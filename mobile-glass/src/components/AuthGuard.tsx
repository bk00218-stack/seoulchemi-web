'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export default function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 로딩 중
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e5e5',
            borderTopColor: '#007aff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#86868b' }}>로딩 중...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // 로그인 안됨
  if (!user) {
    return null
  }

  // 권한 체크
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f7'
      }}>
        <div style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            접근 권한이 없습니다
          </h2>
          <p style={{ color: '#86868b', marginBottom: '24px' }}>
            이 페이지에 접근할 권한이 없습니다.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            뒤로 가기
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
