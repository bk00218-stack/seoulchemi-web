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
interface Store { id: number; name: string; code: string; phone?: string | null; outstandingAmount?: number }
interface OrderItem { id: string; product: Product; sph: string; cyl: string; axis: string; quantity: number }

// 숫자 포맷: -1.25 → "125" (3자리, 부호 없이)
function formatLegacy(value: number): string {
  return String(Math.round(Math.abs(value) * 100)).padStart(3, '0')
}

// OlwsPro 스타일:
// 세로(행) = SPH: 0.00 ~ 15.00 (61행)
// 가로(열) = CYL: 0.00 ~ -4.00 (17열)
// 왼쪽 = 근시 (-SPH), 오른쪽 = 원시 (+SPH)

function generateSphRows(): number[] {
  const values: number[] = []
  for (let i = 0; i <= 15; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values // 0.00, 0.25, ..., 15.00
}

function generateCylCols(): number[] {
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
  
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orderType, setOrderType] = useState<'여벌' | '착색' | 'RX' | '기타'>('여벌')
  const [productFocusIndex, setProductFocusIndex] = useState<number>(-1)
  const [storeFocusIndex, setStoreFocusIndex] = useState<number>(-1)
  
  // 그리드 포커스: isPlus=false면 왼쪽(근시/-SPH), true면 오른쪽(원시/+SPH)
  // sphIndex=행, cylIndex=열
  const [gridFocus, setGridFocus] = useState<{sphIndex: number, cylIndex: number, isPlus: boolean} | null>(null)
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

  const sphRows = generateSphRows() // 0.00 ~ 15.00
  const cylCols = generateCylCols() // 0.00 ~ -4.00

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => { setProducts(data.products || []); setBrands(data.brands || []) })
    fetch('/api/stores').then(r => r.json()).then(data => setStores(data.stores || []))
  }, [])

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
        setGridFocus({ sphIndex: 0, cylIndex: 0, isPlus: false }) // 시작: SPH 0.00, CYL 0.00, 왼쪽(근시)
        setCellInputValue('')
        gridRef.current?.focus()
      }
    }
  }

  const handleGridCellInput = useCallback((sph: number, cyl: number, isPlus: boolean, quantity: number) => {
    if (!selectedProduct || !selectedStore || quantity < 1) return
    // 왼쪽(근시)이면 -SPH, 오른쪽(원시)이면 +SPH
    const actualSph = isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = cyl.toFixed(2)
    const exists = orderItems.find(item => item.product.id === selectedProduct.id && item.sph === sphStr && item.cyl === cylStr)
    if (exists) {
      setOrderItems(items => items.map(item => item.id === exists.id ? { ...item, quantity } : item))
    } else {
      setOrderItems(items => [...items, { id: `${Date.now()}-${Math.random()}`, product: selectedProduct, sph: sphStr, cyl: cylStr, axis: '0', quantity }])
    }
  }, [selectedProduct, selectedStore, orderItems])

  const getFocusedSphCyl = useCallback(() => {
    if (!gridFocus) return null
    const sph = sphRows[gridFocus.sphIndex]
    const cyl = cylCols[gridFocus.cylIndex]
    if (sph === undefined || cyl === undefined) return null
    const actualSph = gridFocus.isPlus ? sph : -sph
    return { sph: actualSph, cyl }
  }, [gridFocus, sphRows, cylCols])

  const handleGridKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedProduct || !selectedStore) return
    const maxSphIndex = sphRows.length - 1
    const maxCylIndex = cylCols.length - 1

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      const newValue = cellInputValue + e.key
      setCellInputValue(newValue)
      if (gridFocus) {
        const qty = parseInt(newValue)
        if (!isNaN(qty) && qty > 0) {
          handleGridCellInput(sphRows[gridFocus.sphIndex], cylCols[gridFocus.cylIndex], gridFocus.isPlus, qty)
        }
      }
      return
    }

    // 위아래 = SPH 이동 (행)
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.min(prev.sphIndex + 1, maxSphIndex) } : { sphIndex: 0, cylIndex: 0, isPlus: false })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.max(prev.sphIndex - 1, 0) } : { sphIndex: 0, cylIndex: 0, isPlus: false })
    } 
    // 좌우 = CYL 이동 (열), 경계에서 좌우 섹션 전환
    else if (e.key === 'ArrowRight') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, cylIndex: 0, isPlus: false }
        if (!prev.isPlus) {
          // 왼쪽(근시) 영역에서 오른쪽으로
          if (prev.cylIndex < maxCylIndex) return { ...prev, cylIndex: prev.cylIndex + 1 }
          else return { sphIndex: prev.sphIndex, cylIndex: 0, isPlus: true } // 오른쪽(원시)로 전환
        } else {
          return { ...prev, cylIndex: Math.min(prev.cylIndex + 1, maxCylIndex) }
        }
      })
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, cylIndex: 0, isPlus: false }
        if (prev.isPlus) {
          // 오른쪽(원시) 영역에서 왼쪽으로
          if (prev.cylIndex > 0) return { ...prev, cylIndex: prev.cylIndex - 1 }
          else return { sphIndex: prev.sphIndex, cylIndex: maxCylIndex, isPlus: false } // 왼쪽(근시)로 전환
        } else {
          return { ...prev, cylIndex: Math.max(prev.cylIndex - 1, 0) }
        }
      })
    } else if (e.key === 'Tab') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, isPlus: !prev.isPlus } : null)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      if (cellInputValue) setCellInputValue(cellInputValue.slice(0, -1))
      else {
        const focused = getFocusedSphCyl()
        if (focused && selectedProduct) {
          const sphStr = focused.sph >= 0 ? `+${focused.sph.toFixed(2)}` : focused.sph.toFixed(2)
          const cylStr = focused.cyl.toFixed(2)
          setOrderItems(items => items.filter(item => !(item.product.id === selectedProduct.id && item.sph === sphStr && item.cyl === cylStr)))
        }
      }
    }
  }, [selectedProduct, selectedStore, sphRows, cylCols, cellInputValue, gridFocus, getFocusedSphCyl, handleGridCellInput])

  const handleGridClick = useCallback((sphIndex: number, cylIndex: number, isPlus: boolean) => {
    if (!selectedProduct || !selectedStore) { alert('가맹점과 상품을 먼저 선택해주세요.'); return }
    setGridFocus({ sphIndex, cylIndex, isPlus })
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
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: selectedStore.id, orderType, memo, items: orderItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sph: item.sph, cyl: item.cyl, axis: item.axis })) }) })
      if (res.ok) { alert('주문이 등록되었습니다.'); router.push('/') } else alert('주문 생성 실패')
    } catch { alert('오류가 발생했습니다.') }
    setLoading(false)
  }

  const renderCell = (sphIndex: number, cylIndex: number, isPlus: boolean) => {
    const sph = sphRows[sphIndex]
    const cyl = cylCols[cylIndex]
    const actualSph = isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = cyl.toFixed(2)
    const item = orderItems.find(i => i.product.id === selectedProductId && i.sph === sphStr && i.cyl === cylStr)
    const isFocused = gridFocus?.sphIndex === sphIndex && gridFocus?.cylIndex === cylIndex && gridFocus?.isPlus === isPlus
    const isCurrentRow = gridFocus?.sphIndex === sphIndex
    
    let bg = sphIndex % 2 === 0 ? '#fffde7' : '#fff'
    if (isCurrentRow) bg = '#ffcdd2'
    if (isFocused) bg = '#42a5f5'
    if (item) bg = '#4caf50'
    
    return (
      <td key={`${isPlus ? 'p' : 'm'}-${cylIndex}`} onClick={() => handleGridClick(sphIndex, cylIndex, isPlus)}
        style={{ border: '1px solid #bbb', padding: 0, textAlign: 'center', background: bg, color: item || isFocused ? '#fff' : '#333', cursor: 'pointer', width: 26, height: 18, fontSize: 9, fontFamily: 'monospace', fontWeight: item ? 700 : 400 }}>
        {item ? item.quantity : isFocused && cellInputValue ? cellInputValue : ''}
      </td>
    )
  }

  const focusedCell = getFocusedSphCyl()

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 4, borderBottom: '2px solid #333' }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>판매전표 입력</h1>
        <span style={{ fontSize: 10, color: '#666' }}>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', gap: 4, height: 'calc(100vh - 110px)' }}>
        {/* 왼쪽 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#f5f5f5', padding: 4, borderRadius: 3, overflow: 'hidden', fontSize: 9 }}>
          <section>
            <label style={{ fontWeight: 600 }}>상호 [Esc]</label>
            <input ref={storeInputRef} type="text" placeholder="검색..." value={storeSearchText}
              onKeyDown={e => { const vs = filteredStores.slice(0, 10); if (e.key === 'ArrowDown' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.min(p + 1, vs.length - 1)) } else if (e.key === 'ArrowUp' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.max(p - 1, 0)) } else if (e.key === 'Enter' && storeSearchText && vs.length > 0 && !selectedStore) { setSelectedStore(vs[storeFocusIndex >= 0 ? storeFocusIndex : 0]); setStoreSearchText(''); setStoreFocusIndex(-1); brandSelectRef.current?.focus() } }}
              onChange={e => { setStoreSearchText(e.target.value); setStoreFocusIndex(-1) }}
              style={{ width: '100%', padding: 3, border: '1px solid #ccc', borderRadius: 2, fontSize: 9, marginTop: 1 }} />
            {selectedStore && <div style={{ marginTop: 2, padding: 2, background: '#e3f2fd', borderRadius: 2 }}><strong>{selectedStore.name}</strong></div>}
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

        {/* 중앙: 도수표 - 양쪽 동일 구조 */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}
          style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: gridFocus ? '2px solid #f57c00' : '1px solid #ccc', borderRadius: 3, overflow: 'hidden', outline: 'none' }}>
          <div style={{ padding: '2px 4px', background: '#e0e0e0', borderBottom: '1px solid #ccc', fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>{selectedProduct ? `${selectedProduct.brandName} - ${selectedProduct.name}` : '상품 선택'}</span>
            <span style={{ color: '#666' }}>↑↓ SPH | ←→ CYL | Tab 근시↔원시</span>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
            {/* 왼쪽: 근시 영역 (-SPH) */}
            <div style={{ borderRight: '3px solid #1976d2', overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 9, fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ background: '#c8d4e0' }}>
                    <th style={{ border: '1px solid #999', padding: 1, fontWeight: 700, minWidth: 28, position: 'sticky', left: 0, background: '#c8d4e0', zIndex: 10 }}>-Sph</th>
                    {cylCols.map((cyl, i) => (
                      <th key={i} style={{ border: '1px solid #999', padding: 1, minWidth: 26, fontWeight: 400 }}>{formatLegacy(cyl)}</th>
                    ))}
                    <th style={{ border: '1px solid #999', padding: 1, fontWeight: 700, minWidth: 28, position: 'sticky', right: 0, background: '#c8d4e0', zIndex: 10 }}>-Sph</th>
                  </tr>
                </thead>
                <tbody>
                  {sphRows.map((sph, sphIndex) => {
                    const isCurrentRow = gridFocus?.sphIndex === sphIndex && !gridFocus?.isPlus
                    return (
                      <tr key={sphIndex}>
                        <td style={{ border: '1px solid #999', padding: 1, fontWeight: 700, textAlign: 'center', position: 'sticky', left: 0, background: isCurrentRow ? '#ffcdd2' : '#c8d4e0', zIndex: 5 }}>{formatLegacy(sph)}</td>
                        {cylCols.map((_, cylIndex) => renderCell(sphIndex, cylIndex, false))}
                        <td style={{ border: '1px solid #999', padding: 1, fontWeight: 700, textAlign: 'center', position: 'sticky', right: 0, background: isCurrentRow ? '#ffcdd2' : '#c8d4e0', zIndex: 5 }}>{formatLegacy(sph)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 오른쪽: 원시 영역 (+SPH) */}
            <div style={{ overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 9, fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ background: '#e0d8c8' }}>
                    <th style={{ border: '1px solid #999', padding: 1, fontWeight: 700, minWidth: 28, position: 'sticky', left: 0, background: '#e0d8c8', zIndex: 10 }}>+Sph</th>
                    {cylCols.map((cyl, i) => (
                      <th key={i} style={{ border: '1px solid #999', padding: 1, minWidth: 26, fontWeight: 400 }}>{formatLegacy(cyl)}</th>
                    ))}
                    <th style={{ border: '1px solid #999', padding: 1, fontWeight: 700, minWidth: 28, position: 'sticky', right: 0, background: '#e0d8c8', zIndex: 10 }}>+Sph</th>
                  </tr>
                </thead>
                <tbody>
                  {sphRows.map((sph, sphIndex) => {
                    const isCurrentRow = gridFocus?.sphIndex === sphIndex && gridFocus?.isPlus
                    return (
                      <tr key={sphIndex}>
                        <td style={{ border: '1px solid #999', padding: 1, fontWeight: 700, textAlign: 'center', position: 'sticky', left: 0, background: isCurrentRow ? '#ffcdd2' : '#e0d8c8', zIndex: 5 }}>{formatLegacy(sph)}</td>
                        {cylCols.map((_, cylIndex) => renderCell(sphIndex, cylIndex, true))}
                        <td style={{ border: '1px solid #999', padding: 1, fontWeight: 700, textAlign: 'center', position: 'sticky', right: 0, background: isCurrentRow ? '#ffcdd2' : '#e0d8c8', zIndex: 5 }}>{formatLegacy(sph)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ padding: '2px 4px', background: '#e0e0e0', borderTop: '1px solid #ccc', fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
            <span>{focusedCell ? <>SPH: <strong>{focusedCell.sph >= 0 ? '+' : ''}{focusedCell.sph.toFixed(2)}</strong> | CYL: <strong>{focusedCell.cyl.toFixed(2)}</strong></> : '셀 선택'}</span>
            <span style={{ color: '#1976d2', fontWeight: 600 }}>{gridFocus ? (gridFocus.isPlus ? '원시(+)' : '근시(-)') : ''}</span>
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', fontSize: 9 }}>
          <div style={{ padding: '3px 4px', background: '#333', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>주문 목록</span><span>{orderItems.length}건</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 24px 44px 16px', padding: '2px 3px', background: '#e0e0e0', fontWeight: 600, fontSize: 8 }}>
            <span>상품</span><span>SPH</span><span>CYL</span><span>수량</span><span>금액</span><span></span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? <div style={{ padding: 10, textAlign: 'center', color: '#999' }}>도수표에서 수량 입력</div> : (
              orderItems.map((item, i) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 24px 44px 16px', padding: '2px 3px', borderBottom: '1px solid #ddd', background: i % 2 === 0 ? '#fff' : '#fafafa', alignItems: 'center', fontSize: 8 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                  <div style={{ fontFamily: 'monospace' }}>{item.sph}</div>
                  <div style={{ fontFamily: 'monospace' }}>{item.cyl}</div>
                  <div style={{ fontWeight: 600, textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right' }}>{(item.product.sellingPrice * item.quantity / 1000).toFixed(0)}k</div>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: '50%', width: 12, height: 12, cursor: 'pointer', fontSize: 7 }}>×</button>
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
