// 로그인 테스트
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin1234' })
})

const data = await res.json()
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))
