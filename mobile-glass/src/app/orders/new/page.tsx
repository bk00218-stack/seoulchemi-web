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
interface Product { id: number; name: string; brand: string; brandId: number; optionType: string; refractiveIndex: string | null; sellingPrice: number; purchasePrice: number }
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
  
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item: OrderItem} | null>(null)
  const [editModal, setEditModal] = useState<{type: 'quantity' | 'price', item: OrderItem} | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // 수량 입력 액션 팝업 (추가/수정/취소)
  const [quantityActionModal, setQuantityActionModal] = useState<{
    existingQty: number
    newQty: number
    sphIndex: number
    colIndex: number
    sphStr: string
    cylStr: string
  } | null>(null)
  
  // 재고 그리드 데이터 (SPH/CYL 조합별 재고)
  const [stockGrid, setStockGrid] = useState<Record<string, Record<string, number>>>({})

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

  // 상품 선택 시 재고 정보 로드
  useEffect(() => {
    if (selectedProductId) {
      fetch(`/api/products/diopter-grid?productId=${selectedProductId}`)
        .then(r => r.json())
        .then(data => {
          if (data.grid) {
            // grid 데이터를 stock 수량만 추출하여 저장
            const stockData: Record<string, Record<string, number>> = {}
            Object.entries(data.grid).forEach(([sph, cylData]) => {
              stockData[sph] = {}
              Object.entries(cylData as Record<string, { stock: number }>).forEach(([cyl, cell]) => {
                stockData[sph][cyl] = cell.stock
              })
            })
            setStockGrid(stockData)
          } else {
            setStockGrid({})
          }
        })
        .catch(() => setStockGrid({}))
    } else {
      setStockGrid({})
    }
  }, [selectedProductId])

  // 상호 검색 결과 키보드 이동 시 스크롤
  useEffect(() => {
    if (storeFocusIndex >= 0 && storeResultRefs.current[storeFocusIndex]) {
      storeResultRefs.current[storeFocusIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [storeFocusIndex])

  // 상품 목록 키보드 이동 시 스크롤
  useEffect(() => {
    if (productFocusIndex >= 0 && productItemRefs.current[productFocusIndex]) {
      productItemRefs.current[productFocusIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [productFocusIndex])

  // 도수표 포커스 이동 시 스크롤
  useEffect(() => {
    if (gridFocus && gridContainerRef.current) {
      const container = gridContainerRef.current
      const cellWidth = 34
      const cellHeight = 24
      const headerHeight = 28
      
      // 가로 스크롤 (colIndex 기준)
      const targetScrollLeft = gridFocus.colIndex * cellWidth - container.clientWidth / 2 + cellWidth / 2 + 40
      container.scrollLeft = Math.max(0, targetScrollLeft)
      
      // 세로 스크롤 (sphIndex 기준)
      const targetScrollTop = gridFocus.sphIndex * cellHeight + headerHeight - container.clientHeight / 2 + cellHeight / 2
      container.scrollTop = Math.max(0, targetScrollTop)
    }
  }, [gridFocus])

  useEffect(() => {
    const handleGlobalKeys = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); setGridFocus(null); setCellInputValue(''); brandSelectRef.current?.focus() }
      else if (e.key === 'F6') { e.preventDefault(); setGridFocus(null); setCellInputValue(''); if (filteredProducts.length > 0) { setProductFocusIndex(0); productListRef.current?.focus() } }
      else if (e.key === 'F7') { e.preventDefault(); setOrderType('여벌') }
      else if (e.key === 'F8') { e.preventDefault(); setOrderType('착색') }
      else if (e.key === 'F9') { e.preventDefault(); setOrderType('RX') }
      else if (e.key === 'F10') { e.preventDefault(); setOrderType('기타') }
      else if (e.key === 'F2') { e.preventDefault(); if (selectedStore && orderItems.length > 0) handleSubmit() }
      else if (e.key === 'Escape') {
        e.preventDefault()
        if (gridFocus) { setGridFocus(null); setCellInputValue('') }
        else { 
          // 전체 초기화 (주문목록 포함)
          setSelectedStore(null); setStoreSearchText(''); setStoreFocusIndex(-1); 
          setSelectedBrandId(null); setSelectedProductId(null); setProductFocusIndex(-1); 
          setOrderItems([]); setMemo(''); // 주문목록 & 메모 초기화
          storeInputRef.current?.focus() 
        }
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

  const handleGridCellInput = useCallback((sphIndex: number, colIndex: number, quantity: number, forceMode?: 'add' | 'replace') => {
    // 0.5 단위로 올림 (안경렌즈: 0.5 = 한쪽, 1 = 양쪽)
    const roundedQty = Math.ceil(quantity * 2) / 2 // 0.5 단위로 올림
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
      // 기존 수량이 있고 forceMode가 없으면 팝업 띄우기
      if (!forceMode) {
        setQuantityActionModal({ existingQty: exists.quantity, newQty: quantity, sphIndex, colIndex, sphStr, cylStr })
        return
      }
      // forceMode에 따라 처리
      if (forceMode === 'add') {
        setOrderItems(items => items.map(item => item.id === exists.id ? { ...item, quantity: item.quantity + quantity } : item))
      } else {
        setOrderItems(items => items.map(item => item.id === exists.id ? { ...item, quantity } : item))
      }
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

    if (/^[0-9.]$/.test(e.key)) {
      e.preventDefault()
      // 소수점 중복 방지
      if (e.key === '.' && cellInputValue.includes('.')) return
      const newValue = cellInputValue + e.key
      setCellInputValue(newValue)
      if (gridFocus) {
        const qty = parseFloat(newValue)
        if (!isNaN(qty) && qty > 0) handleGridCellInput(gridFocus.sphIndex, gridFocus.colIndex, qty)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => prev ? { ...prev, sphIndex: Math.min(prev.sphIndex + 1, maxSphIndex) } : { sphIndex: 0, colIndex: centerIndex })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: centerIndex }
        const newSphIndex = Math.max(prev.sphIndex - 1, 0)
        // 오른쪽 원시 영역에서 SPH 000으로 올라가려 하면 막기
        const colInfo = getColInfo(prev.colIndex)
        if (newSphIndex === 0 && colInfo && colInfo.isPlus) {
          return prev // 이동하지 않음
        }
        return { ...prev, sphIndex: newSphIndex }
      })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); setCellInputValue('')
      setGridFocus(prev => {
        if (!prev) return { sphIndex: 0, colIndex: 0 }
        let newCol = prev.colIndex + 1
        if (newCol === centerIndex) newCol++ // 가운데 열 건너뛰기
        // SPH 000 행에서는 오른쪽 원시 영역 진입 불가
        if (prev.sphIndex === 0 && newCol > centerIndex) {
          return prev // 이동하지 않음
        }
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
  
  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent, item: OrderItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }
  
  const handleEditQuantity = (item: OrderItem) => {
    setEditValue(String(item.quantity))
    setEditModal({ type: 'quantity', item })
    setContextMenu(null)
  }
  
  const handleEditPrice = (item: OrderItem) => {
    setEditValue(String(item.product.sellingPrice))
    setEditModal({ type: 'price', item })
    setContextMenu(null)
  }
  
  const handleEditConfirm = () => {
    if (!editModal) return
    const value = parseFloat(editValue)
    if (isNaN(value) || value < 0) return
    
    if (editModal.type === 'quantity') {
      setOrderItems(items => items.map(item => 
        item.id === editModal.item.id ? { ...item, quantity: value } : item
      ))
    } else {
      setOrderItems(items => items.map(item => 
        item.id === editModal.item.id ? { ...item, product: { ...item.product, sellingPrice: value } } : item
      ))
    }
    setEditModal(null)
    setEditValue('')
  }
  
  const totalAmount = orderItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; storeName: string; itemCount: number; totalAmount: number } | null>(null)

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
        // 접수 완료 팝업 표시
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
    // 폼 초기화
    setSelectedStore(null)
    setStoreSearchText('')
    setSelectedBrandId(null)
    setSelectedProductId(null)
    setOrderItems([])
    setMemo('')
    setGridFocus(null)
    // 전체 주문내역 페이지로 이동
    router.push('/orders/all')
  }

  // 오른쪽 원시 SPH 000 행 비활성화 여부 체크
  const isDisabledCell = (sphIndex: number, colIndex: number): boolean => {
    const colInfo = getColInfo(colIndex)
    // 오른쪽(+Sph) 영역의 SPH 0.00 행은 비활성화
    return colInfo !== null && colInfo.isPlus && sphIndex === 0
  }

  const renderCell = (sphIndex: number, colIndex: number) => {
    const sph = sphRows[sphIndex]
    const colInfo = getColInfo(colIndex)
    if (!colInfo) return null
    
    // 오른쪽 원시 SPH 000 행 비활성화 처리
    const isDisabled = isDisabledCell(sphIndex, colIndex)
    
    const actualSph = colInfo.isPlus ? sph : -sph
    const sphStr = actualSph >= 0 ? `+${actualSph.toFixed(2)}` : actualSph.toFixed(2)
    const cylStr = colInfo.cyl.toFixed(2)
    
    const item = orderItems.find(i => i.product.id === selectedProductId && i.sph === sphStr && i.cyl === cylStr)
    const isFocused = gridFocus?.sphIndex === sphIndex && gridFocus?.colIndex === colIndex
    const isCurrentRow = gridFocus?.sphIndex === sphIndex
    const isCurrentCol = gridFocus?.colIndex === colIndex
    
    let bg = sphIndex % 2 === 0 ? '#f5f8f5' : '#eaf2ea'
    if (isDisabled) bg = '#d1d5db' // 비활성화: 회색
    else if (isCurrentRow || isCurrentCol) bg = '#c5dbc5' // 세이지 행/열
    if (!isDisabled && isCurrentRow && isCurrentCol) bg = '#a8c8a8' // 교차점 더 진하게
    if (!isDisabled && isFocused) bg = '#5d7a5d'
    if (!isDisabled && item) bg = '#6b8e6b'
    
    return (
      <td key={colIndex} onClick={() => !isDisabled && handleGridClick(sphIndex, colIndex)}
        style={{ 
          border: '1px solid #a8c4a8', 
          padding: 0, textAlign: 'center', background: bg, 
          color: isDisabled ? '#9ca3af' : (item || isFocused ? '#fff' : '#3d5c3d'), 
          cursor: isDisabled ? 'not-allowed' : 'pointer', 
          width: 40, height: 30, fontSize: 13, 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
          fontWeight: item ? 700 : 500,
          transition: 'background 0.15s'
        }}>
        {item && !isDisabled ? item.quantity : isFocused && !isDisabled && cellInputValue ? cellInputValue : ''}
      </td>
    )
  }

  const focusedInfo = getFocusedInfo()

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 4, borderBottom: '2px solid #333' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>판매전표 입력</h1>
        <span style={{ fontSize: 12, color: '#666' }}>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 4, height: 'calc(100vh - 110px)' }}>
        {/* 왼쪽 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#f5f5f5', padding: 5, borderRadius: 3, overflow: 'hidden', fontSize: 13 }}>
          <section>
            <label style={{ fontWeight: 600 }}>상호 [Esc]</label>
            <input ref={storeInputRef} type="text" placeholder="검색..." value={storeSearchText}
              onKeyDown={e => { const vs = filteredStores.slice(0, 10); if (e.key === 'ArrowDown' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.min(p + 1, vs.length - 1)) } else if (e.key === 'ArrowUp' && storeSearchText && !selectedStore) { e.preventDefault(); setStoreFocusIndex(p => Math.max(p - 1, 0)) } else if (e.key === 'Enter' && storeSearchText && vs.length > 0 && !selectedStore) { setSelectedStore(vs[storeFocusIndex >= 0 ? storeFocusIndex : 0]); setStoreSearchText(''); setStoreFocusIndex(-1); brandSelectRef.current?.focus() } }}
              onChange={e => { setStoreSearchText(e.target.value); setStoreFocusIndex(-1) }}
              style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 3, fontSize: 14, marginTop: 4 }} />
            {selectedStore && (
              <div style={{ marginTop: 3, padding: 5, background: '#e3f2fd', borderRadius: 2, fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{selectedStore.name}</div>
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
              <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 2, border: '1px solid #ddd', borderRadius: 3, background: '#fff' }}>
                {filteredStores.slice(0, 10).map((s, i) => (
                  <div key={s.id} ref={el => { storeResultRefs.current[i] = el }} onClick={() => { setSelectedStore(s); setStoreSearchText(''); brandSelectRef.current?.focus() }}
                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #eee', background: storeFocusIndex === i ? '#e3f2fd' : '#fff', fontSize: 13 }}>{s.name}</div>
                ))}
              </div>
            )}
          </section>
          <section>
            <label style={{ fontWeight: 600 }}>주문 구분</label>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              {([
                { label: '여벌', key: 'F7' },
                { label: '착색', key: 'F8' },
                { label: 'RX', key: 'F9' },
                { label: '기타', key: 'F10' }
              ] as const).map(({ label: t, key }) => (
                <label key={t} style={{ flex: 1, padding: '10px 8px', background: orderType === t ? '#5d7a5d' : '#fff', color: orderType === t ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <input type="radio" name="ot" checked={orderType === t} onChange={() => setOrderType(t)} style={{ display: 'none' }} />
                  <span>{t}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>[{key}]</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <label style={{ fontWeight: 600 }}>품목 [F5]</label>
            <select ref={brandSelectRef} value={selectedBrandId || ''} onChange={e => { const bid = e.target.value ? parseInt(e.target.value) : null; setSelectedBrandId(bid); setSelectedProductId(null); if (bid) setTimeout(() => { setProductFocusIndex(0); productListRef.current?.focus() }, 50) }}
              style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 3, fontSize: 14, marginTop: 4 }}>
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
                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #eee', background: selectedProductId === p.id ? '#e3f2fd' : productFocusIndex === i ? '#fff3e0' : '#fff', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ color: '#5d7a5d', fontWeight: 600 }}>{(p.sellingPrice/1000).toFixed(0)}k</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* 중앙: 하나의 도수표 (가운데 기준) */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}
          style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: gridFocus ? '2px solid #5d7a5d' : '1px solid #c5dbc5', borderRadius: 8, overflow: 'hidden', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '8px 12px', background: 'linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}>{selectedProduct ? `${selectedProduct.brand} - ${selectedProduct.name}` : '상품 선택'}</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>←→ CYL | ↑↓ SPH{focusedInfo ? <> | <strong style={{ color: '#fffacd' }}>재고: {stockGrid[focusedInfo.sph.toFixed(2)]?.[focusedInfo.cyl.toFixed(2)] ?? '-'}</strong></> : ''}</span>
          </div>
          
          <div ref={gridContainerRef} style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <thead>
                <tr style={{ background: '#e8f0e8' }}>
                  {/* 왼쪽 SPH 헤더 */}
                  <th style={{ border: '1px solid #a8c4a8', padding: '4px 10px', fontWeight: 700, minWidth: 46, position: 'sticky', left: 0, background: '#5d7a5d', color: '#fff', zIndex: 10, fontSize: 13, whiteSpace: 'nowrap' }}>-SPH</th>
                  
                  {/* 왼쪽 CYL 열들 (400 → 000) */}
                  {cylColsLeft.map((cyl, i) => {
                    const isFirst = i === 0
                    return <th key={`L${i}`} style={{ border: '1px solid #a8c4a8', padding: '4px 4px', minWidth: 40, fontWeight: isFirst ? 700 : 600, background: gridFocus?.colIndex === i ? '#7d9d7d' : isFirst ? '#4a6b4a' : '#e8f0e8', color: gridFocus?.colIndex === i ? '#fff' : isFirst ? '#fff' : '#3d5c3d', fontSize: 13 }}>-{formatLegacy(cyl)}</th>
                  })}
                  
                  {/* 가운데 구분 열 -Sph+ */}
                  <th style={{ border: '1px solid #4a6b4a', borderLeft: '2px solid #4a6b4a', borderRight: '2px solid #4a6b4a', padding: '4px 10px', minWidth: 60, fontWeight: 700, background: '#4a6b4a', color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>-SPH+</th>
                  
                  {/* 오른쪽 CYL 열들 (000 → 400) */}
                  {cylColsRight.map((cyl, i) => {
                    const isLast = i === cylColsRight.length - 1
                    return <th key={`R${i}`} style={{ border: '1px solid #a8c4a8', padding: '4px 4px', minWidth: 40, fontWeight: isLast ? 700 : 600, background: gridFocus?.colIndex === cylColsLeft.length + 1 + i ? '#7d9d7d' : isLast ? '#4a6b4a' : '#e8f0e8', color: gridFocus?.colIndex === cylColsLeft.length + 1 + i ? '#fff' : isLast ? '#fff' : '#3d5c3d', fontSize: 13 }}>-{formatLegacy(cyl)}</th>
                  })}
                  
                  {/* 오른쪽 SPH 헤더 */}
                  <th style={{ border: '1px solid #a8c4a8', padding: '4px 10px', fontWeight: 700, minWidth: 46, position: 'sticky', right: 0, background: '#5d7a5d', color: '#fff', zIndex: 10, fontSize: 13, whiteSpace: 'nowrap' }}>+SPH</th>
                </tr>
              </thead>
              <tbody>
                {sphRows.map((sph, sphIndex) => {
                  const isCurrentRow = gridFocus?.sphIndex === sphIndex
                  return (
                    <tr key={sphIndex}>
                      {/* 왼쪽 SPH 값 */}
                      <td style={{ border: '1px solid #a8c4a8', padding: '5px 8px', fontWeight: 700, textAlign: 'center', position: 'sticky', left: 0, background: isCurrentRow ? '#7d9d7d' : '#e8f0e8', color: isCurrentRow ? '#fff' : '#3d5c3d', zIndex: 5, fontSize: 13 }}>{formatLegacy(sph)}</td>
                      
                      {/* 왼쪽 CYL 셀들 */}
                      {cylColsLeft.map((_, i) => renderCell(sphIndex, i))}
                      
                      {/* 가운데 구분 셀: -000+ 형식 */}
                      <td style={{ border: '1px solid #4a6b4a', borderLeft: '2px solid #4a6b4a', borderRight: '2px solid #4a6b4a', padding: '5px 8px', fontWeight: 700, textAlign: 'center', background: isCurrentRow ? '#6b8e6b' : '#4a6b4a', color: '#fff', fontSize: 13, whiteSpace: 'nowrap' }}>-{formatLegacy(sph)}+</td>
                      
                      {/* 오른쪽 CYL 셀들 */}
                      {cylColsRight.map((_, i) => renderCell(sphIndex, cylColsLeft.length + 1 + i))}
                      
                      {/* 오른쪽 SPH 값 */}
                      <td style={{ border: '1px solid #a8c4a8', padding: '5px 8px', fontWeight: 700, textAlign: 'center', position: 'sticky', right: 0, background: isCurrentRow ? '#7d9d7d' : '#e8f0e8', color: isCurrentRow ? '#fff' : '#3d5c3d', zIndex: 5, fontSize: 13 }}>{formatLegacy(sph)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%)', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{focusedInfo ? (() => {
              // CYL 플러스 환산: newSPH = SPH + CYL, newCYL = -CYL
              const convertedSph = focusedInfo.sph + focusedInfo.cyl
              const convertedCyl = -focusedInfo.cyl
              return <>
                <strong style={{ color: '#fff', fontSize: 16 }}>
                  {focusedInfo.sph >= 0 ? '+' : ''}{focusedInfo.sph.toFixed(2)}
                </strong>
                <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.6)' }}>/</span>
                <strong style={{ color: '#fff', fontSize: 16 }}>
                  {focusedInfo.cyl >= 0 ? '+' : ''}{focusedInfo.cyl.toFixed(2)}
                </strong>
                <span style={{ margin: '0 12px', color: 'rgba(255,255,255,0.5)' }}>→</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 4, fontSize: 15 }}>
                  <strong style={{ color: '#fffacd' }}>{convertedSph >= 0 ? '+' : '-'}{String(Math.round(Math.abs(convertedSph) * 100)).padStart(3, '0')}</strong>
                  <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.6)' }}>/</span>
                  <strong style={{ color: '#fffacd' }}>+{String(Math.round(Math.abs(convertedCyl) * 100)).padStart(3, '0')}</strong>
                </span>
              </>
            })() : <span style={{ color: 'rgba(255,255,255,0.7)' }}>셀 선택</span>}</span>
            <span style={{ color: focusedInfo?.isPlus ? '#ffcccb' : '#c5dbc5', fontWeight: 700, fontSize: 13 }}>{focusedInfo ? (focusedInfo.isPlus ? '원시(+)' : '근시(-)') : ''}</span>
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', fontSize: 13 }}>
          <div style={{ padding: '6px 8px', background: '#333', color: '#fff', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>주문 목록</span><span>{orderItems.length}건</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '50px minmax(60px, 1fr) 36px 36px 24px 52px', padding: '4px 6px', background: '#e0e0e0', fontWeight: 600, fontSize: 10, gap: '2px', alignItems: 'center' }}>
            <span>품목</span>
            <span>상품</span>
            <span style={{ textAlign: 'center' }}>SPH</span>
            <span style={{ textAlign: 'center' }}>CYL</span>
            <span style={{ textAlign: 'center' }}>수량</span>
            <span style={{ textAlign: 'right' }}>금액</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {orderItems.length === 0 ? <div style={{ padding: 10, textAlign: 'center', color: '#999' }}>도수표에서 수량 입력</div> : (
              orderItems.map((item, i) => (
                <div key={item.id} onContextMenu={(e) => handleContextMenu(e, item)} style={{ display: 'grid', gridTemplateColumns: '50px minmax(60px, 1fr) 36px 36px 24px 52px', padding: '5px 6px', borderBottom: '1px solid #ddd', background: i % 2 === 0 ? '#fff' : '#fafafa', alignItems: 'center', fontSize: 10, gap: '2px', cursor: 'context-menu' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>{item.product.brand}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                  <div style={{ fontFamily: 'monospace', textAlign: 'center' }}>{(() => { const v = parseFloat(item.sph); return (v <= 0 ? '-' : '+') + String(Math.round(Math.abs(v) * 100)).padStart(3, '0'); })()}</div>
                  <div style={{ fontFamily: 'monospace', textAlign: 'center' }}>-{String(Math.round(Math.abs(parseFloat(item.cyl)) * 100)).padStart(3, '0')}</div>
                  <div style={{ fontWeight: 600, textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{(item.product.sellingPrice * item.quantity).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 6, borderTop: '1px solid #ddd' }}>
            <input type="text" placeholder="메모..." value={memo} onChange={e => setMemo(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 2, fontSize: 12 }} />
          </div>
          <div style={{ padding: '8px 10px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span>총 <strong>{totalQuantity}</strong>개</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{totalAmount.toLocaleString()}원</span>
          </div>
          <div style={{ padding: 6, display: 'flex', gap: 4 }}>
            <button onClick={() => setOrderItems([])} style={{ flex: 1, padding: 8, background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}>초기화</button>
            <button onClick={handleSubmit} disabled={loading || !selectedStore || orderItems.length === 0} style={{ flex: 2, padding: 8, background: loading ? '#ccc' : '#4caf50', color: '#fff', border: 'none', borderRadius: 3, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>전송 [F2]</button>
          </div>
        </div>
      </div>

      {/* 접수 완료 팝업 */}
      {showCompleteModal && completedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 400, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>접수 완료</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>주문이 정상적으로 접수되었습니다.</p>
            
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>주문번호</span>
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{completedOrder.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>가맹점</span>
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{completedOrder.storeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>주문유형</span>
                <span style={{ fontWeight: 600, color: '#3b82f6' }}>{orderType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>상품수</span>
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{completedOrder.itemCount}건</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>총 금액</span>
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: 18 }}>{completedOrder.totalAmount.toLocaleString()}원</span>
              </div>
            </div>

            <button 
              onClick={handleCompleteClose}
              style={{ width: '100%', padding: '14px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >
              전체 주문내역 보기
            </button>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} onClick={() => setContextMenu(null)}>
          <div style={{ position: 'absolute', top: contextMenu.y, left: contextMenu.x, background: '#fff', border: '1px solid #ccc', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', overflow: 'hidden', width: 'fit-content' }} onClick={e => e.stopPropagation()}>
            <div onClick={() => handleEditQuantity(contextMenu.item)} style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 11, whiteSpace: 'nowrap' }} onMouseEnter={e => (e.target as HTMLElement).style.background = '#f5f5f5'} onMouseLeave={e => (e.target as HTMLElement).style.background = '#fff'}>📝 수량</div>
            <div onClick={() => handleEditPrice(contextMenu.item)} style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 11, whiteSpace: 'nowrap' }} onMouseEnter={e => (e.target as HTMLElement).style.background = '#f5f5f5'} onMouseLeave={e => (e.target as HTMLElement).style.background = '#fff'}>💰 금액</div>
            <div onClick={() => { removeItem(contextMenu.item.id); setContextMenu(null) }} style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#e53935', whiteSpace: 'nowrap' }} onMouseEnter={e => (e.target as HTMLElement).style.background = '#ffebee'} onMouseLeave={e => (e.target as HTMLElement).style.background = '#fff'}>🗑️ 삭제</div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>{editModal.type === 'quantity' ? '수량 변경' : '금액 변경'}</h3>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
              {editModal.item.product.name} ({(() => { const v = parseFloat(editModal.item.sph); return (v <= 0 ? '-' : '+') + String(Math.round(Math.abs(v) * 100)).padStart(3, '0'); })()})
            </div>
            <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter') handleEditConfirm(); if (e.key === 'Escape') { setEditModal(null); setEditValue('') } }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditModal(null); setEditValue('') }} style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>취소</button>
              <button onClick={handleEditConfirm} style={{ flex: 1, padding: '10px', background: '#5d7a5d', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 수량 입력 액션 팝업 */}
      {quantityActionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => { setQuantityActionModal(null); setCellInputValue('') }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', width: 'fit-content' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 8, fontSize: 11, textAlign: 'center', color: '#333' }}>
              <span style={{ fontWeight: 600 }}>{quantityActionModal.sphStr}/{quantityActionModal.cylStr}</span>
              <span style={{ margin: '0 6px', color: '#999' }}>|</span>
              <span>{quantityActionModal.existingQty} → {quantityActionModal.newQty}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => {
                handleGridCellInput(quantityActionModal.sphIndex, quantityActionModal.colIndex, quantityActionModal.newQty, 'add')
                setQuantityActionModal(null)
                setCellInputValue('')
              }} style={{ padding: '5px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                ➕{quantityActionModal.existingQty + quantityActionModal.newQty}
              </button>
              <button onClick={() => {
                handleGridCellInput(quantityActionModal.sphIndex, quantityActionModal.colIndex, quantityActionModal.newQty, 'replace')
                setQuantityActionModal(null)
                setCellInputValue('')
              }} style={{ padding: '5px 8px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                ✏️{quantityActionModal.newQty}
              </button>
              <button onClick={() => { setQuantityActionModal(null); setCellInputValue('') }}
                style={{ padding: '5px 8px', background: '#9e9e9e', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
