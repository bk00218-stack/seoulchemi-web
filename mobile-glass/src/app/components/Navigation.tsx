'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

// 메뉴 구조 정의 (레티나 관리자 시스템 기반)
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
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
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
              <text x="42" y="24" fontFamily="Inter, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1d1d1f">
                AI<tspan fill="#5d7a5d">Optic</tspan>
              </text>
            </svg>
          </Link>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {Object.entries(menuStructure).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleMenuClick(key as MenuKey)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: currentMenu === key ? '#1d1d1f' : '#86868b',
                  textDecoration: 'none',
                  fontWeight: currentMenu === key ? 500 : 400,
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 0',
                  borderBottom: currentMenu === key ? '2px solid #5d7a5d' : '2px solid transparent'
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
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1
            }}
          >
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  marginRight: '6px',
                  background: user.role === 'admin' ? '#fee2e2' : user.role === 'manager' ? '#dbeafe' : '#f3f4f6',
                  color: user.role === 'admin' ? '#dc2626' : user.role === 'manager' ? '#2563eb' : '#374151'
                }}>
                  {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '사용자'}
                </span>
                {user.name}님
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  fontSize: '13px',
                  color: '#86868b',
                  cursor: 'pointer'
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
        width: '200px', 
        background: '#fff', 
        borderRight: '1px solid #e5e5e5',
        minHeight: 'calc(100vh - 60px)',
        padding: '20px 0',
        position: 'fixed',
        top: '60px',
        left: 0,
        overflowY: 'auto'
      }}>
        {menu.sections.map((section, idx) => (
          <div key={idx}>
            <div style={{ padding: '0 16px', margin: idx > 0 ? '24px 0 16px' : '0 0 16px' }}>
              <div style={{ fontSize: '12px', color: '#86868b', fontWeight: 500 }}>
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
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: isActive ? '#f0f7f0' : 'transparent',
                    borderLeft: isActive ? '3px solid #5d7a5d' : '3px solid transparent',
                    color: isActive ? '#5d7a5d' : '#1d1d1f',
                    fontSize: '14px',
                    textDecoration: 'none',
                    fontWeight: isActive ? 500 : 400
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
      background: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Navigation activeMenu={activeMenu} />
      <main style={{ 
        marginLeft: '200px', 
        padding: '32px', 
        paddingTop: '92px',
        maxWidth: '1200px' 
      }}>
        {children}
      </main>
    </div>
  )
}
