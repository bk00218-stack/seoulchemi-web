'use client'
import Layout, { cardStyle } from '../../components/Layout'
export default function ApprovePage() {
  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>유통사 코드 승인</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p>가맹점 코드를 승인합니다</p>
      </div>
    </Layout>
  )
}
