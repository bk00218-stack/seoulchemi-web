const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 밝은안경 가맹점 찾기
  const store = await prisma.store.findFirst({ where: { code: 'BK-001' } })
  if (!store) {
    console.log('❌ 가맹점 없음')
    return
  }
  console.log('가맹점:', store.name, `(${store.code})`)

  // 상품 2개 가져오기
  const products = await prisma.product.findMany({ take: 2 })
  console.log('상품:', products.map(p => p.name).join(', '))

  // 주문번호 생성
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.order.count()
  const orderNo = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`

  // 주문 생성
  const order = await prisma.order.create({
    data: {
      orderNo,
      storeId: store.id,
      status: 'pending',
      totalAmount: products.reduce((sum, p) => sum + (p.sellingPrice || 0), 0),
      items: {
        create: products.map(p => ({
          productId: p.id,
          quantity: 1,
          unitPrice: p.sellingPrice || 0,
          totalPrice: p.sellingPrice || 0,
        }))
      }
    },
    include: {
      items: { include: { product: true } }
    }
  })

  console.log('\n✅ 주문 생성 완료!')
  console.log('주문번호:', order.orderNo)
  console.log('금액:', order.totalAmount.toLocaleString() + '원')
  console.log('상품:', order.items.map(i => i.product.name).join(', '))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
