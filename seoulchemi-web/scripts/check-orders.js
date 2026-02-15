const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      store: true,
      items: { include: { product: { include: { brand: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  console.log('=== 최근 주문 내역 ===\n')
  
  if (orders.length === 0) {
    console.log('주문 없음')
    return
  }

  orders.forEach(order => {
    console.log(`📦 ${order.orderNo}`)
    console.log(`   가맹점: ${order.store.name}`)
    console.log(`   상태: ${order.status}`)
    console.log(`   금액: ${order.totalAmount.toLocaleString()}원`)
    console.log(`   상품:`)
    order.items.forEach(item => {
      console.log(`     - ${item.product.brand?.name || ''} ${item.product.name} x${item.quantity}`)
    })
    console.log(`   주문일: ${order.createdAt.toLocaleString('ko-KR')}`)
    console.log('')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
