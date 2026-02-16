const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: 'pending' },
    include: {
      items: {
        include: {
          product: {
            include: { brand: true }
          }
        }
      },
      store: true
    },
    take: 3
  })
  
  orders.forEach(o => {
    console.log(`\n=== Order ${o.orderNo} (${o.store?.name || 'no store'}) ===`)
    console.log(`Items: ${o.items.length}`)
    o.items.forEach(item => {
      console.log(`  - ${item.product?.name || 'no product'} (brand: ${item.product?.brand?.name || 'no brand'})`)
    })
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
