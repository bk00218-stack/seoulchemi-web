'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Category {
  id: number
  type: string
  code: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ type: 'optionType', code: '', name: '', description: '', displayOrder: 0 })

  useEffect(() => { loadData() }, [typeFilter])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      const res = await fetch(`/api/categories?${params}`)
      setCategories(await res.json())
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await fetch('/api/categories', {
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

  const typeLabels: Record<string, string> = {
    optionType: '?µÏÖò?Ä??,
    productType: '?ÅÌíàÍµ¨Î∂Ñ',
    orderStatus: 'Ï£ºÎ¨∏?ÅÌÉú',
    paymentMethod: 'Í≤∞Ï†úÎ∞©Î≤ï'
  }

  const columns: Column<Category>[] = [
    { key: 'type', label: 'Íµ¨Î∂Ñ?Ä??, render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {typeLabels[v as string] || v}
      </span>
    )},
    { key: 'code', label: 'ÏΩîÎìú', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{v as string}</span> },
    { key: 'name', label: '?úÏãúÎ™?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'description', label: '?§Î™Ö', render: (v) => <span style={{ color: '#666', fontSize: '13px' }}>{(v as string) || '-'}</span> },
    { key: 'displayOrder', label: '?úÏÑú', align: 'center', render: (v) => <span style={{ color: 'var(--text-tertiary)' }}>{v as number}</span> },
    { key: 'isActive', label: '?ÅÌÉú', align: 'center', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ]

  const types = [...new Set(categories.map(c => c.type))]

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Íµ¨Î∂Ñ?§Ï†ï</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?Íµ¨Î∂Ñ</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{categories.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Íµ¨Î∂Ñ?Ä??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{types.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?úÏÑ±</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{categories.filter(c => c.isActive).length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ÎπÑÌôú??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{categories.filter(c => !c.isActive).length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="ÏΩîÎìú, ?¥Î¶Ñ Í≤Ä??
        filters={[{
          key: 'type', label: 'Íµ¨Î∂Ñ?Ä??,
          options: [
            { label: '?ÑÏ≤¥', value: '' },
            ...Object.entries(typeLabels).map(([k, v]) => ({ label: v, value: k }))
          ],
          value: typeFilter, onChange: setTypeFilter
        }]}
        actions={
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            + Íµ¨Î∂Ñ ?±Î°ù
          </button>
        }
      />

      <DataTable columns={columns} data={categories} loading={loading} emptyMessage="?±Î°ù??Íµ¨Î∂Ñ???ÜÏäµ?àÎã§" />

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Íµ¨Î∂Ñ ?±Î°ù</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Íµ¨Î∂Ñ?Ä??*</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ÏΩîÎìú *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?úÏãúÎ™?*</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
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
