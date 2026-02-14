'use client'

import { useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '주제�??�계',
    items: [
      { label: '가맹점 매출 ?�계', href: '/stats' },
      { label: '가맹점 ?�품 ?�계', href: '/stats/products' },
      { label: '가맹점 출고 ?�계', href: '/stats/shipping' },
      { label: '그룹�??�품 ?�계', href: '/stats/groups' },
      { label: '기�? ?�계', href: '/stats/etc' },
    ]
  }
]

export default function StatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="?�계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>가맹점 매출?�계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점�?매출 ?�황???�인?�니??/p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['미수�?, '?�인??].map((t, i) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" name="statType" defaultChecked={i === 0} style={{ accentColor: 'var(--primary)' }} /> {t}
              </label>
            ))}
          </div>
          <select style={selectStyle}><option>그룹 ?�체</option></select>
          <select style={selectStyle}><option>지???�체</option></select>
          <select style={selectStyle}><option>?�업?�원 ?�체</option></select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간검??</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['?�제', '?�늘', '?�번�?, '?�번??].map(label => (
              <button key={label} style={{ 
                padding: '6px 12px', borderRadius: 20, 
                border: '1px solid var(--gray-200)', background: 'var(--bg-primary)', 
                fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer' 
              }}>{label}</button>
            ))}
          </div>
          <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검??/button>
          <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>?�� ?��??�운</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: '주문금액', value: '0', color: 'var(--primary)' },
          { label: '반품금액', value: '0', color: 'var(--danger)' },
          { label: '?�금??, value: '0', color: 'var(--success)' },
          { label: '?�인금액', value: '0', color: 'var(--warning)' },
          { label: '총�???, value: '0', color: 'var(--gray-700)' },
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
          <table style={{ width: '100%', minWidth: 1200 }}>
            <thead>
              <tr>
                <th style={thStyle}>그룹�?/th>
                <th style={thStyle}>가맹점�?/th>
                <th style={thStyle}>?�태</th>
                <th style={thStyle}>지??/th>
                <th style={thStyle}>?�업?�원</th>
                <th style={thStyle}>?�전??/th>
                <th style={thStyle}>주문금액</th>
                <th style={thStyle}>반품금액</th>
                <th style={thStyle}>?�금??/th>
                <th style={thStyle}>?�인금액</th>
                <th style={thStyle}>총�???/th>
                <th style={thStyle}>?�매출액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  검??조건???�택?�고 검??버튼???�러주세??
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td style={tdStyle} colSpan={5}>총합�?/td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Layout>
  )
}
