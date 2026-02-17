'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface ProductOption {
  id: number
  sph: string | null
  cyl: string | null
  optionName: string | null
  stock: number
  barcode: string | null
  location: string | null
}

interface ProductInventory {
  id: number
  brandId: number
  brandName: string
  name: string
  totalStock: number
  optionCount: number
  lowStockOptions: number
  options: ProductOption[]
}

interface Stats {
  totalProducts: number
  totalStock: number
  lowStock: number
  zeroStock: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalStock: 0, lowStock: 0, zeroStock: 0 })

  useEffect(() => {
    fetchInventory()
  }, [selectedBrand, search, lowStockOnly])

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBrand !== 'all') params.set('brandId', selectedBrand)
      if (search) params.set('search', search)
      if (lowStockOnly) params.set('lowStock', 'true')

      const res = await fetch(`/api/inventory?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setBrands(data.brands || [])
        setStats(data.stats || { totalProducts: 0, totalStock: 0, lowStock: 0, zeroStock: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return '#ff3b30'
    if (stock <= 5) return '#ff9500'
    return '#1d1d1f'
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>재고 현황</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
          상품별 재고 현황을 확인합니다. 저재고 및 품절 상품을 관리하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>전체 상품</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)' }}>{stats.totalProducts.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 재고</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#007aff' }}>{stats.totalStock.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#ff9500', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>저재고 (5개 이하)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ff9500' }}>{stats.lowStock.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠️</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#ff3b30', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>품절</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ff3b30' }}>{stats.zeroStock.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚫</div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none', minWidth: 150 }}
        >
          <option value="all">전체 브랜드</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="🔍 상품명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 16px', background: lowStockOnly ? '#fff0e6' : 'var(--gray-50)', borderRadius: 8, border: `1px solid ${lowStockOnly ? '#ff9500' : 'var(--gray-200)'}` }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
            style={{ accentColor: '#ff9500' }}
          />
          <span style={{ fontSize: 14, color: lowStockOnly ? '#ff9500' : 'var(--gray-600)', fontWeight: lowStockOnly ? 500 : 400 }}>저재고만</span>
        </label>
      </div>

      {/* 상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            로딩 중...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              {search || selectedBrand !== 'all' || lowStockOnly ? '검색 결과가 없습니다' : '재고 데이터가 없습니다'}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? '다른 검색어를 시도해보세요' : '상품을 등록하면 재고 현황이 여기에 표시됩니다'}
            </div>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
              {/* 상품 헤더 */}
              <div
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: expandedProduct === product.id ? 'var(--gray-50)' : '#fff',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--gray-400)', fontSize: 12, background: 'var(--gray-100)', padding: '4px 10px', borderRadius: 4 }}>{product.brandName}</span>
                  <span style={{ fontWeight: 500 }}>{product.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontSize: 14 }}>
                    총 재고: <strong style={{ color: getStockColor(product.totalStock) }}>{product.totalStock}</strong>
                  </span>
                  {product.lowStockOptions > 0 && (
                    <span style={{ fontSize: 12, color: '#ff9500', background: '#fef3e7', padding: '4px 10px', borderRadius: 4, fontWeight: 500 }}>
                      ⚠ 저재고 {product.lowStockOptions}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                    옵션 {product.optionCount}개
                  </span>
                  <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{expandedProduct === product.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* 옵션 목록 (확장 시) */}
              {expandedProduct === product.id && product.options.length > 0 && (
                <div style={{ padding: '0 16px 16px', background: 'var(--gray-50)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>SPH</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>CYL</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>옵션명</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>바코드</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>위치</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500, color: 'var(--gray-500)' }}>재고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.options.map(option => (
                        <tr key={option.id} style={{ borderBottom: '1px solid var(--gray-100)', background: '#fff' }}>
                          <td style={{ padding: '12px 8px' }}>{option.sph || '-'}</td>
                          <td style={{ padding: '12px 8px' }}>{option.cyl || '-'}</td>
                          <td style={{ padding: '12px 8px' }}>{option.optionName || '-'}</td>
                          <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-500)' }}>{option.barcode || '-'}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--gray-500)' }}>{option.location || '-'}</td>
                          <td style={{
                            padding: '12px 8px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: getStockColor(option.stock)
                          }}>
                            {option.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  )
}
