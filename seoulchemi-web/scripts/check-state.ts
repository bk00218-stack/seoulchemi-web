import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // MainCategory 확인
  const mainCats = await prisma.mainCategory.findMany()
  console.log('\n📂 MainCategory 테이블:')
  mainCats.forEach(c => console.log(`  ID ${c.id}: ${c.name} (${c.code})`))

  // Brand의 categoryId 확인
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true, categoryId: true }
  })
  console.log('\n🏷️ Brand.categoryId 확인:')
  brands.forEach(b => console.log(`  ID ${b.id}: ${b.name} → categoryId: ${b.categoryId}`))

  // categoryId별 브랜드 수
  console.log('\n📊 categoryId별 브랜드 수:')
  const grouped = brands.reduce((acc, b) => {
    const key = b.categoryId ?? 'null'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  Object.entries(grouped).forEach(([k, v]) => console.log(`  categoryId ${k}: ${v}개`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
