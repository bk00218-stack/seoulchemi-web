import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orders } = body // { [productId]: displayOrder }

    // 트랜잭션으로 모든 순서 업데이트
    const updates = Object.entries(orders).map(([id, order]) => 
      prisma.product.update({
        where: { id: parseInt(id) },
        data: { displayOrder: order as number }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product orders:', error)
    return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 })
  }
}
