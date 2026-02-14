'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Order {
  id: number
  orderNo: string
  storeName: string
  storeCode: string
  status: string
  totalAmount: number
  itemCount: number
  orderedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '?ÄÍ∏?, color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: '?ïÏù∏', color: '#3b82f6', bg: '#dbeafe' },
  shipped: { label: 'Ï∂úÍ≥†', color: '#8b5cf6', bg: '#ede9fe' },
  delivered: { label: '?ÑÎ£å', color: '#10b981', bg: '#d1fae5' },
}

export default function MobileOrdersPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    fetchOrders()
  }, [status])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      params.set('limit', '50')

      const res = await fetch(`/api/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* ?ÅÌÉú ?ÑÌÑ∞ */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { value: 'all', label: '?ÑÏ≤¥' },
          ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: status === opt.value ? '#007aff' : '#fff',
              color: status === opt.value ? '#fff' : '#1d1d1f',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ï£ºÎ¨∏ Î™©Î°ù */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Î°úÎî© Ï§?..</div>
      ) : orders.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-primary)',
          borderRadius: '12px'
        }}>
          Ï£ºÎ¨∏???ÜÏäµ?àÎã§.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            return (
              <Link
                key={order.id}
                href={`/mobile/orders/${order.id}`}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{order.storeName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{order.orderNo}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: statusConfig.bg,
                    color: statusConfig.color
                  }}>
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {new Date(order.orderedAt).toLocaleDateString('ko-KR')}
                  </div>
                  <div style={{ fontWeight: 600 }}>{order.totalAmount.toLocaleString()}??/div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
