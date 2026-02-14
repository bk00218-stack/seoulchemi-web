'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StoreLoginPage() {
  const router = useRouter()
  const [storeCode, setStoreCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // TODO: ?�제 로그??API ?�동
    setTimeout(() => {
      if (storeCode && password) {
        router.push('/store/products')
      } else {
        setError('가맹점 코드?� 비�?번호�??�력?�세??)
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #007aff, #00c7be)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28,
            fontWeight: 700,
            color: 'white',
          }}>L</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            LensChoice
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 8 }}>
            ?�경??주문 ?�스??
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              가맹점 코드
            </label>
            <input
              type="text"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="가맹점 코드�??�력?�세??
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              비�?번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비�?번호�??�력?�세??
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff2f2',
              color: '#ff3b30',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 14,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              color: 'white',
              background: loading ? '#86868b' : 'linear-gradient(135deg, #007aff, #0056b3)',
              border: 'none',
              borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {loading ? '로그??�?..' : '로그??}
          </button>
        </form>

        {/* Help */}
        <div style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-tertiary)',
        }}>
          <p style={{ margin: '0 0 8px' }}>가맹점 코드�?모르?�나??</p>
          <a href="tel:1588-0000" style={{ color: '#007aff', textDecoration: 'none' }}>
            고객?�터 1588-0000
          </a>
        </div>
      </div>
    </div>
  )
}
