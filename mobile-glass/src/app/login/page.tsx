'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get('redirect') || '/admin'
  const expired = searchParams.get('expired')

  useEffect(() => {
    if (expired) {
      setError('세션이 만료되었습니다. 다시 로그인해주세요.')
    }
  }, [expired])

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
        if (res.status === 429) {
          setError('로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.')
        } else {
          setError(data.error || '로그인에 실패했습니다.')
        }
        return
      }

      // 로그인 성공 - 리다이렉트
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: expired ? '#fef3c7' : '#fee2e2',
          color: expired ? '#d97706' : '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{expired ? '⚠️' : '❌'}</span>
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
          autoComplete="username"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--gray-200)',
            fontSize: '15px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
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
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--gray-200)',
            fontSize: '15px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
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
          background: loading ? 'var(--text-tertiary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  )
}

function LoginFormFallback() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ color: 'var(--text-secondary)' }}>로딩 중...</div>
    </div>
  )
}

export default function LoginPage() {
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

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        {/* 보안 안내 */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'var(--gray-100)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span>🔒</span>
            <strong>보안 안내</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li>공용 PC에서는 반드시 로그아웃해주세요</li>
            <li>비밀번호는 주기적으로 변경해주세요</li>
          </ul>
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--gray-200)',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-tertiary)'
        }}>
          © 2026 LensChoice. All rights reserved.
        </div>
      </div>
    </div>
  )
}
