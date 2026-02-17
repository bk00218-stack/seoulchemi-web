'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { STORES_SIDEBAR } from '../../../constants/sidebar'

interface Brand {
  id: number
  name: string
}

interface ProductLine {
  id: number
  name: string
  brandId: number
  brand: { id: number; name: string }
}

interface Product {
  id: number
  name: string
  brandId: number
  sellingPrice: number
}

interface BrandDiscount {
  id: number
  brandId: number
  discountRate: number
  brand: { id: number; name: string }
}

interface ProductLineDiscount {
  id: number
  productLineId: number
  discountRate: number
  productLine: ProductLine
}

interface ProductDiscount {
  id: number
  productId: number
  discountRate: number
  product: Product
}

interface ProductPrice {
  id: number
  productId: number
  specialPrice: number
  product: Product
}

interface StoreDiscountData {
  store: { id: number; name: string; code: string; discountRate: number }
  brandDiscounts: BrandDiscount[]
  productLineDiscounts: ProductLineDiscount[]
  productDiscounts: ProductDiscount[]
  productPrices: ProductPrice[]
  brands: Brand[]
  productLines: ProductLine[]
  products: Product[]
}

export default function StoreDiscountsPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast()
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<StoreDiscountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'brand' | 'product_line' | 'product_discount' | 'product_price'>('brand')
  
  // 새 항목 추가용
  const [newBrandId, setNewBrandId] = useState<number>(0)
  const [newBrandRate, setNewBrandRate] = useState<number>(0)
  const [newProductLineId, setNewProductLineId] = useState<number>(0)
  const [newProductLineRate, setNewProductLineRate] = useState<number>(0)
  const [newProductId, setNewProductId] = useState<number>(0)
  const [newProductRate, setNewProductRate] = useState<number>(0)
  const [newPriceProductId, setNewPriceProductId] = useState<number>(0)
  const [newSpecialPrice, setNewSpecialPrice] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/stores/${id}/discounts`)
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch (error) {
      console.error('Failed:', error)
      toast.error('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const updateBaseRate = async (discountRate: number) => {
    setSaving(true)
    try {
      await fetch(`/api/stores/${id}/discounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountRate })
      })
      loadData()
    } catch (error) {
      toast.error('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const addDiscount = async (type: string, payload: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch(`/api/stores/${id}/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload })
      })
      loadData()
      // Reset forms
      setNewBrandId(0)
      setNewBrandRate(0)
      setNewProductLineId(0)
      setNewProductLineRate(0)
      setNewProductId(0)
      setNewProductRate(0)
      setNewPriceProductId(0)
      setNewSpecialPrice(0)
    } catch (error) {
      toast.error('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const deleteDiscount = async (type: string, targetId: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await fetch(`/api/stores/${id}/discounts?type=${type}&targetId=${targetId}`, {
        method: 'DELETE'
      })
      loadData()
    } catch (error) {
      toast.error('삭제 실패')
    }
  }

  if (loading) {
    return (
      <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          로딩 중...
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          거래처를 찾을 수 없습니다
        </div>
      </Layout>
    )
  }

  const { store, brandDiscounts, productLineDiscounts, productDiscounts, productPrices, brands, productLines, products } = data

  // 이미 설정된 브랜드/품목/상품 제외
  const availableBrands = brands.filter(b => !brandDiscounts.find(bd => bd.brandId === b.id))
  const availableProductLines = productLines.filter(pl => !productLineDiscounts.find(pld => pld.productLineId === pl.id))
  const availableProductsForDiscount = products.filter(p => !productDiscounts.find(pd => pd.productId === p.id))
  const availableProductsForPrice = products.filter(p => !productPrices.find(pp => pp.productId === p.id))

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            {store.name} <span style={{ color: '#86868b', fontWeight: 400 }}>({store.code})</span>
          </h2>
          <p style={{ color: '#86868b', fontSize: '14px', margin: '4px 0 0' }}>할인 설정</p>
        </div>
      </div>

      {/* 가격 적용 우선순위 안내 */}
      <div style={{ 
        background: '#fff3cd', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '24px', 
        fontSize: '14px',
        border: '1px solid #ffc107'
      }}>
        <strong>📌 가격 적용 우선순위:</strong> 특수단가 → 상품별 할인 → 품목별 할인 → 브랜드별 할인 → 기본할인율 → 정가
      </div>

      {/* 기본 할인율 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>기본 할인율</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            defaultValue={store.discountRate}
            step="0.5"
            min="0"
            max="100"
            style={{
              width: '100px',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              textAlign: 'right'
            }}
            onBlur={(e) => {
              const val = parseFloat(e.target.value) || 0
              if (val !== store.discountRate) {
                updateBaseRate(val)
              }
            }}
          />
          <span style={{ fontSize: '16px' }}>%</span>
          <span style={{ color: '#86868b', fontSize: '13px' }}>
            (모든 상품에 기본 적용)
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'brand', label: '브랜드별 할인', count: brandDiscounts.length },
          { key: 'product_line', label: '품목별 할인', count: productLineDiscounts.length },
          { key: 'product_discount', label: '상품별 할인', count: productDiscounts.length },
          { key: 'product_price', label: '특수단가', count: productPrices.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? '#007aff' : '#f5f5f7',
              color: activeTab === tab.key ? '#fff' : '#1d1d1f',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {activeTab === 'brand' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>브랜드별 할인율</h3>
            
            {/* 추가 폼 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newBrandId}
                onChange={(e) => setNewBrandId(parseInt(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>브랜드 선택</option>
                {availableBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="할인율"
                value={newBrandRate || ''}
                onChange={(e) => setNewBrandRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>%</span>
              <button
                onClick={() => newBrandId && addDiscount('brand', { brandId: newBrandId, discountRate: newBrandRate })}
                disabled={!newBrandId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newBrandId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newBrandId ? 'pointer' : 'not-allowed'
                }}
              >
                추가
              </button>
            </div>

            {/* 목록 */}
            {brandDiscounts.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>설정된 브랜드별 할인이 없습니다</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>브랜드</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>할인율</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {brandDiscounts.map(bd => (
                    <tr key={bd.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                      <td style={{ padding: '12px' }}>{bd.brand.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                          {bd.discountRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteDiscount('brand', bd.brandId)}
                          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'product_line' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>품목별 할인율</h3>
            <p style={{ color: '#86868b', fontSize: '13px', marginBottom: '16px' }}>
              품목(블루라이트, 누진다초점, 변색 등) 단위로 할인율을 설정합니다.
            </p>
            
            {/* 추가 폼 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newProductLineId}
                onChange={(e) => setNewProductLineId(parseInt(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>품목 선택</option>
                {availableProductLines.map(pl => (
                  <option key={pl.id} value={pl.id}>[{pl.brand.name}] {pl.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="할인율"
                value={newProductLineRate || ''}
                onChange={(e) => setNewProductLineRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>%</span>
              <button
                onClick={() => newProductLineId && addDiscount('product_line', { productLineId: newProductLineId, discountRate: newProductLineRate })}
                disabled={!newProductLineId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newProductLineId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newProductLineId ? 'pointer' : 'not-allowed'
                }}
              >
                추가
              </button>
            </div>

            {/* 목록 */}
            {productLineDiscounts.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>설정된 품목별 할인이 없습니다</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>브랜드</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>품목</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>할인율</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {productLineDiscounts.map(pld => (
                    <tr key={pld.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                      <td style={{ padding: '12px', color: '#86868b' }}>{pld.productLine.brand.name}</td>
                      <td style={{ padding: '12px' }}>{pld.productLine.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                          {pld.discountRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteDiscount('product_line', pld.productLineId)}
                          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'product_discount' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>상품별 할인율</h3>
            
            {/* 추가 폼 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newProductId}
                onChange={(e) => setNewProductId(parseInt(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>상품 선택</option>
                {availableProductsForDiscount.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sellingPrice.toLocaleString()}원)</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="할인율"
                value={newProductRate || ''}
                onChange={(e) => setNewProductRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>%</span>
              <button
                onClick={() => newProductId && addDiscount('product_discount', { productId: newProductId, discountRate: newProductRate })}
                disabled={!newProductId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newProductId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newProductId ? 'pointer' : 'not-allowed'
                }}
              >
                추가
              </button>
            </div>

            {/* 목록 */}
            {productDiscounts.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>설정된 상품별 할인이 없습니다</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>상품</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>정가</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>할인율</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>할인가</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {productDiscounts.map(pd => {
                    const discountedPrice = Math.round(pd.product.sellingPrice * (1 - pd.discountRate / 100))
                    return (
                      <tr key={pd.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                        <td style={{ padding: '12px' }}>{pd.product.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#86868b' }}>{pd.product.sellingPrice.toLocaleString()}원</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                            {pd.discountRate}%
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#007aff' }}>{discountedPrice.toLocaleString()}원</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteDiscount('product_discount', pd.productId)}
                            style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'product_price' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>상품별 특수단가</h3>
            <p style={{ color: '#86868b', fontSize: '13px', marginBottom: '16px' }}>
              특수단가가 설정된 상품은 다른 할인과 관계없이 이 가격이 적용됩니다.
            </p>
            
            {/* 추가 폼 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newPriceProductId}
                onChange={(e) => {
                  const pid = parseInt(e.target.value)
                  setNewPriceProductId(pid)
                  const product = products.find(p => p.id === pid)
                  if (product) setNewSpecialPrice(product.sellingPrice)
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>상품 선택</option>
                {availableProductsForPrice.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (정가: {p.sellingPrice.toLocaleString()}원)</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="특수단가"
                value={newSpecialPrice || ''}
                onChange={(e) => setNewSpecialPrice(parseInt(e.target.value) || 0)}
                style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>원</span>
              <button
                onClick={() => newPriceProductId && addDiscount('product_price', { productId: newPriceProductId, specialPrice: newSpecialPrice })}
                disabled={!newPriceProductId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newPriceProductId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newPriceProductId ? 'pointer' : 'not-allowed'
                }}
              >
                추가
              </button>
            </div>

            {/* 목록 */}
            {productPrices.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>설정된 특수단가가 없습니다</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>상품</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>정가</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>특수단가</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>할인액</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {productPrices.map(pp => {
                    const discount = pp.product.sellingPrice - pp.specialPrice
                    const discountRate = ((discount / pp.product.sellingPrice) * 100).toFixed(1)
                    return (
                      <tr key={pp.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                        <td style={{ padding: '12px' }}>{pp.product.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#86868b', textDecoration: 'line-through' }}>{pp.product.sellingPrice.toLocaleString()}원</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ff3b30' }}>{pp.specialPrice.toLocaleString()}원</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                            -{discount.toLocaleString()}원 ({discountRate}%)
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteDiscount('product_price', pp.productId)}
                            style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
