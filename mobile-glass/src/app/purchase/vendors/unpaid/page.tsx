'use client'

import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../../components/Layout'

const SIDEBAR = [
  { title: '매입관리', items: [
    { label: '매입내역', href: '/purchase' },
    { label: '매입등록', href: '/purchase/new' },
  ]},
  { title: '매입처 관리', items: [
    { label: '매입처 관리', href: '/purchase/vendors' },
    { label: '매입처 미납금 관리', href: '/purchase/vendors/unpaid' },
  ]}
]

export default function VendorsUnpaidPage() {
  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="매입">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>매입처 미납금 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입처별 미납금 현황을 관리합니다</p>
        </div>
        <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>
          📥 엑셀다운
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={selectStyle}><option>매입처 전체</option></select>
        <input type="text" placeholder="매입처 검색..." style={{ ...inputStyle, minWidth: 200 }} />
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검색</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: '총 매입처', value: '0개', color: 'var(--gray-700)' },
          { label: '총 미납금', value: '0원', color: 'var(--danger)' },
          { label: '정산완료', value: '0원', color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>매입처명</th>
                <th style={thStyle}>담당자</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>총 매입금</th>
                <th style={thStyle}>미납금</th>
                <th style={thStyle}>최근 거래일</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  미납금 내역이 없습니다
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
