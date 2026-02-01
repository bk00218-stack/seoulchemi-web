'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const NAV_ITEMS = [
  { label: '주문', href: '/' },
  { label: '매입', href: '/purchase' },
  { label: '상품', href: '/products' },
  { label: '가맹점', href: '/stores' },
  { label: '통계', href: '/stats' },
  { label: '설정', href: '/settings' },
]

interface SidebarMenu {
  title: string
  items: { label: string; href: string }[]
}

interface LayoutProps {
  children: ReactNode
  sidebarMenus: SidebarMenu[]
  activeNav: string
}

export default function Layout({ children, sidebarMenus, activeNav }: LayoutProps) {
  const pathname = usePathname()
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--gray-200)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14
            }}>O</div>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>OptiCore</span>
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === activeNav
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.15s'
                  }}
                >{item.label}</Link>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--gray-500)' }}>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>BK COMPANY</span>
          <span style={{ color: 'var(--gray-400)' }}>|</span>
          <span>{timeStr}</span>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--gray-600)'
          }}>AD</div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: 220,
          background: '#fff',
          borderRight: '1px solid var(--gray-200)',
          padding: '16px 0'
        }}>
          {sidebarMenus.map((menu, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div style={{
                padding: '10px 20px',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--gray-400)'
              }}>{menu.title}</div>
              {menu.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '12px 20px',
                      fontSize: 14,
                      color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s'
                    }}
                  >{item.label}</Link>
                )
              })}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Common Styles Export
export const btnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  background: '#fff',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s'
}

export const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 13,
  background: '#fff',
  minWidth: 120
}

export const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 13
}

export const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--gray-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap',
  background: 'var(--gray-50)'
}

export const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--gray-100)'
}

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--gray-100)'
}
