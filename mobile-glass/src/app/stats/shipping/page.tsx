'use client'
import Layout, { cardStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

export default function ShippingStatsPage() {
  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>가맹점 출고 통계</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚚</div>
        <p>출고 통계를 확인합니다</p>
      </div>
    </Layout>
  )
}
