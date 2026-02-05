import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { orderIds, status } = await request.json()
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '주문을 선택해주세요.' }, { status: 400 })
    }
    
    // 상태에 따른 타임스탬프 업데이트
    const data: Record<string, unknown> = { status }
    const now = new Date()
    
    if (status === 'confirmed') data.confirmedAt = now
    if (status === 'shipped') data.shippedAt = now
    if (status === 'delivered') data.deliveredAt = now
    
    // 트랜잭션으로 상태 변경 및 미수금 처리
    await prisma.$transaction(async (tx) => {
      // 주문 목록 조회 (미수금 처리용)
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, storeId: true, totalAmount: true, status: true, orderNo: true }
      })
      
      // 주문 상태 업데이트
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data
      })
      
      // confirmed(확정) 또는 shipped(출고)로 변경시 미수금 추가
      // pending → confirmed/shipped 일때만 미수금 추가 (중복 방지)
      if (status === 'confirmed' || status === 'shipped') {
        for (const order of orders) {
          // 이미 확정/출고된 주문은 스킵 (중복 미수금 방지)
          if (order.status !== 'pending') continue
          
          // 가맹점 미수금 증가
          const store = await tx.store.update({
            where: { id: order.storeId },
            data: {
              outstandingAmount: { increment: order.totalAmount }
            }
          })
          
          // 입출금 내역 기록 (매출)
          await tx.transaction.create({
            data: {
              storeId: order.storeId,
              type: 'sale',
              amount: order.totalAmount,
              balanceAfter: store.outstandingAmount,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `주문 출고: ${order.orderNo}`,
              processedBy: 'admin',
              processedAt: now,
            }
          })
        }
      }
      
      // cancelled(취소)로 변경시 - 이미 미수금 잡힌 경우 차감
      if (status === 'cancelled') {
        for (const order of orders) {
          // confirmed/shipped 상태에서 취소된 경우만 미수금 차감
          if (order.status === 'confirmed' || order.status === 'shipped') {
            const store = await tx.store.update({
              where: { id: order.storeId },
              data: {
                outstandingAmount: { decrement: order.totalAmount }
              }
            })
            
            // 입출금 내역 기록 (취소)
            await tx.transaction.create({
              data: {
                storeId: order.storeId,
                type: 'adjustment',
                amount: -order.totalAmount,
                balanceAfter: Math.max(0, store.outstandingAmount),
                orderId: order.id,
                orderNo: order.orderNo,
                memo: `주문 취소: ${order.orderNo}`,
                processedBy: 'admin',
                processedAt: now,
              }
            })
          }
        }
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `${orderIds.length}건의 주문 상태가 변경되었습니다.` 
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 })
  }
}
