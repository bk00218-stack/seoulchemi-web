import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders/create - 새 주문 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { storeId, orderType, items, memo } = body
    
    if (!storeId) {
      return NextResponse.json({ error: '가맹점을 선택해주세요' }, { status: 400 })
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: '상품을 추가해주세요' }, { status: 400 })
    }
    
    // 주문번호 생성
    const today = new Date()
    const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
    const lastOrder = await prisma.order.findFirst({
      where: { orderNo: { startsWith: prefix } },
      orderBy: { orderNo: 'desc' }
    })
    
    let seq = 1
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.split('-').pop() || '0')
      seq = lastSeq + 1
    }
    const orderNo = `${prefix}-${String(seq).padStart(4, '0')}`
    
    // 총액 계산
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    )
    
    // 주문 생성
    const order = await prisma.order.create({
      data: {
        orderNo,
        storeId: parseInt(storeId),
        orderType: orderType || 'stock',
        status: 'pending',
        totalAmount,
        memo,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            sph: item.sph || null,
            cyl: item.cyl || null,
            axis: item.axis || null,
            memo: item.memo || null,
          }))
        }
      },
      include: {
        store: true,
        items: { include: { product: true } }
      }
    })
    
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: '주문 등록에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/orders/create - 주문 등록에 필요한 데이터 조회
export async function GET() {
  try {
    const [stores, products, brands] = await Promise.all([
      prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { brand: true },
        orderBy: [{ brandId: 'asc' }, { name: 'asc' }]
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      })
    ])
    
    return NextResponse.json({ stores, products, brands })
  } catch (error) {
    console.error('Failed to fetch order form data:', error)
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
