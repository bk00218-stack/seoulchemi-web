'use client'

import { useState, useEffect, useCallback } from 'react'

interface CategoryItem {
  id: number; name: string; isActive: boolean
  _count?: { brands: number }
}

interface BrandItem {
  id: number; name: string; categoryId: number | null
  _count?: { products: number; productLines: number }
  productLines?: { id: number; name: string; _count?: { products: number } }[]
}

interface ProductLineItem {
  id: number; name: string; brandId: number
  _count?: { products: number }
}

interface ProductItem {
  id: number; name: string; brandId: number; brand: string
  productLineId: number | null; productLine: { id: number; name: string } | null
  sellingPrice: number; purchasePrice: number; retailPrice?: number
  isActive: boolean; erpCode?: string
}

interface BulkManageModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  toast: { success: (msg: string) => void; error: (msg: string) => void }
  categoryId: number | null
}

type ActionType = 'move' | 'price' | 'delete' | 'activate' | 'deactivate'

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 0, width: 1100, maxWidth: '96vw', maxHeight: '92vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, minWidth: 150,
}

const btnStyle = (variant: 'primary' | 'danger' | 'default' | 'warn' = 'default'): React.CSSProperties => ({
  padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  background: variant === 'primary' ? '#2d5a2d' : variant === 'danger' ? '#dc3545' : variant === 'warn' ? '#f59e0b' : '#e9ecef',
  color: variant === 'default' ? '#333' : '#fff',
})

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555',
  background: '#f8f9fa', position: 'sticky', top: 0, borderBottom: '1px solid #e0e0e0',
}

const tdStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f0f0f0',
}

export default function BulkManageModal({ isOpen, onClose, onComplete, toast, categoryId }: BulkManageModalProps) {
  // Filter state
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [productLines, setProductLines] = useState<ProductLineItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])

  const [filterCatId, setFilterCatId] = useState<number | null>(categoryId)
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null)
  const [filterLineId, setFilterLineId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Action state
  const [action, setAction] = useState<ActionType>('move')
  const [targetCatId, setTargetCatId] = useState<number | null>(null)
  const [targetBrandId, setTargetBrandId] = useState<number | null>(null)
  const [targetLineId, setTargetLineId] = useState<number | null>(null)
  const [targetBrands, setTargetBrands] = useState<BrandItem[]>([])
  const [targetLines, setTargetLines] = useState<ProductLineItem[]>([])

  // Price action state
  const [priceType, setPriceType] = useState('sellingPrice')
  const [priceMethod, setPriceMethod] = useState('percent')
  const [priceValue, setPriceValue] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch { /* ignore */ }
  }, [])

  // Fetch brands for filter
  const fetchBrands = useCallback(async (catId: number | null) => {
    if (!catId) { setBrands([]); setProductLines([]); return }
    try {
      const res = await fetch(`/api/brands?categoryId=${catId}`)
      const data = await res.json()
      setBrands(data.brands || [])
    } catch { setBrands([]) }
  }, [])

  // Fetch product lines for filter
  const fetchLines = useCallback(async (brandId: number | null) => {
    if (!brandId) { setProductLines([]); return }
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      const data = await res.json()
      setProductLines(data.productLines || [])
    } catch { setProductLines([]) }
  }, [])

  // Fetch products based on filters
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams()
      if (filterLineId) params.set('productLineId', String(filterLineId))
      else if (filterBrandId) params.set('brandId', String(filterBrandId))
      else if (filterCatId) params.set('categoryId', String(filterCatId))
      if (searchText) params.set('search', searchText)
      if (showInactive) params.set('includeInactive', 'true')
      else params.set('includeInactive', 'false')

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch { setProducts([]) }
    finally { setLoadingProducts(false) }
  }, [filterCatId, filterBrandId, filterLineId, searchText, showInactive])

  // Fetch target brands when target category changes
  const fetchTargetBrands = useCallback(async (catId: number | null) => {
    if (!catId) { setTargetBrands([]); setTargetLines([]); return }
    try {
      const res = await fetch(`/api/brands?categoryId=${catId}`)
      const data = await res.json()
      setTargetBrands(data.brands || [])
    } catch { setTargetBrands([]) }
  }, [])

  // Fetch target lines when target brand changes
  const fetchTargetLines = useCallback(async (brandId: number | null) => {
    if (!brandId) { setTargetLines([]); return }
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      const data = await res.json()
      setTargetLines(data.productLines || [])
    } catch { setTargetLines([]) }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (filterCatId) fetchBrands(filterCatId)
      setSelectedIds(new Set())
    }
  }, [isOpen, fetchCategories, fetchBrands, filterCatId])

  // Load products when filters change
  useEffect(() => {
    if (isOpen && (filterCatId || filterBrandId || filterLineId || searchText)) {
      fetchProducts()
      setSelectedIds(new Set())
    } else if (isOpen && !filterCatId && !filterBrandId && !filterLineId && !searchText) {
      setProducts([])
    }
  }, [isOpen, filterCatId, filterBrandId, filterLineId, searchText, showInactive, fetchProducts])

  // Category change → reset brand/line
  const handleCatChange = (catId: number | null) => {
    setFilterCatId(catId)
    setFilterBrandId(null)
    setFilterLineId(null)
    setBrands([])
    setProductLines([])
    if (catId) fetchBrands(catId)
  }

  // Brand change → reset line
  const handleBrandChange = (brandId: number | null) => {
    setFilterBrandId(brandId)
    setFilterLineId(null)
    setProductLines([])
    if (brandId) fetchLines(brandId)
  }

  // Selection helpers
  const toggleSelect = (id: number) => {
    const s = new Set(selectedIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedIds(s)
  }

  const toggleAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(products.map(p => p.id)))
  }

  // Get category name for a product (from brand's category)
  const getCatName = (product: ProductItem) => {
    const brand = brands.find(b => b.id === product.brandId)
    if (brand) {
      const cat = categories.find(c => c.id === brand.categoryId)
      return cat?.name || '-'
    }
    // fallback: if filtering by category, use that
    if (filterCatId) {
      const cat = categories.find(c => c.id === filterCatId)
      return cat?.name || '-'
    }
    return '-'
  }

  // Execute action
  const handleExecute = async () => {
    if (selectedIds.size === 0) { toast.error('상품을 선택해주세요'); return }

    setLoading(true)
    try {
      if (action === 'move') {
        if (!targetBrandId && !targetLineId) { toast.error('이동 대상을 선택해주세요'); return }
        const res = await fetch('/api/products/bulk-move', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [...selectedIds],
            targetBrandId: targetBrandId || undefined,
            targetProductLineId: targetLineId || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (action === 'price') {
        if (!priceValue) { toast.error('값을 입력해주세요'); return }
        const res = await fetch('/api/products/bulk-price', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [...selectedIds], priceType, method: priceMethod, value: Number(priceValue),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (action === 'delete') {
        const res = await fetch('/api/brands/bulk-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', productIds: [...selectedIds] }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (action === 'activate' || action === 'deactivate') {
        const res = await fetch('/api/brands/bulk-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, productIds: [...selectedIds] }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      setSelectedIds(new Set())
      fetchProducts()
      onComplete()
    } catch (err: any) {
      toast.error(err.message || '작업에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>전체 일괄 관리</h2>
          <span style={{ fontSize: 12, color: '#999' }}>
            {products.length > 0 && `${products.length}개 상품`}
            {selectedIds.size > 0 && ` / ${selectedIds.size}개 선택`}
          </span>
        </div>

        {/* Filter Row */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select style={selectStyle} value={filterCatId || ''} onChange={e => handleCatChange(Number(e.target.value) || null)}>
              <option value="">대분류 전체</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select style={selectStyle} value={filterBrandId || ''} onChange={e => handleBrandChange(Number(e.target.value) || null)}
              disabled={!filterCatId}>
              <option value="">브랜드 전체</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name} ({b._count?.products || 0})</option>)}
            </select>

            <select style={selectStyle} value={filterLineId || ''} onChange={e => setFilterLineId(Number(e.target.value) || null)}
              disabled={!filterBrandId}>
              <option value="">품목 전체</option>
              {productLines.map(l => <option key={l.id} value={l.id}>{l.name} ({l._count?.products || 0})</option>)}
            </select>

            <input
              style={{ ...selectStyle, minWidth: 160 }} placeholder="상품명/코드 검색"
              value={searchText} onChange={e => setSearchText(e.target.value)}
            />

            <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              비활성 포함
            </label>
          </div>
        </div>

        {/* Product Table */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 300, maxHeight: 'calc(92vh - 260px)' }}>
          {!filterCatId && !searchText ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>
              대분류를 선택하거나 검색어를 입력해주세요
            </div>
          ) : loadingProducts ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>로딩중...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>상품이 없습니다</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleAll} />
                  </th>
                  <th style={thStyle}>대분류</th>
                  <th style={thStyle}>브랜드</th>
                  <th style={thStyle}>품목</th>
                  <th style={thStyle}>상품명</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>매입가</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>도매가</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>소매가</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr
                    key={p.id}
                    style={{ background: selectedIds.has(p.id) ? '#f0f7f0' : 'transparent', cursor: 'pointer' }}
                    onClick={() => toggleSelect(p.id)}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#888' }}>{getCatName(p)}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{p.brand}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#666' }}>{p.productLine?.name || '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {p.name}
                      {p.erpCode && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>({p.erpCode})</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12 }}>{p.purchasePrice?.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12 }}>{p.sellingPrice?.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12 }}>{(p.retailPrice || 0)?.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: p.isActive ? '#e8f5e9' : '#fce4ec',
                        color: p.isActive ? '#2e7d32' : '#c62828',
                      }}>
                        {p.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Bar */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333', marginRight: 4 }}>작업:</span>

            <select style={{ ...selectStyle, minWidth: 130 }} value={action} onChange={e => {
              setAction(e.target.value as ActionType)
              setTargetCatId(null); setTargetBrandId(null); setTargetLineId(null)
              setTargetBrands([]); setTargetLines([])
            }}>
              <option value="move">상품 이동</option>
              <option value="price">가격 수정</option>
              <option value="delete">삭제 (비활성화)</option>
              <option value="activate">활성화</option>
              <option value="deactivate">비활성화</option>
            </select>

            {action === 'move' && (
              <>
                <span style={{ fontSize: 12, color: '#888' }}>이동 대상:</span>
                <select style={selectStyle} value={targetCatId || ''} onChange={e => {
                  const v = Number(e.target.value) || null
                  setTargetCatId(v); setTargetBrandId(null); setTargetLineId(null)
                  setTargetBrands([]); setTargetLines([])
                  if (v) fetchTargetBrands(v)
                }}>
                  <option value="">대분류</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={selectStyle} value={targetBrandId || ''} onChange={e => {
                  const v = Number(e.target.value) || null
                  setTargetBrandId(v); setTargetLineId(null); setTargetLines([])
                  if (v) fetchTargetLines(v)
                }} disabled={!targetCatId}>
                  <option value="">브랜드</option>
                  {targetBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select style={selectStyle} value={targetLineId || ''} onChange={e => setTargetLineId(Number(e.target.value) || null)}
                  disabled={!targetBrandId}>
                  <option value="">품목 (선택)</option>
                  {targetLines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </>
            )}

            {action === 'price' && (
              <>
                <select style={{ ...selectStyle, minWidth: 90 }} value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="purchasePrice">매입가</option>
                  <option value="sellingPrice">도매가</option>
                  <option value="retailPrice">소매가</option>
                </select>
                <select style={{ ...selectStyle, minWidth: 90 }} value={priceMethod} onChange={e => setPriceMethod(e.target.value)}>
                  <option value="set">금액 설정</option>
                  <option value="percent">% 조정</option>
                  <option value="add">금액 가감</option>
                </select>
                <input
                  type="number" style={{ ...selectStyle, minWidth: 100, width: 100 }}
                  value={priceValue} onChange={e => setPriceValue(e.target.value)}
                  placeholder={priceMethod === 'percent' ? '예: 10' : '예: 1000'}
                />
              </>
            )}

            <div style={{ flex: 1 }} />

            <button style={btnStyle('default')} onClick={onClose}>닫기</button>
            <button
              style={btnStyle(action === 'delete' ? 'danger' : action === 'deactivate' ? 'warn' : 'primary')}
              disabled={loading || selectedIds.size === 0}
              onClick={() => {
                const actionLabel = action === 'move' ? '이동' : action === 'price' ? '가격 수정' : action === 'delete' ? '삭제' : action === 'activate' ? '활성화' : '비활성화'
                if (confirm(`선택한 ${selectedIds.size}개 상품을 ${actionLabel}하시겠습니까?`)) handleExecute()
              }}
            >
              {loading ? '처리중...' : `실행 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
