import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions - 거래내역 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    
    const where: any = {}
    
    if (storeId) where.storeId = parseInt(storeId)
    if (type) where.type = type
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, code: true } }
        },
        orderBy: { processedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])
    
    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        storeId: t.storeId,
        storeName: t.store.name,
        storeCode: t.store.code,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        orderNo: t.orderNo,
        paymentMethod: t.paymentMethod,
        memo: t.memo,
        processedAt: t.processedAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: '거래내역을 불러오는데 실패했습니다.', transactions: [] }, { status: 500 })
  }
}
