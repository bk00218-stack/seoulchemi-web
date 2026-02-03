import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 안경원에서 주문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, items } = body

    // storeId 검증 (밝은안경 BK-001 사용, 나중에 로그인 연동)
    const store = storeId 
      ? await prisma.store.findUnique({ where: { id: storeId } })
      : await prisma.store.findFirst({ where: { code: 'BK-001' } })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다' }, { status: 400 })
    }

    // 주문번호 생성
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    })
    const orderNo = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`

    // 총 금액 계산
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (!product) continue

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
        add: item.add || null,
      })

      totalAmount += itemTotal
    }

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        orderNo,
        storeId: store.id,
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
    const { searchParams } = new URL(request.url)
    const storeId = parseInt(searchParams.get('storeId') || '1')

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

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 })
  }
}
