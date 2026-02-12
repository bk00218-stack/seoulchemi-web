'use client'
import Layout, { cardStyle } from '../../../components/Layout'
const SIDEBAR = [
  {
    title: '가맹점 관리',
    items: [
      { label: '가맹점 관리', href: '/stores' },
      { label: '배송담당자 관리', href: '/stores/delivery-staff' },
      { label: '가맹점 공지사항', href: '/stores/notices' },
    ]
  },
  {
    title: '가맹점그룹 관리',
    items: [
      { label: '그룹별 가맹점 연결', href: '/stores/groups' },
      { label: '그룹별 할인율 설정', href: '/stores/groups/discounts' },
      { label: '그룹별 타입 설정', href: '/stores/groups/types' },
    ]
  }
]
export default function DiscountsPage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>그룹별 할인율 설정</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
        <p>그룹별 할인율을 설정합니다</p>
      </div>
    </Layout>
  )
}
