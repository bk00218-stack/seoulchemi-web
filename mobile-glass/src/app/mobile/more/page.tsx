'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function MobileMorePage() {
  const { user, logout } = useAuth()

  const menuItems = [
    { icon: '?“Š', label: '?¬ê³  ?„í™©', href: '/admin/products/inventory' },
    { icon: '?’°', label: 'ë¯¸ìˆ˜ê¸?ê´€ë¦?, href: '/admin/stores/receivables' },
    { icon: '?“ˆ', label: '?µê³„', href: '/admin/stats' },
    { icon: '?”„', label: 'ë°˜í’ˆ/êµí™˜', href: '/admin/orders/returns' },
    { icon: '?–¨ï¸?, label: 'ëª…ì„¸??ì¶œë ¥', href: '/admin/orders' },
    { icon: '?™ï¸', label: 'ê´€ë¦¬ì ?˜ì´ì§€', href: '/admin' },
  ]

  return (
    <div>
      {/* ?„ë¡œ??*/}
      <div style={{
        background: 'var(--bg-primary)',
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
            {user?.name || '?¬ìš©??}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            {user?.role === 'admin' ? 'ê´€ë¦¬ì' : user?.role === 'manager' ? 'ë§¤ë‹ˆ?€' : '?¬ìš©??}
          </div>
        </div>
      </div>

      {/* ë©”ë‰´ */}
      <div style={{
        background: 'var(--bg-primary)',
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
            <span style={{ color: '#c7c7cc' }}>??/span>
          </Link>
        ))}
      </div>

      {/* ???•ë³´ */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-tertiary)' }}>???•ë³´</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>ë²„ì „</span>
          <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>1.0.0</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px' }}>?œë²„</span>
          <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>?Œì¦ˆì´ˆì´??/span>
        </div>
      </div>

      {/* ë¡œê·¸?„ì›ƒ */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: 'none',
          background: 'var(--bg-primary)',
          color: '#ef4444',
          fontSize: '16px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        ë¡œê·¸?„ì›ƒ
      </button>
    </div>
  )
}
