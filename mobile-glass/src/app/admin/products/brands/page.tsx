'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Brand {
  id: number
  name: string
  stockManage: string | null
  canExchange: boolean
  canReturn: boolean
  isActive: boolean
  displayOrder: number
  productCount: number
  activeCount: number
  inactiveCount: number
  createdAt: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  
  // ???íƒœ
  const [formData, setFormData] = useState({
    name: '',
    stockManage: '',
    canExchange: false,
    canReturn: false,
    isActive: true,
    displayOrder: 0
  })

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data)
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowModal(false)
        loadBrands()
      } else {
        const error = await res.json()
        alert(error.error || '?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
      }
    } catch (error) {
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('??ë¸Œëœ?œë? ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return
    
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadBrands()
      } else {
        const error = await res.json()
        alert(error.error || '?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
      }
    } catch (error) {
      alert('?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
  }

  const openEditModal = (brand: Brand | null) => {
    if (brand) {
      setFormData({
        name: brand.name,
        stockManage: brand.stockManage || '',
        canExchange: brand.canExchange,
        canReturn: brand.canReturn,
        isActive: brand.isActive,
        displayOrder: brand.displayOrder
      })
      setEditingBrand(brand)
    } else {
      setFormData({
        name: '',
        stockManage: '',
        canExchange: false,
        canReturn: false,
        isActive: true,
        displayOrder: brands.length
      })
      setEditingBrand(null)
    }
    setShowModal(true)
  }

  const columns: Column<Brand>[] = [
    { key: 'displayOrder', label: '?œì„œ', width: '60px', align: 'center', render: (v) => (
      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{v as number}</span>
    )},
    { key: 'name', label: 'ë¸Œëœ?œëª…', render: (v) => (
      <span style={{ fontWeight: 600 }}>{v as string}</span>
    )},
    { key: 'stockManage', label: 'ì¶œê³ ê´€ë¦?, render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string || '-'}</span>
    )},
    { key: 'canExchange', label: 'êµí™˜', align: 'center', render: (v) => (
      <span style={{ color: v ? '#34c759' : '#86868b' }}>{v ? 'O' : 'X'}</span>
    )},
    { key: 'canReturn', label: 'ë°˜í’ˆ', align: 'center', render: (v) => (
      <span style={{ color: v ? '#34c759' : '#86868b' }}>{v ? 'O' : 'X'}</span>
    )},
    { key: 'productCount', label: '?í’ˆ ??, align: 'center', render: (v) => (
      <span style={{ 
        background: '#eef4ee', 
        color: '#007aff', 
        padding: '3px 10px', 
        borderRadius: '12px', 
        fontSize: '13px',
        fontWeight: 500
      }}>
        {v as number}ê°?
      </span>
    )},
    { key: 'isActive', label: '?íƒœ', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: 'ê´€ë¦?, align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        <button
          onClick={() => openEditModal(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'var(--bg-secondary)',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ?˜ì •
        </button>
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#fff0f0',
            color: '#ff3b30',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ?? œ
        </button>
      </div>
    )},
  ]

  const filteredBrands = search 
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands

  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0)
  const activeBrands = brands.filter(b => b.isActive).length
  const inactiveBrands = brands.filter(b => !b.isActive).length

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ë¸Œëœ??ê´€ë¦?
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ì´?ë¸Œëœ??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {brands.length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?œì„±</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {activeBrands}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ë¹„í™œ??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {inactiveBrands}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ì´??í’ˆ</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {totalProducts}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="ë¸Œëœ?œëª… ê²€??
        value={search}
        onChange={setSearch}
        actions={
          <button
            onClick={() => openEditModal(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + ë¸Œëœ???±ë¡
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredBrands}
        loading={loading}
        emptyMessage="?±ë¡??ë¸Œëœ?œê? ?†ìŠµ?ˆë‹¤"
      />

      {/* ?±ë¡/?˜ì • ëª¨ë‹¬ */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '440px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingBrand ? 'ë¸Œëœ???˜ì •' : 'ë¸Œëœ???±ë¡'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ë¸Œëœ?œëª… *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ì¶œê³ ê´€ë¦?/label>
                <select 
                  value={formData.stockManage}
                  onChange={(e) => setFormData({ ...formData, stockManage: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                >
                  <option value="">ë¯¸ì‚¬??/option>
                  <option value="barcode">ë°”ì½”??/option>
                  <option value="manual">?˜ë™</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?œì„œ</label>
                <input 
                  type="number" 
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.canExchange}
                  onChange={(e) => setFormData({ ...formData, canExchange: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>êµí™˜ ê°€??/span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.canReturn}
                  onChange={(e) => setFormData({ ...formData, canReturn: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>ë°˜í’ˆ ê°€??/span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>?œì„±</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                ì·¨ì†Œ
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                ?€??
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
