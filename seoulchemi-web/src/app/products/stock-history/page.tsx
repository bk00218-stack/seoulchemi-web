'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface Brand { id: number; name: string }
interface StockEntry {
  id: number; date: string; type: string; reason: string
  productName: string; brandName: string; optionName: string
  quantity: number; beforeStock: number; afterStock: number
  unitPrice: number; totalPrice: number; orderNo: string
  memo: string; processedBy: string
}

function formatDate(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
    case '최근3개월': {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return { start: formatDateShort(d.toISOString()), end }
    }
    default: return { start: end, end }
  }
}

const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
  in: { label: '입고', color: '#10b981', bg: '#d1fae5' },
  out: { label: '출고', color: '#dc2626', bg: '#fee2e2' },
  adjust: { label: '조정', color: '#f59e0b', bg: '#fef3c7' },
  return: { label: '반품', color: '#6366f1', bg: '#e0e7ff' },
}

const reasonLabels: Record<string, string> = {
  purchase: '매입', sale: '판매', return: '반품', adjust: '조정', transfer: '이관',
}

export default function StockHistoryPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tab, setTab] = useState<'all' | 'transfer' | 'other'>('all')
  const [dateFrom, setDateFrom] = useState(formatDateShort(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDateShort(now.toISOString()))
  const [brandId, setBrandId] = useState('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [summary, setSummary] = useState<Record<string, { count: number; quantity: number }>>({})
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetch('/api/brands?includeInactive=false&limit=500').then(r => r.json()).then(d => setBrands(d.brands || d || []))
  }, [])

  const handleSearch = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)
      if (brandId) params.set('brandId', brandId)
      params.set('page', String(p))
      params.set('limit', '100')

      if (tab === 'transfer') {
        params.set('type', 'transfer')
      } else if (tab === 'other') {
        params.set('reason', 'adjust')
      }

      const res = await fetch(`/api/reports/stock-history?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEntries(data.entries || [])
      setSummary(data.summary || {})
      setPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch(1) }, [tab])

  const handleExport = () => {
    if (entries.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      entries.map(e => ({
        date: formatDate(e.date),
        type: typeLabels[e.type]?.label || e.type,
        reason: reasonLabels[e.reason] || e.reason,
        brandName: e.brandName,
        productName: e.productName,
        optionName: e.optionName,
        quantity: e.quantity,
        beforeStock: e.beforeStock,
        afterStock: e.afterStock,
        orderNo: e.orderNo,
        memo: e.memo,
      })),
      [
        { key: 'date', label: '일시' },
        { key: 'type', label: '유형' },
        { key: 'reason', label: '사유' },
        { key: 'brandName', label: '브랜드' },
        { key: 'productName', label: '상품명' },
        { key: 'optionName', label: '옵션' },
        { key: 'quantity', label: '수량' },
        { key: 'beforeStock', label: '전재고' },
        { key: 'afterStock', label: '후재고' },
        { key: 'orderNo', label: '관련번호' },
        { key: 'memo', label: '메모' },
      ],
      '입출고내역'
    )
  }

  const tabs = [
    { key: 'all' as const, label: '전체 입출고' },
    { key: 'transfer' as const, label: '이관 내역' },
    { key: 'other' as const, label: '기타 출고' },
  ]

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 24px', fontSize: '14px', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#2563eb' : '#6b7280', background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
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
            {['오늘', '이번주', '이번달', '최근3개월'].map(label => (
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
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>브랜드</label>
          <select value={brandId} onChange={e => setBrandId(e.target.value)} style={{ ...selectStyle, width: '180px' }}>
            <option value="">전체</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button onClick={() => handleSearch(1)} disabled={loading} style={{ ...btnStyle, background: '#2563eb', color: '#fff' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {Object.entries(typeLabels).map(([key, cfg]) => (
          <div key={key} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{cfg.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: cfg.color }}>
              {summary[key]?.count || 0}건
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              수량: {Math.abs(summary[key]?.quantity || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>일시</th>
              <th style={thStyle}>유형</th>
              <th style={thStyle}>사유</th>
              <th style={thStyle}>브랜드</th>
              <th style={thStyle}>상품명</th>
              <th style={thStyle}>옵션</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>전재고</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>후재고</th>
              <th style={thStyle}>관련번호</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : entries.map((e, i) => {
              const cfg = typeLabels[e.type] || { label: e.type, color: '#6b7280', bg: '#f3f4f6' }
              return (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>{formatDate(e.date)}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{reasonLabels[e.reason] || e.reason}</td>
                  <td style={tdStyle}>{e.brandName}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{e.productName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{e.optionName}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: e.quantity > 0 ? '#10b981' : '#dc2626' }}>
                    {e.quantity > 0 ? '+' : ''}{e.quantity}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#9ca3af' }}>{e.beforeStock}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{e.afterStock}</td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px' }}>{e.orderNo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button onClick={() => handleSearch(page - 1)} disabled={page <= 1}
            style={{ ...btnStyle, opacity: page <= 1 ? 0.5 : 1 }}>이전</button>
          <span style={{ padding: '8px 16px', fontSize: '13px', color: '#6b7280' }}>{page} / {totalPages}</span>
          <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages}
            style={{ ...btnStyle, opacity: page >= totalPages ? 0.5 : 1 }}>다음</button>
        </div>
      )}
    </Layout>
  )
}
