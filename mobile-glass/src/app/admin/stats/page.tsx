'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface StoreStats {
  id: number
  name: string
  code: string
  totalOrders: number
  totalAmount: number
  avgOrderAmount: number
}

interface ProductStats {
  id: number
  name: string
  brandName: string
  totalQuantity: number
  totalAmount: number
}

interface PeriodStats {
  period: string
  orders: number
  amount: number
}

export default function StatsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [storeStats, setStoreStats] = useState<StoreStats[]>([])
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [periodStats, setPeriodStats] = useState<PeriodStats[]>([])
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalAmount: 0,
    avgOrderAmount: 0,
    totalStores: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // ê¸°ê°„ ê³„ì‚°
      const now = new Date()
      let startDate: Date
      
      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const res = await fetch(`/api/stats?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setStoreStats(data.storeStats || [])
        setProductStats(data.productStats || [])
        setPeriodStats(data.periodStats || [])
        setSummary(data.summary || { totalOrders: 0, totalAmount: 0, avgOrderAmount: 0, totalStores: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxStoreAmount = Math.max(...storeStats.map(s => s.totalAmount), 1)
  const maxProductQty = Math.max(...productStats.map(p => p.totalQuantity), 1)

  return (
    <AdminLayout activeMenu="stats">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>?µê³„</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>ë§¤ì¶œ ë°?ì£¼ë¬¸ ?„í™©??ë¶„ì„?©ë‹ˆ??</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'week', label: '?´ë²ˆ ì£? },
            { value: 'month', label: '?´ë²ˆ ?? },
            { value: 'year', label: '?¬í•´' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: period === opt.value ? '#007aff' : '#f3f4f6',
                color: period === opt.value ? '#fff' : '#1d1d1f',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ?”ì•½ ì¹´ë“œ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>ì´?ì£¼ë¬¸</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{summary.totalOrders.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>ì´?ë§¤ì¶œ</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{(summary.totalAmount / 10000).toFixed(0)}ë§Œì›</div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>?‰ê·  ì£¼ë¬¸??/div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{Math.round(summary.avgOrderAmount).toLocaleString()}??/div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>ê±°ë˜ ê°€ë§¹ì </div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{summary.totalStores}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ê°€ë§¹ì ë³?ë§¤ì¶œ */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>ê°€ë§¹ì ë³?ë§¤ì¶œ TOP 10</h2>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</div>
          ) : storeStats.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>?°ì´?°ê? ?†ìŠµ?ˆë‹¤.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {storeStats.slice(0, 10).map((store, idx) => (
                <div key={store.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: '8px' }}>{idx + 1}</span>
                      {store.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{store.totalAmount.toLocaleString()}??/span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(store.totalAmount / maxStoreAmount) * 100}%`,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ?í’ˆë³??ë§¤??*/}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>?í’ˆë³??ë§¤??TOP 10</h2>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</div>
          ) : productStats.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>?°ì´?°ê? ?†ìŠµ?ˆë‹¤.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productStats.slice(0, 10).map((product, idx) => (
                <div key={product.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: '8px' }}>{idx + 1}</span>
                      {product.brandName} {product.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{product.totalQuantity}ê°?/span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(product.totalQuantity / maxProductQty) * 100}%`,
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ?‘ì? ?¤ìš´ë¡œë“œ */}
      <div style={{ marginTop: '24px', background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>ë¦¬í¬???¤ìš´ë¡œë“œ</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.open(`/api/stats/export?type=store&period=${period}`, '_blank')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ?“Š ê°€ë§¹ì ë³?ë§¤ì¶œ
          </button>
          <button
            onClick={() => window.open(`/api/stats/export?type=product&period=${period}`, '_blank')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ?“¦ ?í’ˆë³??ë§¤
          </button>
          <button
            onClick={() => window.open(`/api/stats/export?type=daily&period=${period}`, '_blank')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ?“… ?¼ë³„ ì¶”ì´
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
