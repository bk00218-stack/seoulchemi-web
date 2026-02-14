'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface Store {
  id: number
  code: string
  name: string
  ownerName: string
  phone: string
  address: string
  isActive: boolean
  orderCount: number
  lastOrderDate: string | null
  createdAt: string
}

interface Stats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
}

interface StoreGroup {
  id: number
  name: string
}

interface FormData {
  code: string
  name: string
  ownerName: string
  phone: string
  mobile: string
  address: string
  paymentTermDays: number
  billingDay: number | null
  groupId: number | null
  salesRepName: string
  deliveryContact: string
  isActive: boolean
}

const initialFormData: FormData = {
  code: '',
  name: '',
  ownerName: '',
  phone: '',
  mobile: '',
  address: '',
  paymentTermDays: 30,
  billingDay: null,
  groupId: null,
  salesRepName: '',
  deliveryContact: '',
  isActive: true,
}

export default function StoresPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [data, setData] = useState<Store[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, newThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [groups, setGroups] = useState<StoreGroup[]>([])

  // ê·¸ë£¹ ëª©ë¡ ê°€?¸ì˜¤ê¸?
  useEffect(() => {
    fetch('/api/store-groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGroups(data)
        }
      })
      .catch(err => console.error('Failed to fetch groups:', err))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/stores?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.stores)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
    setLoading(false)
  }, [filter, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const openModal = (store: any | null = null) => {
    if (store) {
      setEditingStore(store)
      setFormData({
        code: store.code,
        name: store.name,
        ownerName: store.ownerName === '-' ? '' : store.ownerName,
        phone: store.phone === '-' ? '' : store.phone,
        mobile: store.mobile || '',
        address: store.address === '-' ? '' : store.address,
        paymentTermDays: store.paymentTermDays || 30,
        billingDay: store.billingDay || null,
        groupId: store.groupId || null,
        salesRepName: store.salesRepName || '',
        deliveryContact: store.deliveryContact || '',
        isActive: store.isActive,
      })
    } else {
      setEditingStore(null)
      setFormData(initialFormData)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('?ˆê²½?ëª…???…ë ¥?´ì£¼?¸ìš”.')
      return
    }
    
    setSaving(true)
    try {
      const url = editingStore 
        ? `/api/stores/${editingStore.id}` 
        : '/api/stores'
      
      const res = await fetch(url, {
        method: editingStore ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const json = await res.json()
      
      if (json.error) {
        alert(json.error)
        return
      }
      
      alert(editingStore ? '?˜ì •?˜ì—ˆ?µë‹ˆ??' : '?±ë¡?˜ì—ˆ?µë‹ˆ??')
      setShowModal(false)
      fetchData()
    } catch (error) {
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
    setSaving(false)
  }

  const handleDelete = async (store: Store) => {
    if (!confirm(`'${store.name}'??ë¥? ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?`)) return
    
    try {
      const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' })
      const json = await res.json()
      
      if (json.error) {
        alert(json.error)
        return
      }
      
      alert(json.message)
      fetchData()
    } catch (error) {
      alert('?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
  }

  const columns: Column<Store>[] = [
    { key: 'code', label: 'ì½”ë“œ', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>{v as string}</span>
    )},
    { key: 'name', label: '?ˆê²½?ëª…', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'ownerName', label: '?€?œì' },
    { key: 'phone', label: '?°ë½ì²?, render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'address', label: 'ì£¼ì†Œ', width: '200px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'orderCount', label: 'ì£¼ë¬¸??, align: 'center', render: (v) => (
      <span style={{ 
        background: (v as number) > 0 ? '#eef4ee' : '#f5f5f7', 
        color: (v as number) > 0 ? '#007aff' : '#86868b',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v as number}ê±?
      </span>
    )},
    { key: 'lastOrderDate', label: 'ìµœê·¼ì£¼ë¬¸', render: (v) => (
      v ? (
        <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>?†ìŒ</span>
      )
    )},
    { key: 'isActive', label: '?íƒœ', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: 'ê´€ë¦?, align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => router.push(`/admin/stores/${row.id}/discounts`)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#fff3e0',
            color: '#e65100',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ? ì¸
        </button>
        <button
          onClick={() => openModal(row)}
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
          onClick={() => handleDelete(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: '#ff3b30',
            border: '1px solid #ff3b30',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ?? œ
        </button>
      </div>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ê°€ë§¹ì  ê´€ë¦?
      </h2>

      <StatCardGrid>
        <StatCard label="ì´?ê°€ë§¹ì " value={stats.total} unit="ê°? icon="?ª" />
        <StatCard label="?œì„±" value={stats.active} unit="ê°? />
        <StatCard label="ë¹„í™œ?? value={stats.inactive} unit="ê°? />
        <StatCard label="?´ë²ˆ ??? ê·œ" value={stats.newThisMonth} unit="ê°? highlight />
      </StatCardGrid>

      <SearchFilter
        placeholder="ê°€ë§¹ì ëª? ì½”ë“œ, ?°ë½ì²? ?€?œì ê²€??
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        actions={
          <>
            <OutlineButton onClick={() => alert('?‘ì? ?¤ìš´ë¡œë“œ - ì¤€ë¹?ì¤?)}>?“¥ ?‘ì?</OutlineButton>
            <button
              onClick={() => openModal(null)}
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
              + ê°€ë§¹ì  ?±ë¡
            </button>
          </>
        }
      />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: `?„ì²´ (${stats.total})`, value: 'all' },
            { label: `?œì„± (${stats.active})`, value: 'active' },
            { label: `ë¹„í™œ??(${stats.inactive})`, value: 'inactive' },
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          ë¡œë”© ì¤?..
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="?±ë¡??ê°€ë§¹ì ???†ìŠµ?ˆë‹¤"
          />
          
          {/* ?˜ì´ì§€?¤ì´??*/}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px', 
              marginTop: '20px' 
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === 1 ? '#f5f5f7' : '#fff',
                  color: page === 1 ? '#c5c5c7' : '#007aff',
                  border: '1px solid var(--border-color)',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                ?´ì „
              </button>
              <span style={{ 
                padding: '8px 16px', 
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === totalPages ? '#f5f5f7' : '#fff',
                  color: page === totalPages ? '#c5c5c7' : '#007aff',
                  border: '1px solid var(--border-color)',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                ?¤ìŒ
              </button>
            </div>
          )}
        </>
      )}

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
            width: '520px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingStore ? 'ê°€ë§¹ì  ?˜ì •' : 'ê°€ë§¹ì  ?±ë¡'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-tertiary)' }}>
                  ê°€ë§¹ì  ì½”ë“œ
                </label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="?ë™?ì„±"
                  disabled={!!editingStore}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px',
                    background: editingStore ? '#f5f5f7' : '#fff'
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  ?ˆê²½?ëª… <span style={{ color: '#ff3b30' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?€?œì</label>
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?„í™”</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="02-000-0000"
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?¸ë“œ??/label>
                <input 
                  type="tel" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="010-0000-0000"
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ê²°ì œê¸°í•œ (??</label>
                <input 
                  type="number" 
                  value={formData.paymentTermDays}
                  onChange={(e) => setFormData({ ...formData, paymentTermDays: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ì²?µ¬??(ë§¤ì›”)</label>
                <input 
                  type="number" 
                  value={formData.billingDay || ''}
                  onChange={(e) => setFormData({ ...formData, billingDay: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="?? 15 (ë§¤ì›” 15??"
                  min={1}
                  max={31}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ê·¸ë£¹</label>
                <select 
                  value={formData.groupId || ''}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }}
                >
                  <option value="">? íƒ ?ˆí•¨</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?´ë‹¹</label>
                <input 
                  type="text" 
                  value={formData.salesRepName}
                  onChange={(e) => setFormData({ ...formData, salesRepName: e.target.value })}
                  placeholder="?´ë‹¹?ëª…"
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ë°°ì†¡</label>
                <input 
                  type="text" 
                  value={formData.deliveryContact}
                  onChange={(e) => setFormData({ ...formData, deliveryContact: e.target.value })}
                  placeholder="ë°°ì†¡?´ë‹¹"
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ì£¼ì†Œ</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '14px' 
                }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?íƒœ</label>
              <select 
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '14px' 
                }}
              >
                <option value="active">?œì„±</option>
                <option value="inactive">ë¹„í™œ??/option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={saving}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)', 
                  border: 'none', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                ì·¨ì†Œ
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  background: saving ? '#86868b' : '#007aff', 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  cursor: saving ? 'default' : 'pointer' 
                }}
              >
                {saving ? '?€??ì¤?..' : '?€??}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
