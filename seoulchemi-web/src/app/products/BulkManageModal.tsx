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
  brand?: { id: number; name: string }
  _count?: { products: number }
  isActive?: boolean
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

type Level = 'product' | 'productLine' | 'brand' | 'category'
type ActionType = 'move' | 'merge' | 'price' | 'delete' | 'activate' | 'deactivate'

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 0, width: 1100, maxWidth: '96vw', maxHeight: '92vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, minWidth: 140,
}

const btnStyle = (variant: 'primary' | 'danger' | 'default' | 'warn' = 'default'): React.CSSProperties => ({
  padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  background: variant === 'primary' ? '#2d5a2d' : variant === 'danger' ? '#dc3545' : variant === 'warn' ? '#f59e0b' : '#e9ecef',
  color: variant === 'default' ? '#333' : '#fff',
})

const levelBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
  color: active ? '#2d5a2d' : '#888', background: active ? '#e8f5e9' : 'transparent',
  borderRadius: 6, transition: 'all 0.15s',
})

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555',
  background: '#f8f9fa', position: 'sticky', top: 0, borderBottom: '1px solid #e0e0e0',
}

const tdStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f0f0f0',
}

export default function BulkManageModal({ isOpen, onClose, onComplete, toast, categoryId }: BulkManageModalProps) {
  const [level, setLevel] = useState<Level>('product')

  // Data
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [productLines, setProductLines] = useState<ProductLineItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])

  // Filter
  const [filterCatId, setFilterCatId] = useState<number | null>(categoryId)
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null)
  const [filterLineId, setFilterLineId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showInactive, setShowInactive] = useState(true)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Action
  const [action, setAction] = useState<ActionType>('move')
  const [targetCatId, setTargetCatId] = useState<number | null>(null)
  const [targetBrandId, setTargetBrandId] = useState<number | null>(null)
  const [targetLineId, setTargetLineId] = useState<number | null>(null)
  const [targetBrands, setTargetBrands] = useState<BrandItem[]>([])
  const [targetLines, setTargetLines] = useState<ProductLineItem[]>([])

  // Price
  const [priceType, setPriceType] = useState('sellingPrice')
  const [priceMethod, setPriceMethod] = useState('percent')
  const [priceValue, setPriceValue] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // ===== Fetch helpers =====
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch { /* ignore */ }
  }, [])

  const fetchBrands = useCallback(async (catId: number | null) => {
    if (!catId) { setBrands([]); return }
    try {
      const res = await fetch(`/api/brands?categoryId=${catId}`)
      const data = await res.json()
      setBrands(data.brands || [])
    } catch { setBrands([]) }
  }, [])

  const fetchLines = useCallback(async (brandId: number | null) => {
    if (!brandId) { setProductLines([]); return }
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      const data = await res.json()
      setProductLines(data.productLines || [])
    } catch { setProductLines([]) }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoadingData(true)
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
    finally { setLoadingData(false) }
  }, [filterCatId, filterBrandId, filterLineId, searchText, showInactive])

  const fetchTargetBrands = useCallback(async (catId: number | null) => {
    if (!catId) { setTargetBrands([]); setTargetLines([]); return }
    try {
      const res = await fetch(`/api/brands?categoryId=${catId}`)
      const data = await res.json()
      setTargetBrands(data.brands || [])
    } catch { setTargetBrands([]) }
  }, [])

  const fetchTargetLines = useCallback(async (brandId: number | null) => {
    if (!brandId) { setTargetLines([]); return }
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      const data = await res.json()
      setTargetLines(data.productLines || [])
    } catch { setTargetLines([]) }
  }, [])

  // ===== Init =====
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (filterCatId) fetchBrands(filterCatId)
      setSelectedIds(new Set())
    }
  }, [isOpen, fetchCategories, fetchBrands, filterCatId])

  // ===== Load data when filters change =====
  useEffect(() => {
    if (!isOpen) return
    setSelectedIds(new Set())

    if (level === 'category') {
      // categories already loaded
    } else if (level === 'brand') {
      if (filterCatId) fetchBrands(filterCatId)
    } else if (level === 'productLine') {
      if (filterBrandId) fetchLines(filterBrandId)
      else if (filterCatId) fetchBrands(filterCatId)
    } else {
      // product level
      if (filterCatId || searchText) fetchProducts()
      else setProducts([])
    }
  }, [isOpen, level, filterCatId, filterBrandId, filterLineId, searchText, showInactive, fetchBrands, fetchLines, fetchProducts])

  // ===== Level change =====
  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel)
    setSelectedIds(new Set())
    // 대분류는 이동 불가 → 합치기가 기본, 상품은 합치기 불가 → 이동이 기본
    setAction(newLevel === 'category' ? 'merge' : newLevel === 'product' ? 'move' : 'move')
    resetTargets()
  }

  const resetTargets = () => {
    setTargetCatId(null); setTargetBrandId(null); setTargetLineId(null)
    setTargetBrands([]); setTargetLines([])
  }

  // ===== Filter changes =====
  const handleCatChange = (catId: number | null) => {
    setFilterCatId(catId)
    setFilterBrandId(null); setFilterLineId(null)
    setBrands([]); setProductLines([])
    if (catId) fetchBrands(catId)
  }

  const handleBrandChange = (brandId: number | null) => {
    setFilterBrandId(brandId)
    setFilterLineId(null); setProductLines([])
    if (brandId) fetchLines(brandId)
  }

  // ===== Selection =====
  const currentItems = level === 'category' ? categories
    : level === 'brand' ? brands
    : level === 'productLine' ? productLines
    : products

  const toggleSelect = (id: number) => {
    const s = new Set(selectedIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedIds(s)
  }

  const toggleAll = () => {
    if (selectedIds.size === currentItems.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(currentItems.map((item: any) => item.id)))
  }

  // ===== Category name helper =====
  const getCatName = (product: ProductItem) => {
    if (filterCatId) {
      const cat = categories.find(c => c.id === filterCatId)
      return cat?.name || '-'
    }
    return '-'
  }

  // ===== Execute =====
  const handleExecute = async () => {
    if (selectedIds.size === 0) {
      toast.error('항목을 선택해주세요')
      return
    }

    setLoading(true)
    try {
      const ids = [...selectedIds]

      // === MOVE (상위 분류 변경, 원본 유지) ===
      if (action === 'move') {
        if (level === 'brand') {
          // 브랜드 이동: 다른 대분류로 이동 (대분류만 선택)
          if (!targetCatId) { toast.error('이동할 대분류를 선택해주세요'); return }
          const res = await fetch('/api/brands/bulk-move', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandIds: ids, targetCategoryId: targetCatId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)

        } else if (level === 'productLine') {
          // 품목 이동: 다른 브랜드로 이동 (대분류 + 브랜드 선택)
          if (!targetBrandId) { toast.error('이동할 브랜드를 선택해주세요'); return }
          const res = await fetch('/api/product-lines/bulk-move', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productLineIds: ids, targetBrandId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)

        } else if (level === 'product') {
          // 상품 이동: 다른 브랜드/품목으로 이동 (대분류 + 브랜드 + 품목 선택)
          if (!targetBrandId) { toast.error('이동할 브랜드를 선택해주세요'); return }
          const res = await fetch('/api/products/bulk-move', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: ids,
              targetBrandId,
              targetProductLineId: targetLineId || undefined,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)
        }
      }

      // === MERGE (다른 항목으로 병합 + 원본 비활성화) ===
      if (action === 'merge') {
        if (level === 'category') {
          // 대분류 합치기: 선택한 대분류 → 대상 대분류로 브랜드 이동, 원본 비활성화
          if (!targetCatId) { toast.error('대상 대분류를 선택해주세요'); return }
          const res = await fetch('/api/categories/merge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceCategoryIds: ids, targetCategoryId: targetCatId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)

        } else if (level === 'brand') {
          // 브랜드 합치기: 선택한 브랜드 → 대상 브랜드로 품목/상품 이동, 원본 비활성화
          if (!targetBrandId) { toast.error('대상 브랜드를 선택해주세요'); return }
          const res = await fetch('/api/brands/merge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceBrandIds: ids, targetBrandId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)

        } else if (level === 'productLine') {
          // 품목 합치기: 선택한 품목 → 대상 품목으로 상품 이동, 원본 비활성화
          if (!targetLineId) { toast.error('대상 품목을 선택해주세요'); return }
          const res = await fetch('/api/product-lines/merge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceLineIds: ids, targetLineId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)
        }
      }

      // === PRICE ===
      if (action === 'price' && level === 'product') {
        if (!priceValue) { toast.error('값을 입력해주세요'); return }
        const res = await fetch('/api/products/bulk-price', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: ids, priceType, method: priceMethod, value: Number(priceValue) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      // === DELETE / ACTIVATE / DEACTIVATE ===
      if (action === 'delete' || action === 'activate' || action === 'deactivate') {
        if (level === 'category') {
          if (action === 'delete') {
            let deleted = 0
            for (const catId of ids) {
              const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' })
              if (res.ok) deleted++
              else { const d = await res.json(); toast.error(d.error || `삭제 실패 (ID: ${catId})`) }
            }
            if (deleted > 0) toast.success(`${deleted}개 대분류 삭제 완료`)
          }
        } else {
          const body: Record<string, any> = { action }
          if (level === 'brand') body.brandIds = ids
          else if (level === 'productLine') body.productLineIds = ids
          else body.productIds = ids

          const res = await fetch('/api/brands/bulk-action', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)
        }
      }

      // Refresh
      setSelectedIds(new Set())
      if (level === 'category') fetchCategories()
      else if (level === 'brand' && filterCatId) fetchBrands(filterCatId)
      else if (level === 'productLine' && filterBrandId) fetchLines(filterBrandId)
      else fetchProducts()
      onComplete()
    } catch (err: any) {
      toast.error(err.message || '작업에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const levelLabel = level === 'category' ? '대분류' : level === 'brand' ? '브랜드' : level === 'productLine' ? '품목' : '상품'
  const hasFilter = level === 'category' || filterCatId || searchText
  const itemCount = currentItems.length

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>전체 일괄 관리</h2>
          <span style={{ fontSize: 12, color: '#999' }}>
            {itemCount > 0 && `${itemCount}개 ${levelLabel}`}
            {selectedIds.size > 0 && ` / ${selectedIds.size}개 선택`}
          </span>
        </div>

        {/* Level Selector */}
        <div style={{ padding: '8px 24px', borderBottom: '1px solid #eee', display: 'flex', gap: 4, background: '#fafafa' }}>
          <span style={{ fontSize: 12, color: '#999', lineHeight: '30px', marginRight: 8 }}>관리 단위:</span>
          {(['category', 'brand', 'productLine', 'product'] as Level[]).map(l => (
            <button key={l} style={levelBtnStyle(level === l)} onClick={() => handleLevelChange(l)}>
              {l === 'category' ? '대분류' : l === 'brand' ? '브랜드' : l === 'productLine' ? '품목' : '상품'}
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div style={{ padding: '10px 24px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {level === 'category' && (
              <span style={{ fontSize: 13, color: '#666' }}>전체 대분류가 표시됩니다</span>
            )}

            {level !== 'category' && (
              <select style={selectStyle} value={filterCatId || ''} onChange={e => handleCatChange(Number(e.target.value) || null)}>
                <option value="">대분류 전체</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {(level === 'productLine' || level === 'product') && (
              <select style={selectStyle} value={filterBrandId || ''} onChange={e => handleBrandChange(Number(e.target.value) || null)}
                disabled={!filterCatId}>
                <option value="">브랜드 전체</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name} ({b._count?.products || 0})</option>)}
              </select>
            )}

            {level === 'product' && (
              <>
                <select style={selectStyle} value={filterLineId || ''} onChange={e => setFilterLineId(Number(e.target.value) || null)}
                  disabled={!filterBrandId}>
                  <option value="">품목 전체</option>
                  {productLines.map(l => <option key={l.id} value={l.id}>{l.name} ({l._count?.products || 0})</option>)}
                </select>
                <input style={{ ...selectStyle, minWidth: 140 }} placeholder="상품명/코드 검색"
                  value={searchText} onChange={e => setSearchText(e.target.value)} />
              </>
            )}

            {level !== 'category' && (
              <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                비활성 포함
              </label>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 280, maxHeight: 'calc(92vh - 290px)' }}>
          {/* === CATEGORY TABLE === */}
          {level === 'category' && (
            categories.length === 0 ? <EmptyState text="대분류가 없습니다" /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.size === categories.length && categories.length > 0} onChange={toggleAll} />
                    </th>
                    <th style={thStyle}>대분류명</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>브랜드 수</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ background: selectedIds.has(c.id) ? '#f0f7f0' : 'transparent', cursor: 'pointer' }}
                      onClick={() => toggleSelect(c.id)}>
                      <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{c._count?.brands || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* === BRAND TABLE === */}
          {level === 'brand' && (
            !filterCatId ? <EmptyState text="대분류를 선택해주세요" /> :
            brands.length === 0 ? <EmptyState text="브랜드가 없습니다" /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.size === brands.length && brands.length > 0} onChange={toggleAll} />
                    </th>
                    <th style={thStyle}>브랜드명</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>품목 수</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>상품 수</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id} style={{ background: selectedIds.has(b.id) ? '#f0f7f0' : 'transparent', cursor: 'pointer' }}
                      onClick={() => toggleSelect(b.id)}>
                      <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{b.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{b._count?.productLines || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{b._count?.products || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* === PRODUCT LINE TABLE === */}
          {level === 'productLine' && (
            !filterBrandId ? <EmptyState text="브랜드를 선택해주세요" /> :
            productLines.length === 0 ? <EmptyState text="품목이 없습니다" /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.size === productLines.length && productLines.length > 0} onChange={toggleAll} />
                    </th>
                    <th style={thStyle}>품목명</th>
                    <th style={thStyle}>브랜드</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>상품 수</th>
                  </tr>
                </thead>
                <tbody>
                  {productLines.map(l => (
                    <tr key={l.id} style={{ background: selectedIds.has(l.id) ? '#f0f7f0' : 'transparent', cursor: 'pointer' }}
                      onClick={() => toggleSelect(l.id)}>
                      <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{l.name}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#666' }}>{l.brand?.name || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{l._count?.products || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* === PRODUCT TABLE === */}
          {level === 'product' && (
            (!filterCatId && !searchText) ? <EmptyState text="대분류를 선택하거나 검색어를 입력해주세요" /> :
            loadingData ? <EmptyState text="로딩중..." /> :
            products.length === 0 ? <EmptyState text="상품이 없습니다" /> : (
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
                    <tr key={p.id} style={{ background: selectedIds.has(p.id) ? '#f0f7f0' : 'transparent', cursor: 'pointer' }}
                      onClick={() => toggleSelect(p.id)}>
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
            )
          )}
        </div>

        {/* Action Bar */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>작업:</span>

            <select style={{ ...selectStyle, minWidth: 130 }} value={action} onChange={e => {
              setAction(e.target.value as ActionType)
              resetTargets()
            }}>
              {/* 이동: 상위 분류 변경 (대분류는 최상위라 이동 불가) */}
              {level !== 'category' && <option value="move">{levelLabel} 이동</option>}
              {/* 합치기: 같은 레벨 다른 항목으로 병합 + 원본 비활성화 (상품은 합치기 불가) */}
              {level !== 'product' && <option value="merge">{levelLabel} 합치기</option>}
              {level === 'product' && <option value="price">가격 수정</option>}
              <option value="delete">삭제 (비활성화)</option>
              {level !== 'category' && <option value="activate">활성화</option>}
              {level !== 'category' && <option value="deactivate">비활성화</option>}
            </select>

            {/* Move targets: 상위 분류만 선택 */}
            {action === 'move' && (
              <>
                <span style={{ fontSize: 12, color: '#888' }}>→</span>

                {/* 이동은 대분류부터 선택 (상위 분류 변경이므로) */}
                <select style={selectStyle} value={targetCatId || ''} onChange={e => {
                  const v = Number(e.target.value) || null
                  setTargetCatId(v); setTargetBrandId(null); setTargetLineId(null)
                  setTargetBrands([]); setTargetLines([])
                  if (v) fetchTargetBrands(v)
                }}>
                  <option value="">대분류 선택</option>
                  {categories.map(c =>
                    <option key={c.id} value={c.id}>{c.name}</option>
                  )}
                </select>

                {/* 품목/상품 이동 시 브랜드 선택 */}
                {(level === 'productLine' || level === 'product') && (
                  <select style={selectStyle} value={targetBrandId || ''} onChange={e => {
                    const v = Number(e.target.value) || null
                    setTargetBrandId(v); setTargetLineId(null); setTargetLines([])
                    if (v) fetchTargetLines(v)
                  }} disabled={!targetCatId}>
                    <option value="">브랜드 선택</option>
                    {targetBrands.map(b =>
                      <option key={b.id} value={b.id}>{b.name}</option>
                    )}
                  </select>
                )}

                {/* 상품 이동 시 품목 선택 (선택사항) */}
                {level === 'product' && (
                  <select style={selectStyle} value={targetLineId || ''} onChange={e => setTargetLineId(Number(e.target.value) || null)}
                    disabled={!targetBrandId}>
                    <option value="">품목 (선택)</option>
                    {targetLines.map(l =>
                      <option key={l.id} value={l.id}>{l.name}</option>
                    )}
                  </select>
                )}
              </>
            )}

            {/* Merge targets: 같은 레벨의 대상 항목 선택 */}
            {action === 'merge' && (
              <>
                <span style={{ fontSize: 12, color: '#888' }}>→</span>

                {/* 대분류 합치기: 대상 대분류 */}
                <select style={selectStyle} value={targetCatId || ''} onChange={e => {
                  const v = Number(e.target.value) || null
                  setTargetCatId(v); setTargetBrandId(null); setTargetLineId(null)
                  setTargetBrands([]); setTargetLines([])
                  if (v && level !== 'category') fetchTargetBrands(v)
                }}>
                  <option value="">{level === 'category' ? '대상 대분류' : '대분류 선택'}</option>
                  {categories.filter(c => level === 'category' ? !selectedIds.has(c.id) : true).map(c =>
                    <option key={c.id} value={c.id}>{c.name}</option>
                  )}
                </select>

                {/* 브랜드 합치기: 대상 브랜드 */}
                {(level === 'brand' || level === 'productLine') && (
                  <select style={selectStyle} value={targetBrandId || ''} onChange={e => {
                    const v = Number(e.target.value) || null
                    setTargetBrandId(v); setTargetLineId(null); setTargetLines([])
                    if (v && level === 'productLine') fetchTargetLines(v)
                  }} disabled={!targetCatId}>
                    <option value="">{level === 'brand' ? '대상 브랜드' : '브랜드 선택'}</option>
                    {targetBrands.filter(b => level === 'brand' ? !selectedIds.has(b.id) : true).map(b =>
                      <option key={b.id} value={b.id}>{b.name}</option>
                    )}
                  </select>
                )}

                {/* 품목 합치기: 대상 품목 */}
                {level === 'productLine' && (
                  <select style={selectStyle} value={targetLineId || ''} onChange={e => setTargetLineId(Number(e.target.value) || null)}
                    disabled={!targetBrandId}>
                    <option value="">대상 품목</option>
                    {targetLines.filter(l => !selectedIds.has(l.id)).map(l =>
                      <option key={l.id} value={l.id}>{l.name}</option>
                    )}
                  </select>
                )}
              </>
            )}

            {/* Price controls */}
            {action === 'price' && level === 'product' && (
              <>
                <select style={{ ...selectStyle, minWidth: 80 }} value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="purchasePrice">매입가</option>
                  <option value="sellingPrice">도매가</option>
                  <option value="retailPrice">소매가</option>
                </select>
                <select style={{ ...selectStyle, minWidth: 80 }} value={priceMethod} onChange={e => setPriceMethod(e.target.value)}>
                  <option value="set">금액 설정</option>
                  <option value="percent">% 조정</option>
                  <option value="add">금액 가감</option>
                </select>
                <input type="number" style={{ ...selectStyle, minWidth: 90, width: 90 }}
                  value={priceValue} onChange={e => setPriceValue(e.target.value)}
                  placeholder={priceMethod === 'percent' ? '예: 10' : '예: 1000'} />
              </>
            )}

            <div style={{ flex: 1 }} />

            <button style={btnStyle('default')} onClick={onClose}>닫기</button>
            <button
              style={btnStyle(action === 'delete' ? 'danger' : action === 'deactivate' ? 'warn' : 'primary')}
              disabled={loading || selectedIds.size === 0}
              onClick={() => {
                let msg = ''
                if (action === 'move') {
                  const targetName = level === 'brand' ? categories.find(c => c.id === targetCatId)?.name
                    : level === 'productLine' ? targetBrands.find(b => b.id === targetBrandId)?.name
                    : targetLineId ? targetLines.find(l => l.id === targetLineId)?.name : targetBrands.find(b => b.id === targetBrandId)?.name
                  msg = `선택한 ${selectedIds.size}개 ${levelLabel}을(를) ${targetName || '대상'}(으)로 이동하시겠습니까?`
                } else if (action === 'merge') {
                  const targetName = level === 'category' ? categories.find(c => c.id === targetCatId)?.name
                    : level === 'brand' ? targetBrands.find(b => b.id === targetBrandId)?.name
                    : targetLines.find(l => l.id === targetLineId)?.name
                  msg = `선택한 ${selectedIds.size}개 ${levelLabel}을(를) ${targetName || '대상'}(으)로 합치시겠습니까?\n(원본은 비활성화됩니다)`
                } else {
                  const actLabel = action === 'price' ? '가격 수정' : action === 'delete' ? '삭제' : action === 'activate' ? '활성화' : '비활성화'
                  msg = `선택한 ${selectedIds.size}개 ${levelLabel}을(를) ${actLabel}하시겠습니까?`
                }
                if (confirm(msg)) handleExecute()
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

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>{text}</div>
}
