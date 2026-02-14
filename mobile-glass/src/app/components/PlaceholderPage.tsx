'use client'

import { AdminLayout } from './Navigation'

type MenuKey = 'order' | 'purchase' | 'products' | 'stores' | 'stats' | 'settings'

interface PlaceholderPageProps {
  title: string
  description?: string
  activeMenu: MenuKey
}

export default function PlaceholderPage({ title, description, activeMenu }: PlaceholderPageProps) {
  return (
    <AdminLayout activeMenu={activeMenu}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '60px 40px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '16px',
          opacity: 0.5
        }}>
          🚧
        </div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          {title}
        </h2>
        <p style={{ 
          color: 'var(--text-tertiary)', 
          fontSize: '14px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {description || '이 페이지는 아직 개발 중입니다.'}
        </p>
      </div>
    </AdminLayout>
  )
}
