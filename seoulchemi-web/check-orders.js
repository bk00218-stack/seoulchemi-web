const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    select: {
      id: true,
      orderNo: true,
      status: true,
      orderType: true,
      totalAmount: true,
      orderedAt: true
    }
  })
  console.log('Recent Orders:')
  console.log(JSON.stringify(orders, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
