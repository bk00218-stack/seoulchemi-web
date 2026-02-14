'use client'
import Layout, { cardStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'
export default function ProductDetailPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>상품 상세화면 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
        <p>상품 상세화면을 설정합니다</p>
      </div>
    </Layout>
  )
}
