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

    if (!storeCode || !password) {
      setError('가맹점 코드와 비밀번호를 입력하세요')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storeCode, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // 가맹점 계정이면 가맹점 페이지로, 아니면 관리자 대시보드로
        if (data.user.role === 'store') {
          router.push('/store/products')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            LensChoice
          </h1>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
            안경원 주문 시스템
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: 8,
            }}>
              가맹점 코드
            </label>
            <input
              type="text"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="가맹점 코드를 입력하세요"
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
              color: '#1d1d1f',
              marginBottom: 8,
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
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
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Admin login link */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#86868b',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            관리자 로그인
          </button>
        </div>

        {/* Help */}
        <div style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 13,
          color: '#86868b',
        }}>
          <p style={{ margin: '0 0 8px' }}>가맹점 코드를 모르시나요?</p>
          <a href="tel:02-521-2323" style={{ color: '#007aff', textDecoration: 'none' }}>
            고객센터 02-521-2323
          </a>
        </div>
      </div>
    </div>
  )
}
