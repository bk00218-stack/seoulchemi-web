'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface DeliveryInfo {
  id: number
  code: string
  name: string
  ownerName: string | null
  phone: string | null
  address: string | null
  deliveryContact: string | null
  deliveryPhone: string | null
  deliveryAddress: string | null
  deliveryZipcode: string | null
  deliveryMemo: string | null
  updatedAt: string
}

export default function DeliveryPage() {
  const [data, setData] = useState<DeliveryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<DeliveryInfo>>({})

  useEffect(() => {
    loadData()
  }, [region])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (region) params.append('region', region)
      
      const res = await fetch(`/api/stores/delivery?${params}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to load delivery info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    loadData()
  }

  const startEdit = (item: DeliveryInfo) => {
    setEditingId(item.id)
    setEditForm({
      deliveryContact: item.deliveryContact || item.ownerName || '',
      deliveryPhone: item.deliveryPhone || item.phone || '',
      deliveryAddress: item.deliveryAddress || item.address || '',
      deliveryZipcode: item.deliveryZipcode || '',
      deliveryMemo: item.deliveryMemo || ''
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    
    try {
      const res = await fetch('/api/stores/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ id: editingId, ...editForm }]
        })
      })
      
      if (res.ok) {
        setEditingId(null)
        loadData()
      }
    } catch (error) {
      alert('?�?�에 ?�패?�습?�다.')
    }
  }

  const columns: Column<DeliveryInfo>[] = [
    { key: 'code', label: '가맹점코드', width: '100px', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>{v as string}</span>
    )},
    { key: 'name', label: '?�경?�명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'deliveryContact', label: '?�당??, render: (v, row) => {
      if (editingId === row.id) {
        return (
          <input
            type="text"
            value={editForm.deliveryContact || ''}
            onChange={(e) => setEditForm({ ...editForm, deliveryContact: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', border: '1px solid #007aff', borderRadius: '4px', fontSize: '13px' }}
          />
        )
      }
      return <span>{(v as string) || row.ownerName || '-'}</span>
    }},
    { key: 'deliveryPhone', label: '?�락�?, render: (v, row) => {
      if (editingId === row.id) {
        return (
          <input
            type="text"
            value={editForm.deliveryPhone || ''}
            onChange={(e) => setEditForm({ ...editForm, deliveryPhone: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', border: '1px solid #007aff', borderRadius: '4px', fontSize: '13px' }}
          />
        )
      }
      return <span>{(v as string) || row.phone || '-'}</span>
    }},
    { key: 'deliveryAddress', label: '배송주소', render: (v, row) => {
      if (editingId === row.id) {
        return (
          <input
            type="text"
            value={editForm.deliveryAddress || ''}
            onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', border: '1px solid #007aff', borderRadius: '4px', fontSize: '13px' }}
          />
        )
      }
      return <span style={{ fontSize: '12px' }}>{(v as string) || row.address || '-'}</span>
    }},
    { key: 'deliveryMemo', label: '배송메모', render: (v, row) => {
      if (editingId === row.id) {
        return (
          <input
            type="text"
            value={editForm.deliveryMemo || ''}
            onChange={(e) => setEditForm({ ...editForm, deliveryMemo: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', border: '1px solid #007aff', borderRadius: '4px', fontSize: '13px' }}
            placeholder="배송메모 ?�력"
          />
        )
      }
      return <span style={{ color: '#666', fontSize: '12px' }}>{(v as string) || '-'}</span>
    }},
    { key: 'id', label: '관�?, width: '100px', align: 'center', render: (_, row) => {
      if (editingId === row.id) {
        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <button
              onClick={saveEdit}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ?�??
            </button>
            <button
              onClick={() => setEditingId(null)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: '#666',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
          </div>
        )
      }
      return (
        <button
          onClick={() => startEdit(row)}
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
          ?�정
        </button>
      )
    }},
  ]

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        출고 배송지 ?�보
      </h2>

      <div style={{ 
        background: '#eef4ee', 
        borderRadius: '8px', 
        padding: '16px 20px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#4a6b4a'
      }}>
        ?�� <strong>배송지 관�??�내</strong><br />
        가맹점�?기본 배송지 ?�보�?관리합?�다. 배송지 변�????�당 가맹점??모든 주문???�용?�니??
      </div>

      <SearchFilter
        placeholder="가맹점�? 주소 검??
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        filters={[
          {
            key: 'region',
            label: '지??,
            options: [
              { label: '지??, value: '' },
              { label: '?�울', value: '?�울' },
              { label: '경기', value: '경기' },
              { label: '?�천', value: '?�천' }
            ],
            value: region,
            onChange: setRegion
          }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ?�� ?��?
            </button>
            <button
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ?�️ ?�괄?�정
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="배송지 ?�보가 ?�습?�다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: 'var(--bg-primary)', 
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#666'
      }}>
        <span>�?{data.length}�?가맹점</span>
        <span>최근 ?�데?�트: {data.length > 0 ? new Date(data[0].updatedAt).toLocaleDateString('ko-KR') : '-'}</span>
      </div>
    </AdminLayout>
  )
}
