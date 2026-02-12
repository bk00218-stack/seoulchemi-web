const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('=== DB 데이터 현황 ===')
  console.log('Products:', await p.product.count())
  console.log('Brands:', await p.brand.count())
  console.log('Stores:', await p.store.count())
  console.log('Orders:', await p.order.count())
  console.log('ProductOptions:', await p.productOption.count())
  await p.$disconnect()
}

main()
