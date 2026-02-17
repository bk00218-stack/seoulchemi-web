'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'
import { PURCHASE_SIDEBAR } from '../constants/sidebar'

interface Purchase {
  id: number
  purchaseNo: string
  supplierId: number
  supplier: { id: number; name: string; code: string }
  status: string
  totalAmount: number
  memo: string | null
  purchasedAt: string
  receivedAt: string | null
  _count: { items: number }
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

function getQuickDateRange(label: string): { start: string; end: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = formatDate(today.toISOString())

  switch (label) {
    case '어제': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: formatDate(yesterday.toISOString()), end: formatDate(yesterday.toISOString()) }
    }
    case '오늘':
      return { start: end, end }
    case '이번주': {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      return { start: formatDate(weekStart.toISOString()), end }
    }
    case '이번달': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatDate(monthStart.toISOString()), end }
    }
    default:
      return { start: end, end }
  }
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: '#f59e0b', bg: '#fef3c7' },
  completed: { label: '완료', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: '취소', color: '#ef4444', bg: '#fee2e2' },
}

export default function PurchasePage() {
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Filters
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [dateFrom, setDateFrom] = useState(formatDate(monthStart.toISOString()))
  const [dateTo, setDateTo] = useState(formatDate(now.toISOString()))
  const [filterSupplierId, setFilterSupplierId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  // Stats
  const [stats, setStats] = useState({ totalPurchases: 0, totalAmount: 0 })

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail modal
  const [detailPurchase, setDetailPurchase] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Load suppliers for filter
  useEffect(() => {
    fetch('/api/purchase/suppliers?status=active&limit=200')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => {})
  }, [])

  // Fetch purchases
  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        startDate: dateFrom,
        endDate: dateTo,
      })
      if (filterSupplierId) params.set('supplierId', filterSupplierId)
      if (filterStatus) params.set('status', filterStatus)
      if (search) params.set('search', search)

      const res = await fetch(`/api/purchase?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()

      setPurchases(data.purchases || [])
      setStats(data.stats || { totalPurchases: 0, totalAmount: 0 })
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {
      toast.error('매입 내역을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchPurchases()
  }

  const handleQuickDate = (label: string) => {
    const { start, end } = getQuickDateRange(label)
    setDateFrom(start)
    setDateTo(end)
  }

  // View detail
  const handleViewDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/purchase/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDetailPurchase(data)
    } catch {
      toast.error('상세 정보를 불러오는데 실패했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  // Update status
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/purchase/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '상태 변경에 실패했습니다.')
      }
      toast.success(newStatus === 'completed' ? '입고 완료 처리되었습니다.' : '취소 처리되었습니다.')
      fetchPurchases()
      setDetailPurchase(null)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const pendingCount = purchases.filter(p => p.status === 'pending').length
  const completedAmount = purchases.filter(p => p.status === 'completed').reduce((s, p) => s + p.totalAmount, 0)

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>매입내역 조회</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입 내역을 조회하고 관리합니다</p>
        </div>
        <Link
          href="/purchase/new"
          style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none', textDecoration: 'none' }}
        >
          + 매입등록
        </Link>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={filterSupplierId}
          onChange={e => setFilterSupplierId(e.target.value)}
          style={selectStyle}
        >
          <option value="">매입처 전체</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="">상태 전체</option>
          <option value="pending">대기</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['어제', '오늘', '이번주', '이번달'].map(label => (
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
          placeholder="매입번호/매입처 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{ ...inputStyle, width: 180 }}
        />
        <button
          onClick={handleSearch}
          style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}
        >
          검색
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '총 매입건수', value: `${stats.totalPurchases}건`, color: 'var(--gray-700)' },
          { label: '총 매입금액', value: `${stats.totalAmount.toLocaleString()}원`, color: 'var(--primary)' },
          { label: '대기 중', value: `${pendingCount}건`, color: '#f59e0b' },
          { label: '입고완료 금액', value: `${completedAmount.toLocaleString()}원`, color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>매입번호</th>
                <th style={thStyle}>매입일자</th>
                <th style={thStyle}>매입처</th>
                <th style={thStyle}>품목수</th>
                <th style={thStyle}>매입금액</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>비고</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
                    매입 내역이 없습니다
                  </td>
                </tr>
              ) : (
                purchases.map((p, idx) => {
                  const st = statusLabels[p.status] || statusLabels.pending
                  return (
                    <tr key={p.id}>
                      <td style={tdStyle}>{(page - 1) * 50 + idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#667eea', cursor: 'pointer' }}
                        onClick={() => handleViewDetail(p.id)}
                      >
                        {p.purchaseNo}
                      </td>
                      <td style={tdStyle}>{formatDate(p.purchasedAt)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500 }}>{p.supplier.name}</span>
                        <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 4 }}>({p.supplier.code})</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{p._count.items}개</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                        {p.totalAmount.toLocaleString()}원
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 600,
                          color: st.color, background: st.bg,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--gray-500)', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.memo || '-'}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleViewDetail(p.id)}
                            style={{
                              padding: '4px 10px', fontSize: 12, borderRadius: 6,
                              background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
                              color: 'var(--gray-600)',
                            }}
                          >
                            상세
                          </button>
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'completed')}
                              style={{
                                padding: '4px 10px', fontSize: 12, borderRadius: 6,
                                background: '#d1fae5', border: 'none', cursor: 'pointer',
                                color: '#10b981', fontWeight: 600,
                              }}
                            >
                              입고확인
                            </button>
                          )}
                        </div>
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
              style={{
                ...btnStyle, padding: '6px 12px', fontSize: 13,
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              이전
            </button>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              {page} / {totalPages} (총 {total}건)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                ...btnStyle, padding: '6px 12px', fontSize: 13,
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detailPurchase || detailLoading) && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={() => { if (!detailLoading) setDetailPurchase(null) }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, width: '90%', maxWidth: 700,
              maxHeight: '80vh', overflow: 'auto', padding: 28,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : detailPurchase && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>
                      매입 상세 - {detailPurchase.purchaseNo}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                      {detailPurchase.supplier?.name} · {formatDate(detailPurchase.purchasedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailPurchase(null)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Info grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                  marginBottom: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>상태</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: (statusLabels[detailPurchase.status] || statusLabels.pending).color }}>
                      {(statusLabels[detailPurchase.status] || statusLabels.pending).label}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>총 금액</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>
                      {detailPurchase.totalAmount?.toLocaleString()}원
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>입고일</div>
                    <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                      {detailPurchase.receivedAt ? formatDate(detailPurchase.receivedAt) : '-'}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 10 }}>
                  품목 ({detailPurchase.items?.length || 0}개)
                </h3>
                <table style={{ width: '100%', marginBottom: 20 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, fontSize: 12, padding: '8px 10px' }}>#</th>
                      <th style={{ ...thStyle, fontSize: 12, padding: '8px 10px' }}>상품명</th>
                      <th style={{ ...thStyle, fontSize: 12, padding: '8px 10px', textAlign: 'center' }}>수량</th>
                      <th style={{ ...thStyle, fontSize: 12, padding: '8px 10px', textAlign: 'right' }}>단가</th>
                      <th style={{ ...thStyle, fontSize: 12, padding: '8px 10px', textAlign: 'right' }}>소계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailPurchase.items || []).map((item: any, idx: number) => (
                      <tr key={item.id}>
                        <td style={{ ...tdStyle, fontSize: 13, padding: '8px 10px' }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontSize: 13, padding: '8px 10px', fontWeight: 500 }}>
                          {item.product?.name || `상품 #${item.productId}`}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 13, padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ ...tdStyle, fontSize: 13, padding: '8px 10px', textAlign: 'right' }}>
                          {item.unitPrice?.toLocaleString()}원
                        </td>
                        <td style={{ ...tdStyle, fontSize: 13, padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                          {item.totalPrice?.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Memo */}
                {detailPurchase.memo && (
                  <div style={{ padding: 12, background: '#fef9c3', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    <strong>비고:</strong> {detailPurchase.memo}
                  </div>
                )}

                {/* Actions */}
                {detailPurchase.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleStatusChange(detailPurchase.id, 'cancelled')}
                      style={{
                        ...btnStyle, background: '#fee2e2', color: '#ef4444',
                        border: 'none', fontWeight: 600,
                      }}
                    >
                      매입 취소
                    </button>
                    <button
                      onClick={() => handleStatusChange(detailPurchase.id, 'completed')}
                      style={{
                        ...btnStyle, background: '#10b981', color: '#fff',
                        border: 'none', fontWeight: 600,
                      }}
                    >
                      입고 확인 (재고 반영)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
