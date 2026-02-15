const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const prods = await p.product.findMany({
    where: { brand: { name: '케미' } },
    select: {
      id: true,
      name: true,
      erpCode: true,
      imageUrl: true,
      refractiveIndex: true,
      optionName: true,
      bundleName: true
    },
    orderBy: { id: 'asc' }
  })
  console.log('케미 상품 수:', prods.length)
  prods.forEach(p => {
    console.log(`[${p.id}] ${p.name} | ERP: ${p.erpCode || '-'} | 굴절률: ${p.refractiveIndex || '-'} | 이미지: ${p.imageUrl ? '✓' : '✗'}`)
  })
}

main().finally(() => p.$disconnect())
