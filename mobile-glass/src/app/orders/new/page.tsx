'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'

const SIDEBAR = [
  { title: '후결제 주문', items: [
    { label: '여벌 주문내역', href: '/' },
    { label: 'RX 주문내역', href: '/orders/rx' },
    { label: '관리자 주문등록', href: '/orders/new' },
    { label: '명세표 출력이력', href: '/orders/print-history' },
  ]},
  { title: '출고관리', items: [
    { label: '전체 주문내역', href: '/orders/all' },
    { label: '출고 확인', href: '/orders/shipping' },
    { label: '출고 배송지 정보', href: '/orders/delivery' },
  ]}
]

interface Brand { id: number; name: string }
interface Product { id: number; name: string; brandName: string; brandId: number; optionType: string; refractiveIndex: string | null; sellingPrice: number; purchasePrice: number }
interface Store { 
  id: number
  name: string
  code: string
  phone?: string | null
  deliveryPhone?: string | null
  salesRepName?: string | null
  deliveryContact?: string | null
  outstandingAmount?: number
  address?: string | null
  paymentTermDays?: number | null
}
interface OrderItem { id: string; product: Product; sph: string; cyl: string; axis: string; quantity: number }

function formatLegacy(value: number): string {
  return String(Math.round(Math.abs(value) * 100)).padStart(3, '0')
}

// OlwsPro 스타일 - 하나의 표, 가운데 기준
// 세로(행) = SPH: 0.00 ~ 15.00
// 가로(열) = CYL: 가운데 000에서 시작, 양쪽으로 400까지
// 왼쪽 = -Sph (근시), 오른쪽 = +Sph (원시)

function generateSphRows(): number[] {
  const values: number[] = []
  for (let i = 0; i <= 15; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

// CYL 열: 왼쪽은 400→000, 오른쪽은 000→400
function generateCylColsLeft(): number[] {
  const values: number[] = []
  for (let i = -4; i <= 0; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values // -4.00, -3.75, ..., -0.25, 0.00
}

function generateCylColsRight(): number[] {
  const values: number[] = []
  for (let i = 0; i >= -4; i -= 0.25) values.push(Math.round(i * 100) / 100)
  return values // 0.00, -0.25, ..., -4.00
}

export default function NewOrderPage() {
  const router = useRouter()
  
  const storeInputRef = useRef<HTMLInputElement>(null)
  const storeResultRefs = useRef<(HTMLDivElement | null)[]>([])
  const brandSelectRef = useRef<HTMLSelectElement>(null)
  const productListRef = useRef<HTMLDivElement>(null)
  const productItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orderType, setOrderType] = useState<'여벌' | '착색' | 'RX' | '기타'>('여벌')
  const [productFocusIndex, setProductFocusIndex] = useState<number>(-1)
  const [storeFocusIndex, setStoreFocusIndex] = useState<number>(-1)
  
  // 그리드: colIndex = 전체 열 인덱스 (0 = 맨 왼쪽 CYL 400, 중앙 = CYL 000, 맨 오른쪽 = CYL 400)
  const [gridFocus, setGridFocus] = useState<{sphIndex: number, colIndex: number} | null>(null)
  const [cellInputValue, setCellInputValue] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [storeSearchText, setStoreSearchText] = useState('')

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const filteredProducts = selectedBrandId ? products.filter(p => p.brandId === selectedBrandId) : []
  const filteredStores = storeSearchText
    ? stores.filter(s => s.name.toLowerCase().includes(storeSearchText.toLowerCase()) || s.code.toLowerCase().includes(storeSearchText.toLowerCase()) || (s.phone && s.phone.replace(/-/g, '').includes(storeSearchText.replace(/-/g, ''))))
    : stores

  const sphRows = generateSphRows()
  const cylColsLeft = generateCylColsLeft()   // -4.00 → 0.00 (왼쪽, -Sph용)
  const cylColsRight = generateCylColsRight() // 0.00 → -4.00 (오른쪽, +Sph용)
  
  // 전체 열: 왼쪽 CYL + 가운데 구분 + 오른쪽 CYL
  const centerIndex = cylColsLeft.length // 가운데 열 인덱스
  const totalCols = cylColsLeft.length + 1 + cylColsRight.length

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => { setProducts(data.products || []); setBrands(data.brands || []) })
    fetch('/api/stores').then(r => r.json()).then(data => setStores(data.stores || []))
  }, [])

  // 그리드 포커스 시 가운데로 스크롤
  useEffect(() => {
    if (gridContainerRef.current && !gridFocus) {
      // 초기에 가운데로 스크롤
      const container = gridContainerRef.current
      const scrollLeft = (centerIndex * 34) - (container.clientWidth / 2) + 50
      container.scrollLeft = Math.max(0, scrollLeft)
    }
  }, [selectedProductId])

  useEffect(() => {
    const handleGlobalKeys = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); setGridFocus(null); setCellInputValue(''); brandSelectRef.current?.focus() }
      else if (e.key === 'F6') { e.preventDefault(); setGridFocus(null); setCellInputValue(''); if (filteredProducts.length > 0) { setProductFocusIndex(0); productListRef.current?.focus() } }
      else if (e.key === 'F2') { e.preventDefault(); if (selectedStore && orderItems.length > 0) handleSubmit() }
      else if (e.key === 'Escape') {
        if (gridFocus) { setGridFocus(null); setCellInputValue('') }
        else { setSelectedStore(null); setStoreSearchText(''); setStoreFocusIndex(-1); setSelectedBrandId(null); setSelectedProductId(null); setProductFocusIndex(-1); storeInputRef.current?.focus() }
      }
    }
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [gridFocus, filteredProducts.length, selectedStore, orderItems.length])

  const handleProductListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (filteredProducts.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setProductFocusIndex(prev => Math.min(prev + 1, filteredProducts.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setProductFocusIndex(prev => Math.max(prev - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (productFocusIndex >= 0 && productFocusIndex < filteredProducts.length) {
        setSelectedProductId(filteredProducts[productFocusIndex].id)
        setGridFocus({ sphIndex: 0, colIndex: cylColsLeft.length - 1 }) // 왼쪽 끝(CYL 000)에서 시작
        setCellInputValue('')
        gridRef.current?.focus()
      }
    }
  }

  // 열 인덱스로 SPH 부호와 CYL 값 계산
  const getColInfo = (colIndex: number): { isPlus: boolean, cyl: number } | null => {
    if (colIndex < cylColsLeft.length) {
      // 왼쪽 영역 (-Sph)
      return { isPlus: false, cyl: cylColsLeft[colIndex] }
    } else if (colIndex === centerIndex) {
      // 가운데 (경계) - 입력 불가 영역
      return null
    } else {
      // 오른쪽 영역 (+Sph)
      const rightIndex = colIndex - centerIndex - 1
      if (rightIndex >= 0 && rightIndex < cylColsRight.length) {
        return { isPlus: true, cyl: cylColsRight[rightIndex] }
      }
    }
    return null
  }

  const handleGridCellInput = useCallback((sphIndex: number, colIndex: number, quantity: number) => {
    if (!selectedProduct || !selectedStore || quantity < 1) return
    const sph = sphRows[sphIndex]
    const colInfo = getColInfo(colIndex)
    if (!colInfo) return
    
    const actualSph = colInfo.isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = colInfo.cyl.toFixed(2)
    
    const exists = orderItems.find(item => item.product.id === selectedProduct.id && item.sph === sphStr && item.cyl === cylStr)
    if (exists) {
      setOrderItems(items => items.map(item => item.id === exists.id ? { ...item, quantity } : item))
    } else {
      setOrderItems(items => [...items, { id: `${Date.now()}-${Math.random()}`, product: selectedProduct, sph: sphStr, cyl: cylStr, axis: '0', quantity }])
    }
  }, [selectedProduct, selectedStore, orderItems, sphRows])

  const getFocusedInfo = useCallback(() => {
    if (!gridFocus) return null
    const sph = sphRows[gridFocus.sphIndex]
    const colInfo = getColInfo(gridFocus.colIndex)
    if (!colInfo) return null
    const actualSph = colInfo.isPlus ? sph : -sph
    return { sph: actualSph, cyl: colInfo.cyl, isPlus: colInfo.isPlus }
  }, [gridFocus, sphRows])

  const handleGridKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedProduct || !selectedStore) return
    const maxSphIndex = sphRows.length - 1
    const maxColIndex = totalCols - 1

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      const newValue = cellInputValue + e.key
      setCellInputValue(newValue)
      if (gridFocus) {
        const qty = parseInt(newValue)
        if (!isNaN(qty) && qty > 0) handleGridCellInput(gridFocus.sphIndex, gridFocus.colIndex, qty)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.min(prev.sphIndex + 1, maxSphIndex) } : { sphIndex: 0, colIndex: centerIndex })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.max(prev.sphIndex - 1, 0) } : { sphIndex: 0, colIndex: centerIndex })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: 0 }
        let newCol = prev.colIndex + 1
        if (newCol === centerIndex) newCol++ // 가운데 열 건너뛰기
        return { ...prev, colIndex: Math.min(newCol, maxColIndex) }
      })
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: 0 }
        let newCol = prev.colIndex - 1
        if (newCol === centerIndex) newCol-- // 가운데 열 건너뛰기
        return { ...prev, colIndex: Math.max(newCol, 0) }
      })
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      if (cellInputValue) setCellInputValue(cellInputValue.slice(0, -1))
      else if (gridFocus) {
        const info = getFocusedInfo()
        if (info && selectedProduct) {
          const sphStr = info.sph >= 0 ? `+${info.sph.toFixed(2)}` : info.sph.toFixed(2)
          const cylStr = info.cyl.toFixed(2)
          setOrderItems(items => items.filter(item => !(item.product.id === selectedProduct.id && item.sph === sphStr && item.cyl === cylStr)))
        }
      }
    }
  }, [selectedProduct, selectedStore, sphRows, totalCols, cellInputValue, gridFocus, getFocusedInfo, handleGridCellInput, centerIndex])

  const handleGridClick = useCallback((sphIndex: number, colIndex: number) => {
    if (!selectedProduct || !selectedStore) { alert('가맹점과 상품을 먼저 선택해주세요.'); return }
    setGridFocus({ sphIndex, colIndex })
    setCellInputValue('')
    gridRef.current?.focus()
  }, [selectedProduct, selectedStore])

  const removeItem = (id: string) => setOrderItems(items => items.filter(item => item.id !== id))
  const totalAmount = orderItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedStore || orderItems.length === 0) { alert('가맹점과 상품을 선택해주세요.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: selectedStore.id, orderType, memo, items: orderItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sph: item.sph, cyl: item.cyl, axis: item.axis })) }) })
      if (res.ok) {
        const data = await res.json()
        // 자동 출력
        if (data.order?.id) {
          try {
            await fetch('/api/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: data.order.id, type: 'shipping' }) })
          } catch (e) { console.error('출력 실패:', e) }
        }
        alert('주문이 등록되었습니다.')
        router.push('/')
      } else alert('주문 생성 실패')
    } catch { alert('오류가 발생했습니다.') }
    setLoading(false)
  }

  const renderCell = (sphIndex: number, colIndex: number) => {
    const sph = sphRows[sphIndex]
    const colInfo = getColInfo(colIndex)
    if (!colInfo) return null
    
    const actualSph = colInfo.isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = colInfo.cyl.toFixed(2)
    
    const item = orderItems.find(i => i.product.id === selectedProductId && i.sph === sphStr && i.cyl === cylStr)
    const isFocused = gridFocus?.sphIndex === sphIndex && gridFocus?.colIndex === colIndex
    const isCurrentRow = gridFocus?.sphIndex === sphIndex
    const isCurrentCol = gridFocus?.colIndex === colIndex
    
    let bg = sphIndex % 2 === 0 ? '#fffde7' : '#fff'
    if (isCurrentRow || isCurrentCol) bg = '#ffcdd2' // 핑크 행/열
    if (isCurrentRow && isCurrentCol) bg = '#ef9a9a' // 교차점 더 진하게
    if (isFocused) bg = '#42a5f5'
    if (item) bg = '#4caf50'
    
    return (
      <td key={colIndex} onClick={() => handleGridClick(sphIndex, colIndex)}
        style={{ 
          border: '1px solid #ccc', 
          padding: 0, textAlign: 'center', background: bg, 
          color: item || isFocused ? '#fff' : '#333', 
          cursor: 'pointer', width: 34, height: 24, fontSize: 11, 
          fontFamily: 'monospace', fontWeight: item ? 700 : 400 
        }}>
        {item ? item.quantity : isFocused && cellInputValue ? cellInputValue : ''}
      </td>
    )
  }

  const focusedInfo = getFocusedInfo()

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 4, borderBottom: '2px solid #333' }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>판매전표 입력</h1>
        <span style={{ fontSize: 10, color: '#666' }}>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 220px', gap: 4, height: 'calc(100vh - 110px)' }}>
        {/* 왼쪽 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#f5f5f5', padding: 4, borderRadius: 3, overflow: 'hidden', fontSize: 9 }}>
          <section>
            <label style={{ fontWeight: 600 }}>상호 [Esc]</label>
            <input ref={storeInputRef} type="text" placeholder="검색..." value={storeSearchText}
              onKeyDown={e => { const vs = filteredStores.slice(0, 10); if (e.key === 'ArrowDown' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.min(p + 1, vs.length - 1)) } else if (e.key === 'ArrowUp' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.max(p - 1, 0)) } else if (e.key === 'Enter' && storeSearchText && vs.length > 0 && !selectedStore) { setSelectedStore(vs[storeFocusIndex >= 0 ? storeFocusIndex : 0]); setStoreSearchText(''); setStoreFocusIndex(-1); brandSelectRef.current?.focus() } }}
              onChange={e => { setStoreSearchText(e.target.value); setStoreFocusIndex(-1) }}
              style={{ width: '100%', padding: 3, border: '1px solid #ccc', borderRadius: 2, fontSize: 9, marginTop: 1 }} />
            {selectedStore && (
              <div style={{ marginTop: 2, padding: 4, background: '#e3f2fd', borderRadius: 2, fontSize: 8, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>{selectedStore.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
                  <span>☎️ {selectedStore.phone || '-'}</span>
                  <span>📱 {selectedStore.deliveryPhone || '-'}</span>
                  <span>🎯 {selectedStore.salesRepName || '-'}</span>
                  <span>🚚 {selectedStore.deliveryContact || '-'}</span>
                </div>
                {selectedStore.address && (
                  <div style={{ marginTop: 2 }}>📍 {selectedStore.address}</div>
                )}
                <div style={{ marginTop: 2, display: 'flex', gap: 8 }}>
                  <span style={{ color: (selectedStore.outstandingAmount || 0) > 0 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
                    💰 {(selectedStore.outstandingAmount || 0).toLocaleString()}원
                  </span>
                  {selectedStore.paymentTermDays ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 12, 
                        height: 12, 
                        background: '#fff',
                        border: '1px solid #e53935',
                        borderTop: '3px solid #e53935',
                        borderRadius: 1,
                        lineHeight: 1
                      }}>
                        <span style={{ fontSize: 7, fontWeight: 700, color: '#1d1d1f' }}>{selectedStore.paymentTermDays}</span>
                      </span>
                    </span>
                  ) : '-'}
                </div>
              </div>
            )}
            {storeSearchText && !selectedStore && filteredStores.length > 0 && (
              <div style={{ maxHeight: 60, overflow: 'auto', marginTop: 1, border: '1px solid #ddd', borderRadius: 2, background: '#fff' }}>
                {filteredStores.slice(0, 10).map((s, i) => (
                  <div key={s.id} ref={el => { storeResultRefs.current[i] = el }} onClick={() => { setSelectedStore(s); setStoreSearchText(''); brandSelectRef.current?.focus() }}
                    style={{ padding: 2, cursor: 'pointer', borderBottom: '1px solid #eee', background: storeFocusIndex === i ? '#e3f2fd' : '#fff' }}>{s.name}</div>
                ))}
              </div>
            )}
          </section>
          <section>
            <label style={{ fontWeight: 600 }}>주문 구분</label>
            <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
              {(['여벌', '착색', 'RX', '기타'] as const).map(t => (
                <label key={t} style={{ padding: '1px 4px', background: orderType === t ? '#1976d2' : '#fff', color: orderType === t ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: 2, cursor: 'pointer', fontSize: 8 }}>
                  <input type="radio" name="ot" checked={orderType === t} onChange={() => setOrderType(t)} style={{ display: 'none' }} />{t}
                </label>
              ))}
            </div>
          </section>
          <section>
            <label style={{ fontWeight: 600 }}>품목 [F5]</label>
            <select ref={brandSelectRef} value={selectedBrandId || ''} onChange={e => { const bid = e.target.value ? parseInt(e.target.value) : null; setSelectedBrandId(bid); setSelectedProductId(null); if (bid) setTimeout(() => { setProductFocusIndex(0); productListRef.current?.focus() }, 50) }}
              style={{ width: '100%', padding: 3, border: '1px solid #ccc', borderRadius: 2, fontSize: 9, marginTop: 1 }}>
              <option value="">브랜드...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </section>
          <section style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontWeight: 600 }}>상품 [F6]</label>
            <div ref={productListRef} tabIndex={0} onKeyDown={handleProductListKeyDown} style={{ marginTop: 1, border: '1px solid #ccc', borderRadius: 2, background: '#fff', flex: 1, overflow: 'auto', outline: 'none' }}>
              {filteredProducts.length === 0 ? <div style={{ padding: 4, textAlign: 'center', color: '#999' }}>{selectedBrandId ? '없음' : '선택'}</div> : (
                filteredProducts.map((p, i) => (
                  <div key={p.id} ref={el => { productItemRefs.current[i] = el }} onClick={() => { setSelectedProductId(p.id); setProductFocusIndex(i) }}
                    style={{ padding: '2px 3px', cursor: 'pointer', borderBottom: '1px solid #eee', background: selectedProductId === p.id ? '#e3f2fd' : productFocusIndex === i ? '#fff3e0' : '#fff', display: 'flex', justifyContent: 'space-between', fontSize: 8 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ color: '#1976d2', fontWeight: 600 }}>{(p.sellingPrice/1000).toFixed(0)}k</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* 중앙: 하나의 도수표 (가운데 기준) */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}
          style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: gridFocus ? '2px solid #f57c00' : '1px solid #ccc', borderRadius: 3, overflow: 'hidden', outline: 'none' }}>
          <div style={{ padding: '2px 4px', background: '#e0e0e0', borderBottom: '1px solid #ccc', fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>{selectedProduct ? `${selectedProduct.brandName} - ${selectedProduct.name}` : '상품 선택'}</span>
            <span style={{ color: '#666' }}>←→ CYL | ↑↓ SPH | 가운데=000</span>
          </div>
          
          <div ref={gridContainerRef} style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: '#e8e8e0' }}>
                  {/* 왼쪽 SPH 헤더 */}
                  <th style={{ border: '1px solid #999', padding: '3px 4px', fontWeight: 700, minWidth: 38, position: 'sticky', left: 0, background: '#e8e8e0', zIndex: 10, fontSize: 11 }}>-Sph</th>
                  
                  {/* 왼쪽 CYL 열들 (400 → 000) */}
                  {cylColsLeft.map((cyl, i) => (
                    <th key={`L${i}`} style={{ border: '1px solid #999', padding: '3px 2px', minWidth: 34, fontWeight: 400, background: gridFocus?.colIndex === i ? '#ffcdd2' : '#e8e8e0', fontSize: 11 }}>{formatLegacy(cyl)}</th>
                  ))}
                  
                  {/* 가운데 구분 열 -Sph+ */}
                  <th style={{ border: '1px solid #999', borderLeft: '2px solid #666', borderRight: '2px solid #666', padding: '3px 4px', minWidth: 50, fontWeight: 700, background: gridFocus?.colIndex === cylColsLeft.length ? '#ffcdd2' : '#e8e8e0', fontSize: 11 }}>-Sph+</th>
                  
                  {/* 오른쪽 CYL 열들 (000 → 400) */}
                  {cylColsRight.map((cyl, i) => (
                    <th key={`R${i}`} style={{ border: '1px solid #999', padding: '3px 2px', minWidth: 34, fontWeight: 400, background: gridFocus?.colIndex === cylColsLeft.length + 1 + i ? '#ffcdd2' : '#e8e8e0', fontSize: 11 }}>{formatLegacy(cyl)}</th>
                  ))}
                  
                  {/* 오른쪽 SPH 헤더 */}
                  <th style={{ border: '1px solid #999', padding: '3px 4px', fontWeight: 700, minWidth: 38, position: 'sticky', right: 0, background: '#e8e8e0', zIndex: 10, fontSize: 11 }}>+Sph</th>
                </tr>
              </thead>
              <tbody>
                {sphRows.map((sph, sphIndex) => {
                  const isCurrentRow = gridFocus?.sphIndex === sphIndex
                  const rowBg = isCurrentRow ? '#ffcdd2' : '#e8e8e0'
                  return (
                    <tr key={sphIndex}>
                      {/* 왼쪽 SPH 값 (회색) */}
                      <td style={{ border: '1px solid #999', padding: '2px 4px', fontWeight: 600, textAlign: 'center', position: 'sticky', left: 0, background: rowBg, zIndex: 5, fontSize: 11 }}>{formatLegacy(sph)}</td>
                      
                      {/* 왼쪽 CYL 셀들 */}
                      {cylColsLeft.map((_, i) => renderCell(sphIndex, i))}
                      
                      {/* 가운데 구분 셀: -000+ 형식 */}
                      <td style={{ border: '1px solid #999', borderLeft: '2px solid #666', borderRight: '2px solid #666', padding: '2px 4px', fontWeight: 600, textAlign: 'center', background: rowBg, fontSize: 10 }}>-{formatLegacy(sph)}+</td>
                      
                      {/* 오른쪽 CYL 셀들 */}
                      {cylColsRight.map((_, i) => renderCell(sphIndex, cylColsLeft.length + 1 + i))}
                      
                      {/* 오른쪽 SPH 값 (회색) */}
                      <td style={{ border: '1px solid #999', padding: '2px 4px', fontWeight: 600, textAlign: 'center', position: 'sticky', right: 0, background: rowBg, zIndex: 5, fontSize: 11 }}>{formatLegacy(sph)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '2px 4px', background: '#e0e0e0', borderTop: '1px solid #ccc', fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
            <span>{focusedInfo ? <>SPH: <strong>{focusedInfo.sph >= 0 ? '+' : ''}{focusedInfo.sph.toFixed(2)}</strong> | CYL: <strong>{focusedInfo.cyl.toFixed(2)}</strong></> : '셀 선택'}</span>
            <span style={{ color: focusedInfo?.isPlus ? '#e65100' : '#1565c0', fontWeight: 600 }}>{focusedInfo ? (focusedInfo.isPlus ? '원시(+)' : '근시(-)') : ''}</span>
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', fontSize: 9 }}>
          <div style={{ padding: '3px 4px', background: '#333', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>주문 목록</span><span>{orderItems.length}건</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 28px 44px 16px', padding: '3px 4px', background: '#e0e0e0', fontWeight: 600, fontSize: 8, gap: '4px', alignItems: 'center' }}>
            <span style={{ whiteSpace: 'nowrap' }}>상품</span>
            <span style={{ textAlign: 'center' }}>SPH</span>
            <span style={{ textAlign: 'center' }}>CYL</span>
            <span style={{ textAlign: 'center' }}>수량</span>
            <span style={{ textAlign: 'right' }}>금액</span>
            <span></span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? <div style={{ padding: 10, textAlign: 'center', color: '#999' }}>도수표에서 수량 입력</div> : (
              orderItems.map((item, i) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 28px 44px 16px', padding: '3px 4px', borderBottom: '1px solid #ddd', background: i % 2 === 0 ? '#fff' : '#fafafa', alignItems: 'center', fontSize: 8, gap: '4px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                  <div style={{ fontFamily: 'monospace', textAlign: 'center' }}>{item.sph}</div>
                  <div style={{ fontFamily: 'monospace', textAlign: 'center' }}>{item.cyl}</div>
                  <div style={{ fontWeight: 600, textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{(item.product.sellingPrice * item.quantity / 1000).toFixed(0)}k</div>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: '50%', width: 14, height: 14, cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 3, borderTop: '1px solid #ddd' }}>
            <input type="text" placeholder="메모..." value={memo} onChange={e => setMemo(e.target.value)} style={{ width: '100%', padding: 2, border: '1px solid #ccc', borderRadius: 2, fontSize: 8 }} />
          </div>
          <div style={{ padding: '3px 4px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>총 <strong>{totalQuantity}</strong>개</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{totalAmount.toLocaleString()}원</span>
          </div>
          <div style={{ padding: 3, display: 'flex', gap: 3 }}>
            <button onClick={() => setOrderItems([])} style={{ flex: 1, padding: 4, background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 2, cursor: 'pointer', fontSize: 9 }}>초기화</button>
            <button onClick={handleSubmit} disabled={loading || !selectedStore || orderItems.length === 0} style={{ flex: 2, padding: 4, background: loading ? '#ccc' : '#4caf50', color: '#fff', border: 'none', borderRadius: 2, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 9, fontWeight: 600 }}>전송 [F2]</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
