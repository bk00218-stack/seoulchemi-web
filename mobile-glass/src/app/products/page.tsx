'use client'

import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'

const SIDEBAR = [
  {
    title: '상품관리',
    items: [
      { label: '상품 관리', href: '/products' },
      { label: '묶음상품 설정', href: '/products/bundles' },
      { label: 'RX상품 관리', href: '/products/rx' },
      { label: '상품 단축코드 설정', href: '/products/shortcuts' },
    ]
  },
  {
    title: '재고관리',
    items: [
      { label: '일괄재고수정', href: '/products/stock/bulk' },
      { label: '적정재고 설정', href: '/products/stock/optimal' },
    ]
  }
]

interface Brand {
  id: number
  name: string
  stockManage: string | null
  isActive: boolean
  _count?: { products: number }
}

interface Product {
  id: number
  code: string
  name: string
  optionType: string
  productType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  displayOrder: number
}

interface ProductOption {
  id: number
  sph: string
  cyl: string
  memo: string | null
  barcode: string | null
  stock: number
  status: string
  stockLocation: string | null
}

// 모달 스타일
const modalOverlayStyle: React.CSSProperties = {
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
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  width: 500,
  maxHeight: '85vh',
  overflowY: 'auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e5e5',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  color: '#1d1d1f',
}

export default function ProductsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [productLoading, setProductLoading] = useState(false)
  const [optionLoading, setOptionLoading] = useState(false)
  
  // 필터
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandSearch, setBrandSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)

  // 모달 상태
  const [showProductModal, setShowProductModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)

  // 순서 변경 추적
  const [orderChanged, setOrderChanged] = useState(false)
  const [productOrders, setProductOrders] = useState<{[key: number]: number}>({})

  // 일괄 선택
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data.brands || [])
      if (data.brands?.length > 0) {
        handleSelectBrand(data.brands[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBrand = useCallback(async (brand: Brand) => {
    setSelectedBrand(brand)
    setSelectedProduct(null)
    setOptions([])
    setProductLoading(true)
    setSelectedProductIds(new Set())
    try {
      const res = await fetch(`/api/products?brandId=${brand.id}`)
      const data = await res.json()
      setProducts(data.products || [])
      const orders: {[key: number]: number} = {}
      data.products?.forEach((p: Product) => { orders[p.id] = p.displayOrder })
      setProductOrders(orders)
      setOrderChanged(false)
      if (data.products?.length > 0) {
        handleSelectProduct(data.products[0])
      }
    } catch (e) {
      console.error(e)
      setProducts([])
    } finally {
      setProductLoading(false)
    }
  }, [])

  const handleSelectProduct = useCallback(async (product: Product) => {
    setSelectedProduct(product)
    setOptionLoading(true)
    setSelectedOptionIds(new Set())
    try {
      const res = await fetch(`/api/products/${product.id}/options`)
      const data = await res.json()
      setOptions(data.options || [])
    } catch (e) {
      console.error(e)
      setOptions([])
    } finally {
      setOptionLoading(false)
    }
  }, [])

  // 바코드 검색
  async function handleBarcodeSearch() {
    if (!barcodeSearch.trim()) return
    try {
      const res = await fetch(`/api/products/search?barcode=${encodeURIComponent(barcodeSearch)}`)
      const data = await res.json()
      if (data.product && data.option) {
        // 브랜드 찾기
        const brand = brands.find(b => b.id === data.product.brandId)
        if (brand) {
          await handleSelectBrand(brand)
          setSelectedProduct(data.product)
          // 옵션 목록 로드 후 해당 옵션 하이라이트
          const optRes = await fetch(`/api/products/${data.product.id}/options`)
          const optData = await optRes.json()
          setOptions(optData.options || [])
        }
        setShowBarcodeModal(false)
        setBarcodeSearch('')
        alert(`찾았습니다: ${data.product.name} - SPH: ${data.option.sph}, CYL: ${data.option.cyl}`)
      } else {
        alert('해당 바코드를 찾을 수 없습니다.')
      }
    } catch (e) {
      console.error(e)
      alert('검색 중 오류가 발생했습니다.')
    }
  }

  // 상품 저장
  async function handleSaveProduct(formData: FormData) {
    const data = {
      brandId: selectedBrand?.id,
      name: formData.get('name'),
      optionType: formData.get('optionType'),
      productType: formData.get('productType') || formData.get('optionType'),
      bundleName: formData.get('bundleName') || null,
      refractiveIndex: formData.get('refractiveIndex') || null,
      sellingPrice: parseInt(formData.get('sellingPrice') as string) || 0,
      purchasePrice: parseInt(formData.get('purchasePrice') as string) || 0,
      isActive: formData.get('isActive') === 'true',
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowProductModal(false)
        setEditingProduct(null)
        if (selectedBrand) handleSelectBrand(selectedBrand)
      } else {
        alert('저장 실패')
      }
    } catch (e) {
      console.error(e)
      alert('저장 중 오류 발생')
    }
  }

  // 옵션 저장
  async function handleSaveOption(formData: FormData) {
    const data = {
      sph: formData.get('sph'),
      cyl: formData.get('cyl'),
      memo: formData.get('memo') || null,
      barcode: formData.get('barcode') || null,
      stock: parseInt(formData.get('stock') as string) || 0,
      isActive: formData.get('isActive') === 'true',
      location: formData.get('location') || null,
    }

    try {
      const url = editingOption 
        ? `/api/products/${selectedProduct?.id}/options/${editingOption.id}` 
        : `/api/products/${selectedProduct?.id}/options`
      const method = editingOption ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowOptionModal(false)
        setEditingOption(null)
        if (selectedProduct) handleSelectProduct(selectedProduct)
      } else {
        alert('저장 실패')
      }
    } catch (e) {
      console.error(e)
      alert('저장 중 오류 발생')
    }
  }

  // 순서 저장
  async function handleSaveOrder() {
    try {
      const res = await fetch('/api/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: productOrders }),
      })
      if (res.ok) {
        setOrderChanged(false)
        alert('순서가 저장되었습니다.')
      }
    } catch (e) {
      console.error(e)
      alert('순서 저장 실패')
    }
  }

  // 일괄 수정
  async function handleBulkEdit(formData: FormData) {
    const data = {
      ids: Array.from(selectedProductIds),
      isActive: formData.get('isActive') === '' ? undefined : formData.get('isActive') === 'true',
      optionType: formData.get('optionType') || undefined,
    }

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowBulkEditModal(false)
        setSelectedProductIds(new Set())
        if (selectedBrand) handleSelectBrand(selectedBrand)
        alert('일괄 수정 완료')
      }
    } catch (e) {
      console.error(e)
      alert('일괄 수정 실패')
    }
  }

  // 도수 자동 생성
  async function handleGenerateOptions(formData: FormData) {
    const sphFrom = parseFloat(formData.get('sphFrom') as string) || -8
    const sphTo = parseFloat(formData.get('sphTo') as string) || 4
    const sphStep = parseFloat(formData.get('sphStep') as string) || 0.25
    const cylFrom = parseFloat(formData.get('cylFrom') as string) || -2
    const cylTo = parseFloat(formData.get('cylTo') as string) || 0
    const cylStep = parseFloat(formData.get('cylStep') as string) || 0.25

    const formatValue = (v: number) => {
      const rounded = Math.round(v * 100) / 100
      if (rounded === 0) return '0.00'
      return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
    }

    const options: {sph: string, cyl: string}[] = []
    for (let sph = sphFrom; sph <= sphTo + 0.001; sph += sphStep) {
      for (let cyl = cylFrom; cyl <= cylTo + 0.001; cyl += cylStep) {
        options.push({
          sph: formatValue(sph),
          cyl: formatValue(cyl),
        })
      }
    }

    try {
      const res = await fetch(`/api/products/${selectedProduct?.id}/options/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowGenerateModal(false)
        if (selectedProduct) handleSelectProduct(selectedProduct)
        alert(`${data.created}개의 옵션이 생성되었습니다.`)
      }
    } catch (e) {
      console.error(e)
      alert('도수 생성 실패')
    }
  }

  // 순서 변경
  function handleOrderChange(productId: number, newOrder: number) {
    setProductOrders(prev => ({ ...prev, [productId]: newOrder }))
    setOrderChanged(true)
  }

  // 필터링
  const filteredBrands = brands.filter(b => {
    if (brandSearch && !b.name.toLowerCase().includes(brandSearch.toLowerCase())) return false
    return true
  })

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.optionType !== categoryFilter) return false
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  const filteredOptions = options.filter(o => {
    if (optionSearch) {
      const q = optionSearch.toLowerCase()
      return o.sph.includes(q) || o.cyl.includes(q) || (o.barcode?.includes(q) ?? false)
    }
    return true
  })

  const optionTypes = [...new Set(products.map(p => p.optionType))]

  // 스타일
  const panelStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid var(--gray-200)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const panelHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--gray-50)',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--gray-200)',
    fontSize: 13,
    outline: 'none',
  }

  const listItemStyle = (selected: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: selected ? 'var(--primary-light)' : 'transparent',
    borderBottom: '1px solid var(--gray-100)',
    transition: 'background 0.15s',
  })

  const gridCellStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid var(--gray-100)',
    fontSize: 13,
    whiteSpace: 'nowrap',
  }

  const gridHeaderStyle: React.CSSProperties = {
    ...gridCellStyle,
    background: 'var(--gray-50)',
    fontWeight: 600,
    color: 'var(--gray-600)',
    fontSize: 12,
    position: 'sticky',
    top: 0,
  }

  const actionBtnStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--gray-200)',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    color: 'var(--gray-700)',
  }

  const primaryBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="상품">
      {/* Page Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>상품 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>브랜드별 상품 및 옵션을 관리합니다</p>
        </div>
        <button 
          onClick={() => setShowBarcodeModal(true)}
          style={{ ...actionBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          🔍 바코드 검색
        </button>
      </div>

      {/* 3-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: 16, height: 'calc(100vh - 180px)' }}>
        
        {/* Panel 1: 브랜드 목록 */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-800)' }}>브랜드 목록</div>
            <input
              type="text"
              placeholder="브랜드 검색..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : filteredBrands.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>브랜드 없음</div>
            ) : (
              filteredBrands.map(brand => (
                <div
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand)}
                  style={listItemStyle(selectedBrand?.id === brand.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: selectedBrand?.id === brand.id ? 600 : 400, fontSize: 14 }}>
                      {brand.name}
                    </span>
                    <span style={{ 
                      fontSize: 11, 
                      color: 'var(--gray-500)',
                      background: 'var(--gray-100)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {brand._count?.products || 0}
                    </span>
                  </div>
                  {!brand.isActive && (
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>비활성</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--gray-200)' }}>
            <button style={{ ...primaryBtnStyle, width: '100%' }}>+ 브랜드 추가</button>
          </div>
        </div>

        {/* Panel 2: 상품 목록 */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>
                {selectedBrand ? selectedBrand.name : '상품 목록'}
                {selectedBrand && <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 8 }}>({filteredProducts.length}개)</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={handleSaveOrder}
                  disabled={!orderChanged}
                  style={{ 
                    ...actionBtnStyle, 
                    opacity: orderChanged ? 1 : 0.5,
                    background: orderChanged ? 'var(--success)' : undefined,
                    color: orderChanged ? '#fff' : undefined,
                    border: orderChanged ? 'none' : undefined,
                  }}
                >
                  순서저장
                </button>
                <button 
                  onClick={() => setShowBulkEditModal(true)}
                  disabled={selectedProductIds.size === 0}
                  style={{ ...actionBtnStyle, opacity: selectedProductIds.size > 0 ? 1 : 0.5 }}
                >
                  일괄수정 ({selectedProductIds.size})
                </button>
                <button 
                  onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
                  style={primaryBtnStyle}
                >
                  + 상품
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ ...searchInputStyle, width: 'auto', flex: '0 0 140px' }}
              >
                <option value="all">전체</option>
                {optionTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="상품명 검색..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            {productLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : !selectedBrand ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>브랜드를 선택하세요</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>상품 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ ...gridHeaderStyle, width: 30 }}>
                      <input 
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
                          } else {
                            setSelectedProductIds(new Set())
                          }
                        }}
                      />
                    </th>
                    <th style={gridHeaderStyle}>수정</th>
                    <th style={gridHeaderStyle}>옵션타입</th>
                    <th style={gridHeaderStyle}>상품명</th>
                    <th style={gridHeaderStyle}>묶음상품</th>
                    <th style={gridHeaderStyle}>굴절률</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'right' }}>판매가</th>
                    <th style={gridHeaderStyle}>상태</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', width: 60 }}>순서</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      onClick={() => handleSelectProduct(product)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedProduct?.id === product.id ? 'var(--primary-light)' : undefined,
                      }}
                    >
                      <td style={gridCellStyle} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedProductIds)
                            if (e.target.checked) {
                              newSet.add(product.id)
                            } else {
                              newSet.delete(product.id)
                            }
                            setSelectedProductIds(newSet)
                          }}
                        />
                      </td>
                      <td style={gridCellStyle} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                          style={{ ...actionBtnStyle, padding: '2px 8px' }}
                        >
                          수정
                        </button>
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{ 
                          fontSize: 11, 
                          padding: '2px 6px', 
                          borderRadius: 4,
                          background: 'var(--gray-100)',
                          color: 'var(--gray-600)',
                        }}>
                          {product.optionType}
                        </span>
                      </td>
                      <td style={{ ...gridCellStyle, fontWeight: 500 }}>{product.name}</td>
                      <td style={{ ...gridCellStyle, color: 'var(--gray-500)' }}>{product.bundleName || '-'}</td>
                      <td style={gridCellStyle}>
                        {product.refractiveIndex ? (
                          <span style={{ fontFamily: 'monospace' }}>{product.refractiveIndex}</span>
                        ) : '-'}
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'right', fontWeight: 500 }}>
                        {product.sellingPrice.toLocaleString()}원
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: product.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                          color: product.isActive ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {product.isActive ? '사용' : '미사용'}
                        </span>
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={productOrders[product.id] ?? product.displayOrder}
                          onChange={(e) => handleOrderChange(product.id, parseInt(e.target.value) || 0)}
                          style={{ width: 50, padding: '2px 4px', textAlign: 'center', border: '1px solid var(--gray-200)', borderRadius: 4 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel 3: 옵션 목록 (도수/재고) */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>
                {selectedProduct ? selectedProduct.name : '옵션 목록'}
                {selectedProduct && <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 8 }}>({filteredOptions.length}개)</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  disabled={!selectedProduct}
                  style={{ ...actionBtnStyle, opacity: selectedProduct ? 1 : 0.5 }}
                >
                  도수생성
                </button>
                <button 
                  onClick={() => { setEditingOption(null); setShowOptionModal(true) }}
                  disabled={!selectedProduct}
                  style={{ ...primaryBtnStyle, opacity: selectedProduct ? 1 : 0.5 }}
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="SPH, CYL, 바코드 검색..."
              value={optionSearch}
              onChange={(e) => setOptionSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {optionLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : !selectedProduct ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>상품을 선택하세요</div>
            ) : filteredOptions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                옵션 없음
                <br />
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  style={{ ...primaryBtnStyle, marginTop: 12 }}
                >
                  도수 자동생성
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={gridHeaderStyle}>SPH</th>
                    <th style={gridHeaderStyle}>CYL</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center' }}>재고</th>
                    <th style={gridHeaderStyle}>상태</th>
                    <th style={gridHeaderStyle}>수정</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.map(option => (
                    <tr key={option.id}>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace', fontWeight: 500 }}>{option.sph}</td>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace' }}>{option.cyl}</td>
                      <td style={{ 
                        ...gridCellStyle, 
                        textAlign: 'center',
                        color: option.stock === 0 ? 'var(--error)' : 'var(--gray-700)',
                        fontWeight: option.stock === 0 ? 600 : 400,
                      }}>
                        {option.stock}
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: option.status === '주문가능' ? 'var(--success-light)' : 'var(--gray-100)',
                          color: option.status === '주문가능' ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {option.status}
                        </span>
                      </td>
                      <td style={gridCellStyle}>
                        <button 
                          onClick={() => { setEditingOption(option); setShowOptionModal(true) }}
                          style={{ ...actionBtnStyle, padding: '2px 8px' }}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 바코드 검색 모달 */}
      {showBarcodeModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBarcodeModal(false)}>
          <div style={{ ...modalStyle, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>바코드 검색</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="바코드를 입력하세요"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                style={inputStyle}
                autoFocus
              />
              <button onClick={handleBarcodeSearch} style={primaryBtnStyle}>검색</button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 추가/수정 모달 */}
      {showProductModal && (
        <div style={modalOverlayStyle} onClick={() => setShowProductModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editingProduct ? '상품 수정' : '상품 추가'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>상품명 *</label>
                  <input name="name" defaultValue={editingProduct?.name} required style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>옵션타입 *</label>
                    <select name="optionType" defaultValue={editingProduct?.optionType || '안경렌즈 RX'} required style={inputStyle}>
                      <option value="안경렌즈 RX">안경렌즈 RX</option>
                      <option value="안경렌즈 여벌">안경렌즈 여벌</option>
                      <option value="콘택트렌즈">콘택트렌즈</option>
                      <option value="안경테">안경테</option>
                      <option value="소모품">소모품</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>굴절률</label>
                    <select name="refractiveIndex" defaultValue={editingProduct?.refractiveIndex || ''} style={inputStyle}>
                      <option value="">선택</option>
                      <option value="1.50">1.50</option>
                      <option value="1.56">1.56</option>
                      <option value="1.60">1.60</option>
                      <option value="1.67">1.67</option>
                      <option value="1.74">1.74</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>묶음상품명</label>
                  <input name="bundleName" defaultValue={editingProduct?.bundleName || ''} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>판매가</label>
                    <input name="sellingPrice" type="number" defaultValue={editingProduct?.sellingPrice || 0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>매입가</label>
                    <input name="purchasePrice" type="number" defaultValue={editingProduct?.purchasePrice || 0} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>상태</label>
                  <select name="isActive" defaultValue={editingProduct?.isActive !== false ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">사용</option>
                    <option value="false">미사용</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 옵션 추가/수정 모달 */}
      {showOptionModal && (
        <div style={modalOverlayStyle} onClick={() => setShowOptionModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editingOption ? '옵션 수정' : '옵션 추가'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveOption(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>SPH *</label>
                    <input name="sph" defaultValue={editingOption?.sph || '0.00'} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>CYL *</label>
                    <input name="cyl" defaultValue={editingOption?.cyl || '0.00'} required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>바코드</label>
                  <input name="barcode" defaultValue={editingOption?.barcode || ''} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>재고</label>
                    <input name="stock" type="number" defaultValue={editingOption?.stock || 0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>재고 위치</label>
                    <input name="location" defaultValue={editingOption?.stockLocation || ''} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>메모</label>
                  <input name="memo" defaultValue={editingOption?.memo || ''} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>상태</label>
                  <select name="isActive" defaultValue={editingOption?.status === '주문가능' ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">주문가능</option>
                    <option value="false">품절</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowOptionModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 일괄 수정 모달 */}
      {showBulkEditModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBulkEditModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              일괄 수정 ({selectedProductIds.size}개 선택)
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleBulkEdit(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>상태 변경</label>
                  <select name="isActive" defaultValue="" style={inputStyle}>
                    <option value="">변경 안함</option>
                    <option value="true">사용</option>
                    <option value="false">미사용</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>옵션타입 변경</label>
                  <select name="optionType" defaultValue="" style={inputStyle}>
                    <option value="">변경 안함</option>
                    <option value="안경렌즈 RX">안경렌즈 RX</option>
                    <option value="안경렌즈 여벌">안경렌즈 여벌</option>
                    <option value="콘택트렌즈">콘택트렌즈</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowBulkEditModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>적용</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 도수 생성 모달 */}
      {showGenerateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowGenerateModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>도수 자동 생성</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
              SPH/CYL 범위를 지정하면 해당 범위의 모든 도수 옵션을 자동으로 생성합니다.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateOptions(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>SPH 범위</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                    <input name="sphFrom" type="number" step="0.25" defaultValue={-8} style={inputStyle} />
                    <span>~</span>
                    <input name="sphTo" type="number" step="0.25" defaultValue={4} style={inputStyle} />
                    <span>간격</span>
                    <input name="sphStep" type="number" step="0.25" defaultValue={0.25} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>CYL 범위</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                    <input name="cylFrom" type="number" step="0.25" defaultValue={-2} style={inputStyle} />
                    <span>~</span>
                    <input name="cylTo" type="number" step="0.25" defaultValue={0} style={inputStyle} />
                    <span>간격</span>
                    <input name="cylStep" type="number" step="0.25" defaultValue={0.25} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
