'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface LedgerEntry {
  date: string
  type: 'purchase' | 'payment'
  refNo: string
  supplierName: string
  supplierId: number
  description: string
  amount: number
  memo: string
}

interface Supplier {
  id: number
  name: string
  code: string
}

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
    case '어제': {
      const d = new Date(today); d.setDate(d.getDate() - 1)
      return { start: formatDate(d.toISOString()), end: formatDate(d.toISOString()) }
    }
    case '오늘': return { start: end, end }
    case '이번주': {
      const d = new Date(today); d.setDate(d.getDate() - d.getDay())
      return { start: formatDate(d.toISOString()), end }
    }
    case '이번달': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatDate(d.toISOString()), end }
    }
    case '지난달': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: formatDate(d.toISOString()), end: formatDate(e.toISOString()) }
    }
    default: return { start: end, end }
  }
}

export default function PurchaseLedgerPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tab, setTab] = useState<'all' | 'purchase' | 'payment'>('all')
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState({ totalPurchase: 0, totalPayment: 0, balance: 0, count: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/purchase/suppliers?limit=500')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)
      if (supplierId) params.set('supplierId', supplierId)
      params.set('type', tab)

      const res = await fetch(`/api/reports/purchase-ledger?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEntries(data.entries || [])
      setSummary(data.summary || { totalPurchase: 0, totalPayment: 0, balance: 0, count: 0 })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [tab])

  const handleExport = () => {
    if (entries.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      entries.map(e => ({
        date: formatDate(e.date),
        type: e.type === 'purchase' ? '매입' : '지급',
        refNo: e.refNo,
        supplierName: e.supplierName,
        description: e.description,
        amount: e.amount,
        memo: e.memo,
      })),
      [
        { key: 'date', label: '일자' },
        { key: 'type', label: '구분' },
        { key: 'refNo', label: '번호' },
        { key: 'supplierName', label: '매입처' },
        { key: 'description', label: '내용' },
        { key: 'amount', label: '금액' },
        { key: 'memo', label: '메모' },
      ],
      '매입지급원장'
    )
  }

  const tabs = [
    { key: 'all' as const, label: '전체' },
    { key: 'purchase' as const, label: '매입 원장' },
    { key: 'payment' as const, label: '지급금 원장' },
  ]

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#2563eb' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.2s',
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
            {['오늘', '이번주', '이번달', '지난달'].map(label => (
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
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>매입처</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={{ ...selectStyle, width: '180px' }}>
            <option value="">전체</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{formatAmount(summary.totalPurchase)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 지급액</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{formatAmount(summary.totalPayment)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>미지급 잔액</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: summary.balance > 0 ? '#dc2626' : '#10b981' }}>
            {formatAmount(summary.balance)}
          </div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 건수</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{summary.count}건</div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>일자</th>
              <th style={thStyle}>구분</th>
              <th style={thStyle}>번호</th>
              <th style={thStyle}>매입처</th>
              <th style={thStyle}>내용</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              <th style={thStyle}>메모</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              entries.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={tdStyle}>{formatDate(e.date)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: e.type === 'purchase' ? '#fee2e2' : '#dbeafe',
                      color: e.type === 'purchase' ? '#dc2626' : '#2563eb',
                    }}>
                      {e.type === 'purchase' ? '매입' : '지급'}
                    </span>
                  </td>
                  <td style={tdStyle}>{e.refNo}</td>
                  <td style={tdStyle}>{e.supplierName}</td>
                  <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.description}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: e.type === 'purchase' ? '#dc2626' : '#2563eb' }}>
                    {e.type === 'purchase' ? '+' : '-'}{e.amount.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{e.memo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
