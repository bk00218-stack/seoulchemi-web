'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface Brand {
  id: number
  name: string
  stockManage: string | null
  canExchange: boolean
  canReturn: boolean
  isActive: boolean
  displayOrder: number
  productCount: number
  productLineCount: number
  activeCount: number
  inactiveCount: number
  category?: { id: number; name: string; code: string } | null
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  
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
      setBrands(data.brands || data)
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('브랜드명을 입력해주세요.')
      return
    }

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
    if (!confirm('이 브랜드를 삭제하시겠습니까?\n연결된 상품이 있으면 삭제할 수 없습니다.')) return
    
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

  const filteredBrands = search 
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands

  const totalProducts = brands.reduce((sum, b) => sum + (b.productCount || 0), 0)
  const activeBrands = brands.filter(b => b.isActive).length

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>브랜드 관리</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          브랜드를 등록하고 관리합니다. 브랜드별 상품 수와 상태를 확인할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>총 브랜드</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{brands.length}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>활성 브랜드</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{activeBrands}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>비활성</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>{brands.length - activeBrands}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>총 상품</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#007aff' }}>{totalProducts.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
      </div>

      {/* 검색 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 브랜드명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            fontSize: 14,
            width: 300,
            outline: 'none'
          }}
        />
        <button
          onClick={() => openEditModal(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: '#007aff',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + 브랜드 등록
        </button>
      </div>

      {/* 브랜드 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
        ) : filteredBrands.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            {search ? '검색 결과가 없습니다.' : '등록된 브랜드가 없습니다.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 60 }}>순서</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>브랜드명</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>출고관리</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 70 }}>교환</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 70 }}>반품</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>상품 수</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 120 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map(brand => (
                <tr key={brand.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>{brand.displayOrder}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{brand.name}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
                    {brand.stockManage === 'barcode' ? '바코드' : brand.stockManage === 'manual' ? '수동' : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ color: brand.canExchange ? '#34c759' : 'var(--gray-300)' }}>{brand.canExchange ? '●' : '○'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ color: brand.canReturn ? '#34c759' : 'var(--gray-300)' }}>{brand.canReturn ? '●' : '○'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: 'var(--gray-100)',
                      color: '#007aff',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 500
                    }}>
                      {brand.productCount || 0}개
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: brand.isActive ? '#e8f5e9' : '#fef3e7',
                      color: brand.isActive ? '#34c759' : '#ff9500'
                    }}>
                      {brand.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={() => openEditModal(brand)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: 'var(--gray-100)',
                          color: '#007aff',
                          border: 'none',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: '#fff0f0',
                          color: '#ff3b30',
                          border: 'none',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
            borderRadius: 16,
            padding: 28,
            width: 460,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, margin: '0 0 24px' }}>
              {editingBrand ? '브랜드 수정' : '브랜드 등록'}
            </h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>브랜드명 *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="브랜드명을 입력하세요"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>출고관리</label>
                <select 
                  value={formData.stockManage}
                  onChange={(e) => setFormData({ ...formData, stockManage: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none' }}
                >
                  <option value="">미사용</option>
                  <option value="barcode">바코드</option>
                  <option value="manual">수동</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>순서</label>
                <input 
                  type="number" 
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24, padding: '16px 0', borderTop: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.canExchange}
                  onChange={(e) => setFormData({ ...formData, canExchange: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#007aff' }}
                />
                <span style={{ fontSize: 14 }}>교환 가능</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.canReturn}
                  onChange={(e) => setFormData({ ...formData, canReturn: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#007aff' }}
                />
                <span style={{ fontSize: 14 }}>반품 가능</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#007aff' }}
                />
                <span style={{ fontSize: 14 }}>활성</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '12px 24px', borderRadius: 8, background: 'var(--gray-100)', color: '#1d1d1f', border: 'none', fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '12px 28px', borderRadius: 8, background: '#007aff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
