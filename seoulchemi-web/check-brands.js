const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const brands = await p.brand.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { products: true } } }
  })
  console.log('Total brands:', brands.length)
  brands.forEach(b => console.log(`- ${b.name} (products: ${b._count.products}, active: ${b.isActive})`))
}

main().finally(() => p.$disconnect())
