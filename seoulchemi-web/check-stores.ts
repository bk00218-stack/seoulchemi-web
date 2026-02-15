import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const stores = await prisma.store.findMany({
    take: 5,
    select: { id: true, name: true, code: true }
  })
  console.log('Stores:', JSON.stringify(stores, null, 2))
  
  const products = await prisma.product.findMany({
    take: 3,
    select: { id: true, name: true, brandId: true, sellingPrice: true }
  })
  console.log('Products:', JSON.stringify(products, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
