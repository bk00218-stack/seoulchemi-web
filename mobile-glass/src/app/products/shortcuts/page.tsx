'use client'

import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

export default function ShortcutsPage() {
  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>상품 단축코드 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⌨️</div>
        <p>빠른 주문을 위한 단축코드를 설정합니다</p>
      </div>
    </Layout>
  )
}
