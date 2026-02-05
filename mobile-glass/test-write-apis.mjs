// 쓰기 API 테스트
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
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function runTests() {
  console.log('\n========== 쓰기 API 테스트 ==========\n')

  // 1. 재고 조정 테스트
  console.log('📌 1. 재고 조정')
  
  // 먼저 재고가 있는 상품 옵션 찾기
  const inventory = await fetchJson('/api/inventory?limit=100')
  const productWithOptions = inventory.products.find(p => p.options.length > 0)
  
  if (productWithOptions) {
    const optionId = productWithOptions.options[0].id
    const currentStock = productWithOptions.options[0].stock
    console.log(`   대상: ${productWithOptions.brandName} ${productWithOptions.name} (옵션 ID: ${optionId}, 현재재고: ${currentStock})`)
    
    // 입고 테스트
    const inResult = await test('입고 +10', async () => {
      return await fetchJson('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          productOptionId: optionId,
          type: 'in',
          quantity: 10,
          reason: 'test',
          memo: '테스트 입고',
          processedBy: '테스트'
        })
      })
    })
    
    if (inResult) {
      console.log(`   결과: ${inResult.option.beforeStock} → ${inResult.option.afterStock}`)
      
      // 출고 테스트 (원복)
      await test('출고 -10 (원복)', async () => {
        return await fetchJson('/api/inventory', {
          method: 'POST',
          body: JSON.stringify({
            productOptionId: optionId,
            type: 'out',
            quantity: 10,
            reason: 'test',
            memo: '테스트 출고 (원복)',
            processedBy: '테스트'
          })
        })
      })
    }
  } else {
    console.log('   ⚠️ 옵션이 있는 상품이 없어서 스킵')
  }

  // 2. 주문 상태 변경 테스트
  console.log('\n📌 2. 주문 상태 변경')
  const orders = await fetchJson('/api/orders?status=pending')
  
  if (orders.orders.length > 0) {
    const order = orders.orders[0]
    console.log(`   대상: ${order.orderNo} (현재: ${order.status})`)
    
    // 확인 상태로 변경
    await test('주문 확인 처리', async () => {
      return await fetchJson(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'confirmed',
          processedBy: '테스트'
        })
      })
    })
    
    // 다시 대기로 원복
    await test('주문 대기로 원복', async () => {
      return await fetchJson(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending',
          processedBy: '테스트'
        })
      })
    })
  } else {
    console.log('   ⚠️ 대기 주문이 없어서 스킵')
  }

  // 3. 입금 처리 테스트
  console.log('\n📌 3. 입금 처리')
  const receivables = await fetchJson('/api/receivables')
  const storeWithDebt = receivables.stores?.find(s => s.outstandingAmount > 0)
  
  if (storeWithDebt) {
    console.log(`   대상: ${storeWithDebt.name} (미수금: ${storeWithDebt.outstandingAmount.toLocaleString()})`)
    
    // 테스트 입금
    const depositResult = await test('입금 1,000원', async () => {
      return await fetchJson('/api/receivables/deposit', {
        method: 'POST',
        body: JSON.stringify({
          storeId: storeWithDebt.id,
          amount: 1000,
          paymentMethod: 'transfer',
          memo: '테스트 입금',
          processedBy: '테스트'
        })
      })
    })
    
    if (depositResult) {
      console.log(`   결과: ${depositResult.transaction.balanceAfter.toLocaleString()}원`)
      
      // 원복 (조정으로)
      await test('입금 취소 (원복)', async () => {
        return await fetchJson('/api/receivables/deposit', {
          method: 'POST',
          body: JSON.stringify({
            storeId: storeWithDebt.id,
            amount: -1000,
            paymentMethod: 'transfer',
            memo: '테스트 입금 취소 (원복)',
            processedBy: '테스트'
          })
        })
      })
    }
  } else {
    console.log('   ⚠️ 미수금 있는 가맹점이 없어서 스킵')
  }

  console.log('\n========== 쓰기 테스트 완료 ==========\n')
}

runTests().catch(console.error)
