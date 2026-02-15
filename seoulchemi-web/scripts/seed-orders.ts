import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 기존 주문 상태 확인
  const existingOrders = await prisma.order.findMany({
    include: { store: true, items: true }
  })
  console.log(`기존 주문 수: ${existingOrders.length}`)
  
  if (existingOrders.length === 0) {
    // 테스트 주문 생성
    const stores = await prisma.store.findMany({ take: 5 })
    const products = await prisma.product.findMany({ take: 10 })
    
    if (stores.length === 0) {
      console.log('가맹점이 없습니다. 먼저 가맹점을 추가해주세요.')
      return
    }
    
    if (products.length === 0) {
      console.log('상품이 없습니다. 먼저 상품을 추가해주세요.')
      return
    }
    
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered']
    const today = new Date()
    
    for (let i = 0; i < 20; i++) {
      const store = stores[i % stores.length]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const orderDate = new Date(today)
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 7))
      
      const orderNo = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`
      
      // 랜덤 상품 1-3개
      const itemCount = Math.floor(Math.random() * 3) + 1
      const selectedProducts = products.sort(() => Math.random() - 0.5).slice(0, itemCount)
      
      const order = await prisma.order.create({
        data: {
          orderNo,
          storeId: store.id,
          status,
          totalAmount: selectedProducts.reduce((sum, p) => sum + p.sellingPrice, 0),
          orderedAt: orderDate,
          confirmedAt: status !== 'pending' ? new Date(orderDate.getTime() + 3600000) : null,
          shippedAt: ['shipped', 'delivered'].includes(status) ? new Date(orderDate.getTime() + 7200000) : null,
          deliveredAt: status === 'delivered' ? new Date(orderDate.getTime() + 86400000) : null,
          items: {
            create: selectedProducts.map(p => ({
              productId: p.id,
              quantity: Math.floor(Math.random() * 3) + 1,
              unitPrice: p.sellingPrice,
              totalPrice: p.sellingPrice * (Math.floor(Math.random() * 3) + 1),
            }))
          }
        }
      })
      
      console.log(`주문 생성: ${order.orderNo} (${status})`)
    }
    
    console.log('테스트 주문 20개 생성 완료!')
  } else {
    console.log('기존 주문 목록:')
    existingOrders.forEach(o => {
      console.log(`  ${o.orderNo} - ${o.store.name} - ${o.status}`)
    })
    
    // 상태 업데이트 (pending -> confirmed)
    const pendingOrders = existingOrders.filter(o => o.status === 'pending')
    if (pendingOrders.length > 0) {
      const toUpdate = pendingOrders.slice(0, Math.ceil(pendingOrders.length / 2))
      for (const order of toUpdate) {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: 'confirmed',
            confirmedAt: new Date()
          }
        })
        console.log(`상태 변경: ${order.orderNo} pending -> confirmed`)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
