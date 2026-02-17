import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// DELETE /api/orders/bulk-delete - 주문 일괄 삭제
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserName(request)
    const body = await request.json()
    const { orderIds } = body as { orderIds: number[] }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '삭제할 주문을 선택해주세요.' }, { status: 400 })
    }

    // 주문 정보 조회
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { shippingSlips: true }
    })

    if (orders.length === 0) {
      return NextResponse.json({ error: '삭제할 주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 출고된 주문 확인
    const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered')
    if (shippedOrders.length > 0) {
      return NextResponse.json({ 
        error: `출고된 주문 ${shippedOrders.length}건이 포함되어 있어 삭제할 수 없습니다. (${shippedOrders.map(o => o.orderNo).join(', ')})` 
      }, { status: 400 })
    }

    const deletableIds = orders.map(o => o.id)
    const deletedOrderNos = orders.map(o => o.orderNo)

    await prisma.$transaction(async (tx) => {
      // 모든 출고 지시서의 아이템 삭제
      const slipIds = orders.flatMap(o => o.shippingSlips.map(s => s.id))
      if (slipIds.length > 0) {
        await tx.shippingSlipItem.deleteMany({ where: { slipId: { in: slipIds } } })
        await tx.shippingSlip.deleteMany({ where: { id: { in: slipIds } } })
      }

      // 주문 아이템 삭제
      await tx.orderItem.deleteMany({ where: { orderId: { in: deletableIds } } })

      // 작업 로그 기록
      await tx.workLog.create({
        data: {
          workType: 'order_bulk_delete',
          targetType: 'order',
          targetId: deletableIds[0],
          targetNo: deletedOrderNos.join(', '),
          description: `주문 일괄 삭제: ${deletableIds.length}건 (${deletedOrderNos.slice(0, 5).join(', ')}${deletedOrderNos.length > 5 ? ' 외' : ''})`,
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      // 주문 삭제
      await tx.order.deleteMany({ where: { id: { in: deletableIds } } })
    })

    return NextResponse.json({ 
      success: true, 
      message: `${deletableIds.length}건의 주문이 삭제되었습니다.`,
      deletedCount: deletableIds.length,
      deletedOrderNos
    })
  } catch (error) {
    console.error('Failed to bulk delete orders:', error)
    return NextResponse.json({ error: '주문 일괄 삭제에 실패했습니다.' }, { status: 500 })
  }
}
