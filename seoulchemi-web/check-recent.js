const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    where: { orderNo: { in: ['024', '025'] } },
    include: {
      items: {
        include: {
          product: {
            include: { brand: { include: { supplier: true } } }
          }
        }
      },
      store: true
    }
  })
  
  orders.forEach(o => {
    console.log(`\n=== Order ${o.orderNo} ===`)
    console.log(`Store: ${o.store?.name || 'NULL'} (id: ${o.storeId})`)
    console.log(`Status: ${o.status}`)
    console.log(`Type: ${o.orderType}`)
    console.log(`Items: ${o.items.length}`)
    o.items.forEach(item => {
      const brand = item.product?.brand
      console.log(`  - Product: ${item.product?.name || 'NULL'}`)
      console.log(`    Brand: ${brand?.name || 'NULL'} (supplierId: ${brand?.supplierId || 'NULL'})`)
    })
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
