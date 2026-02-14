'use client'

import Layout, { cardStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

export default function OptimalStockPage() {
  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>적정재고 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <p>적정 재고량을 설정합니다</p>
      </div>
    </Layout>
  )
}
