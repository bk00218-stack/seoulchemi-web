import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/purchase-summary - 매입 집계표
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'supplier' // supplier | month | product

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00')
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59')

    const purchaseWhere: Record<string, unknown> = {}
    if (startDate || endDate) purchaseWhere.purchasedAt = dateFilter

    if (groupBy === 'supplier') {
      // 매입처별 집계
      const purchases = await prisma.purchase.findMany({
        where: purchaseWhere,
        include: {
          supplier: { select: { id: true, name: true, code: true, outstandingAmount: true } },
        }
      })

      const supplierMap = new Map<number, {
        supplierId: number
        supplierName: string
        supplierCode: string
        purchaseCount: number
        totalAmount: number
        outstandingAmount: number
      }>()

      for (const p of purchases) {
        const existing = supplierMap.get(p.supplierId) || {
          supplierId: p.supplierId,
          supplierName: p.supplier.name,
          supplierCode: p.supplier.code,
          purchaseCount: 0,
          totalAmount: 0,
          outstandingAmount: p.supplier.outstandingAmount,
        }
        existing.purchaseCount++
        existing.totalAmount += p.totalAmount
        supplierMap.set(p.supplierId, existing)
      }

      const rows = Array.from(supplierMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
      const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0)
      const totalOutstanding = rows.reduce((sum, r) => sum + r.outstandingAmount, 0)

      return NextResponse.json({
        groupBy,
        rows,
        summary: { grandTotal, totalOutstanding, rowCount: rows.length }
      })
    }

    if (groupBy === 'month') {
      // 월별 집계
      const purchases = await prisma.purchase.findMany({
        where: purchaseWhere,
        select: { totalAmount: true, purchasedAt: true }
      })

      const monthMap = new Map<string, { month: string; purchaseCount: number; totalAmount: number }>()

      for (const p of purchases) {
        const month = p.purchasedAt.toISOString().slice(0, 7) // YYYY-MM
        const existing = monthMap.get(month) || { month, purchaseCount: 0, totalAmount: 0 }
        existing.purchaseCount++
        existing.totalAmount += p.totalAmount
        monthMap.set(month, existing)
      }

      const rows = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
      const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0)

      return NextResponse.json({
        groupBy,
        rows,
        summary: { grandTotal, totalOutstanding: 0, rowCount: rows.length }
      })
    }

    if (groupBy === 'product') {
      // 상품별 집계
      const items = await prisma.purchaseItem.findMany({
        where: {
          purchase: purchaseWhere,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: { select: { name: true } },
              productLine: { select: { name: true } },
            }
          }
        }
      })

      const productMap = new Map<number, {
        productId: number
        productName: string
        brandName: string
        productLineName: string
        totalQuantity: number
        totalAmount: number
      }>()

      for (const item of items) {
        const pid = item.productId
        const existing = productMap.get(pid) || {
          productId: pid,
          productName: item.product?.name || '',
          brandName: item.product?.brand?.name || '',
          productLineName: item.product?.productLine?.name || '',
          totalQuantity: 0,
          totalAmount: 0,
        }
        existing.totalQuantity += item.quantity
        existing.totalAmount += item.totalPrice
        productMap.set(pid, existing)
      }

      const rows = Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
      const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0)

      return NextResponse.json({
        groupBy,
        rows,
        summary: { grandTotal, totalOutstanding: 0, rowCount: rows.length }
      })
    }

    return NextResponse.json({ error: 'Invalid groupBy parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('Purchase summary failed:', error)
    return NextResponse.json({ error: error?.message || '매입 집계 조회에 실패했습니다.' }, { status: 500 })
  }
}
