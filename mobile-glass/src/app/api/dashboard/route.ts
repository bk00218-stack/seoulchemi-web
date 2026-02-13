import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d

    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // 오늘 날짜
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 병렬로 데이터 조회
    const [
      // 오늘 통계
      todayOrders,
      todayRevenue,
      pendingOrders,
      
      // 기간 통계
      periodOrders,
      periodRevenue,
      
      // 거래처 통계
      activeStores,
      totalOutstanding,
      
      // 상품 통계
      lowStockProducts,
      totalProducts,
      
      // 일별 주문 (차트용)
      dailyOrders
    ] = await Promise.all([
      // 오늘 주문 수
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } }
      }),
      
      // 오늘 매출
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ['cancelled'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // 대기 주문
      prisma.order.count({
        where: { status: 'pending' }
      }),
      
      // 기간 주문 수
      prisma.order.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // 기간 매출
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: startDate },
          status: { notIn: ['cancelled'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // 활성 거래처 수
      prisma.store.count({
        where: { isActive: true }
      }),
      
      // 총 미수금
      prisma.store.aggregate({
        _sum: { outstandingAmount: true }
      }),
      
      // 재고 부족 상품 (옵션 기준)
      prisma.productOption.count({
        where: { stock: { lte: 5 }, isActive: true }
      }),
      
      // 전체 상품 수
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // 일별 주문 데이터 (차트용)
      prisma.$queryRaw<{ date: string; count: bigint; amount: bigint }[]>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count,
          COALESCE(SUM("totalAmount"), 0) as amount
        FROM "Order"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `
    ])

    // 응답 구성
    return NextResponse.json({
      today: {
        orders: todayOrders,
        revenue: todayRevenue._sum.totalAmount || 0,
        pending: pendingOrders
      },
      period: {
        days,
        orders: periodOrders,
        revenue: periodRevenue._sum.totalAmount || 0,
        avgOrdersPerDay: Math.round(periodOrders / days * 10) / 10,
        avgRevenuePerDay: Math.round((periodRevenue._sum.totalAmount || 0) / days)
      },
      stores: {
        active: activeStores,
        totalOutstanding: totalOutstanding._sum.outstandingAmount || 0
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      chart: {
        daily: dailyOrders.map(d => ({
          date: d.date,
          orders: Number(d.count),
          revenue: Number(d.amount)
        }))
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
