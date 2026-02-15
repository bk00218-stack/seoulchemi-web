import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // 전체 주문 조회 (최근 2년)
    const twoYearsAgo = new Date(currentYear - 2, 0, 1)
    
    const orders = await prisma.order.findMany({
      where: {
        orderedAt: { gte: twoYearsAgo },
        status: { not: 'cancelled' }
      },
      select: {
        id: true,
        storeId: true,
        totalAmount: true,
        orderedAt: true
      }
    })

    // 월별 데이터 집계 (최근 12개월)
    const monthlyMap = new Map<string, { orders: number; amount: number; stores: Set<number> }>()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, { orders: 0, amount: 0, stores: new Set() })
    }

    // 분기별 데이터 집계 (최근 8분기)
    const quarterlyMap = new Map<string, { orders: number; amount: number; stores: Set<number> }>()
    
    for (let i = 7; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i * 3, 1)
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const key = `${date.getFullYear()}-Q${quarter}`
      if (!quarterlyMap.has(key)) {
        quarterlyMap.set(key, { orders: 0, amount: 0, stores: new Set() })
      }
    }

    // 연도별 데이터 집계 (최근 5년)
    const yearlyMap = new Map<string, { orders: number; amount: number; stores: Set<number> }>()
    
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i
      yearlyMap.set(String(year), { orders: 0, amount: 0, stores: new Set() })
    }

    // 데이터 집계
    for (const order of orders) {
      const date = new Date(order.orderedAt)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const quarter = Math.floor(date.getMonth() / 3) + 1

      // 월별
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      if (monthlyMap.has(monthKey)) {
        const data = monthlyMap.get(monthKey)!
        data.orders++
        data.amount += order.totalAmount
        data.stores.add(order.storeId)
      }

      // 분기별
      const quarterKey = `${year}-Q${quarter}`
      if (quarterlyMap.has(quarterKey)) {
        const data = quarterlyMap.get(quarterKey)!
        data.orders++
        data.amount += order.totalAmount
        data.stores.add(order.storeId)
      }

      // 연도별
      const yearKey = String(year)
      if (yearlyMap.has(yearKey)) {
        const data = yearlyMap.get(yearKey)!
        data.orders++
        data.amount += order.totalAmount
        data.stores.add(order.storeId)
      }
    }

    // 결과 변환
    const formatMonthly = (key: string) => {
      const [year, month] = key.split('-')
      return `${year}년 ${parseInt(month)}월`
    }

    const formatQuarterly = (key: string) => {
      const [year, quarter] = key.split('-')
      return `${year}년 ${quarter}`
    }

    const monthly = Array.from(monthlyMap.entries()).map(([period, data]) => ({
      period,
      label: formatMonthly(period),
      orders: data.orders,
      amount: data.amount,
      avgOrder: data.orders > 0 ? Math.round(data.amount / data.orders) : 0,
      stores: data.stores.size
    }))

    const quarterly = Array.from(quarterlyMap.entries()).map(([period, data]) => ({
      period,
      label: formatQuarterly(period),
      orders: data.orders,
      amount: data.amount,
      avgOrder: data.orders > 0 ? Math.round(data.amount / data.orders) : 0,
      stores: data.stores.size
    }))

    const yearly = Array.from(yearlyMap.entries()).map(([period, data]) => ({
      period,
      label: `${period}년`,
      orders: data.orders,
      amount: data.amount,
      avgOrder: data.orders > 0 ? Math.round(data.amount / data.orders) : 0,
      stores: data.stores.size
    }))

    return NextResponse.json({
      monthly,
      quarterly,
      yearly
    })
  } catch (error) {
    console.error('Failed to fetch compare stats:', error)
    return NextResponse.json({ error: '통계 조회에 실패했습니다.' }, { status: 500 })
  }
}
