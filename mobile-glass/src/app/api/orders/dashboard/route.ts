import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/dashboard - 주문 대시보드 통계 (최적화)
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    // 모든 쿼리를 병렬로 실행
    const [
      todayStats,
      yesterdayStats,
      thisWeekStats,
      thisMonthStats,
      statusCounts,
      pendingOrders,
      todayShipping,
      overdueStores,
      lowStockCount,
      pendingDeposits,
      dailyOrdersRaw
    ] = await Promise.all([
      // 오늘 통계
      prisma.order.aggregate({
        where: { orderedAt: { gte: today } },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 어제 통계
      prisma.order.aggregate({
        where: { orderedAt: { gte: yesterday, lt: today } },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 이번 주 통계
      prisma.order.aggregate({
        where: { orderedAt: { gte: thisWeekStart } },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 이번 달 통계
      prisma.order.aggregate({
        where: { orderedAt: { gte: thisMonthStart } },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 상태별 주문 수
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),
      // 대기 중인 주문
      prisma.order.findMany({
        where: { status: 'pending' },
        include: {
          store: { select: { name: true, code: true } },
          items: { select: { id: true } }
        },
        orderBy: { orderedAt: 'asc' },
        take: 10
      }),
      // 오늘 출고 예정
      prisma.order.findMany({
        where: { status: 'confirmed', confirmedAt: { gte: today } },
        include: { store: { select: { name: true, code: true } } },
        orderBy: { confirmedAt: 'asc' },
        take: 10
      }),
      // 미수금 경고
      prisma.store.findMany({
        where: {
          outstandingAmount: { gt: 0 },
          creditLimit: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          code: true,
          outstandingAmount: true,
          creditLimit: true
        },
        orderBy: { outstandingAmount: 'desc' },
        take: 5
      }),
      // 재고 부족 수
      prisma.productOption.count({
        where: { isActive: true, stock: { lte: 5 } }
      }),
      // 입금 대기 수
      prisma.store.count({
        where: { isActive: true, outstandingAmount: { gt: 0 } }
      }),
      // 7일 주문 데이터 (한 번에 가져오기)
      prisma.order.findMany({
        where: { orderedAt: { gte: sevenDaysAgo } },
        select: { orderedAt: true, totalAmount: true }
      })
    ])

    // 7일 추이 계산 (메모리에서 처리)
    const dailyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = dailyOrdersRaw.filter(o => {
        const orderDate = new Date(o.orderedAt).toISOString().split('T')[0]
        return orderDate === dateStr
      })
      
      dailyTrend.push({
        date: dateStr,
        orders: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      })
    }

    const overLimitStores = overdueStores.filter(s => s.outstandingAmount > s.creditLimit)

    return NextResponse.json({
      summary: {
        today: {
          orders: todayStats._count,
          amount: todayStats._sum.totalAmount || 0
        },
        yesterday: {
          orders: yesterdayStats._count,
          amount: yesterdayStats._sum.totalAmount || 0
        },
        thisWeek: {
          orders: thisWeekStats._count,
          amount: thisWeekStats._sum.totalAmount || 0
        },
        thisMonth: {
          orders: thisMonthStats._count,
          amount: thisMonthStats._sum.totalAmount || 0
        }
      },
      status: {
        pending: statusCounts.find(s => s.status === 'pending')?._count || 0,
        confirmed: statusCounts.find(s => s.status === 'confirmed')?._count || 0,
        shipped: statusCounts.find(s => s.status === 'shipped')?._count || 0,
        delivered: statusCounts.find(s => s.status === 'delivered')?._count || 0,
        cancelled: statusCounts.find(s => s.status === 'cancelled')?._count || 0
      },
      pendingOrders: pendingOrders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        storeName: o.store.name,
        storeCode: o.store.code,
        itemCount: o.items.length,
        totalAmount: o.totalAmount,
        orderedAt: o.orderedAt.toISOString()
      })),
      todayShipping: todayShipping.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        storeName: o.store.name,
        totalAmount: o.totalAmount
      })),
      dailyTrend,
      alerts: {
        overLimitStores: overLimitStores.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          outstanding: s.outstandingAmount,
          limit: s.creditLimit,
          overBy: s.outstandingAmount - s.creditLimit
        })),
        lowStockCount,
        pendingDeposits
      }
    })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return NextResponse.json({ error: '대시보드 데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
