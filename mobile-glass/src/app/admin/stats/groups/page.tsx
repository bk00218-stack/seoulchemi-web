'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface GroupStat {
  id: number
  name: string
  storeType: string
  storeCount: number
  orderCount: number
  totalAmount: number
}

export default function GroupStatsPage() {
  const [data, setData] = useState<GroupStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/store-groups')
      const groups = await res.json()
      
      // Í∞?Í∑∏Î£π???ÑÏãú ?µÍ≥Ñ Ï∂îÍ? (?§Ï†úÎ°úÎäî Ï£ºÎ¨∏ ÏßëÍ≥Ñ ?ÑÏöî)
      const stats = groups.map((g: { id: number; name: string; storeType: string; storeCount: number }) => ({
        ...g,
        orderCount: Math.floor(Math.random() * 100),
        totalAmount: Math.floor(Math.random() * 10000000)
      }))
      
      setData(stats)
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<GroupStat>[] = [
    { key: 'name', label: 'Í∑∏Î£πÎ™?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'storeType', label: '?Ä??, render: (v) => {
      const types: Record<string, string> = { normal: '?ºÎ∞ò', vip: 'VIP', wholesale: '?ÑÎß§' }
      return <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{types[v as string] || v}</span>
    }},
    { key: 'storeCount', label: 'Í∞ÄÎßπÏ†ê', align: 'center', render: (v) => <span>{v as number}Í∞?/span> },
    { key: 'orderCount', label: 'Ï£ºÎ¨∏??, align: 'center', render: (v) => <span>{v as number}Í±?/span> },
    { key: 'totalAmount', label: 'Îß§Ï∂ú??, align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}??/span>
    )},
  ]

  const totalStores = data.reduce((sum, d) => sum + d.storeCount, 0)
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0)
  const totalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0)

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Í∑∏Î£πÎ≥??ÅÌíà ?µÍ≥Ñ</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Í∑∏Î£π</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Í∞ÄÎßπÏ†ê</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalStores}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Ï£ºÎ¨∏</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{totalOrders}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í±?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Îß§Ï∂ú</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{Math.round(totalAmount / 10000).toLocaleString()}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ÎßåÏõê</span></div>
        </div>
      </div>

      <SearchFilter placeholder="Í∑∏Î£πÎ™?Í≤Ä?? />

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Í∑∏Î£π???ÜÏäµ?àÎã§" />
    </AdminLayout>
  )
}
