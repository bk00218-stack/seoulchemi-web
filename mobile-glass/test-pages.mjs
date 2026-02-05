// 페이지 로딩 테스트
const BASE = 'http://localhost:3000'

const pages = [
  '/login',
  '/admin/orders',
  '/admin/orders/new',
  '/admin/orders/returns',
  '/admin/stores',
  '/admin/stores/receivables',
  '/admin/stores/receivables/deposit',
  '/admin/stores/receivables/transactions',
  '/admin/stores/tax-invoices',
  '/admin/products',
  '/admin/products/brands',
  '/admin/products/inventory',
  '/admin/settings/users',
]

async function testPage(path) {
  try {
    const res = await fetch(BASE + path)
    if (res.ok) {
      console.log(`✅ ${path}`)
      return true
    } else {
      console.log(`❌ ${path} - HTTP ${res.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${path} - ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('\n========== 페이지 로딩 테스트 ==========\n')
  
  let passed = 0
  let failed = 0
  
  for (const page of pages) {
    const ok = await testPage(page)
    if (ok) passed++
    else failed++
  }
  
  console.log(`\n========== 결과: ${passed}/${pages.length} 통과 ==========\n`)
}

runTests().catch(console.error)
