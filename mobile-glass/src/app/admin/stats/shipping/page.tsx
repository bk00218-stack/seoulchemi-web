'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface ShippingStat {
  date: string
  totalOrders: number
  shipped: number
  delivered: number
  pending: number
  avgTime: number
}

export default function ShippingStatsPage() {
  const [data, setData] = useState<ShippingStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      // Ï£ºÎ¨∏ ?∞Ïù¥?∞Ïóê??Ï∂úÍ≥† ?µÍ≥Ñ ÏßëÍ≥Ñ
      const res = await fetch('/api/orders?limit=1000')
      const result = await res.json()
      const orders = result.orders || []
      
      // ?†ÏßúÎ≥?ÏßëÍ≥Ñ
      const byDate = new Map<string, { total: number; shipped: number; delivered: number; pending: number }>()
      
      orders.forEach((order: { orderedAt: string; status: string }) => {
        const date = new Date(order.orderedAt).toISOString().split('T')[0]
        if (!byDate.has(date)) {
          byDate.set(date, { total: 0, shipped: 0, delivered: 0, pending: 0 })
        }
        const stat = byDate.get(date)!
        stat.total++
        if (order.status === 'shipped') stat.shipped++
        else if (order.status === 'delivered') stat.delivered++
        else if (order.status === 'pending') stat.pending++
      })
      
      const stats = Array.from(byDate.entries())
        .map(([date, stat]) => ({
          date,
          totalOrders: stat.total,
          shipped: stat.shipped,
          delivered: stat.delivered,
          pending: stat.pending,
          avgTime: 1.5 // ?ÑÏãú ?âÍ∑† Î∞∞ÏÜ°?úÍ∞Ñ
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14)
      
      setData(stats)
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<ShippingStat>[] = [
    { key: 'date', label: '?†Ïßú', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'totalOrders', label: 'Ï¥?Ï£ºÎ¨∏', align: 'center', render: (v) => <span>{v as number}Í±?/span> },
    { key: 'shipped', label: 'Ï∂úÍ≥†', align: 'center', render: (v) => <span style={{ color: '#007aff' }}>{v as number}Í±?/span> },
    { key: 'delivered', label: 'Î∞∞ÏÜ°?ÑÎ£å', align: 'center', render: (v) => <span style={{ color: '#34c759' }}>{v as number}Í±?/span> },
    { key: 'pending', label: '?ÄÍ∏?, align: 'center', render: (v) => <span style={{ color: '#ff9500' }}>{v as number}Í±?/span> },
    { key: 'avgTime', label: '?âÍ∑† Î∞∞ÏÜ°?úÍ∞Ñ', align: 'center', render: (v) => <span style={{ color: 'var(--text-tertiary)' }}>{v as number}??/span> },
  ]

  const totalOrders = data.reduce((sum, d) => sum + d.totalOrders, 0)
  const totalShipped = data.reduce((sum, d) => sum + d.shipped + d.delivered, 0)

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Í∞ÄÎßπÏ†ê Ï∂úÍ≥† ?µÍ≥Ñ</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Ï£ºÎ¨∏</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{totalOrders}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í±?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï∂úÍ≥†?ÑÎ£å</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{totalShipped}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í±?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï∂úÍ≥†??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalOrders ? Math.round(totalShipped / totalOrders * 100) : 0}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>%</span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?âÍ∑† Î∞∞ÏÜ°?úÍ∞Ñ</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>1.5<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>??/span></div>
        </div>
      </div>

      <SearchFilter placeholder="?†Ïßú Í≤Ä?? />

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Ï∂úÍ≥† ?∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§" />
    </AdminLayout>
  )
}
