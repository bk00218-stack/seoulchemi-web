'use client'
import Layout, { cardStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'
export default function AccountsPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>계정관리</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <p>관리자 계정을 관리합니다</p>
      </div>
    </Layout>
  )
}
