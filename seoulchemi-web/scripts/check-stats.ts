import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const brands = await prisma.brand.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  console.log('=== 브랜드별 상품 수 ===')
  let total = 0
  for (const b of brands) {
    console.log(`${b.name}: ${b._count.products}개`)
    total += b._count.products
  }
  console.log(`\n총 상품: ${total}개`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
