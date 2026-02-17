import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions/[id] - 거래내역 상세
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transactionId = parseInt(id)
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        store: { select: { id: true, name: true, code: true } }
      }
    })
    
    if (!transaction) {
      return NextResponse.json({ error: '거래내역을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 주문 아이템 정보 가져오기
    let items: any[] = []
    if (transaction.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: transaction.orderId },
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
      })
      
      items = order?.items.map(item => ({
        id: item.id,
        brand: item.product.brand?.name || '',
        product: item.product.name,
        qty: item.quantity,
        sph: item.sph,
        cyl: item.cyl,
        axis: item.axis,
        add: item.bc,
        price: item.totalPrice,
      })) || []
    }
    
    return NextResponse.json({
      id: transaction.id,
      storeId: transaction.storeId,
      storeName: transaction.store.name,
      storeCode: transaction.store.code,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      orderId: transaction.orderId,
      orderNo: transaction.orderNo,
      paymentMethod: transaction.paymentMethod,
      memo: transaction.memo,
      processedAt: transaction.processedAt.toISOString(),
      items,
    })
  } catch (error) {
    console.error('Failed to fetch transaction:', error)
    return NextResponse.json({ error: '거래내역을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/transactions/[id] - 거래내역 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transactionId = parseInt(id)
    
    // 거래내역 조회
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { store: true }
    })
    
    if (!transaction) {
      return NextResponse.json({ error: '거래내역을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 거래 삭제 및 잔액 복구
    await prisma.$transaction(async (tx) => {
      // 이 거래 이후의 모든 거래내역 잔액 조정
      const laterTransactions = await tx.transaction.findMany({
        where: {
          storeId: transaction.storeId,
          processedAt: { gt: transaction.processedAt }
        },
        orderBy: { processedAt: 'asc' }
      })
      
      // 삭제하는 거래의 금액만큼 이후 거래들의 잔액 조정
      const amountDiff = transaction.type === 'deposit' ? transaction.amount : -transaction.amount
      
      for (const t of laterTransactions) {
        await tx.transaction.update({
          where: { id: t.id },
          data: { balanceAfter: t.balanceAfter + amountDiff }
        })
      }
      
      // 가맹점 잔액 업데이트
      await tx.store.update({
        where: { id: transaction.storeId },
        data: {
          outstandingAmount: { increment: amountDiff }
        }
      })
      
      // 거래내역 삭제
      await tx.transaction.delete({
        where: { id: transactionId }
      })
    })
    
    return NextResponse.json({ success: true, message: '거래내역이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json({ error: '거래내역 삭제에 실패했습니다.' }, { status: 500 })
  }
}
