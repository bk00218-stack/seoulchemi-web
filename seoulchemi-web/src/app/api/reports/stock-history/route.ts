import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/stock-history - 입출고 내역 (항명별)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') || 'all' // all | in | out | adjust | transfer
    const reason = searchParams.get('reason') // purchase | sale | return | adjust | transfer
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}

    if (type !== 'all') {
      if (type === 'transfer') {
        where.reason = 'transfer'
      } else {
        where.type = type
      }
    }

    if (reason) where.reason = reason

    if (brandId) {
      const products = await prisma.product.findMany({
        where: { brandId: parseInt(brandId), isActive: true },
        select: { id: true }
      })
      where.productId = { in: products.map(p => p.id) }
    }

    if (productId) where.productId = parseInt(productId)

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00')
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59')
      where.createdAt = dateFilter
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryTransaction.count({ where }),
    ])

    // 상품 정보 일괄 조회 (InventoryTransaction에는 relation이 없으므로)
    const productIds = [...new Set(transactions.map(t => t.productId))]
    const optionIds = [...new Set(transactions.filter(t => t.productOptionId).map(t => t.productOptionId!))]

    const [productsData, optionsData] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true, name: true,
              brand: { select: { name: true } },
              productLine: { select: { name: true } },
            }
          })
        : [],
      optionIds.length > 0
        ? prisma.productOption.findMany({
            where: { id: { in: optionIds } },
            select: { id: true, optionName: true, sph: true, cyl: true }
          })
        : [],
    ])

    const productMap = new Map(productsData.map(p => [p.id, p] as const))
    const optionMap = new Map(optionsData.map(o => [o.id, o] as const))

    // 유형별 집계
    const summary = await prisma.inventoryTransaction.groupBy({
      by: ['type'],
      where,
      _sum: { quantity: true },
      _count: { id: true },
    })

    const summaryMap: Record<string, { count: number; quantity: number }> = {}
    for (const s of summary) {
      summaryMap[s.type] = { count: s._count.id, quantity: s._sum.quantity || 0 }
    }

    const entries = transactions.map(t => {
      const prod = productMap.get(t.productId)
      const opt = t.productOptionId ? optionMap.get(t.productOptionId) : null
      return {
        id: t.id,
        date: t.createdAt.toISOString(),
        type: t.type,
        reason: t.reason,
        productName: prod?.name || '',
        brandName: prod?.brand?.name || '',
        productLineName: prod?.productLine?.name || '',
        optionName: opt?.optionName || '',
        quantity: t.quantity,
        beforeStock: t.beforeStock,
        afterStock: t.afterStock,
        unitPrice: t.unitPrice,
        totalPrice: t.totalPrice,
        orderNo: t.orderNo || '',
        memo: t.memo || '',
        processedBy: t.processedBy || '',
      }
    })

    return NextResponse.json({
      entries,
      summary: summaryMap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error: any) {
    console.error('Stock history failed:', error)
    return NextResponse.json({ error: error?.message || '입출고 내역 조회에 실패했습니다.' }, { status: 500 })
  }
}
