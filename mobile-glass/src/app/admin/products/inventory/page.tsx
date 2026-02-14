'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface ProductInventory {
  id: number
  brandId: number
  brandName: string
  name: string
  totalStock: number
  optionCount: number
  lowStockOptions: number
  options: {
    id: number
    sph: string | null
    cyl: string | null
    optionName: string | null
    stock: number
    barcode: string | null
    location: string | null
  }[]
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<any>(null)
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in')
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustMemo, setAdjustMemo] = useState('')
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, lowStock: 0, zeroStock: 0 })

  useEffect(() => {
    fetchInventory()
  }, [selectedBrand, search])

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBrand !== 'all') params.set('brandId', selectedBrand)
      if (search) params.set('search', search)

      const res = await fetch(`/api/inventory?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setBrands(data.brands)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAdjustModal = (product: ProductInventory, option: any) => {
    setAdjustTarget({ product, option })
    setAdjustType('in')
    setAdjustQty(0)
    setAdjustMemo('')
    setShowAdjustModal(true)
  }

  const handleAdjust = async () => {
    if (!adjustTarget || adjustQty === 0) return

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productOptionId: adjustTarget.option.id,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustType,
          memo: adjustMemo,
          processedBy: '관리자'
        })
      })

      if (res.ok) {
        setShowAdjustModal(false)
        fetchInventory()
      } else {
        const data = await res.json()
        alert(data.error || '재고 조정에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  return (
    <AdminLayout activeMenu="products">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>재고 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>상품별 재고 현황을 확인하고 입출고를 처리합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>전체 상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.totalProducts}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>총 재고</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.totalStock.toLocaleString()}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>저재고</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#f59e0b' }}>{stats.lowStock}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ef4444' }}>{stats.zeroStock}</div>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}
        >
          <option value="all">전체 브랜드</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="상품명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}
        />
      </div>

      {/* 상품 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>재고 데이터가 없습니다.</div>
        ) : (
          products.map(product => (
            <div key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              {/* 상품 헤더 */}
              <div
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: expandedProduct === product.id ? '#f9fafb' : '#fff'
                }}
              >
                <div>
                  <span style={{ color: '#86868b', fontSize: '12px', marginRight: '8px' }}>{product.brandName}</span>
                  <span style={{ fontWeight: 500 }}>{product.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px' }}>
                    재고: <strong>{product.totalStock}</strong>
                  </span>
                  {product.lowStockOptions > 0 && (
                    <span style={{ fontSize: '12px', color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                      저재고 {product.lowStockOptions}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#86868b' }}>
                    옵션 {product.optionCount}개
                  </span>
                  <span style={{ color: '#86868b' }}>{expandedProduct === product.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* 옵션 목록 (확장 시) */}
              {expandedProduct === product.id && product.options.length > 0 && (
                <div style={{ padding: '0 16px 16px', background: '#f9fafb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>SPH</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>CYL</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>옵션</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>바코드</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>위치</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500, color: '#6b7280' }}>재고</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 500, color: '#6b7280' }}>조정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.options.map(option => (
                        <tr key={option.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 8px' }}>{option.sph || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>{option.cyl || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>{option.optionName || '-'}</td>
                          <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{option.barcode || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>{option.location || '-'}</td>
                          <td style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: option.stock === 0 ? '#ef4444' : option.stock <= 5 ? '#f59e0b' : '#1d1d1f'
                          }}>
                            {option.stock}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => openAdjustModal(product, option)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: '1px solid #e9ecef',
                                background: '#fff',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              조정
                            </button>
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

      {/* 재고 조정 모달 */}
      {showAdjustModal && adjustTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>재고 조정</h2>
            <p style={{ fontSize: '14px', color: '#86868b', marginBottom: '20px' }}>
              {adjustTarget.product.brandName} - {adjustTarget.product.name}
              {adjustTarget.option.sph && ` (${adjustTarget.option.sph}/${adjustTarget.option.cyl || '0'})`}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>현재 재고: <strong>{adjustTarget.option.stock}</strong></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>조정 유형</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'in', label: '입고 (+)' },
                  { value: 'out', label: '출고 (-)' },
                  { value: 'adjust', label: '직접 설정' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAdjustType(opt.value as any)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: adjustType === opt.value ? '#007aff' : '#e5e5e5',
                      background: adjustType === opt.value ? '#eff6ff' : '#fff',
                      color: adjustType === opt.value ? '#007aff' : '#1d1d1f',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                {adjustType === 'adjust' ? '변경할 재고 수량' : '조정 수량'}
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                min={0}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>메모</label>
              <input
                type="text"
                value={adjustMemo}
                onChange={e => setAdjustMemo(e.target.value)}
                placeholder="조정 사유 입력"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleAdjust}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
