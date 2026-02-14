'use client'
import Layout, { cardStyle } from '../../components/Layout'
export default function ShippingSettingsPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>배송비 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚚</div>
        <p>배송비를 설정합니다</p>
      </div>
    </Layout>
  )
}
