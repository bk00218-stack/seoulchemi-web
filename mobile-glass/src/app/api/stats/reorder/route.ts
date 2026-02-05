// 자동 발주 제안 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '5') // 기본 5개 이하면 발주 제안
    const brandId = searchParams.get('brandId')

    // 재고 부족 상품 조회
    const where: any = {
      isActive: true,
      stock: { lte: threshold },
      product: { isActive: true }
    }

    if (brandId) {
      where.product.brandId = parseInt(brandId)
    }

    const lowStockOptions = await prisma.productOption.findMany({
      where,
      include: {
        product: {
          include: { brand: true }
        }
      },
      orderBy: { stock: 'asc' }
    })

    // 최근 30일 판매량 기준 발주 추천 수량 계산
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recommendations = await Promise.all(
      lowStockOptions.map(async (option) => {
        // 최근 30일 판매량
        const salesData = await prisma.orderItem.aggregate({
          where: {
            productId: option.productId,
            sph: option.sph,
            cyl: option.cyl,
            order: {
              orderedAt: { gte: thirtyDaysAgo },
              status: { not: 'cancelled' }
            }
          },
          _sum: { quantity: true }
        })

        const monthlySales = salesData._sum.quantity || 0
        const dailyAvg = monthlySales / 30
        
        // 발주 추천 수량 = (일평균 판매량 * 30일) - 현재 재고 + 안전 재고(10)
        const recommendedQty = Math.max(
          Math.ceil(dailyAvg * 30) - option.stock + 10,
          10 // 최소 10개
        )

        return {
          optionId: option.id,
          productId: option.productId,
          productName: option.product.name,
          brandName: option.product.brand.name,
          sph: option.sph,
          cyl: option.cyl,
          currentStock: option.stock,
          monthlySales,
          dailyAvg: Math.round(dailyAvg * 100) / 100,
          recommendedQty,
          purchasePrice: option.product.purchasePrice,
          estimatedCost: recommendedQty * option.product.purchasePrice,
          urgency: option.stock === 0 ? 'critical' : option.stock <= 3 ? 'high' : 'normal'
        }
      })
    )

    // 브랜드별 그룹화
    const byBrand: Record<string, typeof recommendations> = {}
    recommendations.forEach(item => {
      if (!byBrand[item.brandName]) {
        byBrand[item.brandName] = []
      }
      byBrand[item.brandName].push(item)
    })

    // 요약
    const summary = {
      totalItems: recommendations.length,
      criticalCount: recommendations.filter(r => r.urgency === 'critical').length,
      highCount: recommendations.filter(r => r.urgency === 'high').length,
      totalEstimatedCost: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0)
    }

    return NextResponse.json({
      summary,
      recommendations: recommendations.sort((a, b) => {
        // 긴급도 순 정렬
        const urgencyOrder = { critical: 0, high: 1, normal: 2 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }),
      byBrand
    })
  } catch (error) {
    console.error('Failed to fetch reorder suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch reorder suggestions' }, { status: 500 })
  }
}
