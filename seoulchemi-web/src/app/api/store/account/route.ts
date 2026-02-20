import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/store/account - 안경원 가맹점 정보 + 잔액 + 거래내역
export async function GET(request: NextRequest) {
  try {
    const headerStoreId = request.headers.get('x-user-store')

    if (!headerStoreId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const storeId = parseInt(headerStoreId)

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        ownerName: true,
        outstandingAmount: true,
        creditLimit: true,
        billingDay: true,
      }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 최근 거래내역 (최근 3개월)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const transactions = await prisma.transaction.findMany({
      where: {
        storeId,
        processedAt: { gte: threeMonthsAgo }
      },
      orderBy: { processedAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        phone: store.phone,
        ownerName: store.ownerName,
        outstandingAmount: store.outstandingAmount,
        creditLimit: store.creditLimit,
        billingDay: store.billingDay,
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        orderNo: t.orderNo,
        memo: t.memo,
        processedAt: t.processedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Failed to fetch store account:', error)
    return NextResponse.json({ error: '가맹점 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
