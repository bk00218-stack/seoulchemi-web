import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 아이템 수정 (수량, 금액)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { quantity, totalPrice } = body

    const updateData: any = {}
    
    if (quantity !== undefined) {
      // 수량은 0.5 단위로 반올림 (음수 반품도 허용)
      const roundedQty = quantity >= 0
        ? Math.round(quantity * 2) / 2
        : -Math.round(Math.abs(quantity) * 2) / 2
      if (roundedQty === 0) {
        return NextResponse.json({ error: '수량은 0이 될 수 없습니다' }, { status: 400 })
      }
      updateData.quantity = roundedQty
    }

    if (totalPrice !== undefined) {
      updateData.totalPrice = Math.round(totalPrice)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 데이터가 없습니다' }, { status: 400 })
    }

    const updated = await prisma.orderItem.update({
      where: { id: parseInt(itemId) },
      data: updateData
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error: any) {
    console.error('Item update error:', error)
    return NextResponse.json({ error: error.message || '수정 실패' }, { status: 500 })
  }
}

// 아이템 삭제 (주문 총액 자동 업데이트)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const id = parseInt(itemId)

    // 품목 조회
    const item = await prisma.orderItem.findUnique({
      where: { id },
      include: { order: true }
    })

    if (!item) {
      return NextResponse.json({ error: '품목을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id } })

      // 주문 총액 업데이트
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId }
      })
      const newTotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0)

      await tx.order.update({
        where: { id: item.orderId },
        data: { totalAmount: newTotal }
      })

      // 거래내역 금액도 업데이트
      await tx.transaction.updateMany({
        where: { orderId: item.orderId },
        data: { amount: newTotal }
      })
    })

    return NextResponse.json({ success: true, message: '품목이 삭제되었습니다.' })
  } catch (error: any) {
    console.error('Item delete error:', error)
    return NextResponse.json({ error: error.message || '삭제 실패' }, { status: 500 })
  }
}
