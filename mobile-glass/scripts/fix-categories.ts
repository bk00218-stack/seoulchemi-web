import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. 올바른 대분류 코드들
  const validCodes = ['rx', 'stock', 'contact', 'accessory', 'tint']
  
  // 2. 잘못된 카테고리 삭제 (브랜드 연결이 없는 것만)
  const invalidCategories = await prisma.category.findMany({
    where: { code: { notIn: validCodes } }
  })
  
  console.log('🗑️ 삭제할 카테고리:')
  for (const cat of invalidCategories) {
    const brandCount = await prisma.brand.count({ where: { categoryId: cat.id } })
    if (brandCount === 0) {
      await prisma.category.delete({ where: { id: cat.id } })
      console.log(`  ❌ ${cat.name} (${cat.code}) - 삭제됨`)
    } else {
      console.log(`  ⚠️ ${cat.name} (${cat.code}) - 브랜드 ${brandCount}개 연결됨, 스킵`)
    }
  }

  // 3. 미연결 브랜드를 안경렌즈 RX로 연결 (니콘, 대명, 에실로, 자이스, 호야)
  const rxCategory = await prisma.category.findFirst({ where: { code: 'rx' } })
  if (rxCategory) {
    const unlinked = await prisma.brand.findMany({ where: { categoryId: null } })
    console.log('\n🔗 미연결 브랜드 → 안경렌즈 RX 연결:')
    for (const brand of unlinked) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: { categoryId: rxCategory.id }
      })
      console.log(`  ✅ ${brand.name}`)
    }
  }

  // 4. 최종 상태 확인
  const categories = await prisma.category.findMany({ orderBy: { displayOrder: 'asc' } })
  console.log('\n📂 정리된 대분류:')
  for (const cat of categories) {
    const count = await prisma.brand.count({ where: { categoryId: cat.id } })
    console.log(`  ${cat.name}: ${count}개 브랜드`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
