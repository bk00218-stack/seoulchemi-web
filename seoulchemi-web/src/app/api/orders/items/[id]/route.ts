import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/orders/items/[id] - 주문 품목 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id)
    
    // 품목 조회
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true }
    })
    
    if (!item) {
      return NextResponse.json({ error: '품목을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 주문 품목 삭제
      await tx.orderItem.delete({
        where: { id: itemId }
      })
      
      // 주문 총액 업데이트
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId }
      })
      
      const newTotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0)
      
      await tx.order.update({
        where: { id: item.orderId },
        data: { totalAmount: newTotal }
      })
      
      // 거래내역 금액도 업데이트 (해당 주문의 거래내역)
      await tx.transaction.updateMany({
        where: { orderId: item.orderId },
        data: { amount: newTotal }
      })
    })
    
    return NextResponse.json({ success: true, message: '품목이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json({ error: '품목 삭제에 실패했습니다.' }, { status: 500 })
  }
}
