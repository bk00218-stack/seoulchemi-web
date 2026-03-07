import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/sales-ledger - 매출 원장
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00')
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59')

    const entries: Array<{
      date: string
      type: 'sale' | 'return' | 'deposit' | 'discount'
      refNo: string
      storeId: number
      storeName: string
      storeCode: string
      description: string
      saleAmount: number
      returnAmount: number
      depositAmount: number
    }> = []

    // 1. 주문 (매출) 내역
    const orderWhere: Record<string, unknown> = {
      status: { notIn: ['cancelled'] }
    }
    if (storeId) orderWhere.storeId = parseInt(storeId)
    if (startDate || endDate) orderWhere.orderedAt = dateFilter

    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        store: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { name: true, brand: { select: { name: true } } } }
          }
        }
      },
      orderBy: { orderedAt: 'asc' }
    })

    for (const o of orders) {
      const itemDesc = o.items.slice(0, 3).map(i =>
        `${i.product?.name || '상품'} x${i.quantity}`
      ).join(', ') + (o.items.length > 3 ? ` 외 ${o.items.length - 3}건` : '')

      entries.push({
        date: o.orderedAt.toISOString(),
        type: 'sale',
        refNo: o.orderNo,
        storeId: o.store.id,
        storeName: o.store.name,
        storeCode: o.store.code || '',
        description: itemDesc || `주문 ${o.items.length}건`,
        saleAmount: o.totalAmount,
        returnAmount: 0,
        depositAmount: 0,
      })
    }

    // 2. 입금 내역 (Transaction)
    const txWhere: Record<string, unknown> = {
      type: 'deposit'
    }
    if (storeId) txWhere.storeId = parseInt(storeId)
    if (startDate || endDate) txWhere.processedAt = dateFilter

    const deposits = await prisma.transaction.findMany({
      where: txWhere,
      include: {
        store: { select: { id: true, name: true, code: true } }
      },
      orderBy: { processedAt: 'asc' }
    })

    for (const t of deposits) {
      entries.push({
        date: t.processedAt.toISOString(),
        type: 'deposit',
        refNo: t.orderNo || '',
        storeId: t.store.id,
        storeName: t.store.name,
        storeCode: t.store.code || '',
        description: `입금 (${t.paymentMethod || ''}) ${t.depositor || ''}`.trim(),
        saleAmount: 0,
        returnAmount: 0,
        depositAmount: t.amount,
      })
    }

    // 3. 반품 내역
    const returnWhere: Record<string, unknown> = {
      status: { in: ['approved', 'received'] }
    }
    if (storeId) returnWhere.storeId = parseInt(storeId)
    if (startDate || endDate) returnWhere.requestedAt = dateFilter

    const returns = await prisma.return.findMany({
      where: returnWhere,
      orderBy: { requestedAt: 'asc' }
    })

    for (const r of returns) {
      entries.push({
        date: r.requestedAt.toISOString(),
        type: 'return',
        refNo: r.returnNo,
        storeId: r.storeId,
        storeName: r.storeName || '',
        storeCode: '',
        description: `반품 ${r.totalQuantity}건`,
        saleAmount: 0,
        returnAmount: r.totalAmount,
        depositAmount: 0,
      })
    }

    // 날짜순 정렬
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 집계
    const totalSale = entries.reduce((s, e) => s + e.saleAmount, 0)
    const totalReturn = entries.reduce((s, e) => s + e.returnAmount, 0)
    const totalDeposit = entries.reduce((s, e) => s + e.depositAmount, 0)
    const netSales = totalSale - totalReturn

    return NextResponse.json({
      entries,
      summary: {
        totalSale,
        totalReturn,
        totalDeposit,
        netSales,
        outstanding: netSales - totalDeposit,
        count: entries.length,
      }
    })
  } catch (error: any) {
    console.error('Sales ledger failed:', error)
    return NextResponse.json({ error: error?.message || '매출 원장 조회에 실패했습니다.' }, { status: 500 })
  }
}
