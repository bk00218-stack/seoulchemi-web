import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface PriceResult {
  originalPrice: number      // 정가
  finalPrice: number         // 최종가
  discountAmount: number     // 할인액
  discountRate: number       // 할인율 (%)
  discountType: 'special_price' | 'brand_discount' | 'product_discount' | 'base_discount' | 'none'
  discountSource: string     // 할인 출처 설명
}

/**
 * 거래처별 상품 가격 계산
 * 우선순위: 특수단가 > 브랜드별 할인 > 상품별 할인 > 기본할인율 > 정가
 */
export async function calculatePrice(
  storeId: number,
  productId: number
): Promise<PriceResult> {
  // 상품 정보 조회
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, brandId: true, sellingPrice: true }
  })

  if (!product) {
    throw new Error('상품을 찾을 수 없습니다')
  }

  const originalPrice = product.sellingPrice

  // 1. 특수단가 체크
  const specialPrice = await prisma.storeProductPrice.findUnique({
    where: { storeId_productId: { storeId, productId } }
  })

  if (specialPrice) {
    return {
      originalPrice,
      finalPrice: specialPrice.specialPrice,
      discountAmount: originalPrice - specialPrice.specialPrice,
      discountRate: ((originalPrice - specialPrice.specialPrice) / originalPrice) * 100,
      discountType: 'special_price',
      discountSource: '특수단가'
    }
  }

  // 2. 브랜드별 할인 체크
  const brandDiscount = await prisma.storeBrandDiscount.findUnique({
    where: { storeId_brandId: { storeId, brandId: product.brandId } },
    include: { brand: { select: { name: true } } }
  })

  if (brandDiscount && brandDiscount.discountRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - brandDiscount.discountRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: brandDiscount.discountRate,
      discountType: 'brand_discount',
      discountSource: `브랜드 할인 (${brandDiscount.brand.name})`
    }
  }

  // 3. 상품별 할인 체크
  const productDiscount = await prisma.storeProductDiscount.findUnique({
    where: { storeId_productId: { storeId, productId } }
  })

  if (productDiscount && productDiscount.discountRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - productDiscount.discountRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: productDiscount.discountRate,
      discountType: 'product_discount',
      discountSource: '상품별 할인'
    }
  }

  // 4. 기본 할인율 체크
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { discountRate: true }
  })

  if (store && store.discountRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - store.discountRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: store.discountRate,
      discountType: 'base_discount',
      discountSource: '기본 할인율'
    }
  }

  // 5. 할인 없음 - 정가
  return {
    originalPrice,
    finalPrice: originalPrice,
    discountAmount: 0,
    discountRate: 0,
    discountType: 'none',
    discountSource: '정가'
  }
}

/**
 * 여러 상품의 가격을 한번에 계산
 */
export async function calculatePrices(
  storeId: number,
  productIds: number[]
): Promise<Map<number, PriceResult>> {
  const results = new Map<number, PriceResult>()
  
  for (const productId of productIds) {
    const result = await calculatePrice(storeId, productId)
    results.set(productId, result)
  }
  
  return results
}

/**
 * 거래처의 모든 할인 설정을 한번에 조회 (캐싱용)
 */
export async function getStoreDiscountSettings(storeId: number) {
  const [store, brandDiscounts, productDiscounts, productPrices] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: { discountRate: true }
    }),
    prisma.storeBrandDiscount.findMany({
      where: { storeId }
    }),
    prisma.storeProductDiscount.findMany({
      where: { storeId }
    }),
    prisma.storeProductPrice.findMany({
      where: { storeId }
    })
  ])

  return {
    baseDiscountRate: store?.discountRate || 0,
    brandDiscounts: new Map(brandDiscounts.map(d => [d.brandId, d.discountRate])),
    productDiscounts: new Map(productDiscounts.map(d => [d.productId, d.discountRate])),
    productPrices: new Map(productPrices.map(p => [p.productId, p.specialPrice]))
  }
}

/**
 * 캐시된 설정으로 빠른 가격 계산
 */
export function calculatePriceFromCache(
  product: { id: number; brandId: number; sellingPrice: number },
  settings: Awaited<ReturnType<typeof getStoreDiscountSettings>>
): PriceResult {
  const originalPrice = product.sellingPrice

  // 1. 특수단가
  const specialPrice = settings.productPrices.get(product.id)
  if (specialPrice !== undefined) {
    return {
      originalPrice,
      finalPrice: specialPrice,
      discountAmount: originalPrice - specialPrice,
      discountRate: ((originalPrice - specialPrice) / originalPrice) * 100,
      discountType: 'special_price',
      discountSource: '특수단가'
    }
  }

  // 2. 브랜드별 할인
  const brandRate = settings.brandDiscounts.get(product.brandId)
  if (brandRate && brandRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - brandRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: brandRate,
      discountType: 'brand_discount',
      discountSource: '브랜드 할인'
    }
  }

  // 3. 상품별 할인
  const productRate = settings.productDiscounts.get(product.id)
  if (productRate && productRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - productRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: productRate,
      discountType: 'product_discount',
      discountSource: '상품별 할인'
    }
  }

  // 4. 기본 할인율
  if (settings.baseDiscountRate > 0) {
    const finalPrice = Math.round(originalPrice * (1 - settings.baseDiscountRate / 100))
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      discountRate: settings.baseDiscountRate,
      discountType: 'base_discount',
      discountSource: '기본 할인율'
    }
  }

  // 5. 정가
  return {
    originalPrice,
    finalPrice: originalPrice,
    discountAmount: 0,
    discountRate: 0,
    discountType: 'none',
    discountSource: '정가'
  }
}
