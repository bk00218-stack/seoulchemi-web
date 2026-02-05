'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/app/components/Navigation'

interface Store {
  id: number
  name: string
  code: string
  discountRate: number
  outstandingAmount: number
  creditLimit: number
}

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  brandId: number
  optionType: string
  sellingPrice: number
  hasSph: boolean
  hasCyl: boolean
}

interface PriceInfo {
  finalPrice: number
  originalPrice: number
  discountRate: number
  discountType: string
}

// 도수 범위 생성
const generateSphRange = () => {
  const range: string[] = []
  for (let i = 4; i >= -8; i -= 0.25) {
    range.push(i >= 0 ? `+${i.toFixed(2)}` : i.toFixed(2))
  }
  return range
}

const generateCylRange = () => {
  const range: string[] = ['0.00']
  for (let i = -0.25; i >= -4; i -= 0.25) {
    range.push(i.toFixed(2))
  }
  return range
}

const SPH_RANGE = generateSphRange()
const CYL_RANGE = generateCylRange()

export default function NewOrderPage() {
  const router = useRouter()

  // 단계별 선택
  const [stores, setStores] = useState<Store[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [storeSearch, setStoreSearch] = useState('')
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null)
  
  // 도수표 수량 (key: "sph_cyl", value: quantity)
  const [gridQuantities, setGridQuantities] = useState<Record<string, number>>({})
  
  // 주문
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    fetchStores()
    fetchBrands()
  }, [])

  // 브랜드 선택시 상품 로드
  useEffect(() => {
    if (selectedBrand) {
      fetchProducts(selectedBrand.id)
    }
  }, [selectedBrand])

  // 상품 선택시 가격 정보 로드
  useEffect(() => {
    if (selectedStore && selectedProduct) {
      fetchPriceInfo(selectedStore.id, selectedProduct.id)
    }
  }, [selectedStore, selectedProduct])

  const fetchStores = async () => {
    const res = await fetch('/api/stores?limit=500&status=active')
    if (res.ok) {
      const data = await res.json()
      setStores(data.stores || [])
    }
  }

  const fetchBrands = async () => {
    const res = await fetch('/api/brands')
    if (res.ok) {
      const data = await res.json()
      setBrands(data.brands || data || [])
    }
  }

  const fetchProducts = async (brandId: number) => {
    const res = await fetch(`/api/products?brandId=${brandId}&limit=500&isActive=true`)
    if (res.ok) {
      const data = await res.json()
      setProducts(data.products || [])
    }
  }

  const fetchPriceInfo = async (storeId: number, productId: number) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/price?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setPriceInfo(data)
      }
    } catch (e) {
      // 가격 정보 없으면 정가 사용
      if (selectedProduct) {
        setPriceInfo({
          finalPrice: selectedProduct.sellingPrice,
          originalPrice: selectedProduct.sellingPrice,
          discountRate: 0,
          discountType: 'none'
        })
      }
    }
  }

  // 가맹점 필터링
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.code.toLowerCase().includes(storeSearch.toLowerCase())
  )

  // 도수표 수량 변경
  const handleQuantityChange = (sph: string, cyl: string, value: string) => {
    const key = `${sph}_${cyl}`
    const qty = parseInt(value) || 0
    
    setGridQuantities(prev => {
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: qty }
    })
  }

  // 도수표 입력 수량 합계
  const gridTotal = Object.values(gridQuantities).reduce((sum, qty) => sum + qty, 0)
  
  // 총액 계산
  const totalAmount = priceInfo ? gridTotal * priceInfo.finalPrice : 0
  const totalOriginal = priceInfo ? gridTotal * priceInfo.originalPrice : 0
  const totalDiscount = totalOriginal - totalAmount

  // 주문 제출 (바로 접수대기로)
  const handleSubmit = async () => {
    if (!selectedStore) {
      alert('거래처를 선택해주세요.')
      return
    }
    if (!selectedProduct || !priceInfo) {
      alert('상품을 선택해주세요.')
      return
    }
    if (gridTotal === 0) {
      alert('수량을 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      // 도수표에서 주문 아이템 생성
      const items = Object.entries(gridQuantities).map(([key, qty]) => {
        const [sph, cyl] = key.split('_')
        return {
          productId: selectedProduct.id,
          quantity: qty,
          unitPrice: priceInfo.finalPrice,
          sph,
          cyl: cyl === '0.00' ? null : cyl,
        }
      })

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.id,
          orderType: 'stock',
          memo,
          items
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        // 프린트 서버로 출고지시서 출력 요청
        try {
          const printRes = await fetch('/api/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.order.id })
          })
          
          if (!printRes.ok) {
            const printErr = await printRes.json()
            console.warn('출력 실패:', printErr)
            // 출력 실패해도 주문은 성공했으므로 알림만
            if (printErr.hint) {
              alert(`주문 접수 완료! (${data.order.orderNo})\n\n⚠️ 출력 실패: ${printErr.hint}`)
            }
          }
        } catch (printError) {
          console.warn('프린트 서버 연결 실패:', printError)
        }
        
        // 초기화하고 계속 주문 받을 수 있게
        setGridQuantities({})
        setMemo('')
        // 같은 상품 계속 주문하거나, 다른 상품 선택 가능
      } else {
        const data = await res.json()
        alert(data.error || '주문 등록에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 선택 초기화
  const resetBrand = () => {
    setSelectedBrand(null)
    setSelectedProduct(null)
    setProducts([])
    setGridQuantities({})
    setPriceInfo(null)
  }

  const resetProduct = () => {
    setSelectedProduct(null)
    setGridQuantities({})
    setPriceInfo(null)
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>주문 등록</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          거래처 → 브랜드 → 상품 → 도수표에서 수량 입력
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
        {/* 왼쪽: 선택 영역 */}
        <div>
          {/* Step 1: 거래처 선택 */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            border: selectedStore ? '2px solid #34c759' : '1px solid #e5e5e5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: selectedStore ? '#34c759' : '#007aff',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700
                }}>1</span>
                거래처 선택
              </h2>
              {selectedStore && (
                <button onClick={() => { setSelectedStore(null); resetBrand() }}
                  style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                  변경
                </button>
              )}
            </div>

            {selectedStore ? (
              <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedStore.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {selectedStore.code} · 기본할인: {selectedStore.discountRate || 0}% · 미수금: {selectedStore.outstandingAmount?.toLocaleString() || 0}원
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="거래처 검색..."
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', marginBottom: '8px' }}
                />
                <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
                  {filteredStores.slice(0, 30).map(store => (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 500 }}>{store.name}</div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>{store.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: 브랜드 선택 */}
          {selectedStore && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              border: selectedBrand ? '2px solid #34c759' : '1px solid #e5e5e5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedBrand ? '#34c759' : '#007aff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>2</span>
                  브랜드 선택
                </h2>
                {selectedBrand && (
                  <button onClick={resetBrand}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                    변경
                  </button>
                )}
              </div>

              {selectedBrand ? (
                <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <div style={{ fontWeight: 600 }}>{selectedBrand.name}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {brands.map(brand => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        background: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: 상품 선택 */}
          {selectedBrand && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              border: selectedProduct ? '2px solid #34c759' : '1px solid #e5e5e5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedProduct ? '#34c759' : '#007aff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>3</span>
                  상품 선택
                </h2>
                {selectedProduct && (
                  <button onClick={resetProduct}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                    변경
                  </button>
                )}
              </div>

              {selectedProduct ? (
                <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '13px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {priceInfo && priceInfo.discountRate > 0 ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#86868b' }}>{priceInfo.originalPrice.toLocaleString()}원</span>
                        <span style={{ color: '#ff3b30', fontWeight: 600 }}>{priceInfo.finalPrice.toLocaleString()}원</span>
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {priceInfo.discountRate.toFixed(1)}% 할인
                        </span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#007aff' }}>{selectedProduct.sellingPrice.toLocaleString()}원</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        background: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '14px' }}>{product.name}</div>
                      <div style={{ fontSize: '13px', color: '#007aff', fontWeight: 600 }}>{product.sellingPrice.toLocaleString()}원</div>
                    </button>
                  ))}
                  {products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#86868b' }}>
                      상품이 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: 도수표 */}
          {selectedProduct && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e5e5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: gridTotal > 0 ? '#34c759' : '#007aff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>4</span>
                  도수표 수량 입력
                </h2>
                {gridTotal > 0 && (
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    {gridTotal}개 선택됨
                  </span>
                )}
              </div>

              <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{
                        position: 'sticky',
                        left: 0,
                        top: 0,
                        background: '#f5f5f7',
                        padding: '8px',
                        border: '1px solid #e5e5e5',
                        zIndex: 2,
                        minWidth: '60px'
                      }}>
                        SPH\CYL
                      </th>
                      {CYL_RANGE.map(cyl => (
                        <th key={cyl} style={{
                          position: 'sticky',
                          top: 0,
                          background: '#f5f5f7',
                          padding: '8px',
                          border: '1px solid #e5e5e5',
                          minWidth: '50px',
                          zIndex: 1
                        }}>
                          {cyl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SPH_RANGE.map(sph => (
                      <tr key={sph}>
                        <td style={{
                          position: 'sticky',
                          left: 0,
                          background: '#f5f5f7',
                          padding: '8px',
                          border: '1px solid #e5e5e5',
                          fontWeight: 500,
                          textAlign: 'center'
                        }}>
                          {sph}
                        </td>
                        {CYL_RANGE.map(cyl => {
                          const key = `${sph}_${cyl}`
                          const qty = gridQuantities[key] || ''
                          return (
                            <td key={cyl} style={{ padding: '2px', border: '1px solid #e5e5e5' }}>
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={e => handleQuantityChange(sph, cyl, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 4px',
                                  border: qty ? '2px solid #007aff' : '1px solid transparent',
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: qty ? 600 : 400,
                                  background: qty ? '#eff6ff' : '#fff',
                                  outline: 'none'
                                }}
                                onFocus={e => e.target.select()}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 주문 요약 */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          position: 'sticky',
          top: '80px',
          height: 'fit-content'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📋 주문 요약
          </h2>

          {/* 선택 정보 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#f5f5f7', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>거래처</div>
              <div style={{ fontWeight: 500 }}>{selectedStore?.name || '-'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#f5f5f7', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>브랜드</div>
              <div style={{ fontWeight: 500 }}>{selectedBrand?.name || '-'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#f5f5f7', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>상품</div>
              <div style={{ fontWeight: 500 }}>{selectedProduct?.name || '-'}</div>
              {priceInfo && (
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {priceInfo.discountRate > 0 ? (
                    <span>
                      <span style={{ textDecoration: 'line-through', color: '#86868b' }}>{priceInfo.originalPrice.toLocaleString()}</span>
                      <span style={{ color: '#ff3b30', fontWeight: 600, marginLeft: '8px' }}>{priceInfo.finalPrice.toLocaleString()}원</span>
                    </span>
                  ) : (
                    <span style={{ color: '#007aff', fontWeight: 600 }}>{priceInfo.finalPrice.toLocaleString()}원</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 수량 */}
          <div style={{ padding: '12px', borderRadius: '8px', background: gridTotal > 0 ? '#eff6ff' : '#f5f5f7', marginBottom: '16px', border: gridTotal > 0 ? '2px solid #007aff' : 'none' }}>
            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>선택 수량</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: gridTotal > 0 ? '#007aff' : '#c5c5c7' }}>
              {gridTotal}<span style={{ fontSize: '14px', fontWeight: 400 }}>개</span>
            </div>
          </div>

          {/* 메모 */}
          <input
            type="text"
            placeholder="메모 (선택)"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              fontSize: '14px',
              marginBottom: '16px'
            }}
          />

          {/* 총액 */}
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#f5f5f7',
            marginBottom: '16px'
          }}>
            {totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#86868b' }}>정가 합계</span>
                <span style={{ textDecoration: 'line-through', color: '#86868b' }}>{totalOriginal.toLocaleString()}원</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#dc2626' }}>할인</span>
                <span style={{ color: '#dc2626', fontWeight: 500 }}>-{totalDiscount.toLocaleString()}원</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>주문 금액</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#007aff' }}>
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 주문 접수 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedStore || !selectedProduct || gridTotal === 0}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: submitting || !selectedStore || !selectedProduct || gridTotal === 0 ? '#c5c5c7' : '#34c759',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: submitting || !selectedStore || !selectedProduct || gridTotal === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '접수 중...' : '📥 접수대기로 등록'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
