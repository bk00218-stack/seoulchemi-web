'use client'

import Layout, { cardStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

export default function SettlementPage() {
  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>매입 정산</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <p>매입 정산을 처리합니다</p>
      </div>
    </Layout>
  )
}
