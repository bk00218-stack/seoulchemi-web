import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 오늘 생일인 고객 (월/일 매칭)
    const todayMonth = now.getMonth() + 1
    const todayDay = now.getDate()

    const [
      totalCustomers,
      newCustomersThisMonth,
      todayOrders,
      monthOrders,
      pendingReminders,
      recentCustomers,
      birthdayCustomers,
    ] = await Promise.all([
      // 전체 고객 수
      prisma.customer.count({ where: { isActive: true } }),

      // 이번 달 신규 고객
      prisma.customer.count({
        where: {
          isActive: true,
          createdAt: { gte: thisMonthStart },
        }
      }),

      // 오늘 주문 매출 (B2B 매출 기준)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ['cancelled'] }
        },
        _sum: { totalAmount: true }
      }),

      // 이번 달 매출
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thisMonthStart },
          status: { notIn: ['cancelled'] }
        },
        _sum: { totalAmount: true }
      }),

      // 대기 중 리마인더
      prisma.customerReminder.count({
        where: {
          status: 'pending',
          scheduledAt: { lte: tomorrow },
        }
      }),

      // 최근 방문 고객 5명
      prisma.customer.findMany({
        where: { isActive: true, lastVisitAt: { not: null } },
        orderBy: { lastVisitAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          lastVisitAt: true,
        }
      }),

      // 오늘 생일 고객 (raw query로 월/일 비교)
      prisma.$queryRaw<{ id: number; name: string; phone: string }[]>`
        SELECT id, name, phone
        FROM "Customer"
        WHERE "isActive" = true
          AND "birthDate" IS NOT NULL
          AND CAST(strftime('%m', "birthDate") AS INTEGER) = ${todayMonth}
          AND CAST(strftime('%d', "birthDate") AS INTEGER) = ${todayDay}
        LIMIT 10
      `.catch(() => [] as { id: number; name: string; phone: string }[]),
    ])

    return NextResponse.json({
      totalCustomers,
      newCustomersThisMonth,
      todaySales: todayOrders._sum.totalAmount || 0,
      monthSales: monthOrders._sum.totalAmount || 0,
      pendingReminders,
      recentCustomers: recentCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        lastVisitAt: c.lastVisitAt?.toISOString() || null,
      })),
      todayBirthdays: birthdayCustomers,
    })
  } catch (error) {
    console.error('CRM Dashboard API error:', error)
    return NextResponse.json(
      { error: 'CRM 대시보드 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
