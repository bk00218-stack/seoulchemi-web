import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory/transactions - 입출고 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const productOptionId = searchParams.get('productOptionId')
    const type = searchParams.get('type') // in, out, adjust, return
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (productId) {
      where.productId = parseInt(productId)
    }

    if (productOptionId) {
      where.productOptionId = parseInt(productOptionId)
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const total = await prisma.inventoryTransaction.count({ where })

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // 상품 정보 조회
    const productIds = [...new Set(transactions.map(t => t.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    // 옵션 정보 조회
    const optionIds = transactions
      .filter(t => t.productOptionId)
      .map(t => t.productOptionId as number)
    const options = await prisma.productOption.findMany({
      where: { id: { in: optionIds } }
    })
    const optionMap = new Map(options.map(o => [o.id, o]))

    // 데이터 조합
    const enrichedTransactions = transactions.map(t => {
      const product = productMap.get(t.productId)
      const option = t.productOptionId ? optionMap.get(t.productOptionId) : null

      return {
        ...t,
        productName: product?.name || '',
        brandName: product?.brand?.name || '',
        optionName: option ? `${option.sph || ''} ${option.cyl || ''}`.trim() || option.optionName : ''
      }
    })

    // 타입별 통계
    const stats = await prisma.inventoryTransaction.groupBy({
      by: ['type'],
      _sum: { quantity: true },
      _count: true
    })

    return NextResponse.json({
      transactions: enrichedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        in: stats.find(s => s.type === 'in')?._sum.quantity || 0,
        out: Math.abs(stats.find(s => s.type === 'out')?._sum.quantity || 0),
        adjust: stats.find(s => s.type === 'adjust')?._count || 0,
        return: stats.find(s => s.type === 'return')?._sum.quantity || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch inventory transactions:', error)
    return NextResponse.json({ error: '입출고 내역 조회에 실패했습니다.' }, { status: 500 })
  }
}
