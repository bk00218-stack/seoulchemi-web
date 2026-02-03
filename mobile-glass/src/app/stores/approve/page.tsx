'use client'
import Layout, { cardStyle } from '../../components/Layout'
const SIDEBAR = [
  { title: '가맹점 관리', items: [{ label: '가맹점 관리', href: '/stores' }, { label: '가맹점 공지사항', href: '/stores/notices' }]},
  { title: '가맹점그룹 관리', items: [{ label: '그룹별 가맹점 연결', href: '/stores/groups' }, { label: '그룹별 할인율 설정', href: '/stores/groups/discounts' }, { label: '그룹별 타입 설정', href: '/stores/groups/types' }]},
  { title: '승인/통합', items: [{ label: '가입여부 확인', href: '/stores/verify' }, { label: '코드 승인', href: '/stores/approve' }, { label: '정산통합', href: '/stores/settle' }]}
]
export default function ApprovePage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>코드 승인</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p>가맹점 코드를 승인합니다</p>
      </div>
    </Layout>
  )
}
