'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

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

interface StoreSummary {
  storeId: number; storeName: string; storeCode: string
  orderCount: number; saleAmount: number; returnAmount: number; depositAmount: number
  netSales: number; outstanding: number
}
interface ProductSummary {
  productId: number; productName: string; brandName: string
  totalQuantity: number; totalAmount: number; avgPrice: number
}

export default function SalesSummaryPage() {
  const { toast } = useToast()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [view, setView] = useState<'store' | 'product'>('store')
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [storeRows, setStoreRows] = useState<StoreSummary[]>([])
  const [productRows, setProductRows] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [grandTotal, setGrandTotal] = useState({ sale: 0, return: 0, deposit: 0, net: 0, outstanding: 0 })

  const handleSearch = async () => {
    setLoading(true)
    try {
      if (view === 'store') {
        // 가맹점별 집계 - 기존 stats/sales API 활용
        const params = new URLSearchParams()
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        const res = await fetch(`/api/stats/sales?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        const rows: StoreSummary[] = (data.stores || []).map((s: any) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          storeCode: s.storeCode || '',
          orderCount: s.orderCount || 0,
          saleAmount: s.saleAmount || 0,
          returnAmount: s.returnAmount || 0,
          depositAmount: s.depositAmount || 0,
          netSales: s.netSales || (s.saleAmount || 0) - (s.returnAmount || 0),
          outstanding: s.totalOutstanding || 0,
        }))
        setStoreRows(rows)
        setGrandTotal({
          sale: rows.reduce((s, r) => s + r.saleAmount, 0),
          return: rows.reduce((s, r) => s + r.returnAmount, 0),
          deposit: rows.reduce((s, r) => s + r.depositAmount, 0),
          net: rows.reduce((s, r) => s + r.netSales, 0),
          outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
        })
      } else {
        // 상품별 집계
        const params = new URLSearchParams()
        if (dateFrom) params.set('startDate', dateFrom)
        if (dateTo) params.set('endDate', dateTo)

        const res = await fetch(`/api/stats/products?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        const rows: ProductSummary[] = (data.products || []).map((p: any) => ({
          productId: p.productId || p.id,
          productName: p.productName || p.name || '',
          brandName: p.brandName || '',
          totalQuantity: p.totalQuantity || p.quantity || 0,
          totalAmount: p.totalAmount || p.amount || 0,
          avgPrice: p.totalQuantity > 0 ? Math.round((p.totalAmount || 0) / p.totalQuantity) : 0,
        }))
        setProductRows(rows)
        setGrandTotal({
          sale: rows.reduce((s, r) => s + r.totalAmount, 0),
          return: 0, deposit: 0,
          net: rows.reduce((s, r) => s + r.totalAmount, 0),
          outstanding: 0,
        })
      }
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [view])

  const handleExport = () => {
    if (view === 'store') {
      if (storeRows.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
      exportToCSV(storeRows as any[], [
        { key: 'storeName', label: '가맹점' },
        { key: 'storeCode', label: '코드' },
        { key: 'orderCount', label: '주문수' },
        { key: 'saleAmount', label: '매출액' },
        { key: 'returnAmount', label: '반품액' },
        { key: 'netSales', label: '순매출' },
        { key: 'depositAmount', label: '입금액' },
        { key: 'outstanding', label: '미수금' },
      ], '매출집계표_가맹점별')
    } else {
      if (productRows.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
      exportToCSV(productRows as any[], [
        { key: 'brandName', label: '브랜드' },
        { key: 'productName', label: '상품명' },
        { key: 'totalQuantity', label: '수량' },
        { key: 'totalAmount', label: '매출액' },
        { key: 'avgPrice', label: '평균단가' },
      ], '매출집계표_상품별')
    }
  }

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* 뷰 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'store' as const, label: '가맹점별 집계' },
          { key: 'product' as const, label: '상품별 집계' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            style={{
              padding: '10px 24px', fontSize: '14px', fontWeight: view === t.key ? 600 : 400,
              color: view === t.key ? '#2563eb' : '#6b7280', background: 'none', border: 'none',
              borderBottom: view === t.key ? '2px solid #2563eb' : '2px solid transparent',
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
            {['이번달', '지난달', '최근3개월', '올해'].map(label => (
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
          <div style={{ fontSize: '12px', color: '#6b7280' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{formatAmount(grandTotal.sale)}</div>
        </div>
        {view === 'store' && (
          <>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>반품</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{formatAmount(grandTotal.return)}</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>순매출</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{formatAmount(grandTotal.net)}</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>입금</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{formatAmount(grandTotal.deposit)}</div>
            </div>
          </>
        )}
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          {view === 'store' ? (
            <>
              <thead>
                <tr>
                  <th style={thStyle}>가맹점</th>
                  <th style={thStyle}>코드</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>주문수</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>매출액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>반품액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>순매출</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>입금액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>미수금</th>
                </tr>
              </thead>
              <tbody>
                {storeRows.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                    {loading ? '조회 중...' : '데이터가 없습니다.'}
                  </td></tr>
                ) : storeRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.storeName}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{r.storeCode}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{r.orderCount}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.saleAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#f59e0b' }}>{r.returnAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.netSales.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#2563eb' }}>{r.depositAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: r.outstanding > 0 ? '#dc2626' : '#10b981', fontWeight: 600 }}>
                      {r.outstanding.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th style={thStyle}>브랜드</th>
                  <th style={thStyle}>상품명</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>매출액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>평균단가</th>
                </tr>
              </thead>
              <tbody>
                {productRows.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                    {loading ? '조회 중...' : '데이터가 없습니다.'}
                  </td></tr>
                ) : productRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={tdStyle}>{r.brandName}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.productName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{r.totalQuantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.totalAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#6b7280' }}>{r.avgPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </Layout>
  )
}
