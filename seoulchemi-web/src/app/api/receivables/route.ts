import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''

    // 기본 where 조건
    const where: any = {
      isActive: true,
    }

    // 검색 조건
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { areaCode: { contains: search } },
      ]
    }

    // 필터 조건
    if (filter === 'hasDebt') {
      where.outstandingAmount = { gt: 0 }
    } else if (filter === 'overLimit') {
      // 신용한도 초과: outstandingAmount > creditLimit
      // Prisma doesn't support comparing two fields directly, handle in JS
    }

    // 전체 통계 조회
    const allStores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        outstandingAmount: true,
        creditLimit: true,
        paymentTermDays: true,
        lastPaymentAt: true,
      }
    })

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 이번 달 입금 합계
    const thisMonthDeposits = await prisma.transaction.aggregate({
      where: {
        type: 'deposit',
        processedAt: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    })

    // 연체 금액 계산 (결제 기한 초과)
    let overdueAmount = 0
    for (const store of allStores) {
      if (store.outstandingAmount > 0 && store.lastPaymentAt) {
        const lastPayment = new Date(store.lastPaymentAt)
        const dueDate = new Date(lastPayment)
        dueDate.setDate(dueDate.getDate() + store.paymentTermDays)
        if (now > dueDate) {
          overdueAmount += store.outstandingAmount
        }
      }
    }

    const stats = {
      totalStores: allStores.length,
      storesWithDebt: allStores.filter(s => s.outstandingAmount > 0).length,
      totalOutstanding: allStores.reduce((sum, s) => sum + s.outstandingAmount, 0),
      overdueAmount,
      thisMonthReceived: thisMonthDeposits._sum.amount || 0
    }

    // 가맹점 목록 조회 (미수금 포함)
    let stores = await prisma.store.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        ownerName: true,
        phone: true,
        areaCode: true,
        outstandingAmount: true,
        creditLimit: true,
        paymentTermDays: true,
        lastPaymentAt: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            orderedAt: true,
          },
          orderBy: { orderedAt: 'desc' },
        }
      },
      orderBy: { outstandingAmount: 'desc' },
    })

    // 필터 후처리 (overLimit, overdue)
    if (filter === 'overLimit') {
      stores = stores.filter(s => s.outstandingAmount > s.creditLimit && s.creditLimit > 0)
    } else if (filter === 'overdue') {
      stores = stores.filter(s => {
        if (s.outstandingAmount <= 0 || !s.lastPaymentAt) return false
        const lastPayment = new Date(s.lastPaymentAt)
        const dueDate = new Date(lastPayment)
        dueDate.setDate(dueDate.getDate() + s.paymentTermDays)
        return now > dueDate
      })
    }

    // 페이지네이션
    const total = stores.length
    const totalPages = Math.ceil(total / limit)
    const paginatedStores = stores.slice((page - 1) * limit, page * limit)

    // 응답 데이터 가공
    const responseStores = paginatedStores.map(store => ({
      id: store.id,
      code: store.code,
      name: store.name,
      ownerName: store.ownerName || '-',
      phone: store.phone || '-',
      areaCode: store.areaCode,
      outstandingAmount: store.outstandingAmount,
      creditLimit: store.creditLimit,
      paymentTermDays: store.paymentTermDays,
      lastPaymentAt: store.lastPaymentAt?.toISOString() || null,
      lastOrderAt: store.orders[0]?.orderedAt?.toISOString() || null,
      orderCount: store.orders.length,
      totalSales: store.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    }))

    return NextResponse.json({
      stores: responseStores,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    })
  } catch (error) {
    console.error('Failed to fetch receivables:', error)
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
