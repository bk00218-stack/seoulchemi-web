'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState, KeyboardEvent } from 'react'
import NotificationBell from '@/components/NotificationBell'

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

interface SearchResult {
  products: { id: number; name: string; brand: string; url: string }[]
  stores: { id: number; name: string; code: string; url: string }[]
  orders: { id: number; orderNo: string; storeName: string; status: string; url: string }[]
}

export default function Layout({ children, sidebarMenus, activeNav }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult>({ products: [], stores: [], orders: [] })
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Refs for keyboard navigation
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const sidebarRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const mainRef = useRef<HTMLElement>(null)

  // Focus states
  const [navFocusIndex, setNavFocusIndex] = useState(-1)
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(-1)

  // Flatten sidebar items for easier navigation
  const flatSidebarItems = sidebarMenus.flatMap(menu => menu.items)

  // Search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults({ products: [], stores: [], orders: [] })
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
        const data = await res.json()
        setSearchResults(data)
      } catch (e) {
        console.error('Search error:', e)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      // Escape to close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        setSearchQuery('')
        return
      }

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
  }, [router, searchOpen])

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
      e.preventDefault()
      mainRef.current?.focus()
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      const activeNavIndex = NAV_ITEMS.findIndex(item => item.label === activeNav)
      setNavFocusIndex(activeNavIndex >= 0 ? activeNavIndex : 0)
      navRefs.current[activeNavIndex >= 0 ? activeNavIndex : 0]?.focus()
    }
  }

  const handleSearchResultClick = (url: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(url)
  }

  // Track sidebar item index across menu groups
  let sidebarItemIndex = 0

  const hasResults = searchResults.products.length > 0 || searchResults.stores.length > 0 || searchResults.orders.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Search Modal */}
      {searchOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 100
          }}
          onClick={() => { setSearchOpen(false); setSearchQuery('') }}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 600,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="상품, 거래처, 주문번호 검색... (Ctrl+K)"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    padding: '8px 0'
                  }}
                />
                {searching && <span style={{ color: '#9ca3af' }}>검색중...</span>}
              </div>
            </div>

            {/* Search Results */}
            {hasResults && (
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>상품</div>
                    {searchResults.products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSearchResultClick(p.url)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>📦</span>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{p.brand}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stores */}
                {searchResults.stores.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>거래처</div>
                    {searchResults.stores.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSearchResultClick(s.url)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>🏪</span>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{s.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>주문</div>
                    {searchResults.orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => handleSearchResultClick(o.url)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>🧾</span>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>{o.orderNo}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{o.storeName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && !searching && !hasResults && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                검색 결과가 없습니다
              </div>
            )}

            {/* Hint */}
            {searchQuery.length < 2 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                2글자 이상 입력하세요
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcut help */}
      <div style={{ 
        position: 'fixed', 
        bottom: 8, 
        left: 8, 
        fontSize: 10, 
        color: '#999',
        background: 'rgba(255,255,255,0.9)',
        padding: '4px 8px',
        borderRadius: 4,
        zIndex: 100
      }}>
        Ctrl+K 검색 | Alt+1~6 메뉴 | Alt+S 사이드바
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link 
            href="/" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            tabIndex={0}
          >
            <svg width="140" height="28" viewBox="0 0 180 36">
              <defs>
                <linearGradient id="lensGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#5d7a5d'}}/>
                  <stop offset="100%" style={{stopColor:'#4a6b4a'}}/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="18" r="12" fill="none" stroke="url(#lensGradFront)" strokeWidth="2"/>
              <circle cx="16" cy="18" r="7" fill="url(#lensGradFront)" opacity="0.15"/>
              <circle cx="16" cy="18" r="3.5" fill="url(#lensGradFront)" opacity="0.3"/>
              <circle cx="12" cy="14" r="1.5" fill="white" opacity="0.8"/>
              <text x="36" y="23" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="16" fontWeight="600" fill="#1d1d1f">
                AI<tspan fill="#5d7a5d">Optic</tspan>
              </text>
            </svg>
          </Link>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              color: '#6b7280',
              fontSize: 14,
              cursor: 'pointer',
              minWidth: 200
            }}
          >
            <span>🔍</span>
            <span>검색...</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', background: '#fff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Ctrl+K</span>
          </button>

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
                    outlineOffset: 2,
                    textDecoration: 'none'
                  }}
                  title={`Alt+${item.key}`}
                >{item.label}</Link>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--gray-500)' }}>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>서울케미</span>
          <span style={{ color: 'var(--gray-400)' }}>|</span>
          <span>{timeStr}</span>
          {/* 알림 버튼 */}
          <NotificationBell />
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
            width: 'fit-content',
            minWidth: 100,
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
                padding: '10px 12px 6px',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.3px',
                color: '#1f2937',
                whiteSpace: 'nowrap'
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
                      padding: '9px 12px',
                      fontSize: 15,
                      color: isActive ? 'var(--primary)' : '#374151',
                      background: isActive ? 'var(--primary-light)' : 
                                  sidebarFocusIndex === currentIndex ? 'var(--gray-100)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s',
                      outline: sidebarFocusIndex === currentIndex ? '2px solid var(--primary)' : 'none',
                      outlineOffset: -2,
                      whiteSpace: 'nowrap',
                      textDecoration: 'none'
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
  fontSize: 15,
  background: '#fff',
  minWidth: 130
}

export const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 15
}

export const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap',
  background: '#f9fafb'
}

export const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 15,
  verticalAlign: 'middle',
  borderBottom: '1px solid #f3f4f6',
  color: '#1f2937'
}

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--gray-100)'
}
