'use client'

import { useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '주제별 통계',
    items: [
      { label: '가맹점 매출 통계', href: '/stats' },
      { label: '가맹점 상품 통계', href: '/stats/products' },
      { label: '가맹점 출고 통계', href: '/stats/shipping' },
      { label: '그룹별 상품 통계', href: '/stats/groups' },
      { label: '기타 통계', href: '/stats/etc' },
    ]
  }
]

export default function StatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>가맹점 매출통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점별 매출 현황을 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['미수금', '포인트'].map((t, i) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" name="statType" defaultChecked={i === 0} style={{ accentColor: 'var(--primary)' }} /> {t}
              </label>
            ))}
          </div>
          <select style={selectStyle}><option>그룹 전체</option></select>
          <select style={selectStyle}><option>지역 전체</option></select>
          <select style={selectStyle}><option>영업사원 전체</option></select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간검색:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['어제', '오늘', '이번주', '이번달'].map(label => (
              <button key={label} style={{ 
                padding: '6px 12px', borderRadius: 20, 
                border: '1px solid var(--gray-200)', background: '#fff', 
                fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer' 
              }}>{label}</button>
            ))}
          </div>
          <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검색</button>
          <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>📥 엑셀다운</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: '주문금액', value: '0', color: 'var(--primary)' },
          { label: '반품금액', value: '0', color: 'var(--danger)' },
          { label: '입금액', value: '0', color: 'var(--success)' },
          { label: '할인금액', value: '0', color: 'var(--warning)' },
          { label: '총미수', value: '0', color: 'var(--gray-700)' },
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
                <th style={thStyle}>그룹명</th>
                <th style={thStyle}>가맹점명</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>지역</th>
                <th style={thStyle}>영업사원</th>
                <th style={thStyle}>전전액</th>
                <th style={thStyle}>주문금액</th>
                <th style={thStyle}>반품금액</th>
                <th style={thStyle}>입금액</th>
                <th style={thStyle}>할인금액</th>
                <th style={thStyle}>총미수</th>
                <th style={thStyle}>실매출액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  검색 조건을 선택하고 검색 버튼을 눌러주세요
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td style={tdStyle} colSpan={5}>총합계</td>
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
