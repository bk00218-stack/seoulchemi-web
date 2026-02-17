'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

interface SettlementItem {
  id: number
  supplierName: string
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  lastPaymentDate: string | null
}

export default function SettlementPage() {
  const { toast } = useToast()
  const [selectedSupplier, setSelectedSupplier] = useState('')

  // 목업 데이터
  const mockData: SettlementItem[] = [
    { id: 1, supplierName: '(주)한국유리', totalAmount: 5000000, paidAmount: 3000000, outstandingAmount: 2000000, lastPaymentDate: '2024-01-15' },
    { id: 2, supplierName: '대명글라스', totalAmount: 3200000, paidAmount: 3200000, outstandingAmount: 0, lastPaymentDate: '2024-01-10' },
    { id: 3, supplierName: '서울자동차유리', totalAmount: 1500000, paidAmount: 500000, outstandingAmount: 1000000, lastPaymentDate: '2024-01-08' },
  ]

  const totalOutstanding = mockData.reduce((sum, item) => sum + item.outstandingAmount, 0)
  const totalPaid = mockData.reduce((sum, item) => sum + item.paidAmount, 0)

  const handleSettlement = (item: SettlementItem) => {
    toast.info(`${item.supplierName} 정산 등록 기능은 아직 준비 중입니다.`)
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>정산 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입처별 정산 현황을 관리합니다</p>
        </div>
        <a href="/purchase/settlement/history" style={{ textDecoration: 'none' }}>
          <button style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-700)', border: 'none' }}>
            📋 정산 이력
          </button>
        </a>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>총 매입처</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--gray-700)' }}>{mockData.length}개</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>정산완료</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--success)' }}>{totalPaid.toLocaleString()}원</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>미정산</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--danger)' }}>{totalOutstanding.toLocaleString()}원</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <select
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          style={selectStyle}
        >
          <option value="">매입처 전체</option>
          {mockData.map(item => (
            <option key={item.id} value={item.id}>{item.supplierName}</option>
          ))}
        </select>
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검색</button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>매입처</th>
              <th style={thStyle}>총 매입금액</th>
              <th style={thStyle}>정산완료</th>
              <th style={thStyle}>미정산</th>
              <th style={thStyle}>최근 정산일</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.supplierName}</td>
                <td style={tdStyle}>{item.totalAmount.toLocaleString()}원</td>
                <td style={{ ...tdStyle, color: 'var(--success)' }}>{item.paidAmount.toLocaleString()}원</td>
                <td style={{ ...tdStyle, color: item.outstandingAmount > 0 ? 'var(--danger)' : 'var(--gray-500)', fontWeight: item.outstandingAmount > 0 ? 600 : 400 }}>
                  {item.outstandingAmount.toLocaleString()}원
                </td>
                <td style={tdStyle}>{item.lastPaymentDate || '-'}</td>
                <td style={tdStyle}>
                  {item.outstandingAmount > 0 ? (
                    <button
                      onClick={() => handleSettlement(item)}
                      style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', fontSize: 13 }}
                    >
                      정산 등록
                    </button>
                  ) : (
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: 12, 
                      background: 'var(--success-light, #d1fae5)', 
                      color: 'var(--success)' 
                    }}>
                      완료
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
