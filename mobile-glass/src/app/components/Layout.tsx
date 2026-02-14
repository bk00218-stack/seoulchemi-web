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
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      {/* Mobile Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-sidebar-wrapper { display: block !important; }
          .desktop-search { display: none !important; }
          .desktop-nav-links { display: none !important; }
          .header-right-info { display: none !important; }
          .main-content { padding: 12px !important; }
          header { padding: 0 12px !important; }
        }
      `}</style>
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
              background: 'var(--bg-primary)',
              borderRadius: 12,
              width: '100%',
              maxWidth: 600,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--gray-200)' }}>
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
                {searching && <span style={{ color: 'var(--text-tertiary)' }}>검색중...</span>}
              </div>
            </div>

            {/* Search Results */}
            {hasResults && (
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>상품</div>
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
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>📦</span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.brand}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stores */}
                {searchResults.stores.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>거래처</div>
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
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>🏪</span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>주문</div>
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
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16 }}>🧾</span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{o.orderNo}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.storeName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && !searching && !hasResults && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                검색 결과가 없습니다
              </div>
            )}

            {/* Hint */}
            {searchQuery.length < 2 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
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
        color: 'var(--text-tertiary)',
        background: 'rgba(255,255,255,0.9)',
        padding: '4px 8px',
        borderRadius: 4,
        zIndex: 100
      }}>
        Ctrl+K 검색 | Alt+1~6 메뉴 | Alt+S 사이드바
      </div>

      {/* Header */}
      <header style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 24
            }}
            aria-label="메뉴"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

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
            className="desktop-search"
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              minWidth: 220,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <span style={{ opacity: 0.7 }}>🔍</span>
            <span>검색...</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 5, fontWeight: 500 }}>Ctrl+K</span>
          </button>

          <nav className="desktop-nav desktop-nav-links" style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: '6px', borderRadius: 10 }} role="navigation" aria-label="메인 메뉴">
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
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    background: isActive ? '#5d7a5d' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(93, 122, 93, 0.3)' : 'none',
                    transition: 'all 0.2s',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          <span className="header-right-info" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>서울케미</span>
          <span className="header-right-info" style={{ color: 'var(--gray-300)' }}>|</span>
          <span className="header-right-info" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{timeStr}</span>
          {/* 알림 버튼 */}
          <NotificationBell />
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#fff',
            boxShadow: '0 2px 4px rgba(93, 122, 93, 0.3)'
          }}>AD</div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 998
            }}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`mobile-sidebar mobile-sidebar-wrapper ${mobileMenuOpen ? 'open' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 280,
            height: '100vh',
            background: 'var(--bg-primary)',
            zIndex: 999,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#5d7a5d' }}>메뉴</div>
          </div>
          {/* Mobile Nav Items */}
          <div style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  fontSize: 16,
                  color: item.label === activeNav ? 'var(--primary)' : '#374151',
                  fontWeight: item.label === activeNav ? 600 : 400,
                  textDecoration: 'none'
                }}
              >{item.label}</Link>
            ))}
          </div>
          {/* Mobile Sidebar Menus */}
          {sidebarMenus.map((menu, menuIdx) => (
            <div key={menuIdx} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ padding: '8px 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {menu.title}
              </div>
              {menu.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '10px 16px 10px 24px',
                    fontSize: 15,
                    color: pathname === item.href ? 'var(--primary)' : '#374151',
                    fontWeight: pathname === item.href ? 600 : 400,
                    textDecoration: 'none'
                  }}
                >{item.label}</Link>
              ))}
            </div>
          ))}
        </aside>

        {/* Desktop Sidebar */}
        <aside 
          className="desktop-nav sidebar desktop-sidebar"
          style={{
            width: 'fit-content',
            minWidth: 140,
            background: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-color)',
            padding: '20px 12px',
            position: 'sticky',
            top: 60,
            height: 'calc(100vh - 60px)',
            overflowY: 'auto'
          }}
          role="navigation"
          aria-label="사이드 메뉴"
        >
          {sidebarMenus.map((menu, menuIdx) => (
            <div key={menuIdx} style={{ marginBottom: 16 }}>
              <div style={{
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
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
                      padding: '10px 14px',
                      margin: '2px 0',
                      borderRadius: 8,
                      fontSize: 15,
                      color: isActive ? '#5d7a5d' : 'var(--text-secondary)',
                      background: isActive ? '#eef4ee' : 
                                  sidebarFocusIndex === currentIndex ? 'var(--bg-secondary)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
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
          className="main-content"
          style={{ 
            flex: 1, 
            padding: 28, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 24,
            overflowY: 'auto',
            height: 'calc(100vh - 60px)',
            background: 'var(--bg-secondary)',
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
  background: 'var(--bg-primary)',
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
  background: 'var(--bg-primary)',
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
  background: 'var(--gray-50)'
}

export const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 15,
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--gray-100)',
  color: 'var(--text-primary)'
}

export const cardStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--gray-100)'
}
