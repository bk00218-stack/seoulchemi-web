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

// 아이템 삭제 (주문 총액 + 재고 + 잔액 자동 업데이트)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const id = parseInt(itemId)

    // 품목 조회 (주문, 거래내역 포함)
    const item = await prisma.orderItem.findUnique({
      where: { id },
      include: { 
        order: {
          include: {
            store: true
          }
        },
        product: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: '품목을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      const priceDiff = item.totalPrice // 삭제되는 금액
      
      // 1. 재고 복구 (출고된 상품 → 재고 증가)
      // ProductOption에 도수별 재고가 있으면 복구
      if (item.quantity > 0 && (item.sph || item.cyl)) {
        await tx.productOption.updateMany({
          where: {
            productId: item.productId,
            sph: item.sph || '0.00',
            cyl: item.cyl || '0.00'
          },
          data: { stock: { increment: item.quantity } }
        })
      }
      
      // 2. 품목 삭제
      await tx.orderItem.delete({ where: { id } })

      // 3. 주문 총액 업데이트
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId }
      })
      const newTotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0)

      await tx.order.update({
        where: { id: item.orderId },
        data: { totalAmount: newTotal }
      })

      // 4. 연관된 거래내역 찾기
      const transaction = await tx.transaction.findFirst({
        where: { orderId: item.orderId }
      })
      
      if (transaction) {
        // 5. 거래내역 금액 업데이트
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { amount: newTotal }
        })
        
        // 6. 이 거래 이후의 잔액 조정 (매출 감소 → 잔액 감소)
        const laterTransactions = await tx.transaction.findMany({
          where: {
            storeId: transaction.storeId,
            processedAt: { gte: transaction.processedAt }
          },
          orderBy: { processedAt: 'asc' }
        })
        
        for (const t of laterTransactions) {
          await tx.transaction.update({
            where: { id: t.id },
            data: { balanceAfter: t.balanceAfter - priceDiff }
          })
        }
        
        // 7. 가맹점 미결제 잔액 업데이트
        await tx.store.update({
          where: { id: transaction.storeId },
          data: { outstandingAmount: { decrement: priceDiff } }
        })
      }
    })

    return NextResponse.json({ success: true, message: '품목이 삭제되었습니다.' })
  } catch (error: any) {
    console.error('Item delete error:', error)
    return NextResponse.json({ error: error.message || '삭제 실패' }, { status: 500 })
  }
}
