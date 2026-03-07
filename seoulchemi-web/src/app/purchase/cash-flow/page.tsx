'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface CashEntry {
  date: string
  type: 'in' | 'out'
  counterpart: string
  description: string
  amount: number
  paymentMethod: string
  memo: string
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

export default function CashFlowPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all')
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState<CashEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const allEntries: CashEntry[] = []

      // 입금: Transaction (deposit) → 가맹점 수금
      if (typeFilter !== 'out') {
        const params = new URLSearchParams()
        if (dateFrom) params.set('startDate', dateFrom)
        if (dateTo) params.set('endDate', dateTo)
        params.set('type', 'deposit')
        params.set('limit', '500')
        if (search) params.set('search', search)

        const res = await fetch(`/api/receivables/transactions?${params}`)
        const data = await res.json()
        if (res.ok) {
          for (const t of (data.transactions || [])) {
            allEntries.push({
              date: t.processedAt,
              type: 'in',
              counterpart: t.storeName || t.store?.name || '',
              description: `입금 ${t.depositor ? `(${t.depositor})` : ''}`,
              amount: t.amount || 0,
              paymentMethod: t.paymentMethod || '',
              memo: t.memo || '',
            })
          }
        }
      }

      // 출금: WorkLog (supplier_payment) → 매입처 지급
      if (typeFilter !== 'in') {
        const params = new URLSearchParams()
        params.set('type', 'payment')
        if (dateFrom) params.set('startDate', dateFrom)
        if (dateTo) params.set('endDate', dateTo)

        const res = await fetch(`/api/reports/purchase-ledger?${params}`)
        const data = await res.json()
        if (res.ok) {
          for (const e of (data.entries || [])) {
            if (e.type === 'payment') {
              allEntries.push({
                date: e.date,
                type: 'out',
                counterpart: e.supplierName,
                description: e.description,
                amount: e.amount,
                paymentMethod: '',
                memo: e.memo,
              })
            }
          }
        }
      }

      // 날짜순 정렬
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // 검색 필터
      const filtered = search
        ? allEntries.filter(e =>
            e.counterpart.includes(search) || e.description.includes(search) || e.memo.includes(search)
          )
        : allEntries

      setEntries(filtered)
      setTotalIn(filtered.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0))
      setTotalOut(filtered.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0))
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [typeFilter])

  const handleExport = () => {
    if (entries.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      entries.map(e => ({
        date: formatDate(e.date),
        type: e.type === 'in' ? '입금' : '출금',
        counterpart: e.counterpart,
        description: e.description,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        memo: e.memo,
      })),
      [
        { key: 'date', label: '일자' },
        { key: 'type', label: '구분' },
        { key: 'counterpart', label: '거래처' },
        { key: 'description', label: '내용' },
        { key: 'amount', label: '금액' },
        { key: 'paymentMethod', label: '결제방법' },
        { key: 'memo', label: '메모' },
      ],
      '입출금조회'
    )
  }

  const tabs = [
    { key: 'all' as const, label: '전체' },
    { key: 'in' as const, label: '입금' },
    { key: 'out' as const, label: '출금' },
  ]

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            style={{
              padding: '10px 24px', fontSize: '14px', fontWeight: typeFilter === t.key ? 600 : 400,
              color: typeFilter === t.key ? '#2563eb' : '#6b7280', background: 'none', border: 'none',
              borderBottom: typeFilter === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer',
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
                onClick={() => { const r = getQuickDateRange(label); setDateFrom(r.start); setDateTo(r.end) }}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>검색</label>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="거래처, 내용..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...inputStyle, width: '180px' }}
          />
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
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 입금</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{formatAmount(totalIn)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 출금</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{formatAmount(totalOut)}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>순잔액 (입금-출금)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: totalIn - totalOut >= 0 ? '#10b981' : '#dc2626' }}>
            {formatAmount(totalIn - totalOut)}
          </div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 건수</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{entries.length}건</div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>일자</th>
              <th style={thStyle}>구분</th>
              <th style={thStyle}>거래처</th>
              <th style={thStyle}>내용</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              <th style={thStyle}>결제방법</th>
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
            ) : entries.map((e, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={tdStyle}>{formatDate(e.date)}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: e.type === 'in' ? '#dbeafe' : '#fee2e2',
                    color: e.type === 'in' ? '#2563eb' : '#dc2626',
                  }}>
                    {e.type === 'in' ? '입금' : '출금'}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.counterpart}</td>
                <td style={{ ...tdStyle, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.description}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: e.type === 'in' ? '#2563eb' : '#dc2626' }}>
                  {e.type === 'in' ? '+' : '-'}{e.amount.toLocaleString()}
                </td>
                <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{e.paymentMethod}</td>
                <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{e.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
