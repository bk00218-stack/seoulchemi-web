'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface LedgerEntry {
  date: string
  type: 'sale' | 'return' | 'deposit' | 'discount'
  refNo: string
  storeName: string
  storeCode: string
  description: string
  saleAmount: number
  returnAmount: number
  depositAmount: number
}

interface Store { id: number; name: string; code: string }

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

export default function SalesLedgerPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [storeId, setStoreId] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState({ totalSale: 0, totalReturn: 0, totalDeposit: 0, netSales: 0, outstanding: 0, count: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/stores?limit=1000')
      .then(r => r.json())
      .then(d => setStores(d.stores || []))
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)
      if (storeId) params.set('storeId', storeId)

      const res = await fetch(`/api/reports/sales-ledger?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEntries(data.entries || [])
      setSummary(data.summary || { totalSale: 0, totalReturn: 0, totalDeposit: 0, netSales: 0, outstanding: 0, count: 0 })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [])

  const handleExport = () => {
    if (entries.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      entries.map(e => ({
        date: formatDate(e.date),
        type: e.type === 'sale' ? '매출' : e.type === 'return' ? '반품' : '입금',
        refNo: e.refNo,
        storeName: e.storeName,
        description: e.description,
        saleAmount: e.saleAmount,
        returnAmount: e.returnAmount,
        depositAmount: e.depositAmount,
      })),
      [
        { key: 'date', label: '일자' },
        { key: 'type', label: '구분' },
        { key: 'refNo', label: '번호' },
        { key: 'storeName', label: '가맹점' },
        { key: 'description', label: '내용' },
        { key: 'saleAmount', label: '매출액' },
        { key: 'returnAmount', label: '반품액' },
        { key: 'depositAmount', label: '입금액' },
      ],
      '매출원장'
    )
  }

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    sale: { label: '매출', color: '#dc2626', bg: '#fee2e2' },
    return: { label: '반품', color: '#f59e0b', bg: '#fef3c7' },
    deposit: { label: '입금', color: '#2563eb', bg: '#dbeafe' },
    discount: { label: '할인', color: '#6b7280', bg: '#f3f4f6' },
  }

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
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
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>가맹점</label>
          <select value={storeId} onChange={e => setStoreId(e.target.value)} style={{ ...selectStyle, width: '200px' }}>
            <option value="">전체</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{formatAmount(summary.totalSale)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>반품</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{formatAmount(summary.totalReturn)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>순매출</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{formatAmount(summary.netSales)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>입금</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{formatAmount(summary.totalDeposit)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>미수잔액</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: summary.outstanding > 0 ? '#dc2626' : '#10b981' }}>
            {formatAmount(summary.outstanding)}
          </div>
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
              <th style={thStyle}>가맹점</th>
              <th style={thStyle}>내용</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>매출액</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>반품액</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>입금액</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : entries.map((e, i) => {
              const cfg = typeConfig[e.type] || typeConfig.sale
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={tdStyle}>{formatDate(e.date)}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={tdStyle}>{e.refNo}</td>
                  <td style={tdStyle}>{e.storeName}</td>
                  <td style={{ ...tdStyle, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.description}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: e.saleAmount > 0 ? 600 : 400, color: e.saleAmount > 0 ? '#dc2626' : '#ccc' }}>
                    {e.saleAmount > 0 ? e.saleAmount.toLocaleString() : '-'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: e.returnAmount > 0 ? 600 : 400, color: e.returnAmount > 0 ? '#f59e0b' : '#ccc' }}>
                    {e.returnAmount > 0 ? e.returnAmount.toLocaleString() : '-'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: e.depositAmount > 0 ? 600 : 400, color: e.depositAmount > 0 ? '#2563eb' : '#ccc' }}>
                    {e.depositAmount > 0 ? e.depositAmount.toLocaleString() : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                <td colSpan={5} style={{ ...tdStyle, fontWeight: 700 }}>합계 ({summary.count}건)</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{summary.totalSale.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{summary.totalReturn.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{summary.totalDeposit.toLocaleString()}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Layout>
  )
}
