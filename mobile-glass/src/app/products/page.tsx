'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data.brands || [])
      // 첫 번째 브랜드 자동 선택
      if (data.brands?.length > 0) {
        handleSelectBrand(data.brands[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectBrand(brand: Brand) {
    setSelectedBrand(brand)
    setSelectedProduct(null)
    setOptions([])
    setProductLoading(true)
    try {
      const res = await fetch(`/api/products?brandId=${brand.id}`)
      const data = await res.json()
      setProducts(data.products || [])
      // 첫 번째 상품 자동 선택
      if (data.products?.length > 0) {
        handleSelectProduct(data.products[0])
      }
    } catch (e) {
      console.error(e)
      setProducts([])
    } finally {
      setProductLoading(false)
    }
  }

  async function handleSelectProduct(product: Product) {
    setSelectedProduct(product)
    setOptionLoading(true)
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
  }

  // 필터링된 브랜드
  const filteredBrands = brands.filter(b => {
    if (brandSearch && !b.name.toLowerCase().includes(brandSearch.toLowerCase())) return false
    return true
  })

  // 필터링된 상품
  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.optionType !== categoryFilter) return false
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  // 필터링된 옵션
  const filteredOptions = options.filter(o => {
    if (optionSearch) {
      const q = optionSearch.toLowerCase()
      return o.sph.includes(q) || o.cyl.includes(q) || (o.barcode?.includes(q) ?? false)
    }
    return true
  })

  // 옵션타입 목록
  const optionTypes = [...new Set(products.map(p => p.optionType))]

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
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>상품 관리</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>브랜드별 상품 및 옵션을 관리합니다</p>
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
                <button style={actionBtnStyle}>순서저장</button>
                <button style={actionBtnStyle}>일괄수정</button>
                <button style={primaryBtnStyle}>+ 상품</button>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={gridHeaderStyle}>수정</th>
                    <th style={gridHeaderStyle}>옵션타입</th>
                    <th style={gridHeaderStyle}>상품명</th>
                    <th style={gridHeaderStyle}>묶음상품</th>
                    <th style={gridHeaderStyle}>굴절률</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'right' }}>판매가</th>
                    <th style={gridHeaderStyle}>상태</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center' }}>순서</th>
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
                      <td style={gridCellStyle}>
                        <button style={{ ...actionBtnStyle, padding: '2px 8px' }}>수정</button>
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
                      <td style={{ ...gridCellStyle, textAlign: 'center', color: 'var(--gray-500)' }}>
                        {product.displayOrder}
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
                <button style={actionBtnStyle}>도수생성</button>
                <button style={primaryBtnStyle}>+</button>
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
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>옵션 없음</div>
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
                        <button style={{ ...actionBtnStyle, padding: '2px 8px' }}>수정</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
