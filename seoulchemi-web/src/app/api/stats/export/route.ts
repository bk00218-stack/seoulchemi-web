import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats/export - CSV 다운로드
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'store'
    const period = searchParams.get('period') || 'month'

    // 기간 계산
    const now = new Date()
    let startDate: Date
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // 주문 조회
    const orders = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: startDate,
          lte: now
        },
        status: { not: 'cancelled' }
      },
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

    let csv = ''
    let filename = ''

    if (type === 'store') {
      // 가맹점별 매출
      const storeMap = new Map<number, { name: string; code: string; orders: number; amount: number }>()
      for (const order of orders) {
        const existing = storeMap.get(order.storeId) || { name: order.store?.name || '', code: order.store?.code || '', orders: 0, amount: 0 }
        existing.orders++
        existing.amount += order.totalAmount
        storeMap.set(order.storeId, existing)
      }

      const storeStats = Array.from(storeMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.amount - a.amount)

      csv = '코드,가맹점명,주문건수,매출액,평균주문액\n'
      csv += storeStats.map(s => 
        `${s.code},${s.name},${s.orders},${s.amount},${Math.round(s.amount / s.orders)}`
      ).join('\n')

      filename = `가맹점별매출_${startDate.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}.csv`

    } else if (type === 'product') {
      // 상품별 판매
      const productMap = new Map<number, { name: string; brandName: string; quantity: number; amount: number }>()
      for (const order of orders) {
        for (const item of order.items) {
          const existing = productMap.get(item.productId) || { name: item.product?.name || '', brandName: item.product?.brand?.name || '', quantity: 0, amount: 0 }
          existing.quantity += item.quantity
          existing.amount += item.totalPrice
          productMap.set(item.productId, existing)
        }
      }

      const productStats = Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)

      csv = '브랜드,상품명,판매수량,매출액\n'
      csv += productStats.map(p => 
        `${p.brandName},${p.name},${p.quantity},${p.amount}`
      ).join('\n')

      filename = `상품별판매_${startDate.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}.csv`

    } else if (type === 'daily') {
      // 일별 추이
      const dailyMap = new Map<string, { orders: number; amount: number }>()
      for (const order of orders) {
        const dateKey = order.orderedAt.toISOString().slice(0, 10)
        const existing = dailyMap.get(dateKey) || { orders: 0, amount: 0 }
        existing.orders++
        existing.amount += order.totalAmount
        dailyMap.set(dateKey, existing)
      }

      const dailyStats = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))

      csv = '날짜,주문건수,매출액\n'
      csv += dailyStats.map(([date, data]) => 
        `${date},${data.orders},${data.amount}`
      ).join('\n')

      filename = `일별추이_${startDate.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}.csv`

    } else {
      return NextResponse.json({ error: '잘못된 타입입니다.' }, { status: 400 })
    }

    // BOM 추가 (엑셀에서 한글 인식)
    const bom = '\uFEFF'
    
    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export stats:', error)
    return NextResponse.json({ error: '내보내기에 실패했습니다.' }, { status: 500 })
  }
}
