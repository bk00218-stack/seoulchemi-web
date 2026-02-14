'use client'
import Layout, { cardStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'
export default function CategoriesPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>구분설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
        <p>구분 항목을 설정합니다</p>
      </div>
    </Layout>
  )
}
