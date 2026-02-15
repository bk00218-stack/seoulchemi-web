// Test order creation
async function testOrderCreate() {
  const payload = {
    storeId: 47, // 더밝은안경 구리 갈매
    orderType: '여벌',
    memo: 'Test order',
    items: [{
      productId: 701, // [케미 일반] 중
      quantity: 1,
      sph: '0.00',
      cyl: '0.00',
      axis: null
    }]
  }

  try {
    const res = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testOrderCreate()
