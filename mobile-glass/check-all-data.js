const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('=== 전체 DB 데이터 현황 ===\n')
  
  const tables = [
    ['Brand', p.brand],
    ['Product', p.product],
    ['ProductOption', p.productOption],
    ['Store', p.store],
    ['StoreGroup', p.storeGroup],
    ['Order', p.order],
    ['Supplier', p.supplier],
    ['User', p.user],
    ['DeliveryStaff', p.deliveryStaff],
  ]
  
  for (const [name, model] of tables) {
    const count = await model.count()
    const status = count > 0 ? '✓' : '✗'
    console.log(`${status} ${name}: ${count}`)
  }
  
  // 샘플 데이터 확인
  console.log('\n=== 샘플 데이터 ===')
  
  const stores = await p.store.findMany({ take: 3, select: { id: true, name: true, code: true } })
  if (stores.length > 0) {
    console.log('\nStores:', JSON.stringify(stores, null, 2))
  }
  
  const brands = await p.brand.findMany({ take: 3, select: { id: true, name: true } })
  if (brands.length > 0) {
    console.log('\nBrands:', JSON.stringify(brands, null, 2))
  }
  
  await p.$disconnect()
}

main().catch(console.error)
