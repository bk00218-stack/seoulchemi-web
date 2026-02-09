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
    
    // 트랜잭션으로 상태 변경 및 미수금/재고 처리
    await prisma.$transaction(async (tx) => {
      // 주문 목록 조회 (미수금/재고 처리용)
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          items: true
        }
      })
      
      // 주문 상태 업데이트
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data
      })
      
      // confirmed(확정)로 변경시 미수금 추가 + 재고 차감
      // pending → confirmed 일때만 처리 (중복 방지)
      if (status === 'confirmed') {
        for (const order of orders) {
          // 이미 확정/출고된 주문은 스킵 (중복 방지)
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
              memo: `주문 확정: ${order.orderNo}`,
              processedBy: 'admin',
              processedAt: now,
            }
          })
          
          // 재고 차감 (여벌 주문만 - stock 타입)
          if (order.orderType === 'stock') {
            for (const item of order.items) {
              // 도수 조건으로 ProductOption 찾기
              const option = await tx.productOption.findFirst({
                where: {
                  productId: item.productId,
                  sph: item.sph || undefined,
                  cyl: item.cyl || undefined,
                  isActive: true,
                }
              })
              
              if (option) {
                const beforeStock = option.stock
                const afterStock = Math.max(0, beforeStock - item.quantity)
                
                // 재고 차감
                await tx.productOption.update({
                  where: { id: option.id },
                  data: { stock: afterStock }
                })
                
                // 재고 이동 이력 기록
                await tx.inventoryTransaction.create({
                  data: {
                    productId: item.productId,
                    productOptionId: option.id,
                    type: 'out',
                    reason: 'sale',
                    quantity: -item.quantity,
                    beforeStock,
                    afterStock,
                    orderId: order.id,
                    orderNo: order.orderNo,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    memo: `주문 확정 출고: ${order.orderNo}`,
                    processedBy: 'admin',
                  }
                })
              }
            }
          }
        }
      }
      
      // shipped(출고)로 변경시 미수금만 추가 (pending에서 바로 shipped로 갈 경우)
      if (status === 'shipped') {
        for (const order of orders) {
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
          
          // 재고 차감 (여벌 주문만)
          if (order.orderType === 'stock') {
            for (const item of order.items) {
              const option = await tx.productOption.findFirst({
                where: {
                  productId: item.productId,
                  sph: item.sph || undefined,
                  cyl: item.cyl || undefined,
                  isActive: true,
                }
              })
              
              if (option) {
                const beforeStock = option.stock
                const afterStock = Math.max(0, beforeStock - item.quantity)
                
                await tx.productOption.update({
                  where: { id: option.id },
                  data: { stock: afterStock }
                })
                
                await tx.inventoryTransaction.create({
                  data: {
                    productId: item.productId,
                    productOptionId: option.id,
                    type: 'out',
                    reason: 'sale',
                    quantity: -item.quantity,
                    beforeStock,
                    afterStock,
                    orderId: order.id,
                    orderNo: order.orderNo,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    memo: `주문 출고: ${order.orderNo}`,
                    processedBy: 'admin',
                  }
                })
              }
            }
          }
        }
      }
      
      // cancelled(취소)로 변경시 - 이미 미수금/재고 처리된 경우 복원
      if (status === 'cancelled') {
        for (const order of orders) {
          // confirmed/shipped 상태에서 취소된 경우만 미수금 차감 + 재고 복원
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
            
            // 재고 복원 (여벌 주문만)
            if (order.orderType === 'stock') {
              for (const item of order.items) {
                const option = await tx.productOption.findFirst({
                  where: {
                    productId: item.productId,
                    sph: item.sph || undefined,
                    cyl: item.cyl || undefined,
                    isActive: true,
                  }
                })
                
                if (option) {
                  const beforeStock = option.stock
                  const afterStock = beforeStock + item.quantity
                  
                  // 재고 복원
                  await tx.productOption.update({
                    where: { id: option.id },
                    data: { stock: afterStock }
                  })
                  
                  // 재고 이동 이력 기록
                  await tx.inventoryTransaction.create({
                    data: {
                      productId: item.productId,
                      productOptionId: option.id,
                      type: 'in',
                      reason: 'return',
                      quantity: item.quantity,
                      beforeStock,
                      afterStock,
                      orderId: order.id,
                      orderNo: order.orderNo,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                      memo: `주문 취소 재고 복원: ${order.orderNo}`,
                      processedBy: 'admin',
                    }
                  })
                }
              }
            }
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
