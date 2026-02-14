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
  pending: { label: '?…ê³ ?€ê¸?, color: '#f59e0b', bg: '#fef3c7' },
  completed: { label: '?…ê³ ?„ë£Œ', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: 'ì·¨ì†Œ', color: '#6b7280', bg: '#f3f4f6' },
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
    if (newStatus === 'completed' && !confirm('?…ê³  ?„ë£Œ ì²˜ë¦¬?˜ì‹œê² ìŠµ?ˆê¹Œ?\n?¬ê³ ê°€ ?ë™?¼ë¡œ ì¦ê??©ë‹ˆ??')) return
    if (newStatus === 'cancelled' && !confirm('ì·¨ì†Œ ì²˜ë¦¬?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return

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
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>ë§¤ì… ?´ì—­</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          ì´?{stats.totalPurchases}ê±?Â· {stats.totalAmount.toLocaleString()}??
        </p>
      </div>

      {/* ê²€???„í„° */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ë§¤ì…ë²ˆí˜¸, ë§¤ì…ì²?ê²€??.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '14px'
          }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '14px',
            minWidth: '120px'
          }}
        >
          <option value="">?„ì²´ ?íƒœ</option>
          <option value="pending">?…ê³ ?€ê¸?/option>
          <option value="completed">?…ê³ ?„ë£Œ</option>
          <option value="cancelled">ì·¨ì†Œ</option>
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
          + ë§¤ì… ?±ë¡
        </Link>
      </div>

      {/* ëª©ë¡ */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>ë§¤ì…ë²ˆí˜¸</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>ë§¤ì…ì²?/th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?ˆëª©??/th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>ê¸ˆì•¡</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?íƒœ</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ë§¤ì…??/th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?…ê³ ??/th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ì²˜ë¦¬</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  ë¡œë”© ì¤?..
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  ë§¤ì… ?´ì—­???†ìŠµ?ˆë‹¤
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
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{purchase.supplier.code}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#666' }}>
                      {purchase._count.items}ê°?
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                      {purchase.totalAmount.toLocaleString()}??
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
                            ?…ê³ 
                          </button>
                          <button
                            onClick={() => handleStatusChange(purchase, 'cancelled')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ì·¨ì†Œ
                          </button>
                        </>
                      )}
                      {purchase.status !== 'pending' && (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>-</span>
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
