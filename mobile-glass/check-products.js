const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const brands = await p.brand.findMany({ orderBy: { displayOrder: 'asc' } })
  
  for (const brand of brands) {
    const count = await p.product.count({ where: { brandId: brand.id } })
    console.log(`Brand ${brand.id}: ${brand.name} -> ${count} products`)
  }
}

main().finally(() => p.$disconnect())
