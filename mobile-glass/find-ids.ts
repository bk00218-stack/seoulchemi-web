import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 더밝은안경 찾기
  const store = await prisma.store.findFirst({
    where: { name: { contains: '밝은' } },
    select: { id: true, name: true, code: true }
  })
  console.log('Store:', store)
  
  // [케미 일반] 중 찾기
  const product = await prisma.product.findFirst({
    where: { name: { contains: '케미 일반] 중' } },
    select: { id: true, name: true, brandId: true, sellingPrice: true }
  })
  console.log('Product:', product)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
