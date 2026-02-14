'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface ShippingMethod {
  id: number
  name: string
  carrier: string
  baseFee: number
  freeThreshold: number
  estimatedDays: string
  isActive: boolean
}

export default function ShippingSettingsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', carrier: '', baseFee: 0, freeThreshold: 0, estimatedDays: '1-2?? })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      // 기본 배송 방법 (?�제로는 DB?�서 가?�옴)
      setMethods([
        { id: 1, name: '?�배', carrier: 'CJ?�?�통??, baseFee: 3000, freeThreshold: 50000, estimatedDays: '1-2??, isActive: true },
        { id: 2, name: '?�서비스', carrier: '직접배송', baseFee: 5000, freeThreshold: 0, estimatedDays: '?�일', isActive: true },
        { id: 3, name: '?�편', carrier: '?�체�?, baseFee: 2000, freeThreshold: 30000, estimatedDays: '2-3??, isActive: false },
      ])
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setMethods([...methods, { ...formData, id: methods.length + 1, isActive: true }])
    setShowModal(false)
    setFormData({ name: '', carrier: '', baseFee: 0, freeThreshold: 0, estimatedDays: '1-2?? })
  }

  const columns: Column<ShippingMethod>[] = [
    { key: 'name', label: '배송방법�?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'carrier', label: '?�송??, render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'baseFee', label: '기본?�금', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'freeThreshold', label: '무료배송 기�?', align: 'right', render: (v) => (
      <span style={{ color: (v as number) > 0 ? '#1d1d1f' : '#86868b' }}>
        {(v as number) > 0 ? `${(v as number).toLocaleString()}?? : '?�음'}
      </span>
    )},
    { key: 'estimatedDays', label: '?�상?�요', align: 'center', render: (v) => <span>{v as string}</span> },
    { key: 'isActive', label: '?�태', align: 'center', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ]

  const activeCount = methods.filter(m => m.isActive).length

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>배송�??�정</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>�?배송방법</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{methods.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?�성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{activeCount}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>비활??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{methods.length - activeCount}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="배송방법�?검??
        actions={
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            + 배송방법 ?�록
          </button>
        }
      />

      <DataTable columns={columns} data={methods} loading={loading} emptyMessage="?�록??배송방법???�습?�다" />

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>배송방법 ?�록</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>배송방법�?*</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?�송??/label>
                <input type="text" value={formData.carrier} onChange={(e) => setFormData({ ...formData, carrier: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>기본?�금 (??</label>
                <input type="number" value={formData.baseFee} onChange={(e) => setFormData({ ...formData, baseFee: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>무료배송 기�? (??</label>
                <input type="number" value={formData.freeThreshold} onChange={(e) => setFormData({ ...formData, freeThreshold: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>?�??/button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
