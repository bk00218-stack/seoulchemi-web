import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const search = searchParams.get('search') || ''
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // where 조건 구성
    const where: any = {}

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (startDate) {
      where.processedAt = {
        ...where.processedAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.processedAt = {
        ...where.processedAt,
        lte: end
      }
    }

    // 검색 조건 (가맹점명, 주문번호, 메모)
    if (search) {
      where.OR = [
        { store: { name: { contains: search } } },
        { store: { code: { contains: search } } },
        { orderNo: { contains: search } },
        { memo: { contains: search } },
        { depositor: { contains: search } },
      ]
    }

    // 전체 개수
    const total = await prisma.transaction.count({ where })

    // 거래 내역 조회
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        }
      },
      orderBy: { processedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // 특정 가맹점 조회 시 가맹점명 반환
    let storeName = null
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: parseInt(storeId) },
        select: { name: true }
      })
      storeName = store?.name || null
    }

    // 응답 데이터 가공
    const responseTransactions = transactions.map(tx => ({
      id: tx.id,
      storeId: tx.storeId,
      storeCode: tx.store.code,
      storeName: tx.store.name,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      orderId: tx.orderId,
      orderNo: tx.orderNo,
      paymentMethod: tx.paymentMethod,
      bankName: tx.bankName,
      depositor: tx.depositor,
      memo: tx.memo,
      processedBy: tx.processedBy,
      processedAt: tx.processedAt.toISOString(),
    }))

    return NextResponse.json({
      transactions: responseTransactions,
      storeName,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
