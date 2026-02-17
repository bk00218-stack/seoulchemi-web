import { NextRequest, NextResponse } from 'next/server'
import { calculatePrice, calculatePrices, getStoreDiscountSettings, calculatePriceFromCache } from '@/lib/priceCalculator'
import { prisma } from '@/lib/prisma'

// GET: 상품 가격 계산
// ?productId=123 - 단일 상품
// ?productIds=1,2,3 - 여러 상품
// ?all=true - 모든 상품
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get('productId')
    const productIds = searchParams.get('productIds')
    const all = searchParams.get('all')

    // 단일 상품
    if (productId) {
      const result = await calculatePrice(storeId, parseInt(productId))
      return NextResponse.json(result)
    }

    // 여러 상품
    if (productIds) {
      const ids = productIds.split(',').map(id => parseInt(id.trim()))
      const results = await calculatePrices(storeId, ids)
      return NextResponse.json(Object.fromEntries(results))
    }

    // 모든 상품 (캐시 사용)
    if (all === 'true') {
      const [settings, products] = await Promise.all([
        getStoreDiscountSettings(storeId),
        prisma.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, brandId: true, sellingPrice: true }
        })
      ])

      const results: Record<number, unknown> = {}
      for (const product of products) {
        results[product.id] = {
          ...calculatePriceFromCache(product, settings),
          productName: product.name
        }
      }

      return NextResponse.json({
        storeId,
        settings: {
          baseDiscountRate: settings.baseDiscountRate,
          brandDiscountCount: settings.brandDiscounts.size,
          productDiscountCount: settings.productDiscounts.size,
          specialPriceCount: settings.productPrices.size
        },
        products: results
      })
    }

    return NextResponse.json({ error: 'productId, productIds, or all parameter required' }, { status: 400 })
  } catch (error) {
    console.error('Failed to calculate price:', error)
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 })
  }
}
