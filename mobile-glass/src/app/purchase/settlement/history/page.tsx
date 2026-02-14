'use client'

import Layout, { cardStyle } from '../../../components/Layout'

export default function SettlementHistoryPage() {
  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>정산내역 조회</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <p>정산 내역을 조회합니다</p>
      </div>
    </Layout>
  )
}
