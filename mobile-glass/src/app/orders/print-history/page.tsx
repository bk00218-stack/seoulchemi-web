'use client'

import Layout, { cardStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

export default function PrintHistoryPage() {
  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>명세표 출력이력</h1>
      </div>
      
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🖨️</div>
        <p>출력 이력이 표시됩니다</p>
      </div>
    </Layout>
  )
}
