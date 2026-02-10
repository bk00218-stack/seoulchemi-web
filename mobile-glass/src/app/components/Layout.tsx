'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState, KeyboardEvent } from 'react'

const NAV_ITEMS = [
  { label: '주문', href: '/', key: '1' },
  { label: '매입', href: '/purchase', key: '2' },
  { label: '상품', href: '/products', key: '3' },
  { label: '가맹점', href: '/stores', key: '4' },
  { label: '통계', href: '/stats', key: '5' },
  { label: '설정', href: '/settings', key: '6' },
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
  const router = useRouter()
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  // Refs for keyboard navigation
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const sidebarRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const mainRef = useRef<HTMLElement>(null)

  // Focus states
  const [navFocusIndex, setNavFocusIndex] = useState(-1)
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(-1)

  // Flatten sidebar items for easier navigation
  const flatSidebarItems = sidebarMenus.flatMap(menu => menu.items)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Alt + number for nav items
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const navItem = NAV_ITEMS.find(item => item.key === e.key)
        if (navItem) {
          e.preventDefault()
          router.push(navItem.href)
          return
        }
      }

      // Alt + S = Focus sidebar
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSidebarFocusIndex(0)
        sidebarRefs.current[0]?.focus()
        return
      }

      // Alt + M = Focus main content
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        mainRef.current?.focus()
        return
      }

      // Alt + N = Focus nav
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setNavFocusIndex(0)
        navRefs.current[0]?.focus()
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [router])

  // Nav keyboard navigation
  const handleNavKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (index + 1) % NAV_ITEMS.length
      setNavFocusIndex(nextIndex)
      navRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (index - 1 + NAV_ITEMS.length) % NAV_ITEMS.length
      setNavFocusIndex(prevIndex)
      navRefs.current[prevIndex]?.focus()
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab to sidebar
      e.preventDefault()
      setSidebarFocusIndex(0)
      sidebarRefs.current[0]?.focus()
    }
  }

  // Sidebar keyboard navigation
  const handleSidebarKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (index + 1) % flatSidebarItems.length
      setSidebarFocusIndex(nextIndex)
      sidebarRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (index - 1 + flatSidebarItems.length) % flatSidebarItems.length
      setSidebarFocusIndex(prevIndex)
      sidebarRefs.current[prevIndex]?.focus()
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab to main content
      e.preventDefault()
      mainRef.current?.focus()
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab to nav
      e.preventDefault()
      const activeNavIndex = NAV_ITEMS.findIndex(item => item.label === activeNav)
      setNavFocusIndex(activeNavIndex >= 0 ? activeNavIndex : 0)
      navRefs.current[activeNavIndex >= 0 ? activeNavIndex : 0]?.focus()
    }
  }

  // Track sidebar item index across menu groups
  let sidebarItemIndex = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Keyboard shortcut help - hidden but accessible */}
      <div style={{ 
        position: 'fixed', 
        bottom: 8, 
        left: 8, 
        fontSize: 10, 
        color: '#999',
        background: 'rgba(255,255,255,0.9)',
        padding: '4px 8px',
        borderRadius: 4,
        zIndex: 1000
      }}>
        단축키: Alt+1~6 메뉴 | Alt+S 사이드바 | Alt+M 본문 | ↑↓←→ 이동
      </div>

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
          <Link 
            href="/" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            tabIndex={0}
          >
            <svg width="140" height="28" viewBox="0 0 180 36">
              <defs>
                <linearGradient id="lensGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#007AFF'}}/>
                  <stop offset="100%" style={{stopColor:'#5856D6'}}/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="18" r="12" fill="none" stroke="url(#lensGradFront)" strokeWidth="2"/>
              <circle cx="16" cy="18" r="7" fill="url(#lensGradFront)" opacity="0.15"/>
              <circle cx="16" cy="18" r="3.5" fill="url(#lensGradFront)" opacity="0.3"/>
              <circle cx="12" cy="14" r="1.5" fill="white" opacity="0.8"/>
              <text x="36" y="23" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="16" fontWeight="600" fill="#1d1d1f">
                Lens<tspan fill="#007AFF">Choice</tspan>
              </text>
            </svg>
          </Link>
          <nav style={{ display: 'flex', gap: 4 }} role="navigation" aria-label="메인 메뉴">
            {NAV_ITEMS.map((item, index) => {
              const isActive = item.label === activeNav
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  ref={el => { navRefs.current[index] = el }}
                  tabIndex={0}
                  onKeyDown={e => handleNavKeyDown(e, index)}
                  onFocus={() => setNavFocusIndex(index)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.15s',
                    outline: navFocusIndex === index ? '2px solid var(--primary)' : 'none',
                    outlineOffset: 2
                  }}
                  title={`Alt+${item.key}`}
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

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside 
          style={{
            width: 150,
            background: '#fff',
            borderRight: '1px solid var(--gray-200)',
            padding: '16px 0',
            position: 'sticky',
            top: 56,
            height: 'calc(100vh - 56px)',
            overflowY: 'auto'
          }}
          role="navigation"
          aria-label="사이드 메뉴"
        >
          {sidebarMenus.map((menu, menuIdx) => (
            <div key={menuIdx} style={{ marginBottom: 8 }}>
              <div style={{
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--gray-400)'
              }}>{menu.title}</div>
              {menu.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                const currentIndex = sidebarItemIndex++
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={el => { sidebarRefs.current[currentIndex] = el }}
                    tabIndex={0}
                    onKeyDown={e => handleSidebarKeyDown(e, currentIndex)}
                    onFocus={() => setSidebarFocusIndex(currentIndex)}
                    style={{
                      display: 'block',
                      padding: '12px 14px',
                      fontSize: 15,
                      color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                      background: isActive ? 'var(--primary-light)' : 
                                  sidebarFocusIndex === currentIndex ? 'var(--gray-100)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s',
                      outline: sidebarFocusIndex === currentIndex ? '2px solid var(--primary)' : 'none',
                      outlineOffset: -2
                    }}
                  >{item.label}</Link>
                )
              })}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main 
          ref={mainRef}
          tabIndex={-1}
          style={{ 
            flex: 1, 
            padding: 24, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 20,
            overflowY: 'auto',
            height: 'calc(100vh - 56px)',
            background: 'var(--gray-50)',
            outline: 'none'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// Common Styles Export
export const btnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  background: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s'
}

export const selectStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 14,
  background: '#fff',
  minWidth: 130
}

export const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 14
}

export const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--gray-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap',
  background: 'var(--gray-50)'
}

export const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 14,
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--gray-100)'
}

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--gray-100)'
}
