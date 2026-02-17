'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface RxProduct {
  id: number
  code: string
  name: string
  brand: string
  brandId: number
  productLineId: number | null
  productLine?: { id: number; name: string } | null
  optionType: string
  productType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  displayOrder: number
  _count?: { options: number }
}

interface Brand {
  id: number
  name: string
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
  background: 'var(--gray-50)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: 'var(--gray-700)',
}

export default function RxProductsPage() {
  const [products, setProducts] = useState<RxProduct[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<RxProduct | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [productOptions, setProductOptions] = useState<{sph: string; cyl: string; priceAdjustment: number; id: number}[]>([])
  const [optionLoading, setOptionLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    productType: '단초점',
    refractiveIndex: '1.60',
    sellingPrice: 0,
    purchasePrice: 0,
    isActive: true,
  })

  const fetchProducts = useCallback(async () => {
    try {
      // RX 상품만 필터링해서 가져오기
      const params = new URLSearchParams()
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      // optionType이 RX인 것만 필터
      const rxProducts = (data.products || []).filter(
        (p: RxProduct) => p.optionType === '안경렌즈 RX' || p.productType === 'RX'
      )
      setProducts(rxProducts)
      setBrands(data.brands || [])
    } catch (error) {
      console.error('Failed to fetch RX products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const fetchOptions = async (productId: number) => {
    setOptionLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/options`)
      const data = await res.json()
      setProductOptions(data.options || [])
    } catch {
      setProductOptions([])
    } finally {
      setOptionLoading(false)
    }
  }

  const handleExpandProduct = (productId: number) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
      setProductOptions([])
    } else {
      setExpandedProduct(productId)
      fetchOptions(productId)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    const matchBrand = brandFilter === 'all' || String(p.brandId) === brandFilter
    const matchType = typeFilter === 'all' || p.productType === typeFilter
    return matchSearch && matchBrand && matchType
  })

  // 타입별 통계
  const productTypes = [...new Set(products.map(p => p.productType))].filter(Boolean)
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    totalOptions: products.reduce((sum, p) => sum + (p._count?.options || 0), 0),
    byType: productTypes.map(type => ({
      type,
      count: products.filter(p => p.productType === type).length
    }))
  }

  // 브랜드별 통계
  const rxBrands = [...new Set(products.map(p => p.brandId))].map(bId => {
    const brand = brands.find(b => b.id === bId)
    return {
      id: bId,
      name: brand?.name || '알 수 없음',
      count: products.filter(p => p.brandId === bId).length,
    }
  }).sort((a, b) => b.count - a.count)

  const openEditModal = (product: RxProduct | null) => {
    if (product) {
      setFormData({
        name: product.name,
        brandId: String(product.brandId),
        productType: product.productType,
        refractiveIndex: product.refractiveIndex || '',
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        isActive: product.isActive,
      })
      setEditingProduct(product)
    } else {
      setFormData({
        name: '',
        brandId: rxBrands[0]?.id ? String(rxBrands[0].id) : '',
        productType: '단초점',
        refractiveIndex: '1.60',
        sellingPrice: 0,
        purchasePrice: 0,
        isActive: true,
      })
      setEditingProduct(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('상품명을 입력하세요.'); return }
    if (!formData.brandId) { alert('브랜드를 선택하세요.'); return }

    setSaving(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brandId: parseInt(formData.brandId),
          optionType: '안경렌즈 RX',
        })
      })

      if (res.ok) {
        setShowModal(false)
        setEditingProduct(null)
        fetchProducts()
      } else {
        const err = await res.json()
        alert(err.error || '저장에 실패했습니다.')
      }
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // SPH/CYL 범위 계산 (옵션 기반)
  const getSphCylRange = (product: RxProduct) => {
    // 옵션 개수로 대략적 표시
    const optionCount = product._count?.options || 0
    if (optionCount === 0) return { sph: '-', cyl: '-' }
    return { sph: `${optionCount}개 도수`, cyl: '' }
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>RX상품 관리</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
          처방 렌즈(RX) 상품을 관리합니다. 도수 범위, 굴절률, 가격 등을 설정할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>전체 RX상품</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)' }}>
                {stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👓</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>활성 상품</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#34c759' }}>
                {stats.active}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 도수 옵션</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#5856d6' }}>
                {stats.totalOptions.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede7f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔢</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>브랜드 수</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#007aff' }}>
                {rxBrands.length}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏷️</div>
          </div>
        </div>
      </div>

      {/* 브랜드별 칩 필터 */}
      {rxBrands.length > 0 && (
        <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginRight: 4 }}>브랜드:</span>
          <button
            onClick={() => setBrandFilter('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: brandFilter === 'all' ? 600 : 400,
              background: brandFilter === 'all' ? 'var(--primary)' : '#fff',
              color: brandFilter === 'all' ? '#fff' : 'var(--gray-600)',
              border: brandFilter === 'all' ? 'none' : '1px solid var(--gray-200)',
              cursor: 'pointer',
            }}
          >
            전체 ({products.length})
          </button>
          {rxBrands.map(b => (
            <button
              key={b.id}
              onClick={() => setBrandFilter(String(b.id))}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: brandFilter === String(b.id) ? 600 : 400,
                background: brandFilter === String(b.id) ? 'var(--primary)' : '#fff',
                color: brandFilter === String(b.id) ? '#fff' : 'var(--gray-600)',
                border: brandFilter === String(b.id) ? 'none' : '1px solid var(--gray-200)',
                cursor: 'pointer',
              }}
            >
              {b.name} ({b.count})
            </button>
          ))}
        </div>
      )}

      {/* 필터 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="상품명, 브랜드 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 280, paddingLeft: 36 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--gray-400)' }}>🔍</span>
          </div>
          {productTypes.length > 1 && (
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ ...inputStyle, minWidth: 120, cursor: 'pointer' }}
            >
              <option value="all">전체 타입</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {filteredProducts.length}개 표시
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
          }}
        >
          + RX상품 등록
        </button>
      </div>

      {/* 상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            로딩 중...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👓</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              {search || brandFilter !== 'all' ? '검색 결과가 없습니다' : 'RX상품이 없습니다'}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? '다른 검색어를 시도해보세요' : 'RX상품은 판매상품 관리에서 "안경렌즈 RX" 타입으로 등록하면 여기에 표시됩니다'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-600)', fontSize: 13 }}>상품명</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 90, fontSize: 13 }}>브랜드</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 80, fontSize: 13 }}>상품구분</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 70, fontSize: 13 }}>굴절률</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 90, fontSize: 13 }}>도수 옵션</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--gray-600)', width: 100, fontSize: 13 }}>판매가</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--gray-600)', width: 100, fontSize: 13 }}>매입가</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 70, fontSize: 13 }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--gray-600)', width: 100, fontSize: 13 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const range = getSphCylRange(product)
                return (
                  <>
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid var(--gray-100)',
                        cursor: 'pointer',
                        background: expandedProduct === product.id ? 'var(--primary-light)' : undefined,
                        transition: 'background 0.15s',
                      }}
                      onClick={() => handleExpandProduct(product.id)}
                      onMouseEnter={e => { if (expandedProduct !== product.id) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)' }}
                      onMouseLeave={e => { if (expandedProduct !== product.id) (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{product.name}</span>
                          {product.bundleName && (
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#fff3e0', color: '#e65100' }}>
                              {product.bundleName}
                            </span>
                          )}
                          {(product._count?.options || 0) > 0 && (
                            <span style={{
                              fontSize: 11,
                              color: 'var(--gray-400)',
                              transform: expandedProduct === product.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}>▼</span>
                          )}
                        </div>
                        {product.productLine && (
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                            {product.productLine.name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
                        {product.brand}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          background: product.productType === '단초점' ? '#e3f2fd' :
                                     product.productType === '누진' ? '#f3e5f5' :
                                     product.productType === '중근용' ? '#e8f5e9' : 'var(--gray-100)',
                          color: product.productType === '단초점' ? '#1565c0' :
                                product.productType === '누진' ? '#7b1fa2' :
                                product.productType === '중근용' ? '#2e7d32' : 'var(--gray-600)',
                        }}>
                          {product.productType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', fontSize: 13, fontWeight: 500 }}>
                        {product.refractiveIndex || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: (product._count?.options || 0) > 0 ? '#ede7f6' : 'var(--gray-100)',
                          color: (product._count?.options || 0) > 0 ? '#5856d6' : 'var(--gray-400)',
                        }}>
                          {range.sph}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                        {product.sellingPrice > 0 ? `${product.sellingPrice.toLocaleString()}원` : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--gray-500)', fontSize: 13 }}>
                        {product.purchasePrice > 0 ? `${product.purchasePrice.toLocaleString()}원` : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          background: product.isActive ? '#e8f5e9' : '#fef3e7',
                          color: product.isActive ? '#2e7d32' : '#e65100',
                        }}>
                          {product.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(product)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: 'var(--gray-100)',
                            color: '#007aff',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                    {/* 도수 옵션 확장 */}
                    {expandedProduct === product.id && (
                      <tr key={`${product.id}-options`}>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <div style={{
                            background: 'var(--gray-50)',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--gray-200)',
                          }}>
                            {optionLoading ? (
                              <div style={{ textAlign: 'center', padding: 16, color: 'var(--gray-400)', fontSize: 13 }}>
                                도수 옵션 로딩 중...
                              </div>
                            ) : productOptions.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: 16, color: 'var(--gray-400)', fontSize: 13 }}>
                                등록된 도수 옵션이 없습니다. 판매상품 관리에서 도수를 추가하세요.
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 10 }}>
                                  도수 옵션 ({productOptions.length}개)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {productOptions.slice(0, 50).map(opt => (
                                    <div
                                      key={opt.id}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        background: opt.priceAdjustment > 0 ? '#ffebee' : '#fff',
                                        border: '1px solid var(--gray-200)',
                                        fontSize: 11,
                                        fontFamily: 'monospace',
                                        color: opt.priceAdjustment > 0 ? '#c62828' : 'var(--gray-700)',
                                      }}
                                      title={`SPH: ${opt.sph}, CYL: ${opt.cyl}${opt.priceAdjustment ? ` (+${opt.priceAdjustment.toLocaleString()}원)` : ''}`}
                                    >
                                      {opt.sph}/{opt.cyl}
                                      {opt.priceAdjustment > 0 && <span style={{ marginLeft: 3, fontWeight: 600 }}>+{(opt.priceAdjustment/1000).toFixed(0)}k</span>}
                                    </div>
                                  ))}
                                  {productOptions.length > 50 && (
                                    <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--gray-400)' }}>
                                      +{productOptions.length - 50}개 더...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
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
          zIndex: 1000,
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
                {editingProduct ? 'RX상품 수정' : 'RX상품 등록'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>상품명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 에실로 누진 1.67"
                style={{ ...inputStyle, width: '100%' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>브랜드 *</label>
                <select
                  value={formData.brandId}
                  onChange={e => setFormData({ ...formData, brandId: e.target.value })}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="">브랜드 선택</option>
                  {brands.map(b => (
                    <option key={b.id} value={String(b.id)}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>상품구분</label>
                <select
                  value={formData.productType}
                  onChange={e => setFormData({ ...formData, productType: e.target.value })}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="단초점">단초점</option>
                  <option value="누진">누진</option>
                  <option value="중근용">중근용</option>
                  <option value="이중초점">이중초점</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>굴절률</label>
                <select
                  value={formData.refractiveIndex}
                  onChange={e => setFormData({ ...formData, refractiveIndex: e.target.value })}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="">선택</option>
                  <option value="1.50">1.50</option>
                  <option value="1.56">1.56</option>
                  <option value="1.60">1.60</option>
                  <option value="1.67">1.67</option>
                  <option value="1.74">1.74</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>판매가 (원)</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={e => setFormData({ ...formData, sellingPrice: parseInt(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>매입가 (원)</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={e => setFormData({ ...formData, purchasePrice: parseInt(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>

            <div style={{
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                활성 상태
              </label>
            </div>

            {!editingProduct && (
              <div style={{
                padding: 14,
                background: '#e3f2fd',
                borderRadius: 8,
                marginBottom: 24,
                fontSize: 13,
                color: '#1565c0',
                lineHeight: 1.5,
              }}>
                💡 도수 옵션은 상품 등록 후 <strong>판매상품 관리</strong>에서 추가할 수 있습니다.
              </div>
            )}

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
                disabled={saving}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  background: saving ? 'var(--gray-300)' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '저장 중...' : editingProduct ? '수정 저장' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
