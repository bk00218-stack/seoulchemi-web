import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = endDate ? new Date(endDate) : new Date()

    // 기간 내 주문 조회
    const orders = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: start,
          lte: end
        },
        status: { not: 'cancelled' }
      },
      include: {
        items: true
      }
    })

    // 요약 통계
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0
    const storeIds = [...new Set(orders.map(o => o.storeId))]
    const totalStores = storeIds.length

    // 가맹점별 통계
    const storeMap = new Map<number, { name: string; code: string; orders: number; amount: number }>()
    for (const order of orders) {
      const existing = storeMap.get(order.storeId) || { name: order.storeName, code: order.storeCode, orders: 0, amount: 0 }
      existing.orders++
      existing.amount += order.totalAmount
      storeMap.set(order.storeId, existing)
    }

    const storeStats = Array.from(storeMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        code: data.code,
        totalOrders: data.orders,
        totalAmount: data.amount,
        avgOrderAmount: data.amount / data.orders
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)

    // 상품별 통계
    const productMap = new Map<number, { name: string; brandName: string; quantity: number; amount: number }>()
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productMap.get(item.productId) || { name: item.productName, brandName: item.brandName, quantity: 0, amount: 0 }
        existing.quantity += item.quantity
        existing.amount += item.totalPrice
        productMap.set(item.productId, existing)
      }
    }

    const productStats = Array.from(productMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        brandName: data.brandName,
        totalQuantity: data.quantity,
        totalAmount: data.amount
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)

    // 일별 통계
    const dailyMap = new Map<string, { orders: number; amount: number }>()
    for (const order of orders) {
      const dateKey = order.orderedAt.toISOString().slice(0, 10)
      const existing = dailyMap.get(dateKey) || { orders: 0, amount: 0 }
      existing.orders++
      existing.amount += order.totalAmount
      dailyMap.set(dateKey, existing)
    }

    const periodStats = Array.from(dailyMap.entries())
      .map(([period, data]) => ({
        period,
        orders: data.orders,
        amount: data.amount
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json({
      summary: {
        totalOrders,
        totalAmount,
        avgOrderAmount,
        totalStores
      },
      storeStats,
      productStats,
      periodStats
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: '통계 조회에 실패했습니다.' }, { status: 500 })
  }
}
