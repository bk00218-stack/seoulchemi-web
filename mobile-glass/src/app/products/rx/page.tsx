'use client'

import Layout, { cardStyle } from '../../components/Layout'

export default function RxProductsPage() {
  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>RX상품 관리</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👓</div>
        <p>처방렌즈 상품을 관리합니다</p>
      </div>
    </Layout>
  )
}
