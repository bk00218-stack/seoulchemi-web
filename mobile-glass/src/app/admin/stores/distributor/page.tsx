'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Store {
  id: number
  name: string
  code: string
  ownerName: string | null
  distributorCode: string | null
  distributorStatus: string | null
}

export default function DistributorPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data.stores || data || [])
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorStatus: 'approved' })
      })
      loadData()
    } catch (error) {
      alert('?πÏù∏ ?§Ìå®')
    }
  }

  const columns: Column<Store>[] = [
    { key: 'code', label: 'ÏΩîÎìú', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>{v as string}</span> },
    { key: 'name', label: 'Í∞ÄÎßπÏ†êÎ™?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'ownerName', label: '?Ä?úÏûê', render: (v) => <span>{(v as string) || '-'}</span> },
    { key: 'distributorCode', label: '?†ÌÜµ??ÏΩîÎìú', render: (v) => (
      <span style={{ fontFamily: 'monospace', color: v ? '#007aff' : '#86868b' }}>{(v as string) || 'ÎØ∏Îì±Î°?}</span>
    )},
    { key: 'distributorStatus', label: '?πÏù∏?ÅÌÉú', align: 'center', render: (v) => {
      const statuses: Record<string, { bg: string; color: string; label: string }> = {
        pending: { bg: '#fff3e0', color: '#ef6c00', label: '?ÄÍ∏? },
        approved: { bg: '#e8f5e9', color: '#2e7d32', label: '?πÏù∏' },
        rejected: { bg: '#ffebee', color: '#c62828', label: 'Í±∞Ï†à' }
      }
      const s = statuses[v as string] || { bg: '#f5f5f7', color: 'var(--text-tertiary)', label: 'ÎØ∏Ïã†Ï≤? }
      return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{s.label}</span>
    }},
    { key: 'id', label: 'Í¥ÄÎ¶?, align: 'center', render: (_, row) => row.distributorStatus === 'pending' ? (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button onClick={() => handleApprove(row.id)} style={{ padding: '4px 10px', borderRadius: '4px', background: '#34c759', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>?πÏù∏</button>
        <button style={{ padding: '4px 10px', borderRadius: '4px', background: '#ff3b30', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Í±∞Ï†à</button>
      </div>
    ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>-</span> },
  ]

  const filtered = stores.filter(s => !filter || s.distributorStatus === filter)
  const pendingCount = stores.filter(s => s.distributorStatus === 'pending').length

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>?†ÌÜµ??ÏΩîÎìú ?πÏù∏</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?ÑÏ≤¥</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stores.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', border: pendingCount > 0 ? '2px solid #ff9500' : 'none' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?πÏù∏?ÄÍ∏?/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{pendingCount}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?πÏù∏?ÑÎ£å</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{stores.filter(s => s.distributorStatus === 'approved').length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Í±∞Ï†à</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{stores.filter(s => s.distributorStatus === 'rejected').length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="Í∞ÄÎßπÏ†êÎ™?Í≤Ä??
        filters={[{
          key: 'status', label: '?ÅÌÉú',
          options: [
            { label: '?ÑÏ≤¥', value: '' },
            { label: '?ÄÍ∏?, value: 'pending' },
            { label: '?πÏù∏', value: 'approved' },
            { label: 'Í±∞Ï†à', value: 'rejected' }
          ],
          value: filter, onChange: setFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Í∞ÄÎßπÏ†ê???ÜÏäµ?àÎã§" />
    </AdminLayout>
  )
}
