'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import Link from 'next/link'

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

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '입고대기', color: '#f59e0b', bg: '#fef3c7' },
  completed: { label: '입고완료', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: '취소', color: '#6b7280', bg: '#f3f4f6' },
}

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState({ totalPurchases: 0, totalAmount: 0 })

  useEffect(() => {
    fetchPurchases()
  }, [search, status])

  const fetchPurchases = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      
      const res = await fetch(`/api/purchase?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (purchase: Purchase, newStatus: string) => {
    if (newStatus === 'completed' && !confirm('입고 완료 처리하시겠습니까?\n재고가 자동으로 증가됩니다.')) return
    if (newStatus === 'cancelled' && !confirm('취소 처리하시겠습니까?')) return

    try {
      const res = await fetch(`/api/purchase/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchPurchases()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>매입 내역</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          총 {stats.totalPurchases}건 · {stats.totalAmount.toLocaleString()}원
        </p>
      </div>

      {/* 검색/필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="매입번호, 매입처 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            fontSize: '14px'
          }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            fontSize: '14px',
            minWidth: '120px'
          }}
        >
          <option value="">전체 상태</option>
          <option value="pending">입고대기</option>
          <option value="completed">입고완료</option>
          <option value="cancelled">취소</option>
        </select>
        <Link
          href="/admin/purchase/new"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          + 매입 등록
        </Link>
      </div>

      {/* 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>매입번호</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>매입처</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>품목수</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>금액</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>매입일</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>입고일</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>처리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                  로딩 중...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                  매입 내역이 없습니다
                </td>
              </tr>
            ) : (
              purchases.map(purchase => {
                const statusInfo = statusLabels[purchase.status] || statusLabels.pending
                return (
                  <tr key={purchase.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                      {purchase.purchaseNo}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <div style={{ fontWeight: 500 }}>{purchase.supplier.name}</div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>{purchase.supplier.code}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#666' }}>
                      {purchase._count.items}개
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                      {purchase.totalAmount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'center', color: '#666' }}>
                      {new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'center', color: '#666' }}>
                      {purchase.receivedAt 
                        ? new Date(purchase.receivedAt).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {purchase.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(purchase, 'completed')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: 'none',
                              background: '#10b981',
                              color: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '4px'
                            }}
                          >
                            입고
                          </button>
                          <button
                            onClick={() => handleStatusChange(purchase, 'cancelled')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #e5e5e5',
                              background: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            취소
                          </button>
                        </>
                      )}
                      {purchase.status !== 'pending' && (
                        <span style={{ color: '#86868b', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
