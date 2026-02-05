'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Brand {
  id: number
  name: string
  products: { id: number; name: string; refractiveIndex: string | null; optionName: string | null }[]
}

interface GridData {
  sphRange: string[]
  cylRange: string[]
  grid: Record<string, Record<string, { stock: number; optionId: number; barcode?: string }>>
  stats: { totalOptions: number; totalStock: number; outOfStock: number; lowStock: number }
  productName?: string
  brandName?: string
}

export default function DiopterGridPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [gridData, setGridData] = useState<GridData | null>(null)
  const [loading, setLoading] = useState(true)
  const [gridLoading, setGridLoading] = useState(false)

  // 옵션 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    sphMin: -6,
    sphMax: 0,
    sphStep: 0.25,
    cylMin: -2,
    cylMax: 0,
    cylStep: 0.25,
    defaultStock: 0
  })
  const [creating, setCreating] = useState(false)

  // 셀 편집 모달
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    sph: string
    cyl: string
    optionId: number
    stock: number
    priceAdjustment?: number
    barcode?: string
    location?: string
  } | null>(null)
  const [editForm, setEditForm] = useState({
    stock: 0,
    priceAdjustment: 0,
    barcode: '',
    location: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchGrid()
    }
  }, [selectedProduct])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products/diopter-grid')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.brands)
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrid = async () => {
    if (!selectedProduct) return

    setGridLoading(true)
    try {
      const res = await fetch(`/api/products/diopter-grid?productId=${selectedProduct}`)
      if (res.ok) {
        const data = await res.json()
        setGridData(data)
      }
    } catch (error) {
      console.error('Failed to fetch grid:', error)
    } finally {
      setGridLoading(false)
    }
  }

  const openEditModal = (sph: string, cyl: string, cell: { stock: number; optionId: number; barcode?: string }) => {
    setEditingCell({ sph, cyl, ...cell })
    setEditForm({
      stock: cell.stock,
      priceAdjustment: 0,
      barcode: cell.barcode || '',
      location: ''
    })
    setShowEditModal(true)
  }

  const handleSaveCell = async () => {
    if (!editingCell) return

    setSaving(true)
    try {
      const res = await fetch('/api/products/diopter-grid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: editingCell.optionId,
          stock: editForm.stock,
          priceAdjustment: editForm.priceAdjustment,
          barcode: editForm.barcode || null,
          location: editForm.location || null
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        fetchGrid()
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateOptions = async () => {
    if (!selectedProduct) return

    setCreating(true)
    try {
      const res = await fetch('/api/products/diopter-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          sphRange: { min: createForm.sphMin, max: createForm.sphMax, step: createForm.sphStep },
          cylRange: { min: createForm.cylMin, max: createForm.cylMax, step: createForm.cylStep },
          defaultStock: createForm.defaultStock
        })
      })

      if (res.ok) {
        const result = await res.json()
        alert(result.message)
        setShowCreateModal(false)
        fetchGrid()
      } else {
        const error = await res.json()
        alert(error.error || '생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to create options:', error)
      alert('생성에 실패했습니다')
    } finally {
      setCreating(false)
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return { bg: '#fef2f2', color: '#dc2626' }
    if (stock <= 5) return { bg: '#fef3c7', color: '#d97706' }
    if (stock <= 10) return { bg: '#d1fae5', color: '#059669' }
    return { bg: '#dbeafe', color: '#2563eb' }
  }

  const selectedBrandData = brands.find(b => b.id === selectedBrand)

  return (
    <AdminLayout activeMenu="products">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>도수표 그리드</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          SPH/CYL 조합별 재고를 한눈에 확인합니다
        </p>
      </div>

      {/* 선택 영역 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
            브랜드
          </label>
          <select
            value={selectedBrand || ''}
            onChange={(e) => {
              setSelectedBrand(parseInt(e.target.value) || null)
              setSelectedProduct(null)
              setGridData(null)
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              fontSize: '14px'
            }}
          >
            <option value="">브랜드 선택</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name} ({brand.products.length}개 상품)
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
            상품
          </label>
          <select
            value={selectedProduct || ''}
            onChange={(e) => setSelectedProduct(parseInt(e.target.value) || null)}
            disabled={!selectedBrand}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              fontSize: '14px',
              background: !selectedBrand ? '#f9fafb' : '#fff'
            }}
          >
            <option value="">상품 선택</option>
            {selectedBrandData?.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} {product.refractiveIndex && `(${product.refractiveIndex})`}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + 옵션 일괄 생성
          </button>
        )}
      </div>

      {/* 그리드 */}
      {gridLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
          로딩 중...
        </div>
      ) : gridData && gridData.sphRange.length > 0 ? (
        <>
          {/* 통계 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px', 
            marginBottom: '24px' 
          }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#86868b' }}>총 옵션</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>{gridData.stats.totalOptions}</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#86868b' }}>총 재고</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>{gridData.stats.totalStock.toLocaleString()}</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#dc2626' }}>품절</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#dc2626' }}>{gridData.stats.outOfStock}</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#d97706' }}>재고 부족 (≤5)</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#d97706' }}>{gridData.stats.lowStock}</div>
            </div>
          </div>

          {/* 범례 */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            <span>재고 색상:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }} />
              품절
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', background: '#fef3c7', borderRadius: '4px', border: '1px solid #fde68a' }} />
              1~5
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', background: '#d1fae5', borderRadius: '4px', border: '1px solid #a7f3d0' }} />
              6~10
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', background: '#dbeafe', borderRadius: '4px', border: '1px solid #bfdbfe' }} />
              11+
            </span>
          </div>

          {/* 그리드 테이블 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            overflow: 'auto',
            maxHeight: 'calc(100vh - 400px)'
          }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ 
                    position: 'sticky', 
                    left: 0, 
                    top: 0,
                    background: '#f9fafb', 
                    padding: '12px', 
                    borderBottom: '1px solid #e5e5e5',
                    borderRight: '2px solid #e5e5e5',
                    zIndex: 10,
                    minWidth: '80px'
                  }}>
                    SPH \ CYL
                  </th>
                  {gridData.cylRange.map(cyl => (
                    <th 
                      key={cyl} 
                      style={{ 
                        position: 'sticky',
                        top: 0,
                        background: '#f9fafb', 
                        padding: '12px 8px', 
                        borderBottom: '1px solid #e5e5e5',
                        fontSize: '13px',
                        fontWeight: 500,
                        minWidth: '50px',
                        zIndex: 5
                      }}
                    >
                      {cyl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.sphRange.map(sph => (
                  <tr key={sph}>
                    <td style={{ 
                      position: 'sticky',
                      left: 0,
                      background: '#f9fafb', 
                      padding: '8px 12px', 
                      borderRight: '2px solid #e5e5e5',
                      fontSize: '13px',
                      fontWeight: 500,
                      zIndex: 5
                    }}>
                      {sph}
                    </td>
                    {gridData.cylRange.map(cyl => {
                      const cell = gridData.grid[sph]?.[cyl]
                      const colors = cell ? getStockColor(cell.stock) : { bg: '#f3f4f6', color: '#9ca3af' }
                      
                      return (
                        <td 
                          key={cyl}
                          style={{ 
                            padding: '4px',
                            textAlign: 'center'
                          }}
                        >
                          {cell ? (
                            <div
                              onClick={() => openEditModal(sph, cyl, cell)}
                              style={{
                                background: colors.bg,
                                color: colors.color,
                                padding: '8px 4px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              title={`클릭하여 수정${cell.barcode ? `\n바코드: ${cell.barcode}` : ''}`}
                            >
                              {cell.stock}
                            </div>
                          ) : (
                            <div style={{ 
                              padding: '8px 4px', 
                              color: '#d1d5db',
                              fontSize: '12px'
                            }}>
                              -
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedProduct ? (
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '60px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ color: '#86868b', marginBottom: '16px' }}>등록된 도수 옵션이 없습니다</div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 옵션 일괄 생성
          </button>
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '60px', 
          textAlign: 'center',
          color: '#86868b'
        }}>
          브랜드와 상품을 선택하세요
        </div>
      )}

      {/* 옵션 생성 모달 */}
      {showCreateModal && (
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
            width: '500px'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>도수 옵션 일괄 생성</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* SPH 범위 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  SPH 범위
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>최소</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.sphMin}
                      onChange={(e) => setCreateForm({ ...createForm, sphMin: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>최대</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.sphMax}
                      onChange={(e) => setCreateForm({ ...createForm, sphMax: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>간격</label>
                    <select
                      value={createForm.sphStep}
                      onChange={(e) => setCreateForm({ ...createForm, sphStep: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    >
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.50</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CYL 범위 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  CYL 범위
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>최소</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.cylMin}
                      onChange={(e) => setCreateForm({ ...createForm, cylMin: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>최대</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.cylMax}
                      onChange={(e) => setCreateForm({ ...createForm, cylMax: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#86868b' }}>간격</label>
                    <select
                      value={createForm.cylStep}
                      onChange={(e) => setCreateForm({ ...createForm, cylStep: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                    >
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.50</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 기본 재고 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  기본 재고
                </label>
                <input
                  type="number"
                  value={createForm.defaultStock}
                  onChange={(e) => setCreateForm({ ...createForm, defaultStock: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5' }}
                />
              </div>

              {/* 생성될 옵션 수 미리보기 */}
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
                예상 생성 옵션: {' '}
                <strong>
                  {Math.floor((createForm.sphMax - createForm.sphMin) / createForm.sphStep + 1) *
                   Math.floor((createForm.cylMax - createForm.cylMin) / createForm.cylStep + 1)}개
                </strong>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  (기존 옵션이 있으면 건너뜀)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreateOptions}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: creating ? '#e5e5e5' : '#007aff',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 셀 편집 모달 */}
      {showEditModal && editingCell && (
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
            width: '400px'
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>도수 옵션 수정</h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#86868b' }}>
              SPH: {editingCell.sph} / CYL: {editingCell.cyl}
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  재고
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: Math.max(0, editForm.stock - 10) })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', cursor: 'pointer' }}
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: Math.max(0, editForm.stock - 1) })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', cursor: 'pointer' }}
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '16px',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  />
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: editForm.stock + 1 })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', cursor: 'pointer' }}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: editForm.stock + 10 })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', cursor: 'pointer' }}
                  >
                    +10
                  </button>
                </div>
                {editForm.stock !== editingCell.stock && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '13px', 
                    color: editForm.stock > editingCell.stock ? '#10b981' : '#dc2626' 
                  }}>
                    변경: {editingCell.stock} → {editForm.stock} 
                    ({editForm.stock > editingCell.stock ? '+' : ''}{editForm.stock - editingCell.stock})
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  가격 조정 (기본가 대비)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={editForm.priceAdjustment}
                    onChange={(e) => setEditForm({ ...editForm, priceAdjustment: parseInt(e.target.value) || 0 })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>원</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#86868b' }}>
                  예: 고도수 추가금 +5000
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    바코드
                  </label>
                  <input
                    type="text"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    위치
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="예: A-1-3"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSaveCell}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: saving ? '#e5e5e5' : '#007aff',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
