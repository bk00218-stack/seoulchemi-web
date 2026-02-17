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
    
    // orderId가 있는 거래건의 주문 아이템 정보 가져오기
    const orderIds = transactions
      .filter(t => t.orderId)
      .map(t => t.orderId as number)
    
    const orders = orderIds.length > 0 ? await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { name: true } }
              }
            }
          }
        }
      }
    }) : []
    
    const orderMap = new Map(orders.map(o => [o.id, o]))
    
    return NextResponse.json({
      transactions: transactions.map(t => {
        const order = t.orderId ? orderMap.get(t.orderId) : null
        const items = order?.items.map(item => ({
          id: item.id,
          brand: item.product.brand?.name || '',
          product: item.product.name,
          qty: item.quantity,
          sph: item.sph,
          cyl: item.cyl,
          axis: item.axis,
          add: item.bc, // ADD 값으로 bc 사용
          price: item.totalPrice,
        })) || []
        
        return {
          id: t.id,
          storeId: t.storeId,
          storeName: t.store.name,
          storeCode: t.store.code,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          orderId: t.orderId,
          orderNo: t.orderNo,
          paymentMethod: t.paymentMethod,
          memo: t.memo,
          processedAt: t.processedAt.toISOString(),
          items,
        }
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: '거래내역을 불러오는데 실패했습니다.', transactions: [] }, { status: 500 })
  }
}
