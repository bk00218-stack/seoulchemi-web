'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { STORES_SIDEBAR } from '../../../constants/sidebar'

interface StoreGroup {
  id: number
  name: string
  storeCount: number
}

interface DiscountSetting {
  groupId: number
  groupName: string
  brandDiscounts: { brandId: number; brandName: string; discountRate: number }[]
  defaultDiscount: number
}

// 목업 데이터
const MOCK_GROUPS: StoreGroup[] = [
  { id: 1, name: 'VIP 그룹', storeCount: 15 },
  { id: 2, name: '일반 그룹', storeCount: 45 },
  { id: 3, name: '신규 그룹', storeCount: 8 },
  { id: 4, name: '지방 그룹', storeCount: 22 },
]

const MOCK_BRANDS = [
  { id: 1, name: 'HOYA' },
  { id: 2, name: 'ZEISS' },
  { id: 3, name: 'Essilor' },
  { id: 4, name: 'Nikon' },
  { id: 5, name: '대명' },
]

const MOCK_DISCOUNTS: DiscountSetting[] = [
  {
    groupId: 1,
    groupName: 'VIP 그룹',
    defaultDiscount: 25,
    brandDiscounts: [
      { brandId: 1, brandName: 'HOYA', discountRate: 30 },
      { brandId: 2, brandName: 'ZEISS', discountRate: 25 },
      { brandId: 3, brandName: 'Essilor', discountRate: 28 },
    ],
  },
  {
    groupId: 2,
    groupName: '일반 그룹',
    defaultDiscount: 15,
    brandDiscounts: [
      { brandId: 1, brandName: 'HOYA', discountRate: 18 },
      { brandId: 2, brandName: 'ZEISS', discountRate: 15 },
    ],
  },
  {
    groupId: 3,
    groupName: '신규 그룹',
    defaultDiscount: 20,
    brandDiscounts: [
      { brandId: 1, brandName: 'HOYA', discountRate: 25 },
    ],
  },
  {
    groupId: 4,
    groupName: '지방 그룹',
    defaultDiscount: 18,
    brandDiscounts: [],
  },
]

export default function GroupDiscountsPage() {
  const [groups] = useState<StoreGroup[]>(MOCK_GROUPS)
  const [discounts, setDiscounts] = useState<DiscountSetting[]>(MOCK_DISCOUNTS)
  const [selectedGroup, setSelectedGroup] = useState<StoreGroup | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountSetting | null>(null)
  const [formData, setFormData] = useState({ defaultDiscount: 0, brandDiscounts: [] as { brandId: number; brandName: string; discountRate: number }[] })
  const [saving, setSaving] = useState(false)

  const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  const btnStyle = (variant: 'primary' | 'secondary' | 'danger' = 'secondary') => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: variant === 'primary' ? 'none' : '1px solid #e9ecef',
    background: variant === 'primary' ? '#007aff' : variant === 'danger' ? '#ff3b30' : '#fff',
    color: variant === 'primary' || variant === 'danger' ? '#fff' : '#1d1d1f',
    fontSize: '14px',
    fontWeight: 500 as const,
    cursor: 'pointer',
  })

  const handleEditDiscount = (group: StoreGroup) => {
    const existing = discounts.find(d => d.groupId === group.id)
    setSelectedGroup(group)
    
    if (existing) {
      setEditingDiscount(existing)
      setFormData({
        defaultDiscount: existing.defaultDiscount,
        brandDiscounts: [...existing.brandDiscounts],
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        defaultDiscount: 0,
        brandDiscounts: [],
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!selectedGroup) return
    
    setSaving(true)
    
    // 기존 할인 설정 업데이트 또는 새로 추가
    const newDiscount: DiscountSetting = {
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      defaultDiscount: formData.defaultDiscount,
      brandDiscounts: formData.brandDiscounts,
    }

    const existingIndex = discounts.findIndex(d => d.groupId === selectedGroup.id)
    if (existingIndex >= 0) {
      const newDiscounts = [...discounts]
      newDiscounts[existingIndex] = newDiscount
      setDiscounts(newDiscounts)
    } else {
      setDiscounts([...discounts, newDiscount])
    }

    setTimeout(() => {
      setSaving(false)
      setShowModal(false)
      alert('할인율이 저장되었습니다.')
    }, 500)
  }

  const handleAddBrandDiscount = () => {
    // 아직 추가되지 않은 브랜드 찾기
    const existingBrandIds = formData.brandDiscounts.map(bd => bd.brandId)
    const availableBrand = MOCK_BRANDS.find(b => !existingBrandIds.includes(b.id))
    
    if (!availableBrand) {
      alert('모든 브랜드가 이미 추가되어 있습니다.')
      return
    }

    setFormData({
      ...formData,
      brandDiscounts: [
        ...formData.brandDiscounts,
        { brandId: availableBrand.id, brandName: availableBrand.name, discountRate: 0 },
      ],
    })
  }

  const handleRemoveBrandDiscount = (brandId: number) => {
    setFormData({
      ...formData,
      brandDiscounts: formData.brandDiscounts.filter(bd => bd.brandId !== brandId),
    })
  }

  const handleBrandDiscountChange = (brandId: number, field: 'brandId' | 'discountRate', value: number) => {
    setFormData({
      ...formData,
      brandDiscounts: formData.brandDiscounts.map(bd => {
        if (bd.brandId === brandId) {
          if (field === 'brandId') {
            const brand = MOCK_BRANDS.find(b => b.id === value)
            return { ...bd, brandId: value, brandName: brand?.name || '' }
          }
          return { ...bd, [field]: value }
        }
        return bd
      }),
    })
  }

  const getDiscountForGroup = (groupId: number) => {
    return discounts.find(d => d.groupId === groupId)
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>그룹별 할인율 설정</h2>
      </div>

      {/* 안내 */}
      <div style={{ ...cardStyle, marginBottom: '20px', background: '#f0f7ff', border: '1px solid #007aff33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>💡</span>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>그룹별 할인율 설정 안내</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              기본 할인율은 그룹에 속한 모든 가맹점의 기본 할인율로 적용됩니다.<br />
              브랜드별 할인율을 개별 설정하면 해당 브랜드 상품에 대해 별도 할인율이 적용됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* 그룹별 할인율 테이블 */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>그룹명</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>가맹점 수</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>기본 할인율</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>브랜드별 할인</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => {
              const discount = getDiscountForGroup(group.id)
              return (
                <tr key={group.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 500 }}>{group.name}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {group.storeCount}개
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: discount?.defaultDiscount ? '#e8f5e9' : '#f5f5f7',
                      color: discount?.defaultDiscount ? '#2e7d32' : '#86868b',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>
                      {discount?.defaultDiscount || 0}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {discount?.brandDiscounts && discount.brandDiscounts.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {discount.brandDiscounts.map(bd => (
                          <span 
                            key={bd.brandId}
                            style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              background: '#e3f2fd',
                              color: '#1976d2',
                              fontSize: '12px'
                            }}
                          >
                            {bd.brandName}: {bd.discountRate}%
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#86868b', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEditDiscount(group)}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#e3f2fd', color: '#1976d2', border: 'none', fontSize: '13px', cursor: 'pointer' }}
                    >
                      설정
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 할인율 설정 모달 */}
      {showModal && selectedGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {selectedGroup.name} - 할인율 설정
            </h3>

            {/* 기본 할인율 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                기본 할인율 (%)
              </label>
              <input
                type="number"
                value={formData.defaultDiscount}
                onChange={e => setFormData({ ...formData, defaultDiscount: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '16px' }}
              />
              <p style={{ fontSize: '12px', color: '#86868b', marginTop: '6px' }}>
                이 그룹의 모든 가맹점에 적용되는 기본 할인율입니다.
              </p>
            </div>

            {/* 브랜드별 할인율 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>브랜드별 할인율</label>
                <button 
                  onClick={handleAddBrandDiscount}
                  style={{ padding: '4px 10px', borderRadius: '4px', background: '#007aff', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >
                  + 브랜드 추가
                </button>
              </div>

              {formData.brandDiscounts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#86868b', fontSize: '13px' }}>
                  브랜드별 할인율이 설정되지 않았습니다.<br />
                  기본 할인율이 모든 브랜드에 적용됩니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.brandDiscounts.map(bd => (
                    <div key={bd.brandId} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <select
                        value={bd.brandId}
                        onChange={e => handleBrandDiscountChange(bd.brandId, 'brandId', parseInt(e.target.value))}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}
                      >
                        {MOCK_BRANDS.map(brand => (
                          <option 
                            key={brand.id} 
                            value={brand.id}
                            disabled={formData.brandDiscounts.some(x => x.brandId === brand.id && x.brandId !== bd.brandId)}
                          >
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={bd.discountRate}
                          onChange={e => handleBrandDiscountChange(bd.brandId, 'discountRate', parseInt(e.target.value) || 0)}
                          min={0}
                          max={100}
                          style={{ width: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px', textAlign: 'center' }}
                        />
                        <span style={{ color: '#666' }}>%</span>
                      </div>
                      <button
                        onClick={() => handleRemoveBrandDiscount(bd.brandId)}
                        style={{ padding: '6px 8px', borderRadius: '4px', background: '#ffebee', color: '#c62828', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btnStyle('secondary')}>취소</button>
              <button onClick={handleSave} disabled={saving} style={btnStyle('primary')}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
