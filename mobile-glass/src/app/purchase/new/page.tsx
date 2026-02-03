'use client'

import Layout, { cardStyle } from '../../components/Layout'

const SIDEBAR = [
  { title: '매입관리', items: [
    { label: '매입내역 조회', href: '/purchase' },
    { label: '매입등록', href: '/purchase/new' },
    { label: '매입처 관리', href: '/purchase/vendors' },
  ]},
  { title: '정산관리', items: [
    { label: '매입 정산', href: '/purchase/settlement' },
    { label: '정산내역 조회', href: '/purchase/settlement/history' },
  ]}
]

export default function NewPurchasePage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="매입">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>매입등록</h1>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <p>새로운 매입을 등록합니다</p>
      </div>
    </Layout>
  )
}
