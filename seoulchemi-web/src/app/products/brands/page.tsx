'use client'

import { useToast } from '@/contexts/ToastContext'
import React, { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface Category {
  id: number
  name: string
  code: string
  _count?: { brands: number }
}

interface ProductLine {
  id: number
  name: string
  _count?: { products: number }
}

interface Brand {
  id: number
  name: string
  categoryId: number | null
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
  productLines?: ProductLine[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--gray-50)',
  transition: 'border-color 0.2s, background 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: 'var(--gray-700)',
}

export default function BrandsPage() {
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [expandedBrand, setExpandedBrand] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '' as string,
    stockManage: '',
    canExchange: false,
    canReturn: false,
    isActive: true,
    displayOrder: 0
  })

  useEffect(() => {
    loadCategories()
    loadBrands()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

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
      toast.warning('브랜드명을 입력해주세요.')
      return
    }

    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        })
      })

      if (res.ok) {
        setShowModal(false)
        loadBrands()
      } else {
        const error = await res.json()
        toast.error(error.error || '저장에 실패했습니다.')
      }
    } catch {
      toast.error('저장에 실패했습니다.')
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
        toast.error(error.error || '삭제에 실패했습니다.')
      }
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const openEditModal = (brand: Brand | null) => {
    if (brand) {
      setFormData({
        name: brand.name,
        categoryId: brand.categoryId ? String(brand.categoryId) : '',
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
        categoryId: selectedCategory !== 'all' ? String(selectedCategory) : '',
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

  // 필터링
  const filteredBrands = brands.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || b.categoryId === selectedCategory
    return matchSearch && matchCategory
  })

  const totalProducts = brands.reduce((sum, b) => sum + (b.productCount || 0), 0)
  const activeBrands = brands.filter(b => b.isActive).length
  const totalProductLines = brands.reduce((sum, b) => sum + (b.productLineCount || 0), 0)

  // 카테고리별 통계
  const getCategoryStats = (catId: number) => {
    const catBrands = brands.filter(b => b.categoryId === catId)
    return {
      brands: catBrands.length,
      products: catBrands.reduce((sum, b) => sum + (b.productCount || 0), 0)
    }
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>브랜드 관리</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
          브랜드를 등록하고 관리합니다. 대분류별로 브랜드를 분류하고 품목·상품 현황을 확인할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 브랜드</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)' }}>
                {brands.length}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏷️</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>활성 / 비활성</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#34c759' }}>
                {activeBrands}
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--gray-400)', marginLeft: 4 }}>/</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#ff9500', marginLeft: 2 }}>{brands.length - activeBrands}</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 품목</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#5856d6' }}>
                {totalProductLines}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede7f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 상품</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#007aff' }}>
                {totalProducts.toLocaleString()}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
          </div>
        </div>
      </div>

      {/* 대분류 탭 필터 */}
      <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginRight: 4 }}>대분류:</span>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: selectedCategory === 'all' ? 600 : 400,
            background: selectedCategory === 'all' ? 'var(--primary)' : '#fff',
            color: selectedCategory === 'all' ? '#fff' : 'var(--gray-600)',
            border: selectedCategory === 'all' ? 'none' : '1px solid var(--gray-200)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          전체 ({brands.length})
        </button>
        {categories.map(cat => {
          const stats = getCategoryStats(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: selectedCategory === cat.id ? 600 : 400,
                background: selectedCategory === cat.id ? 'var(--primary)' : '#fff',
                color: selectedCategory === cat.id ? '#fff' : 'var(--gray-600)',
                border: selectedCategory === cat.id ? 'none' : '1px solid var(--gray-200)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.name} ({stats.brands})
            </button>
          )
        })}
      </div>

      {/* 검색 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="브랜드명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '10px 14px 10px 36px',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
                fontSize: 14,
                width: 300,
                outline: 'none',
                background: 'var(--gray-50)',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--gray-400)' }}>🔍</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {filteredBrands.length}개 표시
          </span>
        </div>
        <button
          onClick={() => openEditModal(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'opacity 0.2s',
          }}
        >
          + 브랜드 등록
        </button>
      </div>

      {/* 브랜드 목록 */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            로딩 중...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              {search ? '검색 결과가 없습니다' : '등록된 브랜드가 없습니다'}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? '다른 검색어를 시도해보세요' : '상단의 "브랜드 등록" 버튼으로 새 브랜드를 추가하세요'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 14, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 45, fontSize: 13, whiteSpace: 'nowrap' }}>순서</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-600)', fontSize: 13, whiteSpace: 'nowrap' }}>브랜드명</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 110, fontSize: 13, whiteSpace: 'nowrap' }}>대분류</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 85, fontSize: 13, whiteSpace: 'nowrap' }}>출고관리</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 45, fontSize: 13, whiteSpace: 'nowrap' }}>교환</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 45, fontSize: 13, whiteSpace: 'nowrap' }}>반품</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 45, fontSize: 13, whiteSpace: 'nowrap' }}>품목</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 95, fontSize: 13, whiteSpace: 'nowrap' }}>상품</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 55, fontSize: 13, whiteSpace: 'nowrap' }}>상태</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 100, fontSize: 13, whiteSpace: 'nowrap' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map(brand => (
                <React.Fragment key={brand.id}>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer',
                      background: expandedBrand === brand.id ? 'var(--primary-light)' : undefined,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                    onMouseEnter={e => { if (expandedBrand !== brand.id) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)' }}
                    onMouseLeave={e => { if (expandedBrand !== brand.id) (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {brand.displayOrder}
                    </td>
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{brand.name}</span>
                        {(brand.productLines?.length || 0) > 0 && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--gray-400)',
                            transform: expandedBrand === brand.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}>▼</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {brand.category ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          background: brand.category.code === 'SPARE' ? '#e3f2fd' :
                                     brand.category.code === 'RX' ? '#fce4ec' :
                                     brand.category.code === 'CONTACT' ? '#e8f5e9' : 'var(--gray-100)',
                          color: brand.category.code === 'SPARE' ? '#1565c0' :
                                brand.category.code === 'RX' ? '#c62828' :
                                brand.category.code === 'CONTACT' ? '#2e7d32' : 'var(--gray-600)',
                        }}>
                          {brand.category.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap', color: 'var(--gray-600)', fontSize: 13 }}>
                      {brand.stockManage === 'barcode' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: '#f3e5f5', color: '#7b1fa2', fontSize: 11, whiteSpace: 'nowrap' }}>
                          📊 바코드
                        </span>
                      ) : brand.stockManage === 'manual' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: '#fff3e0', color: '#e65100', fontSize: 11, whiteSpace: 'nowrap' }}>
                          ✋ 수동
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 22, height: 22,
                        borderRadius: '50%',
                        lineHeight: '22px',
                        fontSize: 12,
                        background: brand.canExchange ? '#e8f5e9' : 'var(--gray-100)',
                        color: brand.canExchange ? '#2e7d32' : 'var(--gray-300)',
                      }}>
                        {brand.canExchange ? '✓' : '−'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 22, height: 22,
                        borderRadius: '50%',
                        lineHeight: '22px',
                        fontSize: 12,
                        background: brand.canReturn ? '#e8f5e9' : 'var(--gray-100)',
                        color: brand.canReturn ? '#2e7d32' : 'var(--gray-300)',
                      }}>
                        {brand.canReturn ? '✓' : '−'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: '#ede7f6',
                        color: '#5856d6',
                      }}>
                        {brand.productLineCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#007aff' }}>
                          {brand.productCount || 0}
                        </span>
                        {brand.activeCount > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                            ({brand.activeCount}/{brand.inactiveCount || 0})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        background: brand.isActive ? '#e8f5e9' : '#fef3e7',
                        color: brand.isActive ? '#2e7d32' : '#e65100'
                      }}>
                        {brand.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(brand)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: 'var(--gray-100)',
                            color: '#007aff',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#fff0f0',
                            color: '#ff3b30',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* 확장 영역: 품목 목록 */}
                  {expandedBrand === brand.id && brand.productLines && brand.productLines.length > 0 && (
                    <tr key={`${brand.id}-expanded`}>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <div style={{
                          background: 'var(--gray-50)',
                          padding: '12px 16px 12px 60px',
                          borderBottom: '1px solid var(--gray-200)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
                            품목 목록 ({brand.productLines.length}개)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {brand.productLines.map(line => (
                              <div
                                key={line.id}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: '#fff',
                                  border: '1px solid var(--gray-200)',
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <span style={{ color: 'var(--gray-800)' }}>{line.name}</span>
                                <span style={{
                                  fontSize: 11,
                                  color: '#007aff',
                                  background: '#e3f2fd',
                                  padding: '1px 6px',
                                  borderRadius: 8,
                                  fontWeight: 500,
                                }}>
                                  {line._count?.products || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
            width: 520,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingBrand ? '브랜드 수정' : '브랜드 등록'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>브랜드명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 케미그라스, 호야, 에실로..."
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>대분류</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">미분류</option>
                {categories.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>출고관리</label>
                <select
                  value={formData.stockManage}
                  onChange={(e) => setFormData({ ...formData, stockManage: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">미사용</option>
                  <option value="barcode">바코드</option>
                  <option value="manual">수동</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>표시 순서</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 24,
              marginBottom: 24,
              padding: 16,
              background: 'var(--gray-50)',
              borderRadius: 10,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.canExchange}
                  onChange={(e) => setFormData({ ...formData, canExchange: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                교환 가능
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.canReturn}
                  onChange={(e) => setFormData({ ...formData, canReturn: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                반품 가능
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                활성
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'var(--gray-100)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {editingBrand ? '수정 저장' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
