'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

interface Transaction {
  id: number
  productId: number
  productOptionId: number | null
  type: string
  reason: string
  quantity: number
  beforeStock: number
  afterStock: number
  orderId: number | null
  orderNo: string | null
  purchaseId: number | null
  unitPrice: number
  totalPrice: number
  memo: string | null
  processedBy: string | null
  createdAt: string
  productName: string
  brandName: string
  optionName: string
}

interface Stats {
  in: number
  out: number
  adjust: number
  return: number
}

function formatDateTime(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDate(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const typeLabels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  in: { label: '입고', color: '#10b981', bg: '#d1fae5', icon: '📥' },
  out: { label: '출고', color: '#ef4444', bg: '#fee2e2', icon: '📤' },
  adjust: { label: '조정', color: '#f59e0b', bg: '#fef3c7', icon: '🔧' },
  return: { label: '반품', color: '#8b5cf6', bg: '#ede9fe', icon: '↩️' },
}

const reasonLabels: Record<string, string> = {
  purchase: '매입',
  sale: '판매',
  return: '반품',
  adjust: '수동조정',
  transfer: '이동',
}

export default function InventoryLedgerPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ in: 0, out: 0, adjust: 0, return: 0 })

  // Filters
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        startDate: dateFrom,
        endDate: dateTo,
      })
      if (filterType) params.set('type', filterType)

      const res = await fetch(`/api/inventory/transactions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()

      let txns = data.transactions || []
      // Client-side search filter
      if (search) {
        const q = search.toLowerCase()
        txns = txns.filter((t: Transaction) =>
          t.productName.toLowerCase().includes(q) ||
          t.brandName.toLowerCase().includes(q) ||
          (t.orderNo && t.orderNo.toLowerCase().includes(q)) ||
          (t.memo && t.memo.toLowerCase().includes(q))
        )
      }

      setTransactions(txns)
      setStats(data.stats || { in: 0, out: 0, adjust: 0, return: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch {
      toast.error('수불대장 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleQuickDate = (label: string) => {
    const today = new Date()
    const todayStr = formatDate(today.toISOString())
    switch (label) {
      case '오늘':
        setDateFrom(todayStr)
        setDateTo(todayStr)
        break
      case '이번주': {
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        setDateFrom(formatDate(weekStart.toISOString()))
        setDateTo(todayStr)
        break
      }
      case '이번달': {
        const mStart = new Date(today.getFullYear(), today.getMonth(), 1)
        setDateFrom(formatDate(mStart.toISOString()))
        setDateTo(todayStr)
        break
      }
      case '3개월': {
        const threeMonths = new Date(today)
        threeMonths.setMonth(threeMonths.getMonth() - 3)
        setDateFrom(formatDate(threeMonths.toISOString()))
        setDateTo(todayStr)
        break
      }
    }
  }

  // Print handler
  const handlePrint = () => {
    window.print()
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>수불대장</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>품목별 입출고 이력을 조회합니다</p>
        </div>
        <button
          onClick={handlePrint}
          style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-700)', border: 'none' }}
        >
          🖨️ 인쇄
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>📥 입고</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{stats.in}</div>
        </div>
        <div style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>📤 출고</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{stats.out}</div>
        </div>
        <div style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>🔧 조정</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{stats.adjust}건</div>
        </div>
        <div style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>↩️ 반품</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#8b5cf6' }}>{stats.return}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={selectStyle}
        >
          <option value="">유형 전체</option>
          <option value="in">입고</option>
          <option value="out">출고</option>
          <option value="adjust">조정</option>
          <option value="return">반품</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['오늘', '이번주', '이번달', '3개월'].map(label => (
            <button
              key={label}
              onClick={() => handleQuickDate(label)}
              style={{
                padding: '6px 12px', borderRadius: 20,
                border: '1px solid var(--gray-200)', background: '#fff',
                fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="상품명/브랜드/주문번호 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{ ...inputStyle, width: 200 }}
        />
        <button onClick={handleSearch} style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>
          검색
        </button>
      </div>

      {/* Ledger Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 50 }}>#</th>
                <th style={{ ...thStyle, width: 140 }}>일시</th>
                <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>유형</th>
                <th style={{ ...thStyle, width: 70 }}>사유</th>
                <th style={thStyle}>브랜드</th>
                <th style={thStyle}>상품명</th>
                <th style={thStyle}>옵션</th>
                <th style={{ ...thStyle, width: 70, textAlign: 'right' }}>수량</th>
                <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>이전재고</th>
                <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>이후재고</th>
                <th style={{ ...thStyle, width: 100 }}>주문/매입</th>
                <th style={thStyle}>비고</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                    입출고 내역이 없습니다
                  </td>
                </tr>
              ) : (
                transactions.map((t, idx) => {
                  const tt = typeLabels[t.type] || typeLabels.adjust
                  const isIncrease = t.afterStock > t.beforeStock
                  const qtyColor = t.type === 'in' || t.type === 'return' ? '#10b981' : t.type === 'out' ? '#ef4444' : '#f59e0b'

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                      <td style={{ ...tdStyle, color: 'var(--gray-400)', fontSize: 12 }}>{(page - 1) * 50 + idx + 1}</td>
                      <td style={{ ...tdStyle, fontSize: 13 }}>{formatDateTime(t.createdAt)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 8,
                          fontSize: 11, fontWeight: 600, color: tt.color, background: tt.bg,
                        }}>
                          {tt.icon} {tt.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>
                        {reasonLabels[t.reason] || t.reason}
                      </td>
                      <td style={tdStyle}>
                        {t.brandName && (
                          <span style={{
                            background: '#f0f0ff', color: '#667eea', padding: '1px 5px',
                            borderRadius: 3, fontSize: 11, fontWeight: 600,
                          }}>
                            {t.brandName}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{t.productName}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>{t.optionName || '-'}</td>
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontWeight: 700, color: qtyColor,
                      }}>
                        {t.quantity > 0 ? '+' : ''}{t.quantity}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--gray-500)', fontSize: 13 }}>
                        {t.beforeStock}
                      </td>
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontWeight: 600,
                        color: t.afterStock === 0 ? '#ef4444' : t.afterStock <= 5 ? '#f59e0b' : 'var(--gray-900)',
                      }}>
                        {t.afterStock}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>
                        {t.orderNo ? (
                          <span style={{ color: '#667eea', fontWeight: 500 }}>{t.orderNo}</span>
                        ) : t.purchaseId ? (
                          <span style={{ color: '#8b5cf6', fontWeight: 500 }}>매입#{t.purchaseId}</span>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>-</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.memo || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 8, padding: '16px', borderTop: '1px solid var(--gray-100)',
          }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ ...btnStyle, padding: '6px 12px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1 }}
            >
              이전
            </button>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              {page} / {totalPages} (총 {total}건)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ ...btnStyle, padding: '6px 12px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
