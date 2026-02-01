import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

function generateOrderNo() {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MG${y}${m}${d}-${rand}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { storeId, memo, items } = body

    // 상품 조회
    const productIds = items.map((i: { productId: number }) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    // 총액 계산
    let totalAmount = 0
    const orderItems = items.map((item: { productId: number; quantity: number; sph: string; cyl: string; axis: string }) => {
      const product = products.find(p => p.id === item.productId)!
      const itemTotal = product.sellingPrice * item.quantity
      totalAmount += itemTotal
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        totalPrice: itemTotal,
        sph: item.sph,
        cyl: item.cyl,
        axis: item.axis
      }
    })

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        storeId,
        status: 'pending',
        totalAmount,
        memo: memo || null,
        orderedAt: new Date(),
        items: { create: orderItems }
      },
      include: {
        store: true,
        items: { include: { product: true } }
      }
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
