'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../../components/Navigation'
import DataTable, { Column } from '../../../../components/DataTable'
import SearchFilter from '../../../../components/SearchFilter'

interface GroupDiscount {
  id: number
  groupId: number
  groupName: string
  brandId: number
  brandName: string
  productType: string
  discountRate: number
  minQuantity: number
  isActive: boolean
  updatedAt: string
}

interface StoreGroup {
  id: number
  name: string
  discountRate: number
}

interface Brand {
  id: number
  name: string
}

export default function GroupDiscountsPage() {
  const [discounts, setDiscounts] = useState<GroupDiscount[]>([])
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<GroupDiscount | null>(null)
  const [groupFilter, setGroupFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  
  const [formData, setFormData] = useState({
    groupId: 0,
    brandId: 0,
    productType: 'all',
    discountRate: 0,
    minQuantity: 1,
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [groupFilter, brandFilter])

  const loadData = async () => {
    try {
      // Load groups
      const groupsRes = await fetch('/api/store-groups')
      const groupsData = await groupsRes.json()
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      
      // Load brands
      const brandsRes = await fetch('/api/products')
      const brandsData = await brandsRes.json()
      setBrands(brandsData.brands || [])
      
      // Load discounts (mock data for now)
      const mockDiscounts: GroupDiscount[] = [
        { id: 1, groupId: 1, groupName: 'VIP 그룹', brandId: 1, brandName: '호야', productType: 'all', discountRate: 15, minQuantity: 1, isActive: true, updatedAt: new Date().toISOString() },
        { id: 2, groupId: 1, groupName: 'VIP 그룹', brandId: 2, brandName: '에실로', productType: 'rx', discountRate: 12, minQuantity: 5, isActive: true, updatedAt: new Date().toISOString() },
        { id: 3, groupId: 2, groupName: '도매 그룹', brandId: 1, brandName: '호야', productType: 'all', discountRate: 20, minQuantity: 10, isActive: true, updatedAt: new Date().toISOString() },
      ]
      
      let filtered = mockDiscounts
      if (groupFilter) {
        filtered = filtered.filter(d => d.groupId === parseInt(groupFilter))
      }
      if (brandFilter) {
        filtered = filtered.filter(d => d.brandId === parseInt(brandFilter))
      }
      setDiscounts(filtered)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (discount: GroupDiscount | null) => {
    if (discount) {
      setFormData({
        groupId: discount.groupId,
        brandId: discount.brandId,
        productType: discount.productType,
        discountRate: discount.discountRate,
        minQuantity: discount.minQuantity,
        isActive: discount.isActive
      })
      setEditingDiscount(discount)
    } else {
      setFormData({
        groupId: groups[0]?.id || 0,
        brandId: 0,
        productType: 'all',
        discountRate: 0,
        minQuantity: 1,
        isActive: true
      })
      setEditingDiscount(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.groupId) {
      alert('그룹을 선택해주세요')
      return
    }
    
    // TODO: API call
    alert(editingDiscount ? '할인율이 수정되었습니다.' : '할인율이 등록되었습니다.')
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 할인 설정을 삭제하시겠습니까?')) return
    // TODO: API call
    alert('삭제되었습니다.')
    loadData()
  }

  const columns: Column<GroupDiscount>[] = [
    { key: 'groupName', label: '그룹', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ 
        background: '#f0f7ff', 
        color: '#007aff', 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {(v as string) || '전체'}
      </span>
    )},
    { key: 'productType', label: '상품유형', render: (v) => {
      const types: Record<string, string> = { all: '전체', rx: 'RX', spare: '여벌' }
      return <span style={{ color: '#666', fontSize: '13px' }}>{types[v as string] || v}</span>
    }},
    { key: 'discountRate', label: '할인율', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        fontSize: '15px',
        color: '#ff6b00' 
      }}>
        {v as number}%
      </span>
    )},
    { key: 'minQuantity', label: '최소수량', align: 'center', render: (v) => (
      <span>{v as number}개 이상</span>
    )},
    { key: 'isActive', label: '상태', align: 'center', render: (v) => (
      <span style={{
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        background: v ? '#e8f5e9' : '#f5f5f7',
        color: v ? '#2e7d32' : '#86868b'
      }}>
        {v ? '활성' : '비활성'}
      </span>
    )},
    { key: 'id', label: '관리', width: '100px', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => openModal(row)}
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

  const avgDiscount = discounts.length > 0 
    ? Math.round(discounts.reduce((sum, d) => sum + d.discountRate, 0) / discounts.length) 
    : 0

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 할인율 설정
      </h2>

      <div style={{ 
        background: '#fff3e0', 
        borderRadius: '8px', 
        padding: '16px 20px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#e65100'
      }}>
        💡 <strong>할인율 적용 안내</strong><br />
        그룹에 속한 가맹점 주문 시 자동으로 할인율이 적용됩니다. 브랜드/상품유형별로 세분화된 할인 설정이 가능합니다.
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 설정</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{discounts.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>대상 그룹</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{groups.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>평균 할인율</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff6b00' }}>{avgDiscount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>%</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성 설정</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{discounts.filter(d => d.isActive).length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="그룹, 브랜드 검색"
        filters={[
          {
            key: 'group',
            label: '그룹',
            options: [
              { label: '전체 그룹', value: '' },
              ...groups.map(g => ({ label: g.name, value: String(g.id) }))
            ],
            value: groupFilter,
            onChange: setGroupFilter
          },
          {
            key: 'brand',
            label: '브랜드',
            options: [
              { label: '전체 브랜드', value: '' },
              ...brands.map(b => ({ label: b.name, value: String(b.id) }))
            ],
            value: brandFilter,
            onChange: setBrandFilter
          }
        ]}
        actions={
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
            + 할인 설정
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        emptyMessage="등록된 할인 설정이 없습니다"
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
            width: '480px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingDiscount ? '할인 설정 수정' : '할인 설정 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹 *</label>
              <select 
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
              >
                <option value={0}>선택하세요</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} (기본 {g.discountRate}%)</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드</label>
                <select 
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value={0}>전체 브랜드</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상품유형</label>
                <select 
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="all">전체</option>
                  <option value="rx">RX렌즈</option>
                  <option value="spare">여벌렌즈</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>할인율 (%) *</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>최소수량</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>활성화</span>
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
