const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Check order with items and products
  const order = await p.order.findFirst({
    include: {
      store: true,
      items: {
        include: {
          product: {
            include: { brand: true }
          }
        }
      }
    }
  })
  
  console.log('Order:', order?.orderNo)
  console.log('Store:', order?.store?.name)
  console.log('Items count:', order?.items?.length)
  
  if (order?.items?.length > 0) {
    const item = order.items[0]
    console.log('\nFirst item:')
    console.log('  productId:', item.productId)
    console.log('  product:', item.product?.name || 'NULL')
    console.log('  brand:', item.product?.brand?.name || 'NULL')
    console.log('  sph:', item.sph)
    console.log('  quantity:', item.quantity)
  }
  
  // Check if product 26 exists
  const product26 = await p.product.findUnique({
    where: { id: 26 },
    include: { brand: true }
  })
  console.log('\nProduct 26:', product26?.name || 'NOT FOUND')
  console.log('Product 26 brand:', product26?.brand?.name || 'N/A')
  
  await p.$disconnect()
}

main()
