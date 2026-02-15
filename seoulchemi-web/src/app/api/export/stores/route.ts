// 가맹점/미수금 엑셀 내보내기 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stores' // stores, receivables

    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { orders: true } }
      }
    })

    if (type === 'receivables') {
      // 미수금 현황
      const storesWithReceivables = stores.filter(s => s.outstandingAmount > 0)

      const headers = [
        '가맹점코드', '가맹점명', '대표자', '연락처', '미수금', '신용한도', '한도초과여부', '최근입금일'
      ]

      const rows = storesWithReceivables.map(store => [
        store.code,
        store.name,
        store.ownerName || '',
        store.phone || '',
        store.outstandingAmount.toString(),
        store.creditLimit.toString(),
        store.creditLimit > 0 && store.outstandingAmount > store.creditLimit ? 'Y' : 'N',
        store.lastPaymentAt ? new Date(store.lastPaymentAt).toLocaleDateString('ko-KR') : ''
      ])

      const BOM = '\uFEFF'
      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const filename = `receivables_${new Date().toISOString().slice(0, 10)}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // 가맹점 전체 목록
      const headers = [
        '가맹점코드', '가맹점명', '대표자', '연락처', '주소',
        '배송주소', '배송담당자', '배송연락처',
        '미수금', '신용한도', '결제기한', '담당자', '지역', '주문수'
      ]

      const rows = stores.map(store => [
        store.code,
        store.name,
        store.ownerName || '',
        store.phone || '',
        store.address || '',
        store.deliveryAddress || '',
        store.deliveryContact || '',
        store.deliveryPhone || '',
        store.outstandingAmount.toString(),
        store.creditLimit.toString(),
        store.paymentTermDays.toString(),
        store.salesRepName || '',
        store.areaCode || '',
        store._count.orders.toString()
      ])

      const BOM = '\uFEFF'
      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const filename = `stores_${new Date().toISOString().slice(0, 10)}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }
  } catch (error) {
    console.error('Failed to export stores:', error)
    return NextResponse.json({ error: 'Failed to export stores' }, { status: 500 })
  }
}
