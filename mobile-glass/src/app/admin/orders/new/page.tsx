'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/app/components/Navigation'

interface Brand { id: number; name: string }
interface Product { id: number; name: string; brand: string; brandId: number; sellingPrice: number }
interface Store { 
  id: number
  name: string
  code: string
  phone?: string | null
  outstandingAmount?: number
}
interface OrderItem { id: string; product: Product; sph: string; cyl: string; axis: string; quantity: number }

function formatLegacy(value: number): string {
  return String(Math.round(Math.abs(value) * 100)).padStart(3, '0')
}

function generateSphRows(): number[] {
  const values: number[] = []
  for (let i = 0; i <= 15; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

function generateCylColsLeft(): number[] {
  const values: number[] = []
  for (let i = -4; i <= 0; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

function generateCylColsRight(): number[] {
  const values: number[] = []
  for (let i = 0; i >= -4; i -= 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

export default function AdminNewOrderPage() {
  const router = useRouter()
  
  const storeInputRef = useRef<HTMLInputElement>(null)
  const brandSelectRef = useRef<HTMLSelectElement>(null)
  const productListRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const [storesLoaded, setStoresLoaded] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orderType, setOrderType] = useState<'여벌' | '착색' | 'RX' | '기타'>('여벌')
  const [productFocusIndex, setProductFocusIndex] = useState<number>(-1)
  const [storeFocusIndex, setStoreFocusIndex] = useState<number>(-1)
  const [gridFocus, setGridFocus] = useState<{sphIndex: number, colIndex: number} | null>(null)
  const [cellInputValue, setCellInputValue] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [storeSearchText, setStoreSearchText] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; storeName: string; itemCount: number; totalAmount: number } | null>(null)

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const filteredProducts = selectedBrandId ? products.filter(p => p.brandId === selectedBrandId) : []

  const sphRows = generateSphRows()
  const cylColsLeft = generateCylColsLeft()
  const cylColsRight = generateCylColsRight()
  const centerIndex = cylColsLeft.length
  const totalCols = cylColsLeft.length + 1 + cylColsRight.length

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => { 
      setProducts(data.products || [])
      setBrands(data.brands || []) 
    })
    fetch('/api/stores?limit=10000').then(r => r.json()).then(data => { 
      setAllStores(data.stores || [])
      setStoresLoaded(true)
    })
  }, [])

  const storeSearchResults = storeSearchText && storesLoaded
    ? allStores.filter(s => {
        const q = storeSearchText.toLowerCase().replace(/-/g, '')
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.phone && s.phone.replace(/-/g, '').includes(q))
      }).slice(0, 20)
    : []

  const getColInfo = (colIndex: number): { isPlus: boolean, cyl: number } | null => {
    if (colIndex < cylColsLeft.length) return { isPlus: false, cyl: cylColsLeft[colIndex] }
    if (colIndex === centerIndex) return null
    const rightIndex = colIndex - centerIndex - 1
    if (rightIndex >= 0 && rightIndex < cylColsRight.length) return { isPlus: true, cyl: cylColsRight[rightIndex] }
    return null
  }

  const handleGridCellInput = useCallback((sphIndex: number, colIndex: number, quantity: number) => {
    const roundedQty = Math.ceil(quantity * 2) / 2
    if (!selectedProduct || !selectedStore || roundedQty <= 0) return
    quantity = roundedQty
    const sph = sphRows[sphIndex]
    const colInfo = getColInfo(colIndex)
    if (!colInfo) return
    
    const actualSph = colInfo.isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = colInfo.cyl.toFixed(2)
    
    const exists = orderItems.find(item => item.product.id === selectedProduct.id && item.sph === sphStr && item.cyl === cylStr)
    if (exists) {
      setOrderItems(items => items.map(item => item.id === exists.id ? { ...item, quantity: item.quantity + quantity } : item))
    } else {
      setOrderItems(items => [...items, { id: `${Date.now()}-${Math.random()}`, product: selectedProduct, sph: sphStr, cyl: cylStr, axis: '0', quantity }])
    }
  }, [selectedProduct, selectedStore, orderItems, sphRows])

  const handleGridClick = useCallback((sphIndex: number, colIndex: number) => {
    if (!selectedProduct || !selectedStore) { alert('가맹점과 상품을 먼저 선택해주세요.'); return }
    setGridFocus({ sphIndex, colIndex })
    setCellInputValue('')
    gridRef.current?.focus()
  }, [selectedProduct, selectedStore])

  const handleGridKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedProduct || !selectedStore) return
    const maxSphIndex = sphRows.length - 1
    const maxColIndex = totalCols - 1

    if (/^[0-9.]$/.test(e.key)) {
      e.preventDefault()
      if (e.key === '.' && cellInputValue.includes('.')) return
      setCellInputValue(prev => prev + e.key)
      return
    }

    if (e.key === 'Enter' && gridFocus && cellInputValue) {
      e.preventDefault()
      const qty = parseFloat(cellInputValue)
      if (!isNaN(qty) && qty > 0) {
        handleGridCellInput(gridFocus.sphIndex, gridFocus.colIndex, qty)
        setCellInputValue('')
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.min(prev.sphIndex + 1, maxSphIndex) } : { sphIndex: 0, colIndex: centerIndex })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.max(prev.sphIndex - 1, 0) } : { sphIndex: 0, colIndex: centerIndex })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: 0 }
        let newCol = prev.colIndex + 1
        if (newCol === centerIndex) newCol++
        return { ...prev, colIndex: Math.min(newCol, maxColIndex) }
      })
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: 0 }
        let newCol = prev.colIndex - 1
        if (newCol === centerIndex) newCol--
        return { ...prev, colIndex: Math.max(newCol, 0) }
      })
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (cellInputValue) setCellInputValue(prev => prev.slice(0, -1))
    }
  }, [selectedProduct, selectedStore, sphRows, totalCols, cellInputValue, gridFocus, handleGridCellInput, centerIndex])

  const totalAmount = orderItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedStore || orderItems.length === 0) { alert('가맹점과 상품을 선택해주세요.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', { 
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
        const data = await res.json()
        setCompletedOrder({
          orderNumber: data.order?.orderNo || '',
          storeName: selectedStore.name,
          itemCount: orderItems.length,
          totalAmount: totalAmount
        })
        setShowCompleteModal(true)
      } else alert('주문 생성 실패')
    } catch { alert('오류가 발생했습니다.') }
    setLoading(false)
  }

  const handleCompleteClose = () => {
    setShowCompleteModal(false)
    setCompletedOrder(null)
    setSelectedStore(null)
    setStoreSearchText('')
    setSelectedBrandId(null)
    setSelectedProductId(null)
    setOrderItems([])
    setMemo('')
    setGridFocus(null)
    router.push('/admin/orders')
  }

  const renderCell = (sphIndex: number, colIndex: number) => {
    const sph = sphRows[sphIndex]
    const colInfo = getColInfo(colIndex)
    if (!colInfo) return null
    
    const isDisabled = colInfo.isPlus && sphIndex === 0
    const actualSph = colInfo.isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = colInfo.cyl.toFixed(2)
    
    const item = orderItems.find(i => i.product.id === selectedProductId && i.sph === sphStr && i.cyl === cylStr)
    const isFocused = gridFocus?.sphIndex === sphIndex && gridFocus?.colIndex === colIndex
    
    let bg = sphIndex % 2 === 0 ? '#f5f8f5' : '#eaf2ea'
    if (isDisabled) bg = '#d1d5db'
    if (!isDisabled && isFocused) bg = '#5d7a5d'
    if (!isDisabled && item) bg = '#6b8e6b'
    
    return (
      <td key={colIndex} onClick={() => !isDisabled && handleGridClick(sphIndex, colIndex)}
        style={{ 
          border: '1px solid #a8c4a8', padding: 0, textAlign: 'center', background: bg, 
          color: isDisabled ? '#9ca3af' : (item || isFocused ? '#fff' : '#3d5c3d'), 
          cursor: isDisabled ? 'not-allowed' : 'pointer', 
          width: 36, height: 28, fontSize: 12, fontWeight: item ? 700 : 500
        }}>
        {item && !isDisabled ? item.quantity : isFocused && !isDisabled && cellInputValue ? cellInputValue : ''}
      </td>
    )
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>관리자 주문등록</h1>
        <span style={{ fontSize: 13, color: '#6c757d' }}>{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 12, height: 'calc(100vh - 180px)' }}>
        {/* 왼쪽 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 12, borderRadius: 8, overflow: 'auto', border: '1px solid #e5e7eb' }}>
          {/* 가맹점 검색 */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>🏪 가맹점</label>
            <input ref={storeInputRef} type="text" placeholder="검색..." value={storeSearchText}
              onChange={e => { setStoreSearchText(e.target.value); setStoreFocusIndex(-1); if (selectedStore) setSelectedStore(null) }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown' && storeSearchResults.length > 0) { e.preventDefault(); setStoreFocusIndex(p => Math.min(p + 1, storeSearchResults.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setStoreFocusIndex(p => Math.max(p - 1, 0)) }
                else if (e.key === 'Enter' && storeSearchResults.length > 0) { 
                  setSelectedStore(storeSearchResults[storeFocusIndex >= 0 ? storeFocusIndex : 0])
                  setStoreSearchText('')
                  brandSelectRef.current?.focus()
                }
              }}
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginTop: 6 }} />
            {selectedStore && (
              <div style={{ marginTop: 8, padding: 10, background: '#f0fdf4', borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedStore.name}</div>
                <div style={{ color: '#6b7280' }}>{selectedStore.phone || '-'}</div>
                <div style={{ color: selectedStore.outstandingAmount ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: 4 }}>
                  미수금: {(selectedStore.outstandingAmount || 0).toLocaleString()}원
                </div>
              </div>
            )}
            {storeSearchText && !selectedStore && storeSearchResults.length > 0 && (
              <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 4, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff' }}>
                {storeSearchResults.map((s, i) => (
                  <div key={s.id} onClick={() => { setSelectedStore(s); setStoreSearchText(''); brandSelectRef.current?.focus() }}
                    style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: storeFocusIndex === i ? '#dbeafe' : '#fff', fontSize: 14 }}>
                    {s.name} <span style={{ color: '#9ca3af' }}>{s.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 주문 구분 */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>주문 구분</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 6 }}>
              {(['여벌', '착색', 'RX', '기타'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  style={{ padding: 8, background: orderType === t ? '#5d7a5d' : '#f3f4f6', color: orderType === t ? '#fff' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 브랜드 */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>브랜드</label>
            <select ref={brandSelectRef} value={selectedBrandId || ''} 
              onChange={e => { setSelectedBrandId(e.target.value ? parseInt(e.target.value) : null); setSelectedProductId(null) }}
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginTop: 6 }}>
              <option value="">선택...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* 상품 목록 */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>상품</label>
            <div ref={productListRef} style={{ marginTop: 6, border: '1px solid #d1d5db', borderRadius: 6, flex: 1, overflow: 'auto' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>브랜드 선택</div>
              ) : (
                filteredProducts.map((p, i) => (
                  <div key={p.id} onClick={() => { setSelectedProductId(p.id); setProductFocusIndex(i); setGridFocus({ sphIndex: 0, colIndex: cylColsLeft.length - 1 }); gridRef.current?.focus() }}
                    style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: selectedProductId === p.id ? '#dbeafe' : productFocusIndex === i ? '#f3f4f6' : '#fff', fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ color: '#5d7a5d', fontSize: 12 }}>{(p.sellingPrice/1000).toFixed(0)}k</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 중앙: 도수표 */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}
          style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', outline: 'none' }}>
          <div style={{ padding: 10, background: '#5d7a5d', fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {selectedProduct ? `${selectedProduct.brand} - ${selectedProduct.name}` : '상품을 선택하세요'}
          </div>
          <div ref={gridContainerRef} style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#e8f0e8' }}>
                  <th style={{ border: '1px solid #a8c4a8', padding: 4, minWidth: 40, background: '#5d7a5d', color: '#fff', position: 'sticky', left: 0, zIndex: 10 }}>-SPH</th>
                  {cylColsLeft.map((cyl, i) => (
                    <th key={`L${i}`} style={{ border: '1px solid #a8c4a8', padding: 4, minWidth: 36, background: '#e8f0e8', color: '#3d5c3d' }}>-{formatLegacy(cyl)}</th>
                  ))}
                  <th style={{ border: '1px solid #4a6b4a', padding: 4, minWidth: 50, background: '#4a6b4a', color: '#fff' }}>-SPH+</th>
                  {cylColsRight.map((cyl, i) => (
                    <th key={`R${i}`} style={{ border: '1px solid #a8c4a8', padding: 4, minWidth: 36, background: '#e8f0e8', color: '#3d5c3d' }}>-{formatLegacy(cyl)}</th>
                  ))}
                  <th style={{ border: '1px solid #a8c4a8', padding: 4, minWidth: 40, background: '#5d7a5d', color: '#fff', position: 'sticky', right: 0, zIndex: 10 }}>+SPH</th>
                </tr>
              </thead>
              <tbody>
                {sphRows.map((sph, sphIndex) => (
                  <tr key={sphIndex}>
                    <td style={{ border: '1px solid #a8c4a8', padding: 4, fontWeight: 700, textAlign: 'center', position: 'sticky', left: 0, background: '#e8f0e8', color: '#3d5c3d', zIndex: 5 }}>{formatLegacy(sph)}</td>
                    {cylColsLeft.map((_, i) => renderCell(sphIndex, i))}
                    <td style={{ border: '1px solid #4a6b4a', padding: 4, fontWeight: 700, textAlign: 'center', background: '#4a6b4a', color: '#fff' }}>-{formatLegacy(sph)}+</td>
                    {cylColsRight.map((_, i) => renderCell(sphIndex, cylColsLeft.length + 1 + i))}
                    <td style={{ border: '1px solid #a8c4a8', padding: 4, fontWeight: 700, textAlign: 'center', position: 'sticky', right: 0, background: '#e8f0e8', color: '#3d5c3d', zIndex: 5 }}>{formatLegacy(sph)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 10, background: '#5d7a5d', color: '#fff', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>주문 목록</span>
            <span>{orderItems.length}건</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>도수표에서 수량 입력</div>
            ) : (
              orderItems.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                    <div style={{ color: '#6b7280' }}>{item.sph} / {item.cyl}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{item.quantity}개</div>
                    <div style={{ color: '#5d7a5d' }}>{(item.product.sellingPrice * item.quantity).toLocaleString()}원</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 10, borderTop: '1px solid #e5e7eb' }}>
            <input type="text" placeholder="메모..." value={memo} onChange={e => setMemo(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
          </div>
          <div style={{ padding: 12, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>총 {totalQuantity}개</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#5d7a5d' }}>{totalAmount.toLocaleString()}원</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setOrderItems([])} style={{ flex: 1, padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>초기화</button>
              <button onClick={handleSubmit} disabled={loading || !selectedStore || orderItems.length === 0}
                style={{ flex: 2, padding: 10, background: loading ? '#9ca3af' : '#5d7a5d', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {loading ? '처리중...' : '주문 등록'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 완료 모달 */}
      {showCompleteModal && completedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>주문 완료</h2>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'left', fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7280' }}>주문번호</span>
                <span style={{ fontWeight: 600 }}>{completedOrder.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7280' }}>가맹점</span>
                <span style={{ fontWeight: 600 }}>{completedOrder.storeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>금액</span>
                <span style={{ fontWeight: 700, color: '#5d7a5d' }}>{completedOrder.totalAmount.toLocaleString()}원</span>
              </div>
            </div>
            <button onClick={handleCompleteClose}
              style={{ width: '100%', padding: 12, background: '#5d7a5d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              주문 내역으로 이동
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
