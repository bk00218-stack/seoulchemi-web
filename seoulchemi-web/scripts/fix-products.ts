/**
 * 상품 정리 스크립트
 * 1. 중복 상품 찾기 & 삭제
 * 2. 도수 옵션 자동 생성
 * 3. 상품명/품목 정리
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 도수 범위 설정 (여벌렌즈용)
const SPH_RANGE = { min: -10, max: 6, step: 0.25 }
const CYL_RANGE = { min: -4, max: 0, step: 0.25 }

function formatDiopter(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}`
}

function generateDiopterRange(min: number, max: number, step: number): number[] {
  const values: number[] = []
  for (let v = min; v <= max; v += step) {
    values.push(Math.round(v * 100) / 100)
  }
  return values
}

async function main() {
  console.log('🔍 상품 분석 시작...\n')

  // 1. 현재 상품 현황 파악
  const products = await prisma.product.findMany({
    where: { optionType: '안경렌즈 여벌' },
    include: {
      brand: true,
      productLine: true,
      options: true,
    },
    orderBy: [{ brandId: 'asc' }, { name: 'asc' }],
  })

  console.log(`📦 여벌렌즈 상품 총 ${products.length}개\n`)

  // 2. 중복 상품 찾기 (같은 브랜드 + 같은 상품명)
  const duplicateMap = new Map<string, typeof products>()
  for (const p of products) {
    const key = `${p.brandId}-${p.name}`
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, [])
    }
    duplicateMap.get(key)!.push(p)
  }

  const duplicates = Array.from(duplicateMap.entries()).filter(([_, items]) => items.length > 1)
  
  if (duplicates.length > 0) {
    console.log('⚠️  중복 상품 발견:')
    for (const [key, items] of duplicates) {
      console.log(`   - ${items[0].brand?.name} / ${items[0].name}: ${items.length}개`)
      // 첫번째 것만 남기고 나머지 삭제
      for (let i = 1; i < items.length; i++) {
        console.log(`     → 삭제: ID ${items[i].id}`)
        await prisma.productOption.deleteMany({ where: { productId: items[i].id } })
        await prisma.product.delete({ where: { id: items[i].id } })
      }
    }
    console.log(`\n✅ 중복 ${duplicates.reduce((sum, [_, items]) => sum + items.length - 1, 0)}개 삭제 완료\n`)
  } else {
    console.log('✅ 중복 상품 없음\n')
  }

  // 3. 도수 옵션 없는 상품 찾기
  const productsWithoutOptions = await prisma.product.findMany({
    where: {
      optionType: '안경렌즈 여벌',
      options: { none: {} },
    },
    include: { brand: true },
  })

  console.log(`📋 도수옵션 없는 상품: ${productsWithoutOptions.length}개`)
  
  if (productsWithoutOptions.length > 0) {
    console.log('\n도수 옵션 생성 중...')
    
    const sphValues = generateDiopterRange(SPH_RANGE.min, SPH_RANGE.max, SPH_RANGE.step)
    const cylValues = generateDiopterRange(CYL_RANGE.min, CYL_RANGE.max, CYL_RANGE.step)
    
    // 기본 범위: SPH -8.00 ~ +4.00, CYL 0 ~ -2.00 (일반적인 재고 범위)
    const defaultSphValues = sphValues.filter(v => v >= -8 && v <= 4)
    const defaultCylValues = cylValues.filter(v => v >= -2 && v <= 0)
    
    for (const product of productsWithoutOptions) {
      const options: { productId: number; sph: string; cyl: string; stock: number }[] = []
      
      for (const sph of defaultSphValues) {
        for (const cyl of defaultCylValues) {
          options.push({
            productId: product.id,
            sph: formatDiopter(sph),
            cyl: formatDiopter(cyl),
            stock: 0,
          })
        }
      }
      
      await prisma.productOption.createMany({ data: options })
      console.log(`   ✅ ${product.brand?.name} ${product.name}: ${options.length}개 옵션 생성`)
    }
  }

  // 4. 현황 요약
  console.log('\n' + '='.repeat(50))
  console.log('📊 최종 현황:')
  
  const finalProducts = await prisma.product.findMany({
    where: { optionType: '안경렌즈 여벌' },
    include: {
      brand: true,
      _count: { select: { options: true } },
    },
  })

  const byBrand = new Map<string, { count: number; withOptions: number }>()
  for (const p of finalProducts) {
    const brandName = p.brand?.name || '(없음)'
    if (!byBrand.has(brandName)) {
      byBrand.set(brandName, { count: 0, withOptions: 0 })
    }
    const stat = byBrand.get(brandName)!
    stat.count++
    if (p._count.options > 0) stat.withOptions++
  }

  for (const [brand, stat] of byBrand) {
    console.log(`   ${brand}: ${stat.count}개 상품, ${stat.withOptions}개 도수옵션 있음`)
  }

  console.log('\n✨ 완료!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
