'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 샘플 로그인 (실제 구현 시 API 연동)
    await new Promise(r => setTimeout(r, 800))

    if (formData.username === 'admin' && formData.password === 'admin') {
      router.push('/admin')
    } else if (formData.username && formData.password) {
      // 임시: 아무 계정이나 허용
      router.push('/')
    } else {
      setError('아이디와 비밀번호를 입력해주세요.')
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
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="180" height="40" viewBox="0 0 180 40" style={{ margin: '0 auto' }}>
            <defs>
              <linearGradient id="lensGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#007AFF'}}/>
                <stop offset="100%" style={{stopColor:'#5856D6'}}/>
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="16" fill="none" stroke="url(#lensGradLogin)" strokeWidth="2.5"/>
            <circle cx="20" cy="20" r="9" fill="url(#lensGradLogin)" opacity="0.15"/>
            <circle cx="20" cy="20" r="4.5" fill="url(#lensGradLogin)" opacity="0.3"/>
            <circle cx="15" cy="15" r="2" fill="white" opacity="0.9"/>
            <text x="46" y="26" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="20" fontWeight="600" fill="#1d1d1f">
              Lens<tspan fill="#007AFF">Choice</tspan>
            </text>
          </svg>
          <p style={{ 
            color: '#86868b', 
            fontSize: '14px', 
            marginTop: '12px',
            fontWeight: 400
          }}>
            안경렌즈 유통관리 시스템
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 500, 
              color: '#1d1d1f',
              marginBottom: '8px'
            }}>
              아이디
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="아이디를 입력하세요"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#007aff'
                e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e5e5e5'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 500, 
              color: '#1d1d1f',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="비밀번호를 입력하세요"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#007aff'
                e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e5e5e5'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#666'
            }}>
              <input
                type="checkbox"
                checked={formData.remember}
                onChange={e => setFormData({ ...formData, remember: e.target.checked })}
                style={{ 
                  width: '16px', 
                  height: '16px',
                  accentColor: '#007aff'
                }}
              />
              로그인 상태 유지
            </label>
            <a href="#" style={{ 
              fontSize: '13px', 
              color: '#007aff',
              textDecoration: 'none'
            }}>
              비밀번호 찾기
            </a>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#c53030',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? '#86868b' : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(0,122,255,0.4)'
            }}
            onMouseDown={e => {
              if (!loading) (e.target as HTMLElement).style.transform = 'scale(0.98)'
            }}
            onMouseUp={e => {
              (e.target as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>
            BK COMPANY
          </p>
          <p style={{ fontSize: '11px', color: '#c7c7c7' }}>
            © 2024 LensChoice. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
