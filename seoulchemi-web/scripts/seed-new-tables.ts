import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== 새 테이블 데이터 시딩 ===')
  
  // 1. 기존 주문에 orderType 설정 (랜덤하게 stock/rx 배분)
  const orders = await prisma.order.findMany()
  console.log(`기존 주문 ${orders.length}개 업데이트 중...`)
  
  for (const order of orders) {
    const orderType = Math.random() > 0.6 ? 'rx' : 'stock'
    await prisma.order.update({
      where: { id: order.id },
      data: { orderType }
    })
  }
  console.log('주문 타입 설정 완료')
  
  // 2. 매입처 생성
  const suppliers = [
    { name: '에실로코리아', code: 'SUP001', contactName: '김담당', phone: '02-1234-5678', email: 'contact@essilor.kr' },
    { name: '호야광학', code: 'SUP002', contactName: '이과장', phone: '02-2345-6789', email: 'sales@hoya.kr' },
    { name: '칼자이스코리아', code: 'SUP003', contactName: '박대리', phone: '02-3456-7890', email: 'info@zeiss.kr' },
    { name: '니콘광학', code: 'SUP004', contactName: '최부장', phone: '02-4567-8901', email: 'order@nikon.kr' },
    { name: '케미렌즈', code: 'SUP005', contactName: '정팀장', phone: '02-5678-9012', email: 'supply@chemi.kr' },
  ]
  
  console.log('매입처 생성 중...')
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: supplier,
      create: supplier,
    })
  }
  console.log(`매입처 ${suppliers.length}개 생성 완료`)
  
  // 3. 매입 데이터 생성
  const createdSuppliers = await prisma.supplier.findMany()
  const products = await prisma.product.findMany({ take: 20 })
  
  console.log('매입 데이터 생성 중...')
  const statuses = ['pending', 'completed', 'completed', 'completed', 'cancelled']
  
  for (let i = 0; i < 15; i++) {
    const supplier = createdSuppliers[i % createdSuppliers.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const purchaseDate = new Date()
    purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 30))
    
    const purchaseNo = `PUR-2026${String(purchaseDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`
    
    // 랜덤 상품 1-3개
    const itemCount = Math.floor(Math.random() * 3) + 1
    const selectedProducts = products.sort(() => Math.random() - 0.5).slice(0, itemCount)
    
    const items = selectedProducts.map(p => ({
      productId: p.id,
      quantity: Math.floor(Math.random() * 100) + 10,
      unitPrice: p.purchasePrice || Math.floor(p.sellingPrice * 0.6),
      totalPrice: 0, // will be calculated
    }))
    
    items.forEach(item => {
      item.totalPrice = item.quantity * item.unitPrice
    })
    
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
    
    await prisma.purchase.upsert({
      where: { purchaseNo },
      update: {},
      create: {
        purchaseNo,
        supplierId: supplier.id,
        status,
        totalAmount,
        purchasedAt: purchaseDate,
        receivedAt: status === 'completed' ? new Date(purchaseDate.getTime() + 86400000 * 2) : null,
        items: {
          create: items
        }
      }
    })
  }
  console.log('매입 15건 생성 완료')
  
  // 4. 설정 데이터 생성
  const settings = [
    { key: 'company.name', value: 'BK COMPANY', description: '회사명' },
    { key: 'company.bizNo', value: '123-45-67890', description: '사업자등록번호' },
    { key: 'company.owner', value: '홍길동', description: '대표자명' },
    { key: 'company.phone', value: '02-1234-5678', description: '대표 연락처' },
    { key: 'company.email', value: 'admin@bkcompany.co.kr', description: '이메일' },
    { key: 'company.address', value: '서울시 강남구 테헤란로 123', description: '주소' },
    { key: 'order.prefix', value: 'ORD', description: '주문번호 접두사' },
    { key: 'order.autoConfirmDays', value: '3', description: '자동 확정 기간(일)' },
    { key: 'order.minAmount', value: '50000', description: '최소 주문금액' },
    { key: 'notification.push', value: 'true', description: '푸시 알림' },
    { key: 'notification.email', value: 'true', description: '이메일 알림' },
  ]
  
  console.log('설정 데이터 생성 중...')
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    })
  }
  console.log(`설정 ${settings.length}개 생성 완료`)
  
  // 결과 출력
  const stockOrders = await prisma.order.count({ where: { orderType: 'stock' } })
  const rxOrders = await prisma.order.count({ where: { orderType: 'rx' } })
  const purchaseCount = await prisma.purchase.count()
  const supplierCount = await prisma.supplier.count()
  const settingCount = await prisma.setting.count()
  
  console.log('\n=== 시딩 완료 ===')
  console.log(`여벌 주문: ${stockOrders}건`)
  console.log(`RX 주문: ${rxOrders}건`)
  console.log(`매입처: ${supplierCount}개`)
  console.log(`매입: ${purchaseCount}건`)
  console.log(`설정: ${settingCount}개`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
