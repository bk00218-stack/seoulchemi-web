// 전체 API 테스트 스크립트
const BASE = 'http://localhost:3000'

async function test(name, fn) {
  try {
    const result = await fn()
    console.log(`✅ ${name}`)
    return result
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`)
    return null
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function runTests() {
  console.log('\n========== 렌즈초이스 API 테스트 ==========\n')

  // 1. 로그인 테스트
  console.log('📌 1. 인증 API')
  const loginResult = await test('로그인', async () => {
    return await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin1234' })
    })
  })
  
  // 2. 사용자 API
  console.log('\n📌 2. 사용자 API')
  await test('사용자 목록', () => fetchJson('/api/users'))
  
  // 3. 주문 API
  console.log('\n📌 3. 주문 API')
  await test('주문 목록', () => fetchJson('/api/orders'))
  await test('주문 대시보드', () => fetchJson('/api/orders/dashboard'))
  
  // 4. 재고 API
  console.log('\n📌 4. 재고 API')
  const inventory = await test('재고 조회', () => fetchJson('/api/inventory?limit=5'))
  await test('입출고 내역', () => fetchJson('/api/inventory/transactions'))
  
  // 5. 가맹점 API
  console.log('\n📌 5. 가맹점 API')
  const stores = await test('가맹점 목록', () => fetchJson('/api/stores'))
  
  // 6. 미수금 API
  console.log('\n📌 6. 미수금 API')
  await test('미수금 현황', () => fetchJson('/api/receivables'))
  await test('입출금 내역', () => fetchJson('/api/receivables/transactions'))
  
  // 7. 반품 API
  console.log('\n📌 7. 반품 API')
  await test('반품 목록', () => fetchJson('/api/returns'))
  
  // 8. 세금계산서 API
  console.log('\n📌 8. 세금계산서 API')
  await test('세금계산서 목록', () => fetchJson('/api/tax-invoices'))
  
  // 9. 상품 API
  console.log('\n📌 9. 상품 API')
  await test('브랜드 목록', () => fetchJson('/api/brands'))
  await test('상품 목록', () => fetchJson('/api/products?limit=5'))
  
  // 10. 주문 상세 테스트 (기존 주문이 있으면)
  console.log('\n📌 10. 주문 상세 API')
  await test('주문 상세 (ID: 22)', () => fetchJson('/api/orders/22'))
  await test('주문 출력 데이터', () => fetchJson('/api/orders/22/print?type=statement'))

  console.log('\n========== 테스트 완료 ==========\n')
}

runTests().catch(console.error)
