'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
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
  phone?: string | null
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
    for (let i = 0; i <= 800; i += 25) {
      values.push((i / 100).toFixed(2))
    }
  } else {
    for (let i = 0; i >= -2000; i -= 25) {
      values.push((i / 100).toFixed(2))
    }
  }
  return values
}

function generateCylValues(): string[] {
  const values: string[] = []
  for (let i = 0; i >= -600; i -= 25) {
    values.push((i / 100).toFixed(2))
  }
  return values
}

function formatSphDisplay(sph: string): string {
  const num = Math.abs(parseFloat(sph))
  return String(Math.round(num * 100)).padStart(3, '0')
}

function formatCylDisplay(cyl: string): string {
  const num = parseFloat(cyl)
  const abs = Math.abs(num)
  return '-' + String(Math.round(abs * 100)).padStart(3, '0')
}

export default function NewOrderPage() {
  const router = useRouter()
  
  // Refs for keyboard navigation
  const storeInputRef = useRef<HTMLInputElement>(null)
  const storeResultRefs = useRef<(HTMLDivElement | null)[]>([])
  const brandSelectRef = useRef<HTMLSelectElement>(null)
  const productListRef = useRef<HTMLDivElement>(null)
  const productItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  
  // 기본 데이터
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  
  // 선택 상태
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orderType, setOrderType] = useState<'여벌' | '착색' | 'RX' | '기타'>('여벌')
  
  // 상품 목록 키보드 네비게이션
  const [productFocusIndex, setProductFocusIndex] = useState<number>(-1)
  
  // 가맹점 검색 결과 키보드 네비게이션
  const [storeFocusIndex, setStoreFocusIndex] = useState<number>(-1)
  
  // 그리드 키보드 입력 모드
  const [gridInputMode, setGridInputMode] = useState(false)
  const [focusedCell, setFocusedCell] = useState<{sph: string, cyl: string, isPlus: boolean} | null>(null)
  const [cellInputValue, setCellInputValue] = useState('')
  
  // 주문 아이템
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [memo, setMemo] = useState('')
  
  // 로딩
  const [loading, setLoading] = useState(false)
  const [storeSearchText, setStoreSearchText] = useState('')

  const selectedProduct = products.find(p => p.id === selectedProductId)
  
  const filteredProducts = selectedBrandId 
    ? products.filter(p => p.brandId === selectedBrandId)
    : []

  // 가맹점 검색 필터 (이름, 코드, 전화번호)
  const filteredStores = storeSearchText
    ? stores.filter(s => 
        s.name.toLowerCase().includes(storeSearchText.toLowerCase()) ||
        s.code.toLowerCase().includes(storeSearchText.toLowerCase()) ||
        (s.phone && s.phone.replace(/-/g, '').includes(storeSearchText.replace(/-/g, '')))
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

  // 글로벌 Escape 키 핸들러 - 상호 검색으로 돌아가기
  useEffect(() => {
    const handleGlobalEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 셀 입력 중이 아닐 때만
        if (!focusedCell) {
          setSelectedStore(null)
          setStoreSearchText('')
          setStoreFocusIndex(-1)
          storeInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalEscape)
    return () => window.removeEventListener('keydown', handleGlobalEscape)
  }, [focusedCell])

  // 가맹점 검색 결과 스크롤
  useEffect(() => {
    if (storeFocusIndex >= 0 && storeResultRefs.current[storeFocusIndex]) {
      storeResultRefs.current[storeFocusIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [storeFocusIndex])

  // 상품 목록 스크롤
  useEffect(() => {
    if (productFocusIndex >= 0 && productItemRefs.current[productFocusIndex]) {
      productItemRefs.current[productFocusIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [productFocusIndex])

  // 브랜드 선택 후 상품 목록으로 포커스 이동
  const handleBrandKeyDown = (e: KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter' && selectedBrandId && filteredProducts.length > 0) {
      e.preventDefault()
      setProductFocusIndex(0)
      productListRef.current?.focus()
    }
  }

  // 상품 목록 키보드 네비게이션
  const handleProductListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (filteredProducts.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setProductFocusIndex(prev => Math.min(prev + 1, filteredProducts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setProductFocusIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (productFocusIndex >= 0 && productFocusIndex < filteredProducts.length) {
        setSelectedProductId(filteredProducts[productFocusIndex].id)
        // 상품 선택 후 그리드로 포커스 이동
        setGridInputMode(true)
        gridRef.current?.focus()
      }
    }
  }

  // 그리드 셀에 수량 입력
  const handleGridCellInput = useCallback((sph: string, cyl: string, quantity: number) => {
    if (!selectedProduct || !selectedStore || quantity < 1) return
    
    const exists = orderItems.find(item => 
      item.product.id === selectedProduct.id && 
      item.sph === sph && 
      item.cyl === cyl
    )
    
    if (exists) {
      setOrderItems(items => items.map(item => 
        item.id === exists.id ? { ...item, quantity } : item
      ))
    } else {
      const newItem: OrderItem = {
        id: `${Date.now()}-${Math.random()}`,
        product: selectedProduct,
        sph,
        cyl,
        axis: '0',
        quantity
      }
      setOrderItems(items => [...items, newItem])
    }
  }, [selectedProduct, selectedStore, orderItems])

  // 그리드 셀 클릭
  const handleGridClick = useCallback((sph: string, cyl: string, isPlus: boolean = false) => {
    if (!selectedProduct || !selectedStore) {
      alert('가맹점과 상품을 먼저 선택해주세요.')
      return
    }
    
    // 입력 모드 활성화
    setFocusedCell({ sph, cyl, isPlus })
    setCellInputValue('')
    setGridInputMode(true)
  }, [selectedProduct, selectedStore])

  // 셀 입력 완료
  const commitCellInput = useCallback(() => {
    if (focusedCell && cellInputValue) {
      const qty = parseInt(cellInputValue)
      if (!isNaN(qty) && qty > 0) {
        handleGridCellInput(focusedCell.sph, focusedCell.cyl, qty)
      }
    }
    setFocusedCell(null)
    setCellInputValue('')
  }, [focusedCell, cellInputValue, handleGridCellInput])

  // 그리드 키보드 이벤트
  const handleGridKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, sph: string, cyl: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitCellInput()
    } else if (e.key === 'Escape') {
      setFocusedCell(null)
      setCellInputValue('')
    }
  }, [commitCellInput])

  const removeItem = (id: string) => {
    setOrderItems(items => items.filter(item => item.id !== id))
  }

  const totalAmount = orderItems.reduce((sum, item) => 
    sum + item.product.sellingPrice * item.quantity, 0
  )
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)

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

  const minusSphValues = generateSphValues(false)
  const plusSphValues = generateSphValues(true)
  const cylValues = generateCylValues()
  const displayCylValues = cylValues.slice(0, 17)

  // 그리드 셀 렌더링 함수
  const renderGridCell = (sph: string, cyl: string, isPlus: boolean = false) => {
    const actualSph = isPlus ? '+' + sph : sph
    const item = orderItems.find(item => 
      item.product.id === selectedProductId &&
      item.sph === actualSph && 
      item.cyl === cyl
    )
    const hasItem = !!item
    const isFocused = focusedCell?.sph === actualSph && focusedCell?.cyl === cyl
    
    return (
      <div
        key={cyl}
        onClick={() => handleGridClick(actualSph, cyl, isPlus)}
        style={{
          padding: 2,
          textAlign: 'center',
          borderBottom: '1px solid #eee',
          borderLeft: '1px solid #eee',
          background: isFocused ? '#fff9c4' : hasItem ? '#4caf50' : '#fff',
          color: hasItem ? '#fff' : '#333',
          cursor: selectedProduct ? 'pointer' : 'not-allowed',
          transition: 'background 0.1s',
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={e => {
          if (selectedProduct && !hasItem && !isFocused) {
            e.currentTarget.style.background = '#e8f5e9'
          }
        }}
        onMouseLeave={e => {
          if (!hasItem && !isFocused) {
            e.currentTarget.style.background = '#fff'
          }
        }}
      >
        {isFocused ? (
          <input
            type="text"
            autoFocus
            value={cellInputValue}
            onChange={e => setCellInputValue(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => handleGridKeyDown(e, actualSph, cyl)}
            onBlur={commitCellInput}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              outline: 'none'
            }}
            placeholder="수량"
          />
        ) : hasItem ? (
          <span style={{ fontSize: 11, fontWeight: 600 }}>{item.quantity}</span>
        ) : null}
      </div>
    )
  }

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
          gap: 8,
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          overflow: 'hidden',
          minHeight: 0
        }}>
          {/* 가맹점 선택 */}
          <section style={{ flexShrink: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>상호 [Esc]</label>
            <input
              ref={storeInputRef}
              type="text"
              placeholder="이름, 코드, 전화번호로 검색..."
              value={storeSearchText}
              onKeyDown={e => {
                const visibleStores = filteredStores.slice(0, 10)
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  if (storeSearchText && visibleStores.length > 0 && !selectedStore) {
                    setStoreFocusIndex(prev => Math.min(prev + 1, visibleStores.length - 1))
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  if (storeSearchText && visibleStores.length > 0 && !selectedStore) {
                    setStoreFocusIndex(prev => Math.max(prev - 1, 0))
                  }
                } else if (e.key === 'Enter') {
                  // 포커스된 항목이 있으면 선택
                  if (storeSearchText && visibleStores.length > 0 && !selectedStore) {
                    const selectIndex = storeFocusIndex >= 0 ? storeFocusIndex : 0
                    setSelectedStore(visibleStores[selectIndex])
                    setStoreSearchText('')
                    setStoreFocusIndex(-1)
                    brandSelectRef.current?.focus()
                  } else if (selectedStore) {
                    // 가맹점 선택 후 Enter → 품목으로 이동
                    brandSelectRef.current?.focus()
                  }
                } else if (e.key === 'Escape') {
                  // Esc → 상호 선택 초기화
                  setSelectedStore(null)
                  setStoreSearchText('')
                  setStoreFocusIndex(-1)
                }
              }}
              onChange={e => {
                setStoreSearchText(e.target.value)
                setStoreFocusIndex(-1) // 검색어 변경시 포커스 리셋
              }}
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
                {selectedStore.phone && selectedStore.phone !== '-' && (
                  <div style={{ color: '#666' }}>전화: {selectedStore.phone}</div>
                )}
                {selectedStore.outstandingAmount !== undefined && (
                  <div style={{ color: selectedStore.outstandingAmount > 0 ? '#f44336' : '#4caf50' }}>
                    미결제: {selectedStore.outstandingAmount.toLocaleString()}원
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                  Enter → 품목 선택
                </div>
              </div>
            )}
            {storeSearchText && !selectedStore && filteredStores.length > 0 && (
              <div style={{ 
                maxHeight: 150, 
                overflow: 'auto', 
                marginTop: 4,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: '#fff'
              }}>
                <div style={{ padding: '4px 10px', fontSize: 10, color: '#999', borderBottom: '1px solid #eee' }}>
                  ↑↓ 이동, Enter 선택 ({filteredStores.slice(0, 10).length}건)
                </div>
                {filteredStores.slice(0, 10).map((store, index) => (
                  <div
                    key={store.id}
                    ref={el => { storeResultRefs.current[index] = el }}
                    onClick={() => {
                      setSelectedStore(store)
                      setStoreSearchText('')
                      setStoreFocusIndex(-1)
                      brandSelectRef.current?.focus()
                    }}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      fontSize: 12,
                      background: storeFocusIndex === index ? '#e3f2fd' : '#fff',
                      borderLeft: storeFocusIndex === index ? '3px solid #1976d2' : '3px solid transparent'
                    }}
                    onMouseEnter={e => {
                      if (storeFocusIndex !== index) e.currentTarget.style.background = '#f0f0f0'
                    }}
                    onMouseLeave={e => {
                      if (storeFocusIndex !== index) e.currentTarget.style.background = '#fff'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{store.name}</div>
                    <div style={{ color: '#999', fontSize: 11 }}>
                      {store.code} {store.phone && store.phone !== '-' && `| ${store.phone}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 주문 유형 */}
          <section style={{ flexShrink: 0 }}>
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
          <section style={{ flexShrink: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>품목 [F5]</label>
            <select
              ref={brandSelectRef}
              value={selectedBrandId || ''}
              onChange={e => {
                setSelectedBrandId(e.target.value ? parseInt(e.target.value) : null)
                setSelectedProductId(null)
                setProductFocusIndex(-1)
              }}
              onKeyDown={handleBrandKeyDown}
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
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
              브랜드 선택 후 Enter → 상품 선택
            </div>
          </section>

          {/* 상품 선택 */}
          <section style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#333', flexShrink: 0 }}>상품 [F6]</label>
            <div 
              ref={productListRef}
              tabIndex={0}
              onKeyDown={handleProductListKeyDown}
              style={{ 
                marginTop: 4,
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#fff',
                flex: 1,
                overflow: 'auto',
                outline: 'none',
                minHeight: 0
              }}
            >
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 15, textAlign: 'center', color: '#999', fontSize: 12 }}>
                  {selectedBrandId ? '상품이 없습니다' : '브랜드를 선택하세요'}
                </div>
              ) : (
                filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    ref={el => { productItemRefs.current[index] = el }}
                    onClick={() => {
                      setSelectedProductId(product.id)
                      setProductFocusIndex(index)
                    }}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      background: selectedProductId === product.id 
                        ? '#e3f2fd' 
                        : productFocusIndex === index 
                          ? '#fff3e0' 
                          : '#fff',
                      fontSize: 11,
                      borderLeft: productFocusIndex === index ? '3px solid #ff9800' : '3px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onMouseEnter={e => {
                      if (selectedProductId !== product.id && productFocusIndex !== index) {
                        e.currentTarget.style.background = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedProductId !== product.id && productFocusIndex !== index) {
                        e.currentTarget.style.background = '#fff'
                      }
                    }}
                  >
                    <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </span>
                    <span style={{ color: '#1976d2', fontWeight: 600, flexShrink: 0 }}>
                      {product.sellingPrice.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
              ↑↓ 이동, Enter 선택 → 도수표 입력
            </div>
          </section>
        </div>

        {/* 중앙: SPH/CYL 그리드 */}
        <div 
          ref={gridRef}
          tabIndex={0}
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            overflow: 'hidden',
            outline: 'none'
          }}
        >
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
              <span style={{ color: '#1976d2' }}>셀 클릭 → 수량 입력</span>
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
                  {displayCylValues.map(cyl => renderGridCell(sph, cyl, false))}
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
                  {displayCylValues.map(cyl => renderGridCell(sph, cyl, true))}
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 50px 50px 40px 70px 30px',
            padding: '6px 10px',
            background: '#e0e0e0',
            fontSize: 11,
            fontWeight: 600,
            borderBottom: '1px solid #ccc'
          }}>
            <span>상품명</span>
            <span style={{ textAlign: 'center' }}>SPH</span>
            <span style={{ textAlign: 'center' }}>CYL</span>
            <span style={{ textAlign: 'center' }}>수량</span>
            <span style={{ textAlign: 'right' }}>금액</span>
            <span></span>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? (
              <div style={{ 
                padding: 30, 
                textAlign: 'center', 
                color: '#999',
                fontSize: 12
              }}>
                도수표에서 셀을 클릭하고<br />수량을 입력하세요
              </div>
            ) : (
              orderItems.map((item, index) => (
                <div 
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 50px 50px 40px 70px 30px',
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
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 10 }}>
                    {item.sph}
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 10 }}>
                    {item.cyl}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: 600 }}>
                    {item.quantity}
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
