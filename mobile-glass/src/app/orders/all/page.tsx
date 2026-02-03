'use client'

import Layout, { cardStyle } from '../../components/Layout'

const SIDEBAR = [
  {
    title: '후결제 주문',
    items: [
      { label: '여벌 주문내역', href: '/' },
      { label: 'RX 주문내역', href: '/orders/rx' },
      { label: '관리자 주문등록', href: '/orders/new' },
      { label: '명세표 출력이력', href: '/orders/print-history' },
    ]
  },
  {
    title: '출고관리',
    items: [
      { label: '전체 주문내역', href: '/orders/all' },
      { label: '출고 확인', href: '/orders/shipping' },
      { label: '출고 배송지 정보', href: '/orders/delivery' },
    ]
  }
]

export default function AllOrdersPage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>전체 주문내역</h1>
      </div>
      
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <p>전체 주문 내역이 표시됩니다</p>
      </div>
    </Layout>
  )
}
