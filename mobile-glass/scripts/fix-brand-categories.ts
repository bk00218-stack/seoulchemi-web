import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 대분류 ID 확인
  const cats = await prisma.mainCategory.findMany()
  const SPARE = cats.find(c => c.code === 'SPARE')?.id
  const RX = cats.find(c => c.code === 'RX')?.id
  const CONTACT = cats.find(c => c.code === 'CONTACT')?.id

  console.log('📂 대분류 ID:', { SPARE, RX, CONTACT })

  // RX 브랜드로 이동: 대명, 에실로, 호야, 자이스, 니콘
  const rxBrands = ['대명', '에실로', '호야', '자이스', '니콘']
  
  console.log('\n🔄 RX 대분류로 이동:')
  for (const name of rxBrands) {
    const result = await prisma.brand.updateMany({
      where: { name },
      data: { categoryId: RX }
    })
    if (result.count > 0) {
      console.log(`  ✅ ${name} → 안경렌즈 RX`)
    }
  }

  // 여벌 브랜드 확인: 데코비젼, 케미, 하이텍, 진명, 진광학, [행사]영진컬러
  const spareBrands = ['데코비젼', '케미', '하이텍', '진명', '진광학', '[행사]영진컬러']
  
  console.log('\n✅ 여벌 브랜드 확인:')
  for (const name of spareBrands) {
    const brand = await prisma.brand.findFirst({ where: { name } })
    if (brand) {
      console.log(`  ${name}: categoryId ${brand.categoryId}`)
    }
  }

  // 최종 결과
  console.log('\n📊 최종 대분류별 브랜드:')
  for (const cat of cats) {
    const brands = await prisma.brand.findMany({
      where: { categoryId: cat.id },
      select: { name: true }
    })
    console.log(`  ${cat.name}: ${brands.map(b => b.name).join(', ') || '(없음)'}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
