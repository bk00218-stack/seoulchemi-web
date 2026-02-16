import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id]/print - 인쇄용 주문 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            name: true,
            code: true,
            phone: true,
            address: true
          }
        },
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
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      orderNo: order.orderNo,
      storeName: order.store.name,
      storeCode: order.store.code,
      storePhone: order.store.phone,
      storeAddress: order.store.address,
      orderedAt: order.orderedAt.toISOString(),
      totalAmount: order.totalAmount,
      memo: order.memo,
      items: order.items.map(item => ({
        productName: item.product.name,
        brandName: item.product.brand.name,
        sph: item.sph,
        cyl: item.cyl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    })

  } catch (error) {
    console.error('Print API error:', error)
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
  }
}
