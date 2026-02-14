'use client'

import { useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

export default function PurchasePage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>매입내역 조회</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입 내역을 조회하고 관리합니다</p>
        </div>
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>
          + 매입등록
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={selectStyle}><option>매입처 전체</option></select>
        <select style={selectStyle}><option>브랜드 전체</option></select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
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
        <div style={{ flex: 1 }} />
        <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>📥 엑셀다운</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: '총 매입건수', value: '0건', color: 'var(--gray-700)' },
          { label: '총 매입금액', value: '0원', color: 'var(--primary)' },
          { label: '미정산', value: '0원', color: 'var(--danger)' },
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
          <table style={{ width: '100%', minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={thStyle}>
                  <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                </th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>매입일자</th>
                <th style={thStyle}>매입처</th>
                <th style={thStyle}>브랜드</th>
                <th style={thStyle}>상품명</th>
                <th style={thStyle}>수량</th>
                <th style={thStyle}>단가</th>
                <th style={thStyle}>매입금액</th>
                <th style={thStyle}>정산상태</th>
                <th style={thStyle}>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  매입 내역이 없습니다
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
