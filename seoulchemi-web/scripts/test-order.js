// 주문 API 테스트
const testOrder = async () => {
  try {
    // 1. 주문 생성
    const res = await fetch('http://localhost:3000/api/store/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: 1, quantity: 1 },  // 1.50 3040
          { productId: 2, quantity: 2 },  // 1.50 MF-CD-SOFT
        ]
      })
    })
    
    const data = await res.json()
    console.log('주문 결과:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ 주문 성공!')
      console.log('주문번호:', data.order.orderNo)
      console.log('금액:', data.order.totalAmount.toLocaleString() + '원')
    } else {
      console.log('\n❌ 주문 실패:', data.error)
    }
  } catch (e) {
    console.error('에러:', e.message)
  }
}

testOrder()
