'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function MobileMorePage() {
  const { user, logout } = useAuth()

  const menuItems = [
    { icon: '📊', label: '재고 현황', href: '/admin/products/inventory' },
    { icon: '💰', label: '미수금 관리', href: '/admin/stores/receivables' },
    { icon: '📈', label: '통계', href: '/admin/stats' },
    { icon: '🔄', label: '반품/교환', href: '/admin/orders/returns' },
    { icon: '🖨️', label: '명세서 출력', href: '/admin/orders' },
    { icon: '⚙️', label: '관리자 페이지', href: '/admin' },
  ]

  return (
    <div>
      {/* 프로필 */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '24px',
          fontWeight: 600
        }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>
            {user?.name || '사용자'}
          </div>
          <div style={{ fontSize: '14px', color: '#86868b' }}>
            {user?.role === 'admin' ? '관리자' : user?.role === 'manager' ? '매니저' : '사용자'}
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderBottom: idx < menuItems.length - 1 ? '1px solid #f3f4f6' : 'none',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: '15px' }}>{item.label}</span>
            <span style={{ color: '#c7c7cc' }}>›</span>
          </Link>
        ))}
      </div>

      {/* 앱 정보 */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#86868b' }}>앱 정보</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>버전</span>
          <span style={{ fontSize: '14px', color: '#86868b' }}>1.0.0</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px' }}>서버</span>
          <span style={{ fontSize: '14px', color: '#86868b' }}>렌즈초이스</span>
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: 'none',
          background: '#fff',
          color: '#ef4444',
          fontSize: '16px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        로그아웃
      </button>
    </div>
  )
}
