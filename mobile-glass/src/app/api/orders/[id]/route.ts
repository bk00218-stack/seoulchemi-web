import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id] - 주문 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID입니다.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
            address: true,
            ownerName: true,
            deliveryContact: true,
            deliveryPhone: true,
            deliveryAddress: true,
            deliveryZipcode: true,
            deliveryMemo: true,
            outstandingAmount: true,
          }
        },
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        },
        shippingSlips: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 작업 로그 조회
    const workLogs = await prisma.workLog.findMany({
      where: {
        targetType: 'order',
        targetId: orderId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        memo: order.memo,
        orderedAt: order.orderedAt.toISOString(),
        confirmedAt: order.confirmedAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        store: order.store,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          brandName: item.product.brand.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sph: item.sph,
          cyl: item.cyl,
          axis: item.axis,
          bc: item.bc,
          dia: item.dia,
          memo: item.memo,
        })),
        shippingSlips: order.shippingSlips.map(slip => ({
          id: slip.id,
          slipNo: slip.slipNo,
          status: slip.status,
          pickedBy: slip.pickedBy,
          pickedAt: slip.pickedAt?.toISOString() || null,
          packedBy: slip.packedBy,
          packedAt: slip.packedAt?.toISOString() || null,
          shippedBy: slip.shippedBy,
          shippedAt: slip.shippedAt?.toISOString() || null,
          courier: slip.courier,
          trackingNo: slip.trackingNo,
          items: slip.items,
        })),
      },
      workLogs: workLogs.map(log => ({
        id: log.id,
        workType: log.workType,
        description: log.description,
        userName: log.userName,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json({ error: '주문 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/orders/[id] - 주문 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const body = await request.json()
    const { status, memo } = body

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID입니다.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const updateData: any = {}
    const now = new Date()

    // 상태 변경
    if (status && ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      updateData.status = status

      if (status === 'confirmed' && !order.confirmedAt) {
        updateData.confirmedAt = now
      } else if (status === 'shipped' && !order.shippedAt) {
        updateData.shippedAt = now
      } else if (status === 'delivered' && !order.deliveredAt) {
        updateData.deliveredAt = now
      }
    }

    // 메모 변경
    if (memo !== undefined) {
      updateData.memo = memo
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 주문 업데이트
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      })

      // 상태 변경 시 로그 기록
      if (status && status !== order.status) {
        await tx.workLog.create({
          data: {
            workType: 'order_status',
            targetType: 'order',
            targetId: orderId,
            targetNo: order.orderNo,
            description: `주문 상태 변경: ${order.status} → ${status}`,
            details: JSON.stringify({ previousStatus: order.status, newStatus: status }),
            userName: 'admin',
            pcName: 'WEB',
          }
        })

        // 출고 완료 시 미수금 추가
        if (status === 'shipped' && order.status !== 'shipped') {
          await tx.store.update({
            where: { id: order.storeId },
            data: {
              outstandingAmount: { increment: order.totalAmount }
            }
          })

          // 거래 내역 기록
          const store = await tx.store.findUnique({ where: { id: order.storeId } })
          await tx.transaction.create({
            data: {
              storeId: order.storeId,
              type: 'sale',
              amount: order.totalAmount,
              balanceAfter: (store?.outstandingAmount || 0) + order.totalAmount,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `주문 출고 (${order.orderNo})`,
              processedBy: 'admin',
              processedAt: now,
            }
          })
        }

        // 취소 시 미수금 차감 (이미 출고된 경우)
        if (status === 'cancelled' && order.status === 'shipped') {
          await tx.store.update({
            where: { id: order.storeId },
            data: {
              outstandingAmount: { decrement: order.totalAmount }
            }
          })

          const store = await tx.store.findUnique({ where: { id: order.storeId } })
          await tx.transaction.create({
            data: {
              storeId: order.storeId,
              type: 'return',
              amount: order.totalAmount,
              balanceAfter: Math.max(0, (store?.outstandingAmount || 0) - order.totalAmount),
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `주문 취소 (${order.orderNo})`,
              processedBy: 'admin',
              processedAt: now,
            }
          })
        }
      }

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        orderNo: result.orderNo,
        status: result.status,
      }
    })
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: '주문 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/orders/[id] - 주문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID입니다.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shippingSlips: true }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 출고된 주문은 삭제 불가
    if (order.status === 'shipped' || order.status === 'delivered') {
      return NextResponse.json({ error: '출고된 주문은 삭제할 수 없습니다.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 출고 지시서 아이템 삭제
      for (const slip of order.shippingSlips) {
        await tx.shippingSlipItem.deleteMany({ where: { slipId: slip.id } })
      }
      
      // 출고 지시서 삭제
      await tx.shippingSlip.deleteMany({ where: { orderId } })
      
      // 주문 아이템 삭제
      await tx.orderItem.deleteMany({ where: { orderId } })
      
      // 작업 로그 기록
      await tx.workLog.create({
        data: {
          workType: 'order_delete',
          targetType: 'order',
          targetId: orderId,
          targetNo: order.orderNo,
          description: `주문 삭제: ${order.orderNo}`,
          userName: 'admin',
          pcName: 'WEB',
        }
      })
      
      // 주문 삭제
      await tx.order.delete({ where: { id: orderId } })
    })

    return NextResponse.json({ success: true, message: '주문이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete order:', error)
    return NextResponse.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 })
  }
}
