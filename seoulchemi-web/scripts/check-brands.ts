import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all categories
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' }
  })
  console.log('\n📂 대분류 목록:')
  categories.forEach(c => console.log(`  ${c.id}: ${c.name} (${c.code})`))

  // Get all brands
  const brands = await prisma.brand.findMany({
    include: { category: true },
    orderBy: { name: 'asc' }
  })
  console.log('\n🏷️ 브랜드 목록:')
  brands.forEach(b => console.log(`  ${b.id}: ${b.name} → ${b.category?.name || '(미연결)'}`))

  // Count by category
  console.log('\n📊 대분류별 브랜드 수:')
  for (const cat of categories) {
    const count = brands.filter(b => b.categoryId === cat.id).length
    console.log(`  ${cat.name}: ${count}개`)
  }
  const unlinked = brands.filter(b => !b.categoryId).length
  console.log(`  미연결: ${unlinked}개`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
