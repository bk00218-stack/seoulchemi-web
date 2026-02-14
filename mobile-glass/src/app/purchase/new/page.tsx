'use client'

import Layout, { cardStyle } from '../../components/Layout'

export default function NewPurchasePage() {
  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>매입등록</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <p>새로운 매입을 등록합니다</p>
      </div>
    </Layout>
  )
}
