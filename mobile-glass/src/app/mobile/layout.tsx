'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!user) return null

  const navItems = [
    { path: '/mobile', icon: '?è†', label: '?? },
    { path: '/mobile/orders', icon: '?ì¶', label: 'Ï£ºÎ¨∏' },
    { path: '/mobile/order', icon: '??, label: 'Ï£ºÎ¨∏?±Î°ù' },
    { path: '/mobile/scan', icon: '?ì∑', label: '?§Ï∫î' },
    { path: '/mobile/more', icon: '??, label: '?îÎ≥¥Í∏? },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      paddingBottom: '80px'
    }}>
      {/* ?§Îçî */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ fontWeight: 600, fontSize: '18px' }}>
          Lens<span style={{ color: '#007aff' }}>Choice</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
          {user.name}
        </div>
      </header>

      {/* ÏΩòÌÖêÏ∏?*/}
      <main style={{ padding: '16px' }}>
        {children}
      </main>

      {/* ?òÎã® ?§ÎπÑÍ≤åÏù¥??*/}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        padding: '8px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 100
      }}>
        {navItems.map(item => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? '#007aff' : '#86868b',
                fontSize: '10px'
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
