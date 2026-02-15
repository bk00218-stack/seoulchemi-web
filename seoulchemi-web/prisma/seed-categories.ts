import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 대분류 시드 데이터 생성 중...')

  // 대분류 생성
  const mainCategories = [
    { code: 'SPARE', name: '안경렌즈 여벌', displayOrder: 1 },
    { code: 'RX', name: '안경렌즈 RX', displayOrder: 2 },
    { code: 'CONTACT', name: '콘택트렌즈', displayOrder: 3 },
    { code: 'TINT', name: '착색', displayOrder: 4 },
  ]

  for (const cat of mainCategories) {
    await prisma.mainCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: cat,
    })
    console.log(`  ✅ ${cat.name} (${cat.code})`)
  }

  console.log('\n✨ 대분류 시드 완료!')

  // 기존 브랜드에 대분류 연결 (optionType 기반)
  console.log('\n🔗 기존 브랜드에 대분류 연결 중...')
  
  const categories = await prisma.mainCategory.findMany()
  const catMap = new Map(categories.map(c => [c.code, c.id]))

  // 기존 상품의 optionType을 기반으로 브랜드에 대분류 연결
  const products = await prisma.product.findMany({
    select: { brandId: true, optionType: true },
    distinct: ['brandId', 'optionType'],
  })

  for (const p of products) {
    let categoryId: number | null = null
    
    if (p.optionType.includes('여벌')) {
      categoryId = catMap.get('SPARE') || null
    } else if (p.optionType.includes('RX') || p.optionType.includes('맞춤')) {
      categoryId = catMap.get('RX') || null
    } else if (p.optionType.includes('콘택트')) {
      categoryId = catMap.get('CONTACT') || null
    } else if (p.optionType.includes('착색')) {
      categoryId = catMap.get('TINT') || null
    }

    if (categoryId) {
      await prisma.brand.update({
        where: { id: p.brandId },
        data: { categoryId },
      })
    }
  }

  console.log('✨ 브랜드 대분류 연결 완료!')
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
