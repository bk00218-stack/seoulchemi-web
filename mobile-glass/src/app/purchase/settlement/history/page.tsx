'use client'

import { useState } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../../constants/sidebar'

interface SettlementHistory {
  id: number
  settlementDate: string
  supplierName: string
  amount: number
  paymentMethod: string
  memo: string
}

export default function SettlementHistoryPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedSupplier, setSelectedSupplier] = useState('')

  // 목업 데이터
  const mockHistory: SettlementHistory[] = [
    { id: 1, settlementDate: '2024-01-15', supplierName: '(주)한국유리', amount: 1500000, paymentMethod: '계좌이체', memo: '1월 2차 정산' },
    { id: 2, settlementDate: '2024-01-10', supplierName: '대명글라스', amount: 3200000, paymentMethod: '계좌이체', memo: '1월 전액 정산' },
    { id: 3, settlementDate: '2024-01-08', supplierName: '서울자동차유리', amount: 500000, paymentMethod: '현금', memo: '1차 부분 정산' },
    { id: 4, settlementDate: '2024-01-05', supplierName: '(주)한국유리', amount: 1500000, paymentMethod: '계좌이체', memo: '1월 1차 정산' },
  ]

  const suppliers = [...new Set(mockHistory.map(h => h.supplierName))]
  const totalAmount = mockHistory.reduce((sum, h) => sum + h.amount, 0)

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>정산 이력</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입처 정산 내역을 조회합니다</p>
        </div>
        <a href="/purchase/settlement" style={{ textDecoration: 'none' }}>
          <button style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-700)', border: 'none' }}>
            ← 정산 관리
          </button>
        </a>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>정산 건수</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--gray-700)' }}>{mockHistory.length}건</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>총 정산금액</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--success)' }}>{totalAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          style={selectStyle}
        >
          <option value="">매입처 전체</option>
          {suppliers.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['이번주', '이번달', '3개월', '전체'].map(label => (
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

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>정산일자</th>
              <th style={thStyle}>매입처</th>
              <th style={thStyle}>정산금액</th>
              <th style={thStyle}>결제방법</th>
              <th style={thStyle}>비고</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                  정산 이력이 없습니다
                </td>
              </tr>
            ) : (
              mockHistory.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}>{item.settlementDate}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{item.supplierName}</td>
                  <td style={{ ...tdStyle, color: 'var(--success)', fontWeight: 600 }}>
                    {item.amount.toLocaleString()}원
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: item.paymentMethod === '계좌이체' ? '#e0f2fe' : '#fef3c7',
                      color: item.paymentMethod === '계좌이체' ? '#0369a1' : '#92400e'
                    }}>
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--gray-500)', fontSize: 13 }}>{item.memo || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
