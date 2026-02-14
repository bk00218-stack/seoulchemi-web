'use client'
import Layout, { cardStyle } from '../../components/Layout'
export default function MenuPermissionsPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>그룹별 메뉴설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <p>그룹별 메뉴 권한을 설정합니다</p>
      </div>
    </Layout>
  )
}
