'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface ShipmentRow {
  storeId: number; storeName: string; storeCode: string
  totalQuantity: number; totalAmount: number; orderCount: number
}

function formatDateShort(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getQuickDateRange(label: string): { start: string; end: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = formatDateShort(today.toISOString())
  switch (label) {
    case '오늘': return { start: end, end }
    case '이번주': {
      const d = new Date(today); d.setDate(d.getDate() - d.getDay())
      return { start: formatDateShort(d.toISOString()), end }
    }
    case '이번달': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatDateShort(d.toISOString()), end }
    }
    case '지난달': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: formatDateShort(d.toISOString()), end: formatDateShort(e.toISOString()) }
    }
    default: return { start: end, end }
  }
}

export default function ShipmentByStorePage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [dateFrom, setDateFrom] = useState(formatDateShort(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDateShort(now.toISOString()))
  const [rows, setRows] = useState<ShipmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [grandTotal, setGrandTotal] = useState({ quantity: 0, amount: 0, orders: 0 })

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)

      const res = await fetch(`/api/stats?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // storeStats에서 가맹점별 출고 현황 구성
      const storeStats = data.storeStats || data.byStore || []
      const mapped: ShipmentRow[] = storeStats.map((s: any) => ({
        storeId: s.storeId || s.id,
        storeName: s.storeName || s.name || '',
        storeCode: s.storeCode || s.code || '',
        totalQuantity: s.totalQuantity || s.orderCount || 0,
        totalAmount: s.totalAmount || s.amount || 0,
        orderCount: s.totalOrders || s.orderCount || 0,
      })).sort((a: ShipmentRow, b: ShipmentRow) => b.totalAmount - a.totalAmount)

      setRows(mapped)
      setGrandTotal({
        quantity: mapped.reduce((s: number, r: ShipmentRow) => s + r.totalQuantity, 0),
        amount: mapped.reduce((s: number, r: ShipmentRow) => s + r.totalAmount, 0),
        orders: mapped.reduce((s: number, r: ShipmentRow) => s + r.orderCount, 0),
      })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [])

  const handleExport = () => {
    if (rows.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(rows as any[], [
      { key: 'storeName', label: '가맹점' },
      { key: 'storeCode', label: '코드' },
      { key: 'orderCount', label: '주문수' },
      { key: 'totalQuantity', label: '수량' },
      { key: 'totalAmount', label: '금액' },
    ], '거래처별출고현황')
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      {/* 필터 */}
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>기간</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
            <span style={{ color: '#9ca3af' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>빠른선택</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['오늘', '이번주', '이번달', '지난달'].map(label => (
              <button
                key={label}
                onClick={() => { const r = getQuickDateRange(label); setDateFrom(r.start); setDateTo(r.end) }}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading} style={{ ...btnStyle, background: '#2563eb', color: '#fff' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 가맹점</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{rows.length}개</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 주문</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{grandTotal.orders}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 출고금액</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{grandTotal.amount.toLocaleString()}원</div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '50px' }}>#</th>
              <th style={thStyle}>가맹점</th>
              <th style={thStyle}>코드</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>주문수</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>비율</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : rows.map((r, i) => {
              const pct = grandTotal.amount > 0 ? ((r.totalAmount / grandTotal.amount) * 100).toFixed(1) : '0'
              return (
                <tr key={r.storeId} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, color: '#9ca3af', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.storeName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{r.storeCode}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.orderCount}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.totalQuantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.totalAmount.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '40px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>합계</td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{grandTotal.orders}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{grandTotal.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{grandTotal.amount.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Layout>
  )
}
