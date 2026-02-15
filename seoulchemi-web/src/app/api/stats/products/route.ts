import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 상품별 매출 통계
export async function GET() {
  try {
    // 상품별 판매 집계
    const productStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        totalPrice: true
      },
      _count: {
        id: true
      }
    })
    
    // 상품 정보 조회
    const productIds = productStats.map(s => s.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // 결과 조합
    const stats = productStats
      .map(s => {
        const product = productMap.get(s.productId)
        if (!product) return null
        return {
          id: s.productId,
          productName: product.name,
          brandName: product.brand.name,
          optionType: product.optionType,
          quantity: s._sum.quantity || 0,
          amount: s._sum.totalPrice || 0,
          orderCount: s._count.id
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.amount || 0) - (a?.amount || 0))
    
    // 브랜드별 집계
    const brandStats: Record<string, { count: number; amount: number }> = {}
    stats.forEach(s => {
      if (!s) return
      if (!brandStats[s.brandName]) {
        brandStats[s.brandName] = { count: 0, amount: 0 }
      }
      brandStats[s.brandName].count += s.quantity
      brandStats[s.brandName].amount += s.amount
    })
    
    const totalAmount = stats.reduce((sum, s) => sum + (s?.amount || 0), 0)
    const totalCount = stats.reduce((sum, s) => sum + (s?.quantity || 0), 0)
    
    return NextResponse.json({
      products: stats,
      brands: Object.entries(brandStats).map(([name, data]) => ({
        name,
        ...data
      })).sort((a, b) => b.amount - a.amount),
      summary: {
        totalAmount,
        totalCount,
        productCount: stats.length
      }
    })
  } catch (error) {
    console.error('Error fetching product stats:', error)
    return NextResponse.json({ error: 'Failed to fetch product stats' }, { status: 500 })
  }
}
