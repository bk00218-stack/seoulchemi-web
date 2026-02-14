'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  summary: {
    today: { orders: number; amount: number }
    thisMonth: { orders: number; amount: number }
  }
  status: {
    pending: number
    confirmed: number
    shipped: number
  }
  pendingOrders: {
    id: number
    orderNo: string
    storeName: string
    totalAmount: number
    orderedAt: string
  }[]
}

export default function MobileHomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/orders/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</div>
  }

  return (
    <div>
      {/* ?¤ëŠ˜ ?„í™© */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '20px',
        color: '#fff',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>?¤ëŠ˜ ì£¼ë¬¸</div>
        <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
          {data?.summary.today.orders || 0}ê±?
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8 }}>
          {(data?.summary.today.amount || 0).toLocaleString()}??
        </div>
      </div>

      {/* ì£¼ë¬¸ ?íƒœ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <Link href="/mobile/orders?status=pending" style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {data?.status.pending || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>?€ê¸?/div>
        </Link>
        <Link href="/mobile/orders?status=confirmed" style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
            {data?.status.confirmed || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>?•ì¸</div>
        </Link>
        <Link href="/mobile/orders?status=shipped" style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            {data?.status.shipped || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ì¶œê³ </div>
        </Link>
      </div>

      {/* ë¹ ë¥¸ ë©”ë‰´ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <Link href="/mobile/order" style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '20px',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>?“</span>
          <div>
            <div style={{ fontWeight: 600 }}>ì£¼ë¬¸ ?±ë¡</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>??ì£¼ë¬¸ ?…ë ¥</div>
          </div>
        </Link>
        <Link href="/mobile/scan" style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '20px',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>?“·</span>
          <div>
            <div style={{ fontWeight: 600 }}>ë°”ì½”???¤ìº”</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>?¬ê³ /ì¶œê³  ?•ì¸</div>
          </div>
        </Link>
      </div>

      {/* ?€ê¸?ì£¼ë¬¸ */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>?€ê¸?ì¤‘ì¸ ì£¼ë¬¸</h2>
          <Link href="/mobile/orders?status=pending" style={{ fontSize: '14px', color: '#007aff', textDecoration: 'none' }}>
            ?„ì²´ë³´ê¸°
          </Link>
        </div>

        {!data?.pendingOrders?.length ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            ?€ê¸?ì£¼ë¬¸???†ìŠµ?ˆë‹¤ ??
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.pendingOrders.slice(0, 5).map(order => (
              <Link
                key={order.id}
                href={`/mobile/orders/${order.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>{order.storeName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{order.orderNo}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{order.totalAmount.toLocaleString()}??/div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
