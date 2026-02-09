'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'

const SIDEBAR = [
  {
    title: '후결제 주문',
    items: [
      { label: '여벌 주문내역', href: '/' },
      { label: 'RX 주문내역', href: '/orders/rx' },
      { label: '관리자 주문등록', href: '/orders/new' },
      { label: '명세표 출력이력', href: '/orders/print-history' },
    ]
  },
  {
    title: '출고관리',
    items: [
      { label: '전체 주문내역', href: '/orders/all' },
      { label: '출고 확인', href: '/orders/shipping' },
      { label: '출고 배송지 정보', href: '/orders/delivery' },
    ]
  }
]

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  brandName: string
  brandId: number
  optionType: string
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
}

interface Store {
  id: number
  name: string
  code: string
  outstandingAmount?: number
}

interface OrderItem {
  id: string
  product: Product
  sph: string
  cyl: string
  axis: string
  quantity: number
}

// SPH/CYL 그리드 생성 함수
function generateSphValues(isPlus: boolean): string[] {
  const values: string[] = []
  if (isPlus) {
    // +0.00 ~ +8.00
    for (let i = 0; i <= 800; i += 25) {
      values.push((i / 100).toFixed(2))
    }
  } else {
    // -0.00 ~ -20.00 (마이너스)
    for (let i = 0; i >= -2000; i -= 25) {
      values.push((i / 100).toFixed(2))
    }
  }
  return values
}

function generateCylValues(): string[] {
  const values: string[] = []
  // 0.00 ~ -6.00
  for (let i = 0; i >= -600; i -= 25) {
    values.push((i / 100).toFixed(2))
  }
  return values
}

// SPH 표시 포맷 (000, 025, 050 형식)
function formatSphDisplay(sph: string): string {
  const num = Math.abs(parseFloat(sph))
  return String(Math.round(num * 100)).padStart(3, '0')
}

// CYL 표시 포맷 (-000, -025 형식)
function formatCylDisplay(cyl: string): string {
  const num = parseFloat(cyl)
  const abs = Math.abs(num)
  return '-' + String(Math.round(abs * 100)).padStart(3, '0')
}

export default function NewOrderPage() {
  const router = useRouter()
  
  // 기본 데이터
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  
  // 선택 상태
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orderType, setOrderType] = useState<'여벌' | '착색' | 'RX' | '기타'>('여벌')
  
  // 주문 아이템
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [memo, setMemo] = useState('')
  
  // 로딩
  const [loading, setLoading] = useState(false)
  const [storeSearchText, setStoreSearchText] = useState('')

  // 현재 선택된 상품
  const selectedProduct = products.find(p => p.id === selectedProductId)
  
  // 브랜드 내 상품 필터
  const filteredProducts = selectedBrandId 
    ? products.filter(p => p.brandId === selectedBrandId)
    : []

  // 가맹점 검색 필터
  const filteredStores = storeSearchText
    ? stores.filter(s => 
        s.name.toLowerCase().includes(storeSearchText.toLowerCase()) ||
        s.code.toLowerCase().includes(storeSearchText.toLowerCase())
      )
    : stores

  // 데이터 로드
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => {
      setProducts(data.products || [])
      setBrands(data.brands || [])
    })
    fetch('/api/stores').then(r => r.json()).then(data => setStores(data.stores || []))
  }, [])

  // 그리드 셀 클릭 - 주문 추가
  const handleGridClick = useCallback((sph: string, cyl: string) => {
    if (!selectedProduct || !selectedStore) {
      alert('가맹점과 상품을 먼저 선택해주세요.')
      return
    }
    
    // 중복 체크
    const exists = orderItems.find(item => 
      item.product.id === selectedProduct.id && 
      item.sph === sph && 
      item.cyl === cyl
    )
    
    if (exists) {
      // 이미 있으면 수량 증가
      setOrderItems(items => items.map(item => 
        item.id === exists.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // 새로 추가
      const newItem: OrderItem = {
        id: `${Date.now()}-${Math.random()}`,
        product: selectedProduct,
        sph,
        cyl,
        axis: '0',
        quantity: 1
      }
      setOrderItems(items => [...items, newItem])
    }
  }, [selectedProduct, selectedStore, orderItems])

  // 아이템 삭제
  const removeItem = (id: string) => {
    setOrderItems(items => items.filter(item => item.id !== id))
  }

  // 수량 변경
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setOrderItems(items => items.map(item =>
      item.id === id ? { ...item, quantity } : item
    ))
  }

  // 총 금액 계산
  const totalAmount = orderItems.reduce((sum, item) => 
    sum + item.product.sellingPrice * item.quantity, 0
  )
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  // 주문 제출
  const handleSubmit = async () => {
    if (!selectedStore || orderItems.length === 0) {
      alert('가맹점과 상품을 선택해주세요.')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.id,
          orderType,
          memo,
          items: orderItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            sph: item.sph,
            cyl: item.cyl,
            axis: item.axis
          }))
        })
      })
      
      if (res.ok) {
        alert('주문이 등록되었습니다.')
        router.push('/')
      } else {
        alert('주문 생성 실패')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    }
    setLoading(false)
  }

  // SPH/CYL 값 배열
  const minusSphValues = generateSphValues(false)
  const plusSphValues = generateSphValues(true)
  const cylValues = generateCylValues()

  // 마이너스 CYL만 사용 (0.00 ~ -4.00 정도로 제한)
  const displayCylValues = cylValues.slice(0, 17) // 0.00 ~ -4.00

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #333'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            판매전표 입력
          </h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            OlwsPro 스타일 주문 등록
          </p>
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>
          {new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 15, height: 'calc(100vh - 180px)' }}>
        
        {/* 왼쪽: 가맹점 + 상품 선택 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 10,
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          overflow: 'auto'
        }}>
          {/* 가맹점 선택 */}
          <section>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>상호 [Esc]</label>
            <input
              type="text"
              placeholder="가맹점 검색..."
              value={storeSearchText}
              onChange={e => setStoreSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
                marginTop: 4
              }}
            />
            {selectedStore && (
              <div style={{
                marginTop: 8,
                padding: '8px 10px',
                background: '#e3f2fd',
                borderRadius: 4,
                fontSize: 12
              }}>
                <div style={{ fontWeight: 600 }}>{selectedStore.name}</div>
                <div style={{ color: '#666' }}>코드: {selectedStore.code}</div>
                {selectedStore.outstandingAmount !== undefined && (
                  <div style={{ color: selectedStore.outstandingAmount > 0 ? '#f44336' : '#4caf50' }}>
                    미결제: {selectedStore.outstandingAmount.toLocaleString()}원
                  </div>
                )}
              </div>
            )}
            {storeSearchText && !selectedStore && (
              <div style={{ 
                maxHeight: 150, 
                overflow: 'auto', 
                marginTop: 4,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: '#fff'
              }}>
                {filteredStores.slice(0, 10).map(store => (
                  <div
                    key={store.id}
                    onClick={() => {
                      setSelectedStore(store)
                      setStoreSearchText('')
                    }}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      fontSize: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ fontWeight: 500 }}>{store.name}</div>
                    <div style={{ color: '#999', fontSize: 11 }}>{store.code}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 주문 유형 */}
          <section>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>주문 구분</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {(['여벌', '착색', 'RX', '기타'] as const).map(type => (
                <label 
                  key={type}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    background: orderType === type ? '#1976d2' : '#fff',
                    color: orderType === type ? '#fff' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: 4
                  }}
                >
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === type}
                    onChange={() => setOrderType(type)}
                    style={{ display: 'none' }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </section>

          {/* 품목 (브랜드) 선택 */}
          <section>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>품목 [F5]</label>
            <select
              value={selectedBrandId || ''}
              onChange={e => {
                setSelectedBrandId(e.target.value ? parseInt(e.target.value) : null)
                setSelectedProductId(null)
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
                marginTop: 4,
                background: '#fff'
              }}
            >
              <option value="">브랜드 선택...</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </section>

          {/* 품명 (상품) 선택 */}
          <section style={{ flex: 1, overflow: 'auto' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>품명 [F6]</label>
            <div style={{ 
              marginTop: 4,
              border: '1px solid #ccc',
              borderRadius: 4,
              background: '#fff',
              maxHeight: 300,
              overflow: 'auto'
            }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 15, textAlign: 'center', color: '#999', fontSize: 12 }}>
                  {selectedBrandId ? '상품이 없습니다' : '브랜드를 선택하세요'}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      background: selectedProductId === product.id ? '#e3f2fd' : '#fff',
                      fontSize: 12
                    }}
                    onMouseEnter={e => {
                      if (selectedProductId !== product.id) {
                        e.currentTarget.style.background = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedProductId !== product.id) {
                        e.currentTarget.style.background = '#fff'
                      }
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      color: '#666',
                      fontSize: 11,
                      marginTop: 2
                    }}>
                      <span>{product.optionType}</span>
                      <span style={{ color: '#1976d2', fontWeight: 600 }}>
                        {product.sellingPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* 중앙: SPH/CYL 그리드 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* 그리드 헤더 */}
          <div style={{
            padding: '8px 12px',
            background: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {selectedProduct ? (
                <>
                  <span style={{ color: '#1976d2' }}>{selectedProduct.brandName}</span>
                  {' - '}
                  {selectedProduct.name}
                  {' '}
                  <span style={{ color: '#666', fontWeight: 400 }}>
                    ({selectedProduct.sellingPrice.toLocaleString()}원)
                  </span>
                </>
              ) : (
                <span style={{ color: '#999' }}>상품을 선택하세요</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
              <span>○ 여벌</span>
              <span>○ 착색</span>
              <span>○ RX</span>
            </div>
          </div>

          {/* 그리드 본체 */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
            {/* 마이너스 SPH 그리드 */}
            <div style={{ flex: 1, borderRight: '2px solid #1976d2' }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: `50px repeat(${displayCylValues.length}, 45px)`,
                fontSize: 10,
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1
              }}>
                <div style={{ 
                  padding: 4, 
                  fontWeight: 600, 
                  background: '#e3f2fd',
                  textAlign: 'center',
                  borderBottom: '1px solid #ccc'
                }}>
                  -Sph
                </div>
                {displayCylValues.map(cyl => (
                  <div key={cyl} style={{ 
                    padding: 4, 
                    textAlign: 'center',
                    background: '#e3f2fd',
                    borderBottom: '1px solid #ccc',
                    borderLeft: '1px solid #ddd'
                  }}>
                    {formatCylDisplay(cyl)}
                  </div>
                ))}
              </div>
              
              {/* SPH 행들 (마이너스) */}
              {minusSphValues.slice(0, 40).map(sph => (
                <div 
                  key={sph}
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: `50px repeat(${displayCylValues.length}, 45px)`,
                    fontSize: 10
                  }}
                >
                  <div style={{ 
                    padding: 4, 
                    fontWeight: 600, 
                    background: '#fafafa',
                    textAlign: 'center',
                    borderBottom: '1px solid #eee'
                  }}>
                    {formatSphDisplay(sph)}
                  </div>
                  {displayCylValues.map(cyl => {
                    const hasItem = orderItems.some(item => 
                      item.product.id === selectedProductId &&
                      item.sph === sph && 
                      item.cyl === cyl
                    )
                    return (
                      <div
                        key={cyl}
                        onClick={() => handleGridClick(sph, cyl)}
                        style={{
                          padding: 4,
                          textAlign: 'center',
                          borderBottom: '1px solid #eee',
                          borderLeft: '1px solid #eee',
                          background: hasItem ? '#4caf50' : '#fff',
                          color: hasItem ? '#fff' : '#333',
                          cursor: selectedProduct ? 'pointer' : 'not-allowed',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => {
                          if (selectedProduct && !hasItem) {
                            e.currentTarget.style.background = '#e8f5e9'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!hasItem) {
                            e.currentTarget.style.background = '#fff'
                          }
                        }}
                      >
                        {hasItem && '●'}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* 플러스 SPH 그리드 */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: `50px repeat(${displayCylValues.length}, 45px)`,
                fontSize: 10,
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1
              }}>
                <div style={{ 
                  padding: 4, 
                  fontWeight: 600, 
                  background: '#fff3e0',
                  textAlign: 'center',
                  borderBottom: '1px solid #ccc'
                }}>
                  +Sph
                </div>
                {displayCylValues.map(cyl => (
                  <div key={cyl} style={{ 
                    padding: 4, 
                    textAlign: 'center',
                    background: '#fff3e0',
                    borderBottom: '1px solid #ccc',
                    borderLeft: '1px solid #ddd'
                  }}>
                    {formatCylDisplay(cyl)}
                  </div>
                ))}
              </div>
              
              {/* SPH 행들 (플러스) */}
              {plusSphValues.slice(0, 40).map(sph => (
                <div 
                  key={sph}
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: `50px repeat(${displayCylValues.length}, 45px)`,
                    fontSize: 10
                  }}
                >
                  <div style={{ 
                    padding: 4, 
                    fontWeight: 600, 
                    background: '#fafafa',
                    textAlign: 'center',
                    borderBottom: '1px solid #eee'
                  }}>
                    {formatSphDisplay(sph)}
                  </div>
                  {displayCylValues.map(cyl => {
                    const sphWithSign = '+' + sph
                    const hasItem = orderItems.some(item => 
                      item.product.id === selectedProductId &&
                      item.sph === sphWithSign && 
                      item.cyl === cyl
                    )
                    return (
                      <div
                        key={cyl}
                        onClick={() => handleGridClick(sphWithSign, cyl)}
                        style={{
                          padding: 4,
                          textAlign: 'center',
                          borderBottom: '1px solid #eee',
                          borderLeft: '1px solid #eee',
                          background: hasItem ? '#4caf50' : '#fff',
                          color: hasItem ? '#fff' : '#333',
                          cursor: selectedProduct ? 'pointer' : 'not-allowed',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => {
                          if (selectedProduct && !hasItem) {
                            e.currentTarget.style.background = '#e8f5e9'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!hasItem) {
                            e.currentTarget.style.background = '#fff'
                          }
                        }}
                      >
                        {hasItem && '●'}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#f5f5f5',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* 주문 목록 헤더 */}
          <div style={{
            padding: '10px 12px',
            background: '#333',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>주문 목록</span>
            <span>{orderItems.length}건</span>
          </div>

          {/* 컬럼 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 50px 70px 30px',
            padding: '6px 10px',
            background: '#e0e0e0',
            fontSize: 11,
            fontWeight: 600,
            borderBottom: '1px solid #ccc'
          }}>
            <span>상품명</span>
            <span style={{ textAlign: 'center' }}>SPH</span>
            <span style={{ textAlign: 'center' }}>CYL</span>
            <span style={{ textAlign: 'right' }}>금액</span>
            <span></span>
          </div>

          {/* 주문 아이템 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? (
              <div style={{ 
                padding: 30, 
                textAlign: 'center', 
                color: '#999',
                fontSize: 12
              }}>
                그리드에서 도수를 클릭하여<br />주문을 추가하세요
              </div>
            ) : (
              orderItems.map((item, index) => (
                <div 
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 50px 70px 30px',
                    padding: '8px 10px',
                    fontSize: 11,
                    borderBottom: '1px solid #ddd',
                    background: index % 2 === 0 ? '#fff' : '#fafafa',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 11 }}>
                      {item.product.name}
                    </div>
                    <div style={{ color: '#666', fontSize: 10 }}>
                      {item.product.brandName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                    {item.sph}
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                    {item.cyl}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 500 }}>
                    {(item.product.sellingPrice * item.quantity).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 메모 */}
          <div style={{ padding: '8px 10px', borderTop: '1px solid #ddd' }}>
            <input
              type="text"
              placeholder="메모..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 12
              }}
            />
          </div>

          {/* 합계 */}
          <div style={{
            padding: '10px 12px',
            background: '#333',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 12 }}>
              총 <strong>{totalQuantity}</strong>개
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {totalAmount.toLocaleString()}원
            </div>
          </div>

          {/* 버튼들 */}
          <div style={{ 
            padding: 10,
            display: 'flex',
            gap: 8
          }}>
            <button
              onClick={() => setOrderItems([])}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              초기화
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedStore || orderItems.length === 0}
              style={{
                flex: 2,
                padding: '10px',
                background: loading ? '#ccc' : '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {loading ? '처리중...' : '전송 [F2]'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
