'use client'
import Layout, { cardStyle } from '../../components/Layout'
export default function GroupsPage() {
  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>그룹별 가맹점 연결</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <p>가맹점 그룹을 관리합니다</p>
      </div>
    </Layout>
  )
}
