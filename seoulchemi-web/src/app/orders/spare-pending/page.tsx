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
  orderedAt: string; memo: string; elapsedDays: number
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

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: '확인', color: '#2563eb', bg: '#dbeafe' },
}

export default function SparePendingPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

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
      params.set('orderType', 'stock')
      params.set('status', 'pending') // 미처리만
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

  useEffect(() => { handleSearch(1) }, [])

  const handleExport = () => {
    if (entries.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      entries.map(e => ({
        orderNo: e.orderNo,
        storeName: e.storeName,
        productName: e.productName,
        brandName: e.brandName,
        quantity: e.quantity,
        totalAmount: e.totalAmount,
        orderedAt: formatDate(e.orderedAt),
        elapsedDays: e.elapsedDays,
        status: statusLabels[e.status]?.label || e.status,
        memo: e.memo,
      })),
      [
        { key: 'orderNo', label: '주문번호' },
        { key: 'storeName', label: '가맹점' },
        { key: 'productName', label: '상품' },
        { key: 'brandName', label: '브랜드' },
        { key: 'quantity', label: '수량' },
        { key: 'totalAmount', label: '금액' },
        { key: 'orderedAt', label: '주문일' },
        { key: 'elapsedDays', label: '경과일' },
        { key: 'status', label: '상태' },
        { key: 'memo', label: '메모' },
      ],
      '여벌미처리현황'
    )
  }

  // 경과일별 분포 계산
  const distribution = {
    today: entries.filter(e => e.elapsedDays === 0).length,
    within3: entries.filter(e => e.elapsedDays >= 1 && e.elapsedDays <= 3).length,
    over3: entries.filter(e => e.elapsedDays > 3 && e.elapsedDays <= 7).length,
    over7: entries.filter(e => e.elapsedDays > 7).length,
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
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
        <button onClick={() => handleSearch(1)} disabled={loading} style={{ ...btnStyle, background: '#2563eb', color: '#fff' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 미처리</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{entries.length}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>당일</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{distribution.today}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>1~3일</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{distribution.within3}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>4~7일</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ea580c' }}>{distribution.over3}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>7일 초과</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{distribution.over7}건</div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>주문번호</th>
              <th style={thStyle}>가맹점</th>
              <th style={thStyle}>브랜드</th>
              <th style={thStyle}>상품명</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              <th style={thStyle}>주문일</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>경과일</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>메모</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '미처리 주문이 없습니다.'}
                </td>
              </tr>
            ) : entries.map((e, i) => {
              const sCfg = statusLabels[e.status] || statusLabels.pending
              const urgentColor = e.elapsedDays > 7 ? '#dc2626' : e.elapsedDays > 3 ? '#ea580c' : e.elapsedDays > 1 ? '#f59e0b' : '#10b981'
              return (
                <tr key={e.id} style={{ background: e.elapsedDays > 7 ? '#fef2f2' : i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{e.orderNo}</td>
                  <td style={tdStyle}>{e.storeName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{e.brandName}</td>
                  <td style={{ ...tdStyle, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.productName}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{e.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{e.totalAmount.toLocaleString()}</td>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>{formatDate(e.orderedAt)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: urgentColor }}>
                    {e.elapsedDays}일
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: sCfg.bg, color: sCfg.color }}>
                      {sCfg.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.memo}
                  </td>
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
