'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface InventoryItem {
  id: number
  productId: number
  productName: string
  brandName: string
  optionName: string
  barcode: string | null
  stock: number
  location: string | null
  isActive: boolean
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStock, setEditStock] = useState(0)
  const [changes, setChanges] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      const res = await fetch(`/api/inventory?${params}`)
      setData(await res.json())
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockChange = (id: number, newStock: number) => {
    const newChanges = new Map(changes)
    newChanges.set(id, newStock)
    setChanges(newChanges)
  }

  const saveChanges = async () => {
    if (changes.size === 0) return
    
    try {
      const updates = Array.from(changes.entries()).map(([id, stock]) => ({ id, stock }))
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      
      if (res.ok) {
        setChanges(new Map())
        loadData()
        alert(`${updates.length}개 항목이 저장되었습니다.`)
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
  }

  const columns: Column<InventoryItem>[] = [
    { key: 'brandName', label: '브랜드', width: '100px', render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {v as string}
      </span>
    )},
    { key: 'productName', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionName', label: '옵션', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'barcode', label: '바코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{(v as string) || '-'}</span>
    )},
    { key: 'stock', label: '현재고', align: 'center', render: (v, row) => {
      const changed = changes.get(row.id)
      const currentStock = changed !== undefined ? changed : (v as number)
      const isChanged = changed !== undefined
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <button
            onClick={() => handleStockChange(row.id, Math.max(0, currentStock - 1))}
            style={{ width: '24px', height: '24px', border: '1px solid #e5e5e5', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
          >
            -
          </button>
          <input
            type="number"
            value={currentStock}
            onChange={(e) => handleStockChange(row.id, parseInt(e.target.value) || 0)}
            style={{
              width: '60px',
              textAlign: 'center',
              padding: '4px',
              border: isChanged ? '2px solid #007aff' : '1px solid #e5e5e5',
              borderRadius: '4px',
              background: isChanged ? '#f0f7ff' : '#fff'
            }}
          />
          <button
            onClick={() => handleStockChange(row.id, currentStock + 1)}
            style={{ width: '24px', height: '24px', border: '1px solid #e5e5e5', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
          >
            +
          </button>
        </div>
      )
    }},
    { key: 'location', label: '위치', render: (v) => (
      <span style={{ color: '#666', fontSize: '12px' }}>{(v as string) || '-'}</span>
    )},
  ]

  const lowStock = data.filter(d => d.stock > 0 && d.stock <= 10).length
  const outOfStock = data.filter(d => d.stock === 0).length

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        일괄재고수정
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 옵션</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>재고부족</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{lowStock}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{outOfStock}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>변경됨</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{changes.size}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="상품명, 바코드 검색"
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        actions={
          <button
            onClick={saveChanges}
            disabled={changes.size === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: changes.size > 0 ? '#007aff' : '#e5e5e5',
              color: changes.size > 0 ? '#fff' : '#86868b',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: changes.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            💾 {changes.size}개 저장
          </button>
        }
      />

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="재고 데이터가 없습니다" />
    </AdminLayout>
  )
}
