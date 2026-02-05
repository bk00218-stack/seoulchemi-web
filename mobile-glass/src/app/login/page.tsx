'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공 - 메인 페이지로 이동
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="180" height="40" viewBox="0 0 180 36">
            <defs>
              <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#667eea'}}/>
                <stop offset="100%" style={{stopColor:'#764ba2'}}/>
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="14" fill="none" stroke="url(#lensGrad)" strokeWidth="2.5"/>
            <circle cx="18" cy="18" r="8" fill="url(#lensGrad)" opacity="0.15"/>
            <circle cx="18" cy="18" r="4" fill="url(#lensGrad)" opacity="0.3"/>
            <circle cx="13" cy="13" r="2" fill="white" opacity="0.9"/>
            <text x="42" y="24" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="20" fontWeight="600" fill="#1d1d1f">
              Lens<tspan fill="#667eea">Choice</tspan>
            </text>
          </svg>
          <p style={{ color: '#86868b', fontSize: '14px', marginTop: '8px' }}>
            렌즈초이스 관리 시스템
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: '#374151'
            }}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 입력"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: '#374151'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '13px',
          color: '#9ca3af'
        }}>
          © 2026 LensChoice. All rights reserved.
        </div>
      </div>
    </div>
  )
}
