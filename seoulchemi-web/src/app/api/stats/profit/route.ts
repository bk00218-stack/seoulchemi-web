// 손익 분석 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, quarter, year
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    let startDate: Date
    let endDate: Date

    if (period === 'year') {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    } else if (period === 'quarter') {
      const quarter = Math.ceil(month / 3)
      startDate = new Date(year, (quarter - 1) * 3, 1)
      endDate = new Date(year, quarter * 3, 0, 23, 59, 59)
    } else {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    }

    // 주문 데이터 (매출)
    const orders = await prisma.order.findMany({
      where: {
        orderedAt: { gte: startDate, lte: endDate },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        },
        store: true
      }
    })

    // 브랜드별 분석
    const brandStats: Record<number, {
      brandId: number
      brandName: string
      revenue: number
      cost: number
      quantity: number
      orders: number
    }> = {}

    // 상품별 분석
    const productStats: Record<number, {
      productId: number
      productName: string
      brandName: string
      revenue: number
      cost: number
      quantity: number
      orders: number
    }> = {}

    // 가맹점별 분석
    const storeStats: Record<number, {
      storeId: number
      storeName: string
      storeCode: string
      revenue: number
      orders: number
      avgOrderValue: number
    }> = {}

    orders.forEach(order => {
      // 가맹점 통계
      if (!storeStats[order.storeId]) {
        storeStats[order.storeId] = {
          storeId: order.storeId,
          storeName: order.store.name,
          storeCode: order.store.code,
          revenue: 0,
          orders: 0,
          avgOrderValue: 0
        }
      }
      storeStats[order.storeId].revenue += order.totalAmount
      storeStats[order.storeId].orders++

      order.items.forEach(item => {
        const brandId = item.product.brandId
        const productId = item.product.id
        const cost = item.product.purchasePrice * item.quantity
        const revenue = item.totalPrice

        // 브랜드 통계
        if (!brandStats[brandId]) {
          brandStats[brandId] = {
            brandId,
            brandName: item.product.brand.name,
            revenue: 0,
            cost: 0,
            quantity: 0,
            orders: 0
          }
        }
        brandStats[brandId].revenue += revenue
        brandStats[brandId].cost += cost
        brandStats[brandId].quantity += item.quantity
        brandStats[brandId].orders++

        // 상품 통계
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            productName: item.product.name,
            brandName: item.product.brand.name,
            revenue: 0,
            cost: 0,
            quantity: 0,
            orders: 0
          }
        }
        productStats[productId].revenue += revenue
        productStats[productId].cost += cost
        productStats[productId].quantity += item.quantity
        productStats[productId].orders++
      })
    })

    // 평균 주문 금액 계산
    Object.values(storeStats).forEach(store => {
      store.avgOrderValue = store.orders > 0 ? Math.round(store.revenue / store.orders) : 0
    })

    // 배열로 변환 및 정렬
    const brandArray = Object.values(brandStats)
      .map(b => ({
        ...b,
        profit: b.revenue - b.cost,
        margin: b.revenue > 0 ? Math.round((b.revenue - b.cost) / b.revenue * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const productArray = Object.values(productStats)
      .map(p => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? Math.round((p.revenue - p.cost) / p.revenue * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const storeArray = Object.values(storeStats)
      .sort((a, b) => b.revenue - a.revenue)

    // 전체 요약
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalCost = productArray.reduce((sum, p) => sum + p.cost, 0)
    const totalProfit = totalRevenue - totalCost
    const overallMargin = totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0

    // ABC 분석 (매출 상위 20%가 전체의 몇 %?)
    const sortedProducts = [...productArray]
    const top20Count = Math.ceil(sortedProducts.length * 0.2)
    const top20Revenue = sortedProducts.slice(0, top20Count).reduce((sum, p) => sum + p.revenue, 0)
    const abcRatio = totalRevenue > 0 ? Math.round(top20Revenue / totalRevenue * 100) : 0

    return NextResponse.json({
      period: { type: period, year, month, startDate, endDate },
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        totalCost,
        totalProfit,
        margin: overallMargin,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0
      },
      abc: {
        top20ProductCount: top20Count,
        top20Revenue,
        top20Percentage: abcRatio
      },
      byBrand: brandArray.slice(0, 20),
      byProduct: productArray.slice(0, 30),
      byStore: storeArray.slice(0, 20)
    })
  } catch (error) {
    console.error('Failed to fetch profit analysis:', error)
    return NextResponse.json({ error: 'Failed to fetch profit analysis' }, { status: 500 })
  }
}
