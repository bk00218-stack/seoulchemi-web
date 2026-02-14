'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface StoreGroup {
  id: number
  name: string
  description: string | null
  discountRate: number
  storeType: string
  storeCount: number
  isActive: boolean
}

export default function StoreGroupsPage() {
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', discountRate: 0, storeType: 'normal' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/store-groups')
      setGroups(await res.json())
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await fetch('/api/store-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      setShowModal(false)
      loadData()
    } catch (error) {
      alert('?Ä???§Ìå®')
    }
  }

  const columns: Column<StoreGroup>[] = [
    { key: 'name', label: 'Í∑∏Î£πÎ™?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'description', label: '?§Î™Ö', render: (v) => <span style={{ color: '#666', fontSize: '13px' }}>{(v as string) || '-'}</span> },
    { key: 'storeType', label: '?Ä??, render: (v) => {
      const types: Record<string, string> = { normal: '?ºÎ∞ò', vip: 'VIP', wholesale: '?ÑÎß§' }
      return <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{types[v as string] || v}</span>
    }},
    { key: 'storeCount', label: 'Í∞ÄÎßπÏ†ê ??, align: 'center', render: (v) => <span>{v as number}Í∞?/span> },
    { key: 'discountRate', label: 'Í∏∞Î≥∏?†Ïù∏??, align: 'center', render: (v) => <span>{v as number}%</span> },
    { key: 'isActive', label: '?ÅÌÉú', align: 'center', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ]

  const totalStores = groups.reduce((sum, g) => sum + g.storeCount, 0)

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Í∑∏Î£πÎ≥?Í∞ÄÎßπÏ†ê ?∞Í≤∞</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Í∑∏Î£π</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{groups.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?∞Í≤∞??Í∞ÄÎßπÏ†ê</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{totalStores}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?úÏÑ± Í∑∏Î£π</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{groups.filter(g => g.isActive).length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="Í∑∏Î£πÎ™?Í≤Ä??
        actions={
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            + Í∑∏Î£π ?±Î°ù
          </button>
        }
      />

      <DataTable columns={columns} data={groups} loading={loading} emptyMessage="?±Î°ù??Í∑∏Î£π???ÜÏäµ?àÎã§" />

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Í∑∏Î£π ?±Î°ù</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Í∑∏Î£πÎ™?*</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?Ä??/label>
                <select value={formData.storeType} onChange={(e) => setFormData({ ...formData, storeType: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
                  <option value="normal">?ºÎ∞ò</option>
                  <option value="vip">VIP</option>
                  <option value="wholesale">?ÑÎß§</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Í∏∞Î≥∏ ?†Ïù∏??(%)</label>
                <input type="number" value={formData.discountRate} onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Ï∑®ÏÜå</button>
              <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>?Ä??/button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
