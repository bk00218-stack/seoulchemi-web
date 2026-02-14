'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface Product {
  id: number
  code: string
  brand: string
  brandId: number
  name: string
  optionType: string
  productType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  status: string
  imageUrl: string | null
  erpCode: string | null
}

interface Brand {
  id: number
  name: string
}

interface ProductOption {
  id: number
  sph: string
  cyl: string
  axis: string | null
  optionName: string | null
  memo: string | null
  barcode: string | null
  stock: number
  status: string
  stockLocation: string | null
  priceAdjustment: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [brandFilter, setBrandFilter] = useState('')
  const [optionFilter, setOptionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  // 상품 수정시 옵션(도수표) 불러오기
  useEffect(() => {
    if (editingProduct) {
      fetchProductOptions(editingProduct.id)
    } else {
      setProductOptions([])
    }
  }, [editingProduct])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
      setBrands(data.brands || [])
      setStats(data.stats || { total: 0, active: 0, inactive: 0 })
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductOptions(productId: number) {
    setOptionsLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/options`)
      const data = await res.json()
      setProductOptions(data.options || [])
    } catch (error) {
      console.error('Failed to fetch product options:', error)
      setProductOptions([])
    } finally {
      setOptionsLoading(false)
    }
  }

  const columns: Column<Product>[] = [
    { key: 'imageUrl', label: '', render: (v) => (
      v ? (
        <img 
          src={v as string} 
          alt="" 
          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
        />
      ) : (
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: '#f5f5f7', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#86868b'
        }}>📷</div>
      )
    )},
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#eef4ee', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionType', label: '옵션타입', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'refractiveIndex', label: '굴절률', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{v as string || '-'}</span>
    )},
    { key: 'sellingPrice', label: '판매가', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingProduct(row); setShowModal(true); }}
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
    )},
  ]

  // 필터링
  let filteredProducts = products
  if (filter !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.status === filter)
  }
  if (brandFilter) {
    filteredProducts = filteredProducts.filter(p => p.brand === brandFilter)
  }
  if (optionFilter) {
    filteredProducts = filteredProducts.filter(p => p.optionType === optionFilter)
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  }

  // 옵션타입 목록 추출
  const optionTypes = [...new Set(products.map(p => p.optionType))]

  // 이미지 업로드 핸들러
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingProduct || !e.target.files?.[0]) return
    
    setImageUploading(true)
    const formData = new FormData()
    formData.append('image', e.target.files[0])
    
    try {
      const res = await fetch(`/api/products/${editingProduct.id}/image`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.imageUrl) {
        setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl })
        // 목록도 업데이트
        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...p, imageUrl: data.imageUrl } : p
        ))
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('이미지 업로드 실패')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleImageDelete() {
    if (!editingProduct) return
    
    try {
      await fetch(`/api/products/${editingProduct.id}/image`, { method: 'DELETE' })
      setEditingProduct({ ...editingProduct, imageUrl: null })
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, imageUrl: null } : p
      ))
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="products">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        판매상품 관리
      </h2>

      <StatCardGrid>
        <StatCard label="총 상품" value={stats.total} unit="개" icon="📦" />
        <StatCard label="활성 상품" value={stats.active} unit="개" />
        <StatCard label="비활성 상품" value={stats.inactive} unit="개" />
        <StatCard label="브랜드" value={brands.length} unit="개" />
      </StatCardGrid>

      <SearchFilter
        placeholder="상품코드, 상품명 검색"
        onSearch={setSearchQuery}
        filters={[
          { 
            label: '브랜드', 
            key: 'brand', 
            options: brands.map(b => ({ label: b.name, value: b.name })),
            onChange: setBrandFilter
          },
          { 
            label: '옵션타입', 
            key: 'optionType', 
            options: optionTypes.map(t => ({ label: t, value: t })),
            onChange: setOptionFilter
          }
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
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
              + 상품 등록
            </button>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '활성', value: 'active' },
            { label: '비활성', value: 'inactive' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="등록된 상품이 없습니다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#fff', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#86868b' }}>
          총 {filteredProducts.length}개 상품
        </span>
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
            borderRadius: '16px',
            padding: '24px',
            width: editingProduct ? '600px' : '500px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingProduct ? '상품 수정' : '상품 등록'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 이미지 섹션 */}
              {editingProduct && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f5f5f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #e5e5e5'
                  }}>
                    {editingProduct.imageUrl ? (
                      <img 
                        src={editingProduct.imageUrl} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px', color: '#86868b' }}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                      상품 이미지
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#007aff',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: imageUploading ? 'wait' : 'pointer',
                        opacity: imageUploading ? 0.6 : 1
                      }}>
                        {imageUploading ? '업로드 중...' : '이미지 선택'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {editingProduct.imageUrl && (
                        <button
                          onClick={handleImageDelete}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: '#fff',
                            color: '#ff3b30',
                            border: '1px solid #ff3b30',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#86868b', marginTop: '8px' }}>
                      JPG, PNG 형식 (최대 5MB)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드 *</label>
                <select 
                  defaultValue={editingProduct?.brandId || ''} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="">선택</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상품명 *</label>
                <input 
                  type="text" 
                  defaultValue={editingProduct?.name} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>옵션타입</label>
                  <select 
                    defaultValue={editingProduct?.optionType || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  >
                    <option value="">선택</option>
                    <option value="안경렌즈 RX">안경렌즈 RX</option>
                    <option value="안경렌즈 여벌">안경렌즈 여벌</option>
                    <option value="콘택트렌즈">콘택트렌즈</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>굴절률</label>
                  <select 
                    defaultValue={editingProduct?.refractiveIndex || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  >
                    <option value="">선택</option>
                    <option value="1.50">1.50</option>
                    <option value="1.56">1.56</option>
                    <option value="1.60">1.60</option>
                    <option value="1.67">1.67</option>
                    <option value="1.74">1.74</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>묶음상품명</label>
                  <input 
                    type="text" 
                    defaultValue={editingProduct?.bundleName || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ERP 코드</label>
                  <input 
                    type="text" 
                    defaultValue={editingProduct?.erpCode || ''} 
                    placeholder="레티나 상품코드"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>판매가</label>
                  <input 
                    type="number" 
                    defaultValue={editingProduct?.sellingPrice || 0} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>매입가</label>
                  <input 
                    type="number" 
                    defaultValue={editingProduct?.purchasePrice || 0} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
                <select 
                  defaultValue={editingProduct?.isActive ? 'active' : 'inactive'} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              {/* 도수표 섹션 */}
              {editingProduct && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>
                      📋 도수표 ({productOptions.length}개)
                    </label>
                    <button
                      onClick={() => alert('도수 추가 기능 준비중')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: '#007aff',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + 도수 추가
                    </button>
                  </div>
                  
                  {optionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#86868b', fontSize: '13px' }}>
                      로딩 중...
                    </div>
                  ) : productOptions.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px', 
                      background: '#f5f5f7', 
                      borderRadius: '8px',
                      color: '#86868b',
                      fontSize: '13px'
                    }}>
                      등록된 도수가 없습니다
                    </div>
                  ) : (
                    <div style={{ 
                      maxHeight: '250px', 
                      overflowY: 'auto', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f7', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid #e9ecef' }}>SPH</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid #e9ecef' }}>CYL</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid #e9ecef' }}>재고</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid #e9ecef' }}>상태</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid #e9ecef' }}>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productOptions.map((opt, idx) => (
                            <tr key={opt.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{opt.sph}</td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{opt.cyl}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{opt.stock}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  background: opt.status === '주문가능' ? '#e8f5e9' : '#ffebee',
                                  color: opt.status === '주문가능' ? '#2e7d32' : '#c62828'
                                }}>
                                  {opt.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => alert(`도수 수정: SPH ${opt.sph}, CYL ${opt.cyl}`)}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: 'transparent',
                                    color: '#007aff',
                                    border: '1px solid #007aff',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  수정
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={() => { alert('저장되었습니다.'); setShowModal(false); }} 
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
