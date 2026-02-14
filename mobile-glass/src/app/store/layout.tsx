'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  const navItems = [
    { label: '?ÅÌíàÏ£ºÎ¨∏', href: '/store/products', icon: '?õí' },
    { label: 'Ï£ºÎ¨∏?¥Ïó≠', href: '/store/orders', icon: '?ìã' },
    { label: '?îÏï°Ï°∞Ìöå', href: '/store/account', icon: '?í∞' },
  ]

  const isLoginPage = pathname === '/store/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}>
          {/* Logo */}
          <Link href="/store/products" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #007aff, #00c7be)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
            }}>L</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>LensChoice</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>Ï£ºÎ¨∏</span>
          </Link>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: pathname.startsWith(item.href) ? '#007aff' : 'transparent',
                  color: pathname.startsWith(item.href) ? 'white' : '#1d1d1f',
                  transition: 'all 0.2s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Cart */}
            <Link href="/store/cart" style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 12px',
              borderRadius: 20,
              background: pathname === '/store/cart' ? '#007aff' : '#f5f5f7',
              color: pathname === '/store/cart' ? 'white' : '#1d1d1f',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}>
              <span>?õçÔ∏?/span>
              <span>?•Î∞îÍµ¨Îãà</span>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ff3b30',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                }}>{cartCount}</span>
              )}
            </Link>

            {/* Store info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: 20,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Î∞ùÏ??àÍ≤Ω</span>
              <Link href="/store/login" style={{
                fontSize: 12,
                color: '#007aff',
                textDecoration: 'none',
              }}>Î°úÍ∑∏?ÑÏõÉ</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 20,
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid var(--border-color)',
        padding: '20px',
        marginTop: 40,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: 'var(--text-tertiary)',
        }}>
          <span>¬© 2026 LensChoice. BK Company</span>
          <span>Í≥†Í∞ù?ºÌÑ∞: 1588-0000</span>
        </div>
      </footer>
    </div>
  )
}
