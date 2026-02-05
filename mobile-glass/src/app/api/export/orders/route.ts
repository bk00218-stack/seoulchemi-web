// 주문 엑셀 내보내기 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: any = {}

    if (startDate || endDate) {
      where.orderedAt = {}
      if (startDate) where.orderedAt.gte = new Date(startDate)
      if (endDate) where.orderedAt.lte = new Date(endDate + 'T23:59:59')
    }

    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderedAt: 'desc' },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      }
    })

    // CSV 형식으로 변환
    const headers = [
      '주문번호', '주문일시', '가맹점코드', '가맹점명', '주문유형', '상태',
      '상품명', '브랜드', 'SPH', 'CYL', 'AXIS', '수량', '단가', '소계', '총금액', '메모'
    ]

    const rows: string[][] = []

    orders.forEach(order => {
      const statusLabel = {
        pending: '대기',
        confirmed: '확인',
        processing: '가공중',
        shipped: '출고',
        delivered: '배송완료',
        cancelled: '취소'
      }[order.status] || order.status

      const orderTypeLabel = order.orderType === 'rx' ? 'RX' : '여벌'

      if (order.items.length === 0) {
        rows.push([
          order.orderNo,
          new Date(order.orderedAt).toLocaleString('ko-KR'),
          order.store.code,
          order.store.name,
          orderTypeLabel,
          statusLabel,
          '', '', '', '', '', '', '', '',
          order.totalAmount.toString(),
          order.memo || ''
        ])
      } else {
        order.items.forEach((item, idx) => {
          rows.push([
            idx === 0 ? order.orderNo : '',
            idx === 0 ? new Date(order.orderedAt).toLocaleString('ko-KR') : '',
            idx === 0 ? order.store.code : '',
            idx === 0 ? order.store.name : '',
            idx === 0 ? orderTypeLabel : '',
            idx === 0 ? statusLabel : '',
            item.product.name,
            item.product.brand.name,
            item.sph || '',
            item.cyl || '',
            item.axis || '',
            item.quantity.toString(),
            item.unitPrice.toString(),
            item.totalPrice.toString(),
            idx === 0 ? order.totalAmount.toString() : '',
            idx === 0 ? (order.memo || '') : ''
          ])
        })
      }
    })

    // CSV 생성
    const BOM = '\uFEFF'
    const csvContent = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const filename = `orders_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Failed to export orders:', error)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}
