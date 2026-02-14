'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import Link from 'next/link'

interface ReorderItem {
  optionId: number
  productId: number
  productName: string
  brandName: string
  sph: string | null
  cyl: string | null
  currentStock: number
  monthlySales: number
  dailyAvg: number
  recommendedQty: number
  purchasePrice: number
  estimatedCost: number
  urgency: 'critical' | 'high' | 'normal'
}

interface ReorderData {
  summary: {
    totalItems: number
    criticalCount: number
    highCount: number
    totalEstimatedCost: number
  }
  recommendations: ReorderItem[]
  byBrand: Record<string, ReorderItem[]>
}

export default function ReorderPage() {
  const [data, setData] = useState<ReorderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(5)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'brand'>('list')

  useEffect(() => {
    fetchData()
  }, [threshold])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats/reorder?threshold=${threshold}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        // ê¸´ê¸‰ ??ª© ?ë™ ? íƒ
        const criticalIds = new Set<number>(
          json.recommendations
            .filter((r: ReorderItem) => r.urgency === 'critical')
            .map((r: ReorderItem) => r.optionId)
        )
        setSelectedItems(criticalIds)
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (optionId: number) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(optionId)) {
      newSet.delete(optionId)
    } else {
      newSet.add(optionId)
    }
    setSelectedItems(newSet)
  }

  const selectAll = () => {
    if (!data) return
    const allIds = new Set<number>(data.recommendations.map(r => r.optionId))
    setSelectedItems(allIds)
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return { bg: '#fef2f2', color: '#dc2626', label: '?”´ ê¸´ê¸‰' }
      case 'high':
        return { bg: '#fef3c7', color: '#d97706', label: '?Ÿ¡ ?’ìŒ' }
      default:
        return { bg: '#f3f4f6', color: '#6b7280', label: '??ë³´í†µ' }
    }
  }

  const selectedTotal = data?.recommendations
    .filter(r => selectedItems.has(r.optionId))
    .reduce((sum, r) => sum + r.estimatedCost, 0) || 0

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>?ë™ ë°œì£¼ ?œì•ˆ</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          ?¬ê³  ë¶€ì¡??í’ˆ??ë¶„ì„?˜ì—¬ ë°œì£¼ë¥??œì•ˆ?©ë‹ˆ??
        </p>
      </div>

      {/* ?„í„° */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center',
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px' }}>?¬ê³  ê¸°ì?:</label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
          >
            <option value="3">3ê°??´í•˜</option>
            <option value="5">5ê°??´í•˜</option>
            <option value="10">10ê°??´í•˜</option>
            <option value="20">20ê°??´í•˜</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: viewMode === 'list' ? 'none' : '1px solid #e5e5e5',
              background: viewMode === 'list' ? '#007aff' : '#fff',
              color: viewMode === 'list' ? '#fff' : '#1d1d1f',
              cursor: 'pointer'
            }}
          >
            ëª©ë¡
          </button>
          <button
            onClick={() => setViewMode('brand')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: viewMode === 'brand' ? 'none' : '1px solid #e5e5e5',
              background: viewMode === 'brand' ? '#007aff' : '#fff',
              color: viewMode === 'brand' ? '#fff' : '#1d1d1f',
              cursor: 'pointer'
            }}
          >
            ë¸Œëœ?œë³„
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={selectAll} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '13px' }}>
            ?„ì²´ ? íƒ
          </button>
          <button onClick={deselectAll} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '13px' }}>
            ? íƒ ?´ì œ
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</div>
      ) : data ? (
        <>
          {/* ?”ì•½ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>ë°œì£¼ ?„ìš” ?ˆëª©</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{data.summary.totalItems}</div>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: '#dc2626' }}>?”´ ê¸´ê¸‰ (?ˆì ˆ)</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: '#dc2626' }}>
                {data.summary.criticalCount}
              </div>
            </div>
            <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: '#d97706' }}>?Ÿ¡ ?’ìŒ (3ê°??´í•˜)</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: '#d97706' }}>
                {data.summary.highCount}
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>?ˆìƒ ë°œì£¼ ê¸ˆì•¡</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                {data.summary.totalEstimatedCost.toLocaleString()}??
              </div>
            </div>
          </div>

          {/* ? íƒ ?”ì•½ */}
          {selectedItems.size > 0 && (
            <div style={{
              background: '#f0f7ff',
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{selectedItems.size}ê°??ˆëª© ? íƒ</span>
                <span style={{ marginLeft: '16px', color: '#666' }}>
                  ?ˆìƒ ê¸ˆì•¡: <strong>{selectedTotal.toLocaleString()}??/strong>
                </span>
              </div>
              <Link
                href={`/admin/purchase/new`}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#007aff',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                ? íƒ ?ˆëª© ë°œì£¼ ??
              </Link>
            </div>
          )}

          {/* ëª©ë¡ */}
          {viewMode === 'list' ? (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '40px' }}></th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '80px' }}>ê¸´ê¸‰??/th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?í’ˆ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?„ìˆ˜</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?„ì¬ê³?/th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?”íŒë§?/th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ì¶”ì²œ?˜ëŸ‰</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>?ˆìƒê¸ˆì•¡</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recommendations.map(item => {
                    const style = getUrgencyStyle(item.urgency)
                    return (
                      <tr 
                        key={item.optionId} 
                        style={{ borderBottom: '1px solid #f0f0f0', background: selectedItems.has(item.optionId) ? '#f0f7ff' : undefined }}
                      >
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.optionId)}
                            onChange={() => toggleSelect(item.optionId)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: style.bg,
                            color: style.color
                          }}>
                            {style.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.productName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.brandName}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontFamily: 'monospace' }}>
                          {item.sph || '-'} / {item.cyl || '-'}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'center', 
                          fontSize: '14px',
                          fontWeight: 600,
                          color: item.currentStock === 0 ? '#dc2626' : item.currentStock <= 3 ? '#d97706' : '#1d1d1f'
                        }}>
                          {item.currentStock}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                          {item.monthlySales}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#007aff' }}>
                          {item.recommendedQty}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                          {item.estimatedCost.toLocaleString()}??
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {Object.entries(data.byBrand).map(([brandName, items]) => (
                <div key={brandName} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{brandName}</h3>
                    <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                      {items.length}ê°??ˆëª© Â· {items.reduce((sum, i) => sum + i.estimatedCost, 0).toLocaleString()}??
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {items.map(item => {
                      const style = getUrgencyStyle(item.urgency)
                      return (
                        <div
                          key={item.optionId}
                          onClick={() => toggleSelect(item.optionId)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: selectedItems.has(item.optionId) ? '#007aff' : style.bg,
                            color: selectedItems.has(item.optionId) ? '#fff' : style.color,
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {item.productName} {item.sph && `(${item.sph})`}
                          <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                            ?¬ê³ :{item.currentStock} ??+{item.recommendedQty}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤
        </div>
      )}
    </AdminLayout>
  )
}
