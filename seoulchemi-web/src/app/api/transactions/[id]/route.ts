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

// DELETE /api/transactions/[id] - 거래내역 삭제 (잔액 + 재고 복구)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transactionId = parseInt(id)
    
    // 거래내역 조회 (주문 아이템 포함)
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        store: true,
        order: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    })
    
    if (!transaction) {
      return NextResponse.json({ error: '거래내역을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 거래 삭제 및 잔액/재고 복구
    await prisma.$transaction(async (tx) => {
      // 1. 재고 복구 (매출 삭제 → 재고 증가, 반품 삭제 → 재고 감소)
      // ProductOption에 도수별 재고가 있는 경우만 처리
      if (transaction.order?.items && transaction.order.items.length > 0) {
        for (const item of transaction.order.items) {
          // 도수 정보가 있는 품목만 재고 처리
          if (item.sph || item.cyl) {
            let stockChange = 0
            if (transaction.type === 'sale') {
              // 매출 삭제 → 재고 복구 (증가)
              stockChange = item.quantity
            } else if (transaction.type === 'return') {
              // 반품 삭제 → 재고 롤백 (감소)
              stockChange = -item.quantity
            }
            
            if (stockChange !== 0) {
              await tx.productOption.updateMany({
                where: {
                  productId: item.productId,
                  sph: item.sph || '0.00',
                  cyl: item.cyl || '0.00'
                },
                data: { stock: { increment: stockChange } }
              })
            }
          }
        }
      }
      
      // 2. 이 거래 이후의 모든 거래내역 잔액 조정
      const laterTransactions = await tx.transaction.findMany({
        where: {
          storeId: transaction.storeId,
          processedAt: { gt: transaction.processedAt }
        },
        orderBy: { processedAt: 'asc' }
      })
      
      // 삭제하는 거래의 금액만큼 이후 거래들의 잔액 조정
      // sale: 잔액 증가했던 것 → 삭제 시 감소
      // deposit: 잔액 감소했던 것 → 삭제 시 증가
      // return: 잔액 감소했던 것 → 삭제 시 증가
      let amountDiff = 0
      if (transaction.type === 'sale') {
        amountDiff = -transaction.amount // 매출 삭제 → 잔액 감소
      } else if (transaction.type === 'deposit' || transaction.type === 'return' || transaction.type === 'adjustment') {
        amountDiff = transaction.amount // 입금/반품/조정 삭제 → 잔액 증가
      }
      
      for (const t of laterTransactions) {
        await tx.transaction.update({
          where: { id: t.id },
          data: { balanceAfter: t.balanceAfter + amountDiff }
        })
      }
      
      // 3. 가맹점 미결제 잔액 업데이트
      await tx.store.update({
        where: { id: transaction.storeId },
        data: {
          outstandingAmount: { increment: amountDiff }
        }
      })
      
      // 4. 주문도 삭제 (연결된 경우)
      if (transaction.orderId) {
        await tx.order.delete({ where: { id: transaction.orderId } })
      }
      
      // 5. 거래내역 삭제
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
