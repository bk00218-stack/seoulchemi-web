import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 초기 데이터 시딩 시작...\n')

  // 1. 브랜드 시딩
  console.log('📦 브랜드 생성 중...')
  const brands = [
    { name: '케미', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 1 },
    { name: '하이텍', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 2 },
    { name: '진명', stockManage: 'barcode', canExchange: true, canReturn: false, displayOrder: 3 },
    { name: '대명', stockManage: 'none', canExchange: false, canReturn: false, displayOrder: 4 },
    { name: '에실로', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 5 },
    { name: '호야', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 6 },
    { name: '자이스', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 7 },
    { name: '니콘', stockManage: 'barcode', canExchange: true, canReturn: true, displayOrder: 8 },
  ]

  for (const brand of brands) {
    const existing = await prisma.brand.findFirst({
      where: { name: brand.name }
    })
    if (existing) {
      await prisma.brand.update({
        where: { id: existing.id },
        data: brand
      })
    } else {
      await prisma.brand.create({
        data: brand
      })
    }
  }
  console.log(`   ✅ ${brands.length}개 브랜드 생성/업데이트`)

  // 2. 카테고리(구분) 시딩
  console.log('\n📂 카테고리 생성 중...')
  const categories = [
    // 옵션타입
    { type: 'optionType', code: 'rx', name: '안경렌즈 RX', displayOrder: 1 },
    { type: 'optionType', code: 'stock', name: '안경렌즈 여벌', displayOrder: 2 },
    { type: 'optionType', code: 'contact', name: '콘택트렌즈', displayOrder: 3 },
    { type: 'optionType', code: 'accessory', name: '악세서리', displayOrder: 4 },
    
    // 상품구분
    { type: 'productType', code: 'single', name: '단초점', displayOrder: 1 },
    { type: 'productType', code: 'progressive', name: '누진다초점', displayOrder: 2 },
    { type: 'productType', code: 'bifocal', name: '이중초점', displayOrder: 3 },
    { type: 'productType', code: 'office', name: '중근용/오피스', displayOrder: 4 },
    
    // 주문상태
    { type: 'orderStatus', code: 'pending', name: '대기', displayOrder: 1 },
    { type: 'orderStatus', code: 'confirmed', name: '확인', displayOrder: 2 },
    { type: 'orderStatus', code: 'processing', name: '가공중', displayOrder: 3 },
    { type: 'orderStatus', code: 'shipped', name: '출고', displayOrder: 4 },
    { type: 'orderStatus', code: 'delivered', name: '배송완료', displayOrder: 5 },
    { type: 'orderStatus', code: 'cancelled', name: '취소', displayOrder: 6 },
    
    // 거래처 상태
    { type: 'storeStatus', code: 'active', name: '정상', displayOrder: 1 },
    { type: 'storeStatus', code: 'suspended', name: '거래중지', displayOrder: 2 },
    { type: 'storeStatus', code: 'caution', name: '주의', displayOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { type_code: { type: cat.type, code: cat.code } },
      update: cat,
      create: cat
    })
  }
  console.log(`   ✅ ${categories.length}개 카테고리 생성/업데이트`)

  // 3. 거래처 그룹 시딩
  console.log('\n👥 거래처 그룹 생성 중...')
  const groups = [
    { name: '일반', description: '일반 거래처', discountRate: 0, storeType: 'normal' },
    { name: 'VIP', description: 'VIP 거래처', discountRate: 5, storeType: 'vip' },
    { name: '도매', description: '도매 거래처', discountRate: 10, storeType: 'wholesale' },
    { name: '신규', description: '신규 거래처', discountRate: 0, storeType: 'normal' },
  ]

  for (const group of groups) {
    await prisma.storeGroup.upsert({
      where: { name: group.name },
      update: group,
      create: group
    })
  }
  console.log(`   ✅ ${groups.length}개 거래처 그룹 생성/업데이트`)

  // 4. 배송 구역 시딩
  console.log('\n🚚 배송 구역 생성 중...')
  const zones = [
    { name: '서울/경기', regions: JSON.stringify(['서울', '경기']), baseFee: 0, freeThreshold: 50000, deliveryDays: 1 },
    { name: '충청', regions: JSON.stringify(['대전', '충북', '충남', '세종']), baseFee: 3000, freeThreshold: 100000, deliveryDays: 2 },
    { name: '경상', regions: JSON.stringify(['부산', '대구', '울산', '경북', '경남']), baseFee: 3000, freeThreshold: 100000, deliveryDays: 2 },
    { name: '전라', regions: JSON.stringify(['광주', '전북', '전남']), baseFee: 3000, freeThreshold: 100000, deliveryDays: 2 },
    { name: '강원', regions: JSON.stringify(['강원']), baseFee: 4000, freeThreshold: 150000, deliveryDays: 3 },
    { name: '제주', regions: JSON.stringify(['제주']), baseFee: 5000, freeThreshold: 200000, extraFee: 3000, deliveryDays: 3 },
  ]

  for (const zone of zones) {
    const existing = await prisma.shippingZone.findFirst({ where: { name: zone.name } })
    if (!existing) {
      await prisma.shippingZone.create({ data: zone })
    }
  }
  console.log(`   ✅ ${zones.length}개 배송 구역 생성/업데이트`)

  // 5. 도수 범위 시딩
  console.log('\n👓 도수 범위 생성 중...')
  const diopterRanges = [
    { name: 'S200', description: 'SPH 0.00 ~ -2.00', sphMin: 0, sphMax: -2, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 1 },
    { name: 'S400', description: 'SPH -2.25 ~ -4.00', sphMin: -2.25, sphMax: -4, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 2 },
    { name: 'S600', description: 'SPH -4.25 ~ -6.00', sphMin: -4.25, sphMax: -6, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 3 },
    { name: 'S800', description: 'SPH -6.25 ~ -8.00', sphMin: -6.25, sphMax: -8, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 4 },
    { name: 'S1000', description: 'SPH -8.25 ~ -10.00', sphMin: -8.25, sphMax: -10, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 5 },
    { name: 'P200', description: 'SPH +0.25 ~ +2.00', sphMin: 0.25, sphMax: 2, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 6 },
    { name: 'P400', description: 'SPH +2.25 ~ +4.00', sphMin: 2.25, sphMax: 4, sphStep: 0.25, cylMin: 0, cylMax: -2, cylStep: 0.25, displayOrder: 7 },
  ]

  for (const range of diopterRanges) {
    await prisma.diopterRange.upsert({
      where: { name: range.name },
      update: range,
      create: range
    })
  }
  console.log(`   ✅ ${diopterRanges.length}개 도수 범위 생성/업데이트`)

  // 6. SMS 템플릿 시딩
  console.log('\n📱 SMS 템플릿 생성 중...')
  const smsTemplates = [
    { name: '주문접수', code: 'order_received', category: 'order', content: '[렌즈초이스] {storeName}님, 주문이 접수되었습니다. 주문번호: {orderNo}', isAuto: true },
    { name: '출고완료', code: 'order_shipped', category: 'shipping', content: '[렌즈초이스] {storeName}님, 주문({orderNo})이 출고되었습니다. 배송 예정일: {deliveryDate}', isAuto: true },
    { name: '배송완료', code: 'order_delivered', category: 'shipping', content: '[렌즈초이스] {storeName}님, 주문({orderNo}) 배송이 완료되었습니다. 감사합니다!', isAuto: false },
    { name: '미수금안내', code: 'payment_remind', category: 'payment', content: '[렌즈초이스] {storeName}님, 미수금 {amount}원 안내드립니다. 확인 부탁드립니다.', isAuto: false },
  ]

  for (const tpl of smsTemplates) {
    await prisma.smsTemplate.upsert({
      where: { code: tpl.code },
      update: tpl,
      create: tpl
    })
  }
  console.log(`   ✅ ${smsTemplates.length}개 SMS 템플릿 생성/업데이트`)

  // 7. 기본 설정 시딩
  console.log('\n⚙️ 기본 설정 생성 중...')
  const settings = [
    { key: 'company.name', value: JSON.stringify('렌즈초이스'), description: '회사명' },
    { key: 'company.phone', value: JSON.stringify('02-1234-5678'), description: '대표 전화번호' },
    { key: 'company.address', value: JSON.stringify('서울시 강남구'), description: '회사 주소' },
    { key: 'company.bizNo', value: JSON.stringify('123-45-67890'), description: '사업자등록번호' },
    { key: 'order.autoConfirm', value: JSON.stringify(false), description: '주문 자동 확인' },
    { key: 'order.defaultDeliveryDays', value: JSON.stringify(2), description: '기본 배송 소요일' },
    { key: 'print.showLogo', value: JSON.stringify(true), description: '출력물 로고 표시' },
    { key: 'print.copies', value: JSON.stringify(2), description: '기본 출력 매수' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
  }
  console.log(`   ✅ ${settings.length}개 설정 생성/업데이트`)

  console.log('\n✨ 초기 데이터 시딩 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 생성된 데이터:')
  console.log(`   • 브랜드: ${brands.length}개`)
  console.log(`   • 카테고리: ${categories.length}개`)
  console.log(`   • 거래처 그룹: ${groups.length}개`)
  console.log(`   • 배송 구역: ${zones.length}개`)
  console.log(`   • 도수 범위: ${diopterRanges.length}개`)
  console.log(`   • SMS 템플릿: ${smsTemplates.length}개`)
  console.log(`   • 설정: ${settings.length}개`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
