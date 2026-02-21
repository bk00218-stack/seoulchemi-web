'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../../constants/sidebar'

interface PurchaseRecord {
  id: number
  purchaseNo: string
  status: string
  totalAmount: number
  memo: string | null
  purchasedAt: string
  receivedAt: string | null
  supplier: {
    id: number
    name: string
  } | null
  items: {
    id: number
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      name: string
      brand: { name: string } | null
    } | null
  }[]
}

interface SupplierItem {
  id: number
  name: string
}

export default function SettlementHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)

  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedSupplier, setSelectedSupplier] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSupplier) params.set('supplierId', selectedSupplier)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/admin/settlement-history?${params}`)
      const data = await res.json()
      setPurchases(data.purchases || [])
      setSuppliers(data.suppliers || [])
      setTotalAmount(data.stats?.totalAmount || 0)
    } catch (e) {
      console.error('Failed to fetch settlement history:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriod = (days: number) => {
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
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
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--gray-700)' }}>{purchases.length}건</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>총 정산금액</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--success)' }}>{totalAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={selectStyle}>
          <option value="">매입처 전체</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: '이번주', days: 7 },
            { label: '이번달', days: 30 },
            { label: '3개월', days: 90 },
            { label: '전체', days: 365 * 3 },
          ].map(p => (
            <button key={p.label} onClick={() => handlePeriod(p.days)} style={{
              padding: '6px 12px', borderRadius: 20,
              border: '1px solid var(--gray-200)', background: '#fff',
              fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer',
            }}>{p.label}</button>
          ))}
        </div>
        <button onClick={fetchHistory} style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검색</button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>매입번호</th>
                <th style={thStyle}>정산일자</th>
                <th style={thStyle}>매입처</th>
                <th style={thStyle}>상품 수</th>
                <th style={thStyle}>정산금액</th>
                <th style={thStyle}>비고</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                    정산 이력이 없습니다
                  </td>
                </tr>
              ) : (
                purchases.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{item.purchaseNo}</td>
                    <td style={tdStyle}>
                      {item.receivedAt ? new Date(item.receivedAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{item.supplier?.name || '-'}</td>
                    <td style={tdStyle}>{item.items.length}개</td>
                    <td style={{ ...tdStyle, color: 'var(--success)', fontWeight: 600 }}>
                      {(item.totalAmount || 0).toLocaleString()}원
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--gray-500)', fontSize: 13 }}>{item.memo || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
