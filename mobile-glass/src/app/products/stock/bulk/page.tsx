'use client'

import Layout, { cardStyle } from '../../../components/Layout'

export default function BulkStockPage() {
  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>일괄재고수정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p>재고를 일괄 수정합니다</p>
      </div>
    </Layout>
  )
}
