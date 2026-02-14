'use client'
import Layout, { cardStyle } from '../../components/Layout'
const SIDEBAR = [{ title: '주제별 통계', items: [
  { label: '가맹점 매출 통계', href: '/stats' },
  { label: '가맹점 상품 통계', href: '/stats/products' },
  { label: '가맹점 출고 통계', href: '/stats/shipping' },
  { label: '그룹별 상품 통계', href: '/stats/groups' },
  { label: '기타 통계', href: '/stats/etc' },
]}]
export default function EtcStatsPage() {
  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>기타 통계</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <p>기타 통계를 확인합니다</p>
      </div>
    </Layout>
  )
}
