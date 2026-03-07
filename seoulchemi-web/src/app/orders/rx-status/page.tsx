'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface OrderEntry {
  id: number; orderNo: string; storeName: string; storeCode: string
  status: string; totalAmount: number; itemCount: number
  productName: string; brandName: string; quantity: number
  sphR: string; cylR: string; sphL: string; cylL: string
  tintColor: string; tintDensity: number; processType: string; customerName: string
  orderedAt: string; confirmedAt: string; shippedAt: string; deliveredAt: string
  memo: string; elapsedDays: number
}

function formatDate(s: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '접수', color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: '처리중', color: '#2563eb', bg: '#dbeafe' },
  shipped: { label: '출고', color: '#9333ea', bg: '#f3e8ff' },
  delivered: { label: '완료', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: '취소', color: '#ef4444', bg: '#fee2e2' },
}

export default function RxStatusPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tab, setTab] = useState<'pending' | 'confirmed' | 'unprocessed' | 'delivered'>('pending')
  const [dateFrom, setDateFrom] = useState(formatDateShort(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDateShort(now.toISOString()))
  const [entries, setEntries] = useState<OrderEntry[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handleSearch = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('orderType', 'rx')
      params.set('status', tab)
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)
      params.set('page', String(p))
      params.set('limit', '50')

      const res = await fetch(`/api/reports/order-status?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEntries(data.entries || [])
      setStatusCounts(data.statusCounts || {})
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
        orderNo: e.orderNo,
        storeName: e.storeName,
        productName: e.productName,
        brandName: e.brandName,
        customerName: e.customerName,
        sphR: e.sphR, cylR: e.cylR,
        sphL: e.sphL, cylL: e.cylL,
        tintColor: e.tintColor,
        processType: e.processType,
        status: statusLabels[e.status]?.label || e.status,
        orderedAt: formatDate(e.orderedAt),
        elapsedDays: e.elapsedDays,
        totalAmount: e.totalAmount,
      })),
      [
        { key: 'orderNo', label: '주문번호' },
        { key: 'storeName', label: '가맹점' },
        { key: 'customerName', label: '고객명' },
        { key: 'productName', label: '상품' },
        { key: 'brandName', label: '브랜드' },
        { key: 'sphR', label: 'R-SPH' }, { key: 'cylR', label: 'R-CYL' },
        { key: 'sphL', label: 'L-SPH' }, { key: 'cylL', label: 'L-CYL' },
        { key: 'tintColor', label: '착색' },
        { key: 'processType', label: '가공' },
        { key: 'status', label: '상태' },
        { key: 'orderedAt', label: '접수일' },
        { key: 'elapsedDays', label: '경과일' },
        { key: 'totalAmount', label: '금액' },
      ],
      '착색RX현황'
    )
  }

  const tabs = [
    { key: 'pending' as const, label: '접수', emoji: '📥' },
    { key: 'confirmed' as const, label: '처리중', emoji: '⚙️' },
    { key: 'unprocessed' as const, label: '미처리', emoji: '⚠️' },
    { key: 'delivered' as const, label: '마감', emoji: '✅' },
  ]

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
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
            {t.emoji} {t.label}
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
        <button onClick={() => handleSearch(1)} disabled={loading} style={{ ...btnStyle, background: '#2563eb', color: '#fff' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 상태별 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {Object.entries(statusLabels).filter(([k]) => k !== 'cancelled').map(([key, cfg]) => (
          <div key={key} style={{ ...cardStyle, textAlign: 'center', border: tab === key || (tab === 'unprocessed' && key === 'pending') ? `2px solid ${cfg.color}` : undefined }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{cfg.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: cfg.color }}>
              {statusCounts[key] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={thStyle}>주문번호</th>
              <th style={thStyle}>가맹점</th>
              <th style={thStyle}>고객</th>
              <th style={thStyle}>상품</th>
              <th style={thStyle}>R-SPH/CYL</th>
              <th style={thStyle}>L-SPH/CYL</th>
              <th style={thStyle}>착색</th>
              <th style={thStyle}>가공</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>접수일</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>경과</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : entries.map((e, i) => {
              const sCfg = statusLabels[e.status] || statusLabels.pending
              return (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{e.orderNo}</td>
                  <td style={tdStyle}>{e.storeName}</td>
                  <td style={tdStyle}>{e.customerName}</td>
                  <td style={{ ...tdStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.brandName} {e.productName}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px' }}>
                    {e.sphR && `${e.sphR}/${e.cylR || '-'}`}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px' }}>
                    {e.sphL && `${e.sphL}/${e.cylL || '-'}`}
                  </td>
                  <td style={tdStyle}>
                    {e.tintColor ? (
                      <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', background: '#fef3c7', color: '#92400e' }}>
                        {e.tintColor} {e.tintDensity ? `${e.tintDensity}%` : ''}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11px' }}>{e.processType || '-'}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: sCfg.bg, color: sCfg.color }}>
                      {sCfg.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11px' }}>{formatDate(e.orderedAt)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: e.elapsedDays > 3 ? '#dc2626' : '#6b7280', fontWeight: e.elapsedDays > 3 ? 600 : 400 }}>
                    {e.elapsedDays}일
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{e.totalAmount.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button onClick={() => handleSearch(page - 1)} disabled={page <= 1} style={{ ...btnStyle, opacity: page <= 1 ? 0.5 : 1 }}>이전</button>
          <span style={{ padding: '8px 16px', fontSize: '13px', color: '#6b7280' }}>{page} / {totalPages}</span>
          <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages} style={{ ...btnStyle, opacity: page >= totalPages ? 0.5 : 1 }}>다음</button>
        </div>
      )}
    </Layout>
  )
}
