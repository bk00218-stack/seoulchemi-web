'use client'
import Layout, { cardStyle } from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
export default function VerifyPage() {
  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>가맹점 승인관리</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p>가맹점 승인 요청을 관리합니다</p>
      </div>
    </Layout>
  )
}
