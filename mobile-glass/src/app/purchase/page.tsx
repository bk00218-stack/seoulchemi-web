'use client'

import { useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: 'ë§¤ì…ê´€ë¦?,
    items: [
      { label: 'ë§¤ì…?´ì—­', href: '/purchase' },
      { label: 'ë§¤ì…?±ë¡', href: '/purchase/new' },
    ]
  },
  {
    title: 'ë§¤ì…ì²?ê´€ë¦?,
    items: [
      { label: 'ë§¤ì…ì²?ê´€ë¦?, href: '/purchase/vendors' },
      { label: 'ë§¤ì…ì²?ë¯¸ë‚©ê¸?ê´€ë¦?, href: '/purchase/vendors/unpaid' },
    ]
  }
]

export default function PurchasePage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="ë§¤ì…">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>ë§¤ì…?´ì—­ ì¡°íšŒ</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>ë§¤ì… ?´ì—­??ì¡°íšŒ?˜ê³  ê´€ë¦¬í•©?ˆë‹¤</p>
        </div>
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>
          + ë§¤ì…?±ë¡
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={selectStyle}><option>ë§¤ì…ì²??„ì²´</option></select>
        <select style={selectStyle}><option>ë¸Œëœ???„ì²´</option></select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>ê¸°ê°„:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['?´ì œ', '?¤ëŠ˜', '?´ë²ˆì£?, '?´ë²ˆ??].map(label => (
            <button key={label} style={{ 
              padding: '6px 12px', borderRadius: 20, 
              border: '1px solid var(--gray-200)', background: 'var(--bg-primary)', 
              fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer' 
            }}>{label}</button>
          ))}
        </div>
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>ê²€??/button>
        <div style={{ flex: 1 }} />
        <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>?“¥ ?‘ì??¤ìš´</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'ì´?ë§¤ì…ê±´ìˆ˜', value: '0ê±?, color: 'var(--gray-700)' },
          { label: 'ì´?ë§¤ì…ê¸ˆì•¡', value: '0??, color: 'var(--primary)' },
          { label: 'ë¯¸ì •??, value: '0??, color: 'var(--danger)' },
          { label: '?•ì‚°?„ë£Œ', value: '0??, color: 'var(--success)' },
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
                <th style={thStyle}>ë§¤ì…?¼ì</th>
                <th style={thStyle}>ë§¤ì…ì²?/th>
                <th style={thStyle}>ë¸Œëœ??/th>
                <th style={thStyle}>?í’ˆëª?/th>
                <th style={thStyle}>?˜ëŸ‰</th>
                <th style={thStyle}>?¨ê?</th>
                <th style={thStyle}>ë§¤ì…ê¸ˆì•¡</th>
                <th style={thStyle}>?•ì‚°?íƒœ</th>
                <th style={thStyle}>ë¹„ê³ </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  ë§¤ì… ?´ì—­???†ìŠµ?ˆë‹¤
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
