import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/dashboard - 주문 대시보드 통계
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // 오늘 통계
    const todayStats = await prisma.order.aggregate({
      where: { orderedAt: { gte: today } },
      _count: true,
      _sum: { totalAmount: true }
    })

    // 어제 통계
    const yesterdayStats = await prisma.order.aggregate({
      where: {
        orderedAt: { gte: yesterday, lt: today }
      },
      _count: true,
      _sum: { totalAmount: true }
    })

    // 이번 주 통계
    const thisWeekStats = await prisma.order.aggregate({
      where: { orderedAt: { gte: thisWeekStart } },
      _count: true,
      _sum: { totalAmount: true }
    })

    // 이번 달 통계
    const thisMonthStats = await prisma.order.aggregate({
      where: { orderedAt: { gte: thisMonthStart } },
      _count: true,
      _sum: { totalAmount: true }
    })

    // 지난 달 통계 (비교용)
    const lastMonthStats = await prisma.order.aggregate({
      where: {
        orderedAt: { gte: lastMonthStart, lte: lastMonthEnd }
      },
      _count: true,
      _sum: { totalAmount: true }
    })

    // 상태별 주문 수
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })

    // 대기 중인 주문 (처리 필요)
    const pendingOrders = await prisma.order.findMany({
      where: { status: 'pending' },
      include: {
        store: { select: { name: true, code: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { orderedAt: 'asc' },
      take: 10
    })

    // 오늘 출고 예정
    const todayShipping = await prisma.order.findMany({
      where: {
        status: 'confirmed',
        confirmedAt: { gte: today }
      },
      include: {
        store: { select: { name: true, code: true } }
      },
      orderBy: { confirmedAt: 'asc' },
      take: 10
    })

    // 브랜드별 오늘 주문
    const brandStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { orderedAt: { gte: today } }
      },
      _sum: { quantity: true, totalPrice: true }
    })

    // 최근 7일 일별 주문 추이
    const dailyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const stats = await prisma.order.aggregate({
        where: {
          orderedAt: { gte: date, lt: nextDate }
        },
        _count: true,
        _sum: { totalAmount: true }
      })

      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        orders: stats._count,
        amount: stats._sum.totalAmount || 0
      })
    }

    // 미수금 경고 (한도 초과 가맹점)
    const overdueStores = await prisma.store.findMany({
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
    })

    const overLimitStores = overdueStores.filter(s => s.outstandingAmount > s.creditLimit)

    // 재고 부족 상품 수 (적정재고 이하)
    const lowStockCount = await prisma.productOption.count({
      where: {
        isActive: true,
        stock: { lte: 5 } // 5개 이하면 부족으로 간주
      }
    })

    // 입금 확인 대기 (미수금 있는 가맹점 수)
    const pendingDeposits = await prisma.store.count({
      where: {
        isActive: true,
        outstandingAmount: { gt: 0 }
      }
    })

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
        },
        lastMonth: {
          orders: lastMonthStats._count,
          amount: lastMonthStats._sum.totalAmount || 0
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
