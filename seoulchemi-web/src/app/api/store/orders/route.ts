import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// RX 상품 optionType 값들
const RX_OPTION_TYPES = ['안경렌즈 RX', 'RX']

// 안경원에서 주문 생성
export async function POST(request: NextRequest) {
  try {
    // 미들웨어에서 JWT로부터 추출한 storeId
    const headerStoreId = request.headers.get('x-user-store')

    if (!headerStoreId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const storeId = parseInt(headerStoreId)
    const store = await prisma.store.findUnique({ where: { id: storeId } })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 400 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '주문 상품이 없습니다.' }, { status: 400 })
    }

    // 주문번호 생성 (월+순번: 021, 022... 매월 리셋)
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNo: { startsWith: month },
        orderedAt: { gte: monthStart, lt: nextMonthStart }
      },
      orderBy: { orderNo: 'desc' }
    })

    let seq = 1
    if (lastOrder && lastOrder.orderNo.length >= 3) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(2)) || 0
      seq = lastSeq + 1
    }
    const orderNo = `${month}${seq}`

    // 총 금액 계산 + orderType 결정
    let totalAmount = 0
    let hasRxProduct = false
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (!product) continue

      // RX 상품 여부 확인
      if (product.optionType && RX_OPTION_TYPES.some(t => product.optionType?.includes(t))) {
        hasRxProduct = true
      }

      const unitPrice = product.sellingPrice || 0
      const itemTotal = unitPrice * item.quantity

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        sph: item.sph || null,
        cyl: item.cyl || null,
        axis: item.axis || null,
      })

      totalAmount += itemTotal
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ error: '유효한 상품이 없습니다.' }, { status: 400 })
    }

    // orderType: RX 상품 포함 시 'rx', 아니면 'stock'
    const orderType = hasRxProduct ? 'rx' : 'stock'

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        orderNo,
        storeId: store.id,
        orderType,
        status: 'pending',
        totalAmount,
        items: {
          create: orderItems
        }
      },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        orderType: order.orderType,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        status: order.status
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
  }
}

// 안경원의 주문 내역 조회
export async function GET(request: NextRequest) {
  try {
    // 미들웨어에서 JWT로부터 추출한 storeId
    const headerStoreId = request.headers.get('x-user-store')

    if (!headerStoreId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const storeId = parseInt(headerStoreId)

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNo: order.orderNo,
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        memo: order.memo,
        createdAt: order.createdAt.toISOString(),
        orderedAt: order.orderedAt.toISOString(),
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          brandName: item.product.brand?.name || '',
          optionType: item.product.optionType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sph: item.sph,
          cyl: item.cyl,
          axis: item.axis,
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 })
  }
}
