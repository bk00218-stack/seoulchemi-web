import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/purchase-ledger - 매입/지급 원장
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'all' // purchase | payment | all

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00')
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59')

    const entries: Array<{
      date: string
      type: 'purchase' | 'payment'
      refNo: string
      supplierName: string
      supplierId: number
      description: string
      amount: number
      memo: string
    }> = []

    // 매입 내역
    if (type === 'all' || type === 'purchase') {
      const purchaseWhere: Record<string, unknown> = {}
      if (supplierId) purchaseWhere.supplierId = parseInt(supplierId)
      if (startDate || endDate) purchaseWhere.purchasedAt = dateFilter

      const purchases = await prisma.purchase.findMany({
        where: purchaseWhere,
        include: {
          supplier: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { name: true, brand: { select: { name: true } } } }
            }
          }
        },
        orderBy: { purchasedAt: 'asc' }
      })

      for (const p of purchases) {
        const itemDesc = p.items.map(i =>
          `${i.product?.brand?.name || ''} ${i.product?.name || ''} x${i.quantity}`
        ).join(', ')

        entries.push({
          date: p.purchasedAt.toISOString(),
          type: 'purchase',
          refNo: p.purchaseNo,
          supplierName: p.supplier.name,
          supplierId: p.supplier.id,
          description: itemDesc || `매입 ${p.items.length}건`,
          amount: p.totalAmount,
          memo: p.memo || '',
        })
      }
    }

    // 지급 내역 (WorkLog에서 supplier_payment 추출)
    if (type === 'all' || type === 'payment') {
      const paymentWhere: Record<string, unknown> = {
        workType: 'supplier_payment',
        targetType: 'supplier',
      }
      if (supplierId) paymentWhere.targetId = parseInt(supplierId)
      if (startDate || endDate) paymentWhere.createdAt = dateFilter

      const payments = await prisma.workLog.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'asc' }
      })

      for (const w of payments) {
        let details: Record<string, unknown> = {}
        try { details = JSON.parse(w.details || '{}') } catch {}

        // 매입처 이름 조회
        let supplierName = ''
        if (w.targetId) {
          const supplier = await prisma.supplier.findUnique({
            where: { id: w.targetId },
            select: { name: true }
          })
          supplierName = supplier?.name || ''
        }

        entries.push({
          date: w.createdAt.toISOString(),
          type: 'payment',
          refNo: '',
          supplierName,
          supplierId: w.targetId,
          description: w.description,
          amount: (details.amount as number) || 0,
          memo: (details.memo as string) || '',
        })
      }
    }

    // 날짜순 정렬
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 집계
    const totalPurchase = entries
      .filter(e => e.type === 'purchase')
      .reduce((sum, e) => sum + e.amount, 0)
    const totalPayment = entries
      .filter(e => e.type === 'payment')
      .reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({
      entries,
      summary: {
        totalPurchase,
        totalPayment,
        balance: totalPurchase - totalPayment,
        count: entries.length,
      }
    })
  } catch (error: any) {
    console.error('Purchase ledger failed:', error)
    return NextResponse.json({ error: error?.message || '매입 원장 조회에 실패했습니다.' }, { status: 500 })
  }
}
