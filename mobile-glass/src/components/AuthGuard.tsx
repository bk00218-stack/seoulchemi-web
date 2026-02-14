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

  // ë¡œë”© ì¤?
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-secondary)'
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
          <p style={{ color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // ë¡œê·¸???ˆë¨
  if (!user) {
    return null
  }

  // ê¶Œí•œ ì²´í¬
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>?š«</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            ?‘ê·¼ ê¶Œí•œ???†ìŠµ?ˆë‹¤
          </h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
            ???˜ì´ì§€???‘ê·¼??ê¶Œí•œ???†ìŠµ?ˆë‹¤.
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
            ?¤ë¡œ ê°€ê¸?
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
