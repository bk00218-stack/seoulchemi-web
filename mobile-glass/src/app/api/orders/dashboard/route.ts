import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/dashboard - 간소화된 대시보드
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 핵심 쿼리만 병렬 실행 (5개로 축소)
    const [
      todayStats,
      statusCounts,
      pendingOrders,
      overLimitStores,
      pendingDeposits
    ] = await Promise.all([
      // 오늘 주문
      prisma.order.aggregate({
        where: { orderedAt: { gte: today } },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 상태별 카운트
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),
      // 대기 주문 (최근 5개만)
      prisma.order.findMany({
        where: { status: 'pending' },
        select: {
          id: true,
          orderNo: true,
          totalAmount: true,
          orderedAt: true,
          store: { select: { name: true, code: true } },
          _count: { select: { items: true } }
        },
        orderBy: { orderedAt: 'asc' },
        take: 5
      }),
      // 한도 초과 가맹점
      prisma.$queryRaw`
        SELECT id, name, code, "outstandingAmount" as outstanding, "creditLimit" as limit
        FROM "Store"
        WHERE "outstandingAmount" > "creditLimit" AND "creditLimit" > 0
        ORDER BY "outstandingAmount" DESC
        LIMIT 3
      ` as Promise<Array<{id: number, name: string, code: string, outstanding: number, limit: number}>>,
      // 입금 대기 수
      prisma.store.count({
        where: { isActive: true, outstandingAmount: { gt: 0 } }
      })
    ])

    return NextResponse.json({
      summary: {
        today: {
          orders: todayStats._count,
          amount: todayStats._sum.totalAmount || 0
        }
      },
      status: {
        pending: statusCounts.find(s => s.status === 'pending')?._count || 0,
        confirmed: statusCounts.find(s => s.status === 'confirmed')?._count || 0,
        shipped: statusCounts.find(s => s.status === 'shipped')?._count || 0,
        delivered: statusCounts.find(s => s.status === 'delivered')?._count || 0
      },
      pendingOrders: pendingOrders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        storeName: o.store.name,
        storeCode: o.store.code,
        itemCount: o._count.items,
        totalAmount: o.totalAmount,
        orderedAt: o.orderedAt.toISOString()
      })),
      todayShipping: [],
      dailyTrend: [],
      alerts: {
        overLimitStores: (overLimitStores as Array<{id: number, name: string, code: string, outstanding: number, limit: number}>).map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          outstanding: Number(s.outstanding),
          limit: Number(s.limit),
          overBy: Number(s.outstanding) - Number(s.limit)
        })),
        lowStockCount: 0,
        pendingDeposits
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: '대시보드 로딩 실패' }, { status: 500 })
  }
}
