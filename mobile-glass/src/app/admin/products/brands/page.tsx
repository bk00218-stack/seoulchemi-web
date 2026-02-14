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
  
  // 폼 상태
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
        alert(error.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 브랜드를 삭제하시겠습니까?')) return
    
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadBrands()
      } else {
        const error = await res.json()
        alert(error.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제에 실패했습니다.')
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
    { key: 'displayOrder', label: '순서', width: '60px', align: 'center', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as number}</span>
    )},
    { key: 'name', label: '브랜드명', render: (v) => (
      <span style={{ fontWeight: 600 }}>{v as string}</span>
    )},
    { key: 'stockManage', label: '출고관리', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string || '-'}</span>
    )},
    { key: 'canExchange', label: '교환', align: 'center', render: (v) => (
      <span style={{ color: v ? '#34c759' : '#86868b' }}>{v ? 'O' : 'X'}</span>
    )},
    { key: 'canReturn', label: '반품', align: 'center', render: (v) => (
      <span style={{ color: v ? '#34c759' : '#86868b' }}>{v ? 'O' : 'X'}</span>
    )},
    { key: 'productCount', label: '상품 수', align: 'center', render: (v) => (
      <span style={{ 
        background: '#eef4ee', 
        color: '#007aff', 
        padding: '3px 10px', 
        borderRadius: '12px', 
        fontSize: '13px',
        fontWeight: 500
      }}>
        {v as number}개
      </span>
    )},
    { key: 'isActive', label: '상태', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        <button
          onClick={() => openEditModal(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#f5f5f7',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          수정
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
          삭제
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
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        브랜드 관리
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 브랜드</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
            {brands.length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {activeBrands}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>비활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {inactiveBrands}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {totalProducts}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="브랜드명 검색"
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
            + 브랜드 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredBrands}
        loading={loading}
        emptyMessage="등록된 브랜드가 없습니다"
      />

      {/* 등록/수정 모달 */}
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
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '440px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingBrand ? '브랜드 수정' : '브랜드 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드명 *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>출고관리</label>
                <select 
                  value={formData.stockManage}
                  onChange={(e) => setFormData({ ...formData, stockManage: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="">미사용</option>
                  <option value="barcode">바코드</option>
                  <option value="manual">수동</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>순서</label>
                <input 
                  type="number" 
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
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
                <span style={{ fontSize: '13px' }}>교환 가능</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.canReturn}
                  onChange={(e) => setFormData({ ...formData, canReturn: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>반품 가능</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>활성</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
