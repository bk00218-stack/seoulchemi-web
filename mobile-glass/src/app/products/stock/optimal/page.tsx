'use client'

import Layout, { cardStyle } from '../../../components/Layout'

const SIDEBAR = [
  { title: '상품관리', items: [
    { label: '브랜드 관리', href: '/products' },
    { label: '판매상품 관리', href: '/products/items' },
    { label: '묶음상품 설정', href: '/products/bundles' },
    { label: 'RX상품 관리', href: '/products/rx' },
    { label: '상품 단축코드 설정', href: '/products/shortcuts' },
  ]},
  { title: '재고관리', items: [
    { label: '일괄재고수정', href: '/products/stock/bulk' },
    { label: '적정재고 설정', href: '/products/stock/optimal' },
  ]}
]

export default function OptimalStockPage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>적정재고 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <p>적정 재고량을 설정합니다</p>
      </div>
    </Layout>
  )
}
