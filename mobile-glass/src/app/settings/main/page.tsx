'use client'
import Layout, { cardStyle } from '../../components/Layout'
const SIDEBAR = [
  { title: '환경설정', items: [{ label: '기본설정', href: '/settings' }, { label: '구분설정', href: '/settings/categories' }, { label: '배송비 설정', href: '/settings/shipping' }]},
  { title: '화면설정', items: [{ label: '메인화면 설정', href: '/settings/main' }, { label: '상품 상세화면 설정', href: '/settings/product-detail' }]},
  { title: '접속권한 설정', items: [{ label: '그룹별 메뉴설정', href: '/settings/menu-permissions' }, { label: '계정관리', href: '/settings/accounts' }]}
]
export default function MainSettingsPage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="설정">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>메인화면 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
        <p>메인화면을 설정합니다</p>
      </div>
    </Layout>
  )
}
