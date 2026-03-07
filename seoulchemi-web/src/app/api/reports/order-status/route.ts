import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/order-status - 주문 처리 현황 (착색/RX, 여벌)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderType = searchParams.get('orderType') || 'rx' // rx | stock
    const statusFilter = searchParams.get('status') // pending | confirmed | shipped | delivered | unprocessed
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {
      orderType,
    }

    if (statusFilter === 'unprocessed') {
      // 미처리: pending 상태이고 일정 기간 지난 것
      where.status = 'pending'
    } else if (statusFilter) {
      where.status = statusFilter
    }

    if (storeId) where.storeId = parseInt(storeId)

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00')
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59')
      where.orderedAt = dateFilter
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  brand: { select: { name: true } },
                }
              },
              rxDetail: orderType === 'rx' ? {
                select: {
                  sphR: true, cylR: true, axisR: true, addR: true,
                  sphL: true, cylL: true, axisL: true, addL: true,
                  tintBrand: true, tintColor: true, tintDensity: true, tintGradient: true,
                  coatings: true, processType: true,
                  customerName: true,
                }
              } : false,
            }
          }
        },
        orderBy: { orderedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    // 상태별 집계
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { orderType, ...(startDate || endDate ? { orderedAt: where.orderedAt as any } : {}) },
      _count: { id: true },
    })

    const statusMap: Record<string, number> = {}
    for (const s of statusCounts) {
      statusMap[s.status] = s._count.id
    }

    const entries = orders.map(o => {
      const firstItem = o.items[0]
      const rxDetail = firstItem?.rxDetail

      return {
        id: o.id,
        orderNo: o.orderNo,
        storeId: o.store.id,
        storeName: o.store.name,
        storeCode: o.store.code || '',
        status: o.status,
        totalAmount: o.totalAmount,
        itemCount: o.items.length,
        productName: firstItem?.product?.name || '',
        brandName: firstItem?.product?.brand?.name || '',
        quantity: firstItem?.quantity || 0,
        // RX 관련
        sphR: rxDetail?.sphR || '',
        cylR: rxDetail?.cylR || '',
        sphL: rxDetail?.sphL || '',
        cylL: rxDetail?.cylL || '',
        tintColor: rxDetail?.tintColor || '',
        tintDensity: rxDetail?.tintDensity || 0,
        processType: rxDetail?.processType || '',
        customerName: rxDetail?.customerName || '',
        // 일시
        orderedAt: o.orderedAt.toISOString(),
        confirmedAt: o.confirmedAt?.toISOString() || '',
        shippedAt: o.shippedAt?.toISOString() || '',
        deliveredAt: o.deliveredAt?.toISOString() || '',
        memo: o.memo || '',
        // 경과일
        elapsedDays: Math.floor((Date.now() - o.orderedAt.getTime()) / (1000 * 60 * 60 * 24)),
      }
    })

    return NextResponse.json({
      entries,
      statusCounts: statusMap,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error: any) {
    console.error('Order status failed:', error)
    return NextResponse.json({ error: error?.message || '주문 현황 조회에 실패했습니다.' }, { status: 500 })
  }
}
