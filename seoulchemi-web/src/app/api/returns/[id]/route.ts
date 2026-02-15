import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/returns/[id] - 반품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const returnId = parseInt(id)

    if (isNaN(returnId)) {
      return NextResponse.json({ error: '잘못된 반품 ID입니다.' }, { status: 400 })
    }

    const returnData = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        items: true
      }
    })

    if (!returnData) {
      return NextResponse.json({ error: '반품을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 원주문 정보
    const order = await prisma.order.findUnique({
      where: { id: returnData.orderId },
      include: { items: true }
    })

    // 작업 로그
    const workLogs = await prisma.workLog.findMany({
      where: {
        targetType: 'return',
        targetId: returnId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      return: returnData,
      order,
      workLogs
    })
  } catch (error) {
    console.error('Failed to fetch return:', error)
    return NextResponse.json({ error: '반품 조회에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/returns/[id] - 반품 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const returnId = parseInt(id)
    const body = await request.json()
    const { action, memo, processedBy } = body

    if (isNaN(returnId)) {
      return NextResponse.json({ error: '잘못된 반품 ID입니다.' }, { status: 400 })
    }

    const returnData = await prisma.return.findUnique({
      where: { id: returnId },
      include: { items: true }
    })

    if (!returnData) {
      return NextResponse.json({ error: '반품을 찾을 수 없습니다.' }, { status: 404 })
    }

    let updateData: any = {}
    let logDescription = ''

    switch (action) {
      case 'approve':
        if (returnData.status !== 'requested') {
          return NextResponse.json({ error: '승인 대기 상태가 아닙니다.' }, { status: 400 })
        }
        updateData = {
          status: 'approved',
          approvedAt: new Date(),
          processedBy
        }
        logDescription = '반품 승인'
        break

      case 'receive':
        if (returnData.status !== 'approved') {
          return NextResponse.json({ error: '승인된 상태가 아닙니다.' }, { status: 400 })
        }

        // 재고 입고 처리
        for (const item of returnData.items) {
          // 상품 옵션 찾기 (도수로 매칭)
          const option = await prisma.productOption.findFirst({
            where: {
              productId: item.productId,
              isActive: true
            }
          })

          if (option) {
            const beforeStock = option.stock
            const afterStock = beforeStock + item.quantity

            await prisma.$transaction([
              // 재고 증가
              prisma.productOption.update({
                where: { id: option.id },
                data: { stock: afterStock }
              }),
              // 이력 기록
              prisma.inventoryTransaction.create({
                data: {
                  productId: item.productId,
                  productOptionId: option.id,
                  type: 'return',
                  reason: 'return',
                  quantity: item.quantity,
                  beforeStock,
                  afterStock,
                  orderId: returnData.orderId,
                  orderNo: returnData.orderNo,
                  memo: `반품입고: ${returnData.returnNo}`,
                  processedBy
                }
              })
            ])
          }
        }

        // 미수금 차감 (반품 금액만큼)
        const store = await prisma.store.findUnique({
          where: { id: returnData.storeId }
        })

        if (store) {
          const newOutstanding = store.outstandingAmount - returnData.totalAmount

          await prisma.$transaction([
            prisma.store.update({
              where: { id: store.id },
              data: { outstandingAmount: newOutstanding }
            }),
            prisma.transaction.create({
              data: {
                storeId: store.id,
                type: 'return',
                amount: returnData.totalAmount,
                balanceAfter: newOutstanding,
                orderId: returnData.orderId,
                orderNo: returnData.orderNo,
                memo: `반품: ${returnData.returnNo}`,
                processedBy,
                processedAt: new Date()
              }
            })
          ])
        }

        updateData = {
          status: 'received',
          receivedAt: new Date(),
          processedBy
        }
        logDescription = '반품 입고 완료'
        break

      case 'reject':
        if (returnData.status !== 'requested') {
          return NextResponse.json({ error: '승인 대기 상태가 아닙니다.' }, { status: 400 })
        }
        updateData = {
          status: 'rejected',
          memo: memo || returnData.memo,
          processedBy
        }
        logDescription = `반품 거절: ${memo || ''}`
        break

      default:
        return NextResponse.json({ error: '잘못된 액션입니다.' }, { status: 400 })
    }

    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: updateData,
      include: { items: true }
    })

    // 작업 로그
    await prisma.workLog.create({
      data: {
        workType: `return_${action}`,
        targetType: 'return',
        targetId: returnId,
        targetNo: returnData.returnNo,
        description: logDescription,
        userName: processedBy
      }
    })

    return NextResponse.json({
      success: true,
      return: updatedReturn
    })
  } catch (error) {
    console.error('Failed to update return:', error)
    return NextResponse.json({ error: '반품 처리에 실패했습니다.' }, { status: 500 })
  }
}
