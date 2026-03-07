'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

function formatDate(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatAmount(n: number): string {
  return n.toLocaleString() + '원'
}

function getQuickDateRange(label: string): { start: string; end: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = formatDate(today.toISOString())
  switch (label) {
    case '이번달': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatDate(d.toISOString()), end }
    }
    case '지난달': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: formatDate(d.toISOString()), end: formatDate(e.toISOString()) }
    }
    case '최근3개월': {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return { start: formatDate(d.toISOString()), end }
    }
    case '올해': {
      const d = new Date(now.getFullYear(), 0, 1)
      return { start: formatDate(d.toISOString()), end }
    }
    default: return { start: end, end }
  }
}

export default function PurchaseSummaryPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [groupBy, setGroupBy] = useState<'supplier' | 'month' | 'product'>('supplier')
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState({ grandTotal: 0, totalOutstanding: 0, rowCount: 0 })
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)
      params.set('groupBy', groupBy)

      const res = await fetch(`/api/reports/purchase-summary?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.rows || [])
      setSummary(data.summary || { grandTotal: 0, totalOutstanding: 0, rowCount: 0 })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [groupBy])

  const handleExport = () => {
    if (rows.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    const columns = groupBy === 'supplier'
      ? [
          { key: 'supplierName', label: '매입처' },
          { key: 'supplierCode', label: '코드' },
          { key: 'purchaseCount', label: '매입건수' },
          { key: 'totalAmount', label: '매입액' },
          { key: 'outstandingAmount', label: '미지급액' },
        ]
      : groupBy === 'month'
      ? [
          { key: 'month', label: '월' },
          { key: 'purchaseCount', label: '매입건수' },
          { key: 'totalAmount', label: '매입액' },
        ]
      : [
          { key: 'brandName', label: '브랜드' },
          { key: 'productName', label: '상품명' },
          { key: 'totalQuantity', label: '수량' },
          { key: 'totalAmount', label: '금액' },
        ]
    exportToCSV(rows, columns, '매입집계표')
  }

  const tabLabels = [
    { key: 'supplier' as const, label: '매입처별' },
    { key: 'month' as const, label: '월별' },
    { key: 'product' as const, label: '상품별' },
  ]

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* 그룹 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {tabLabels.map(t => (
          <button
            key={t.key}
            onClick={() => setGroupBy(t.key)}
            style={{
              padding: '10px 24px', fontSize: '14px', fontWeight: groupBy === t.key ? 600 : 400,
              color: groupBy === t.key ? '#2563eb' : '#6b7280', background: 'none', border: 'none',
              borderBottom: groupBy === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

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
            {['이번달', '지난달', '최근3개월', '올해'].map(label => (
              <button
                key={label}
                onClick={() => {
                  const range = getQuickDateRange(label)
                  setDateFrom(range.start)
                  setDateTo(range.end)
                }}
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

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 매입액</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{formatAmount(summary.grandTotal)}</div>
        </div>
        {groupBy === 'supplier' && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>총 미지급액</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{formatAmount(summary.totalOutstanding)}</div>
          </div>
        )}
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{groupBy === 'supplier' ? '매입처 수' : groupBy === 'month' ? '개월 수' : '상품 수'}</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{summary.rowCount}</div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            {groupBy === 'supplier' && (
              <tr>
                <th style={thStyle}>매입처</th>
                <th style={thStyle}>코드</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>매입건수</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>매입액</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>미지급액</th>
              </tr>
            )}
            {groupBy === 'month' && (
              <tr>
                <th style={thStyle}>월</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>매입건수</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>매입액</th>
              </tr>
            )}
            {groupBy === 'product' && (
              <tr>
                <th style={thStyle}>브랜드</th>
                <th style={thStyle}>상품명</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : groupBy === 'supplier' ? (
              rows.map((r: any, i: number) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.supplierName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{r.supplierCode}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.purchaseCount}건</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.totalAmount.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: r.outstandingAmount > 0 ? '#dc2626' : '#10b981' }}>
                    {r.outstandingAmount.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : groupBy === 'month' ? (
              rows.map((r: any, i: number) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.month}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.purchaseCount}건</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.totalAmount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              rows.map((r: any, i: number) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={tdStyle}>{r.brandName}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.productName}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.totalQuantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.totalAmount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>합계</td>
                {groupBy === 'supplier' && <td style={tdStyle}></td>}
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {groupBy !== 'product' ? rows.reduce((s: number, r: any) => s + r.purchaseCount, 0) + '건' : rows.reduce((s: number, r: any) => s + r.totalQuantity, 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{summary.grandTotal.toLocaleString()}</td>
                {groupBy === 'supplier' && (
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#dc2626' }}>{summary.totalOutstanding.toLocaleString()}</td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Layout>
  )
}
