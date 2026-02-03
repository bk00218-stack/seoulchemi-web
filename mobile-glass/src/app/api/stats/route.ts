import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - 통계 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year
    
    // 기간 설정
    const now = new Date()
    const periodStart = new Date()
    
    switch (period) {
      case 'day':
        periodStart.setHours(0, 0, 0, 0)
        break
      case 'week':
        periodStart.setDate(now.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(now.getMonth() - 1)
        break
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1)
        break
    }
    
    // 전체 통계
    const totalStats = await prisma.order.aggregate({
      where: {
        orderedAt: { gte: periodStart },
        status: { not: 'cancelled' }
      },
      _count: true,
      _sum: { totalAmount: true }
    })
    
    // 이전 기간 통계 (비교용)
    const prevPeriodStart = new Date(periodStart)
    const prevPeriodEnd = new Date(periodStart)
    
    switch (period) {
      case 'day':
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 1)
        break
      case 'week':
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 7)
        break
      case 'month':
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1)
        break
      case 'year':
        prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1)
        break
    }
    
    const prevStats = await prisma.order.aggregate({
      where: {
        orderedAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        status: { not: 'cancelled' }
      },
      _sum: { totalAmount: true }
    })
    
    // 성장률 계산
    const currentAmount = totalStats._sum.totalAmount || 0
    const prevAmount = prevStats._sum.totalAmount || 0
    const growthRate = prevAmount > 0 
      ? ((currentAmount - prevAmount) / prevAmount * 100).toFixed(1)
      : 0
    
    // 가맹점별 매출 (상위 20개)
    const storeStats = await prisma.order.groupBy({
      by: ['storeId'],
      where: {
        orderedAt: { gte: periodStart },
        status: { not: 'cancelled' }
      },
      _count: true,
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 20,
    })
    
    // 가맹점 정보 조회
    const storeIds = storeStats.map(s => s.storeId)
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, code: true }
    })
    const storeMap = new Map(stores.map(s => [s.id, s]))
    
    // 브랜드별 매출
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          orderedAt: { gte: periodStart },
          status: { not: 'cancelled' }
        }
      },
      include: {
        product: {
          include: { brand: true }
        }
      }
    })
    
    const brandStats: Record<string, { name: string, count: number, amount: number }> = {}
    for (const item of orderItems) {
      const brandName = item.product.brand.name
      if (!brandStats[brandName]) {
        brandStats[brandName] = { name: brandName, count: 0, amount: 0 }
      }
      brandStats[brandName].count += item.quantity
      brandStats[brandName].amount += item.totalPrice
    }
    
    // 일별 매출 (최근 14일)
    const dailyStart = new Date()
    dailyStart.setDate(dailyStart.getDate() - 14)
    dailyStart.setHours(0, 0, 0, 0)
    
    const dailyOrders = await prisma.order.findMany({
      where: {
        orderedAt: { gte: dailyStart },
        status: { not: 'cancelled' }
      },
      select: { orderedAt: true, totalAmount: true }
    })
    
    const dailyMap: Record<string, { date: string, amount: number, count: number }> = {}
    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      const key = d.toISOString().split('T')[0]
      dailyMap[key] = { date: key, amount: 0, count: 0 }
    }
    
    for (const order of dailyOrders) {
      const key = order.orderedAt.toISOString().split('T')[0]
      if (dailyMap[key]) {
        dailyMap[key].amount += order.totalAmount
        dailyMap[key].count += 1
      }
    }
    
    const dailyData = Object.values(dailyMap).map(d => ({
      date: d.date.slice(5), // MM-DD
      amount: d.amount,
      count: d.count
    }))
    
    // 활성 가맹점 수
    const activeStores = await prisma.store.count({ where: { isActive: true } })
    
    return NextResponse.json({
      summary: {
        totalAmount: currentAmount,
        totalOrders: totalStats._count,
        avgOrderAmount: totalStats._count > 0 ? Math.round(currentAmount / totalStats._count) : 0,
        growthRate: Number(growthRate),
        activeStores,
      },
      storeRanking: storeStats.map((s, idx) => ({
        rank: idx + 1,
        storeId: s.storeId,
        storeName: storeMap.get(s.storeId)?.name || '알 수 없음',
        storeCode: storeMap.get(s.storeId)?.code || '-',
        orderCount: s._count,
        totalAmount: s._sum.totalAmount || 0,
        avgAmount: s._count > 0 ? Math.round((s._sum.totalAmount || 0) / s._count) : 0,
      })),
      brandRanking: Object.values(brandStats)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map((b, idx) => ({
          rank: idx + 1,
          brandName: b.name,
          salesCount: b.count,
          totalAmount: b.amount,
        })),
      dailyTrend: dailyData,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
