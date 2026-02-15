'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

// 메뉴 구조 정의
export const menuStructure = {
  order: {
    label: '주문',
    path: '/admin',
    sections: [
      {
        title: '후결제 주문',
        items: [
          { label: '여벌 주문내역', path: '/admin/orders/stock' },
          { label: 'RX 주문내역', path: '/admin/orders/rx' },
          { label: '관리자 주문등록', path: '/admin/orders/new' },
          { label: '명세표 출력이력', path: '/admin/orders/print-history' },
        ]
      },
      {
        title: '출고관리',
        items: [
          { label: '전체 주문내역', path: '/admin/orders' },
          { label: '출고 확인', path: '/admin/orders/shipping' },
          { label: '출고 배송지 정보', path: '/admin/orders/delivery' },
          { label: '반품/교환 관리', path: '/admin/orders/returns' },
          { label: '바코드 스캔', path: '/admin/orders/scan' },
        ]
      }
    ]
  },
  purchase: {
    label: '매입',
    path: '/admin/purchase',
    sections: [
      {
        title: '매입관리',
        items: [
          { label: '매입내역', path: '/admin/purchase' },
          { label: '매입등록', path: '/admin/purchase/new' },
          { label: '자동 발주 제안', path: '/admin/purchase/reorder' },
        ]
      },
      {
        title: '매입처 관리',
        items: [
          { label: '매입처 관리', path: '/admin/purchase/suppliers' },
          { label: '매입처 미납금 관리', path: '/admin/purchase/outstanding' },
        ]
      }
    ]
  },
  products: {
    label: '상품',
    path: '/admin/products',
    sections: [
      {
        title: '상품관리',
        items: [
          { label: '브랜드 관리', path: '/admin/products/brands' },
          { label: '판매상품 관리', path: '/admin/products' },
          { label: '묶음상품 설정', path: '/admin/products/bundles' },
          { label: 'RX상품 관리', path: '/admin/products/rx' },
          { label: '여벌 일괄등록', path: '/products/bulk-spare' },
          { label: '상품 단축코드 설정', path: '/admin/products/shortcuts' },
        ]
      },
      {
        title: '재고관리',
        items: [
          { label: '일괄재고수정', path: '/admin/products/inventory' },
          { label: '적정재고 설정', path: '/admin/products/stock-levels' },
        ]
      }
    ]
  },
  stores: {
    label: '가맹점',
    path: '/admin/stores',
    sections: [
      {
        title: '가맹점 관리',
        items: [
          { label: '가맹점 관리', path: '/admin/stores' },
          { label: '가맹점 공지사항', path: '/admin/stores/notices' },
        ]
      },
      {
        title: '가맹점그룹 관리',
        items: [
          { label: '그룹별 가맹점 연결', path: '/admin/stores/groups' },
          { label: '그룹별 할인율 설정', path: '/admin/stores/discounts' },
          { label: '그룹별 타입 설정', path: '/admin/stores/types' },
        ]
      },
      {
        title: '미수금 관리',
        items: [
          { label: '미수금 현황', path: '/admin/stores/receivables' },
          { label: '입금 처리', path: '/admin/stores/receivables/deposit' },
          { label: '입출금 내역', path: '/admin/stores/receivables/transactions' },
          { label: '세금계산서', path: '/admin/stores/tax-invoices' },
        ]
      }
    ]
  },
  stats: {
    label: '통계',
    path: '/admin/stats',
    sections: [
      {
        title: '주제별 통계',
        items: [
          { label: '통계 대시보드', path: '/admin/stats' },
          { label: '기간별 비교', path: '/admin/stats/compare' },
          { label: '손익 분석', path: '/admin/stats/profit' },
        ]
      },
      {
        title: '마감/결산',
        items: [
          { label: '월마감/결산', path: '/admin/stats/closing' },
        ]
      }
    ]
  },
  settings: {
    label: '설정',
    path: '/admin/settings',
    sections: [
      {
        title: '환경설정',
        items: [
          { label: '기본설정', path: '/admin/settings' },
          { label: '구분설정', path: '/admin/settings/categories' },
          { label: '프린터 설정', path: '/admin/settings/printers' },
          { label: '배송비 설정', path: '/admin/settings/shipping' },
          { label: '데이터 가져오기', path: '/admin/settings/import' },
          { label: '백업 관리', path: '/admin/settings/backup' },
        ]
      },
      {
        title: '쇼핑몰 화면설정',
        items: [
          { label: '메인화면 설정', path: '/admin/settings/main-screen' },
          { label: '상품 상세화면 설정', path: '/admin/settings/product-screen' },
        ]
      },
      {
        title: '접속권한 설정',
        items: [
          { label: '사용자 관리', path: '/admin/settings/users' },
          { label: '그룹별 메뉴설정', path: '/admin/settings/menu-permissions' },
          { label: '계정관리', path: '/admin/settings/accounts' },
          { label: '로그인 이력', path: '/admin/settings/login-history' },
        ]
      }
    ]
  }
}

type MenuKey = keyof typeof menuStructure

interface NavigationProps {
  activeMenu?: MenuKey
}

export default function Navigation({ activeMenu = 'order' }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const [currentMenu, setCurrentMenu] = useState<MenuKey>(activeMenu)

  // URL에 따라 현재 메뉴 자동 감지
  useEffect(() => {
    if (pathname.startsWith('/admin/purchase')) setCurrentMenu('purchase')
    else if (pathname.startsWith('/admin/products')) setCurrentMenu('products')
    else if (pathname.startsWith('/admin/stores')) setCurrentMenu('stores')
    else if (pathname.startsWith('/admin/stats')) setCurrentMenu('stats')
    else if (pathname.startsWith('/admin/settings')) setCurrentMenu('settings')
    else setCurrentMenu('order')
  }, [pathname])

  const menu = menuStructure[currentMenu]

  const handleMenuClick = (key: MenuKey) => {
    setCurrentMenu(key)
    // 해당 섹션의 첫 번째 페이지로 이동
    const firstPage = menuStructure[key].sections[0].items[0].path
    router.push(firstPage)
  }

  return (
    <>
      {/* 헤더 */}
      <header style={{ 
        background: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '60px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg width="160" height="32" viewBox="0 0 180 36">
              <defs>
                <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#5d7a5d'}}/>
                  <stop offset="100%" style={{stopColor:'#4a6b4a'}}/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="14" fill="none" stroke="url(#lensGrad)" strokeWidth="2.5"/>
              <circle cx="18" cy="18" r="8" fill="url(#lensGrad)" opacity="0.15"/>
              <circle cx="18" cy="18" r="4" fill="url(#lensGrad)" opacity="0.3"/>
              <circle cx="14" cy="14" r="2" fill="white" opacity="0.8"/>
              <text x="42" y="24" fontFamily="Inter, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="var(--text-primary)">
                AI<tspan fill="#5d7a5d">Optic</tspan>
              </text>
            </svg>
          </Link>
          <nav style={{ display: 'flex', gap: '6px', background: '#f1f3f5', padding: '6px', borderRadius: '10px' }}>
            {Object.entries(menuStructure).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleMenuClick(key as MenuKey)}
                style={{ 
                  background: currentMenu === key ? '#5d7a5d' : 'transparent',
                  border: 'none',
                  color: currentMenu === key ? '#fff' : '#495057',
                  textDecoration: 'none',
                  fontWeight: currentMenu === key ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  boxShadow: currentMenu === key ? '0 2px 8px rgba(93, 122, 93, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {value.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 다크모드 토글 */}
          <button
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <span style={{ fontSize: '14px', color: '#495057', fontWeight: 500 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginRight: '8px',
                  background: user.role === 'admin' ? '#ffe3e3' : user.role === 'manager' ? '#dbeafe' : '#f1f3f5',
                  color: user.role === 'admin' ? '#e03131' : user.role === 'manager' ? '#1971c2' : '#495057'
                }}>
                  {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '사용자'}
                </span>
                {user.name}님
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: '#ffffff',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </header>

      {/* 사이드바 */}
      <aside style={{ 
        width: '220px', 
        background: '#ffffff', 
        borderRight: '1px solid var(--border-color)',
        minHeight: 'calc(100vh - 60px)',
        padding: '24px 16px',
        position: 'fixed',
        top: '60px',
        left: 0,
        overflowY: 'auto'
      }}>
        {menu.sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '20px' }}>
            <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
              <div style={{ fontSize: '13px', color: '#adb5bd', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {section.title}
              </div>
            </div>
            {section.items.map((item, itemIdx) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={itemIdx}
                  href={item.path}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    margin: '2px 0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    background: isActive ? '#eef4ee' : 'transparent',
                    color: isActive ? '#5d7a5d' : '#495057',
                    fontSize: '15px',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.15s'
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </aside>
    </>
  )
}

// 레이아웃 래퍼 컴포넌트
export function AdminLayout({ 
  children, 
  activeMenu = 'order' 
}: { 
  children: React.ReactNode
  activeMenu?: MenuKey 
}) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Navigation activeMenu={activeMenu} />
      <main style={{ 
        marginLeft: '220px', 
        padding: '32px', 
        paddingTop: '92px',
        maxWidth: '1200px' 
      }}>
        {children}
      </main>
    </div>
  )
}
