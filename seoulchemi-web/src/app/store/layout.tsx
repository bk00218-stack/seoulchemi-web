'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { StoreCartProvider, useCart } from '@/contexts/StoreCartContext'
import { useIsMobile } from '@/hooks/useIsMobile'

const CART_WIDTH = 260

function StoreHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { totalCount } = useCart()
  const isMobile = useIsMobile()
  const [storeName, setStoreName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/store/account')
      .then(res => res.json())
      .then(data => {
        if (data.store?.name) setStoreName(data.store.name)
      })
      .catch(() => {})
  }, [])

  // 페이지 변경 시 메뉴 닫기
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const navItems = [
    { label: '홈', href: '/store', icon: '🏠' },
    { label: '상품주문', href: '/store/products', icon: '🛒' },
    { label: '주문내역', href: '/store/orders', icon: '📋' },
    { label: '잔액조회', href: '/store/account', icon: '💰' },
  ]

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e5e5e5',
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
        <Link href="/store" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #007aff, #00c7be)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 700,
          }}>L</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>LensChoice</span>
          {!isMobile && <span style={{ fontSize: 12, color: '#86868b', marginLeft: 4 }}>주문</span>}
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20,
                  fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  background: (item.href === '/store' ? pathname === '/store' : pathname.startsWith(item.href)) ? '#007aff' : 'transparent',
                  color: (item.href === '/store' ? pathname === '/store' : pathname.startsWith(item.href)) ? 'white' : '#1d1d1f',
                  transition: 'all 0.2s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
          {/* Cart */}
          <Link href="/store/cart" style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: isMobile ? '8px' : '8px 12px', borderRadius: 20,
            background: pathname === '/store/cart' ? '#007aff' : '#f5f5f7',
            color: pathname === '/store/cart' ? 'white' : '#1d1d1f',
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
            <span>🛍️</span>
            {!isMobile && <span>장바구니</span>}
            {totalCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ff3b30', color: 'white',
                fontSize: 11, fontWeight: 700,
                padding: '2px 6px', borderRadius: 10,
                minWidth: 18, textAlign: 'center',
              }}>{totalCount}</span>
            )}
          </Link>

          {/* Mobile hamburger */}
          {isMobile ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none', border: 'none',
                fontSize: 22, cursor: 'pointer', padding: 4,
              }}
            >☰</button>
          ) : (
            /* Desktop store info */
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: '#f5f5f7', borderRadius: 20,
            }}>
              {storeName && <span style={{ fontSize: 13, color: '#86868b' }}>{storeName}</span>}
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  router.push('/store/login')
                }}
                style={{
                  fontSize: 12, color: '#007aff',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >로그아웃</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'white', borderBottom: '1px solid #e5e5e5',
          padding: '12px 20px', zIndex: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 10,
                fontSize: 15, fontWeight: 500, textDecoration: 'none',
                background: (item.href === '/store' ? pathname === '/store' : pathname.startsWith(item.href)) ? '#007aff' : 'transparent',
                color: (item.href === '/store' ? pathname === '/store' : pathname.startsWith(item.href)) ? 'white' : '#1d1d1f',
                marginBottom: 4,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {storeName && <span style={{ fontSize: 13, color: '#86868b' }}>{storeName}</span>}
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/store/login')
              }}
              style={{
                fontSize: 13, color: '#007aff',
                background: 'none', border: 'none',
                cursor: 'pointer',
              }}
            >로그아웃</button>
          </div>
        </div>
      )}
    </header>
  )
}

function CartSidebar() {
  const { items: cart, updateQty, removeItem, totalCount, totalPrice } = useCart()
  const router = useRouter()
  const isMobile = useIsMobile()
  const pathname = usePathname()

  // 상품주문 페이지에서만 데스크톱일 때 표시
  if (isMobile || !pathname.startsWith('/store/products')) return null

  return (
    <div style={{
      width: CART_WIDTH, flexShrink: 0,
      background: 'white', borderLeft: '1px solid #e9ecef',
      position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f' }}>🛒 장바구니</span>
          <span style={{ fontSize: 12, color: '#007aff', fontWeight: 600 }}>{totalCount}개</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 8px', color: '#86868b', fontSize: 13 }}>
            장바구니가 비어있습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {cart.map((item) => {
              const cartKey = item.sph && item.cyl ? `${item.id}-${item.sph}-${item.cyl}` : `${item.id}`
              return (
                <div key={cartKey} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 6px', background: '#f8f9fa', borderRadius: 6, fontSize: 11,
                }}>
                  {/* 이미지 or 이니셜 */}
                  <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 9, color: '#86868b', fontWeight: 600 }}>{item.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.sph && item.cyl ? (
                      <div style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 10 }}>{item.sph}/{item.cyl}</div>
                    ) : (
                      <div style={{ fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{item.name}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => updateQty(cartKey, -0.5)} style={{ width: 18, height: 18, border: '1px solid #e0e0e0', borderRadius: 3, background: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>−</button>
                    <span style={{ width: 22, textAlign: 'center', fontWeight: 700, fontSize: 11 }}>{item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1)}</span>
                    <button onClick={() => updateQty(cartKey, 0.5)} style={{ width: 18, height: 18, border: '1px solid #e0e0e0', borderRadius: 3, background: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1d1d1f', flexShrink: 0, minWidth: 45, textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()}</span>
                  <button
                    onClick={() => removeItem(cartKey)}
                    style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 13, cursor: 'pointer', padding: '0 1px', flexShrink: 0 }}
                  >×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div style={{ padding: 10, borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#86868b' }}>합계</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>{totalPrice.toLocaleString()}원</span>
          </div>
          <button
            onClick={() => router.push('/store/cart')}
            style={{
              width: '100%', padding: '10px', fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, #007aff, #0056b3)',
              color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer',
            }}
          >
            주문하기
          </button>
        </div>
      )}
    </div>
  )
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const isLoginPage = pathname === '/store/login'
  const showCart = !isMobile && pathname.startsWith('/store/products')

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <StoreCartProvider>
      <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
        <StoreHeader />

        <div style={{ display: 'flex' }}>
          {/* Main Content */}
          <main style={{ flex: 1, minWidth: 0, maxWidth: showCart ? undefined : 1200, margin: showCart ? 0 : '0 auto', padding: 20 }}>
            {children}
          </main>

          {/* Cart Sidebar */}
          <CartSidebar />
        </div>

        {/* Footer */}
        <footer style={{
          background: 'white', borderTop: '1px solid #e5e5e5',
          padding: '20px', marginTop: 40,
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 13, color: '#86868b',
          }}>
            <span>© 2026 LensChoice. 서울케미</span>
            <span>고객센터: 02-521-2323</span>
          </div>
        </footer>
      </div>
    </StoreCartProvider>
  )
}
