import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { orderNo: 'desc' },
    take: 10,
    select: { id: true, orderNo: true, createdAt: true }
  })
  console.log('Recent orders:', JSON.stringify(orders, null, 2))
  
  // Check for February 2026 orders
  const febOrders = await prisma.order.findMany({
    where: { orderNo: { startsWith: 'ORD-202602' } },
    select: { orderNo: true }
  })
  console.log('\nFeb 2026 orders:', febOrders.map(o => o.orderNo))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
