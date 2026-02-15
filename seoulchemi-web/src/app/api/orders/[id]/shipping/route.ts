import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders/[id]/shipping - 출고 지시서 생성
export async function POST(
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
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        },
        store: true,
      }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 주문이 확인 상태가 아니면 출고 지시서 생성 불가
    if (order.status === 'pending') {
      return NextResponse.json({ error: '주문 확인 후 출고 지시서를 생성할 수 있습니다.' }, { status: 400 })
    }

    // 출고 지시서 번호 생성
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const lastSlip = await prisma.shippingSlip.findFirst({
      where: { slipNo: { startsWith: `SH${dateStr}` } },
      orderBy: { slipNo: 'desc' }
    })
    
    let seq = 1
    if (lastSlip) {
      const lastSeq = parseInt(lastSlip.slipNo.slice(-4))
      seq = lastSeq + 1
    }
    const slipNo = `SH${dateStr}${String(seq).padStart(4, '0')}`

    // 트랜잭션으로 출고 지시서 생성
    const result = await prisma.$transaction(async (tx) => {
      // 출고 지시서 생성
      const slip = await tx.shippingSlip.create({
        data: {
          slipNo,
          orderId,
          status: 'pending',
        }
      })

      // 출고 지시서 아이템 생성
      const slipItems = order.items.map(item => ({
        slipId: slip.id,
        orderItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        optionName: `${item.product.brand.name} ${item.product.name}`,
        sph: item.sph,
        cyl: item.cyl,
        axis: item.axis,
        quantity: item.quantity,
        isPicked: false,
      }))

      await tx.shippingSlipItem.createMany({ data: slipItems })

      // 작업 로그
      await tx.workLog.create({
        data: {
          workType: 'order_ship',
          targetType: 'order',
          targetId: orderId,
          targetNo: order.orderNo,
          description: `출고 지시서 생성: ${slipNo}`,
          details: JSON.stringify({ slipNo, itemCount: order.items.length }),
          userName: 'admin',
          pcName: 'WEB',
        }
      })

      return slip
    })

    return NextResponse.json({
      success: true,
      shippingSlip: {
        id: result.id,
        slipNo: result.slipNo,
        status: result.status,
      }
    })
  } catch (error) {
    console.error('Failed to create shipping slip:', error)
    return NextResponse.json({ error: '출고 지시서 생성에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/orders/[id]/shipping - 출고 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const body = await request.json()
    const { slipId, action, courier, trackingNo } = body

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID입니다.' }, { status: 400 })
    }

    const slip = await prisma.shippingSlip.findFirst({
      where: { id: slipId, orderId },
      include: { order: true }
    })

    if (!slip) {
      return NextResponse.json({ error: '출고 지시서를 찾을 수 없습니다.' }, { status: 404 })
    }

    const now = new Date()
    const updateData: any = {}
    let newStatus = slip.status
    let orderStatus = null

    switch (action) {
      case 'pick': // 피킹 완료
        updateData.status = 'picking'
        updateData.pickedBy = 'admin'
        updateData.pickedAt = now
        newStatus = 'picking'
        break

      case 'pack': // 포장 완료
        updateData.status = 'packed'
        updateData.packedBy = 'admin'
        updateData.packedAt = now
        newStatus = 'packed'
        break

      case 'ship': // 출고 완료
        if (!courier || !trackingNo) {
          return NextResponse.json({ error: '택배사와 운송장번호를 입력해주세요.' }, { status: 400 })
        }
        updateData.status = 'shipped'
        updateData.shippedBy = 'admin'
        updateData.shippedAt = now
        updateData.courier = courier
        updateData.trackingNo = trackingNo
        newStatus = 'shipped'
        orderStatus = 'shipped'
        break

      default:
        return NextResponse.json({ error: '잘못된 액션입니다.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 출고 지시서 업데이트
      await tx.shippingSlip.update({
        where: { id: slipId },
        data: updateData
      })

      // 피킹 완료 시 아이템 상태도 업데이트
      if (action === 'pick') {
        await tx.shippingSlipItem.updateMany({
          where: { slipId },
          data: { isPicked: true, pickedAt: now }
        })
      }

      // 출고 완료 시 주문 상태 변경 + 미수금 처리
      if (orderStatus) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: orderStatus,
            shippedAt: now
          }
        })

        // 미수금 추가
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { store: true }
        })

        if (order) {
          await tx.store.update({
            where: { id: order.storeId },
            data: {
              outstandingAmount: { increment: order.totalAmount }
            }
          })

          // 거래 내역 기록
          await tx.transaction.create({
            data: {
              storeId: order.storeId,
              type: 'sale',
              amount: order.totalAmount,
              balanceAfter: (order.store.outstandingAmount || 0) + order.totalAmount,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `주문 출고 (${order.orderNo})`,
              processedBy: 'admin',
              processedAt: now,
            }
          })
        }
      }

      // 작업 로그
      await tx.workLog.create({
        data: {
          workType: 'order_ship',
          targetType: 'order',
          targetId: orderId,
          targetNo: slip.order.orderNo,
          description: `출고 상태 변경: ${slip.status} → ${newStatus}`,
          details: JSON.stringify({ slipNo: slip.slipNo, action, courier, trackingNo }),
          userName: 'admin',
          pcName: 'WEB',
        }
      })
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      orderStatus,
    })
  } catch (error) {
    console.error('Failed to update shipping:', error)
    return NextResponse.json({ error: '출고 상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
