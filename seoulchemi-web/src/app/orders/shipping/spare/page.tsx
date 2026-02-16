'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent, MouseEvent } from 'react'
import Layout from '../../../components/Layout'
import { ORDER_SIDEBAR } from '../../../constants/sidebar'
import ConfirmDialog from '../../../components/ConfirmDialog'

interface SpareOrder {
  id: number
  itemId: number
  orderNo: string
  storeId: number
  storeName: string
  storeCode: string
  groupId: number | null
  groupName: string | null
  salesStaffId: number | null
  salesStaffName: string | null
  deliveryStaffId: number | null
  deliveryStaffName: string | null
  productId: number
  productName: string
  brandId: number
  brandName: string
  supplierId: number | null
  supplierName: string | null
  sph: string | null
  cyl: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  orderedAt: string
}

interface FilterOption {
  id: number
  name: string
  code?: string
  phone?: string
}

interface Filters {
  suppliers: FilterOption[]
  stores: FilterOption[]
  groups: FilterOption[]
  salesStaffs: FilterOption[]
  deliveryStaffs: FilterOption[]
}

type FilterType = 'store' | 'deliveryStaff' | 'group' | 'salesStaff' | 'supplier'

interface ColumnWidths {
  checkbox: number
  store: number
  date: number
  product: number
  sph: number
  cyl: number
  qty: number
  price: number
  delivery: number
}

interface ColumnFilters {
  store: string
  date: string
  product: string
  sph: string
  cyl: string
  delivery: string
}

export default function SpareShipmentPage() {
  const [orders, setOrders] = useState<SpareOrder[]>([])
  const [filters, setFilters] = useState<Filters>({
    suppliers: [],
    stores: [],
    groups: [],
    salesStaffs: [],
    deliveryStaffs: []
  })
  const [loading, setLoading] = useState(true)
  const [shipping, setShipping] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  // 필터 상태
  const [activeFilter, setActiveFilter] = useState<FilterType>('store')
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 컬럼별 검색 필터
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    store: '',
    date: '',
    product: '',
    sph: '',
    cyl: '',
    delivery: ''
  })

  // 키보드 네비게이션
  const [focusedFilterIndex, setFocusedFilterIndex] = useState<number>(-1)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const [focusArea, setFocusArea] = useState<'search' | 'filter' | 'table'>('search')
  
  // 리사이즈
  const [leftPanelWidth, setLeftPanelWidth] = useState(300)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 컬럼 너비
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    checkbox: 36,
    store: 130,
    date: 110,
    product: 250,
    sph: 60,
    cyl: 60,
    qty: 45,
    price: 75,
    delivery: 80
  })
  const [resizingColumn, setResizingColumn] = useState<keyof ColumnWidths | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  
  const filterListRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableSectionElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 데이터 로드
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedFilterId !== null) {
        switch (activeFilter) {
          case 'supplier': params.set('supplierId', String(selectedFilterId)); break
          case 'store': params.set('storeId', String(selectedFilterId)); break
          case 'group': params.set('groupId', String(selectedFilterId)); break
          case 'salesStaff': params.set('salesStaffId', String(selectedFilterId)); break
          case 'deliveryStaff': params.set('deliveryStaffId', String(selectedFilterId)); break
        }
      }

      const res = await fetch(`/api/orders/ship/spare?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrders(data.orders || [])
      setFilters(data.filters || { suppliers: [], stores: [], groups: [], salesStaffs: [], deliveryStaffs: [] })
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, selectedFilterId])

  useEffect(() => { loadOrders() }, [loadOrders])

  // F2 단축키 - 출고 처리
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      console.log('🔑 Key pressed:', e.key, 'selectedItems:', selectedItems.size, 'shipping:', shipping)
      if (e.key === 'F2' && selectedItems.size > 0 && !shipping) {
        e.preventDefault()
        handleShipping()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItems.size, shipping])

  // 컬럼 필터링된 주문
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (columnFilters.store && !order.storeName.toLowerCase().includes(columnFilters.store.toLowerCase())) return false
      if (columnFilters.date) {
        const dateStr = new Date(order.orderedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        if (!dateStr.includes(columnFilters.date)) return false
      }
      if (columnFilters.product) {
        const productStr = `${order.brandName} ${order.productName}`.toLowerCase()
        if (!productStr.includes(columnFilters.product.toLowerCase())) return false
      }
      if (columnFilters.sph && order.sph && !order.sph.includes(columnFilters.sph)) return false
      if (columnFilters.cyl && order.cyl && !order.cyl.includes(columnFilters.cyl)) return false
      if (columnFilters.delivery && order.deliveryStaffName && !order.deliveryStaffName.toLowerCase().includes(columnFilters.delivery.toLowerCase())) return false
      return true
    })
  }

  const filteredOrders = getFilteredOrders()

  // 리사이즈 핸들러
  const handlePanelMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    setIsResizing('panel')
    setStartX(e.clientX)
    setStartWidth(leftPanelWidth)
  }

  const handleColumnMouseDown = (column: keyof ColumnWidths) => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column])
  }

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isResizing === 'panel' && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newWidth = e.clientX - containerRect.left
        setLeftPanelWidth(Math.max(220, Math.min(450, newWidth)))
      }
      if (resizingColumn) {
        const diff = e.clientX - startX
        const newWidth = Math.max(40, startWidth + diff)
        setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }))
      }
    }
    const handleMouseUp = () => { setIsResizing(null); setResizingColumn(null) }

    if (isResizing || resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resizingColumn, startX, startWidth])

  // 필터 관련
  const getFilterList = (): FilterOption[] => {
    switch (activeFilter) {
      case 'supplier': return filters.suppliers
      case 'store': return filters.stores
      case 'group': return filters.groups
      case 'salesStaff': return filters.salesStaffs
      case 'deliveryStaff': return filters.deliveryStaffs
      default: return []
    }
  }

  const handleFilterTypeChange = (type: FilterType) => {
    setActiveFilter(type)
    setSelectedFilterId(null)
    setSearchQuery('')
    setFocusedFilterIndex(-1)
  }

  // 검색 필터링 - 이름, 코드, 전화번호 모두 검색
  const getFilteredList = () => {
    const list = getFilterList()
    if (!searchQuery.trim()) return list
    const query = searchQuery.toLowerCase().replace(/-/g, '')
    return list.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.code && item.code.toLowerCase().includes(query)) ||
      (item.phone && item.phone.replace(/-/g, '').includes(query))
    )
  }

  const getFilterStats = () => {
    const list = getFilteredList()
    return list.map(item => {
      let count = 0, amount = 0
      orders.forEach(order => {
        let matches = false
        switch (activeFilter) {
          case 'supplier': matches = order.supplierId === item.id; break
          case 'store': matches = order.storeId === item.id; break
          case 'group': matches = order.groupId === item.id; break
          case 'salesStaff': matches = order.salesStaffId === item.id; break
          case 'deliveryStaff': matches = order.deliveryStaffId === item.id; break
        }
        if (matches) { count++; amount += order.totalPrice }
      })
      return { ...item, count, amount }
    }).filter(s => s.count > 0)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredOrders.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredOrders.map(o => o.itemId)))
    }
  }

  const toggleSelect = (itemId: number) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(itemId)) newSet.delete(itemId)
    else newSet.add(itemId)
    setSelectedItems(newSet)
  }

  // 거래명세표 출력
  const printInvoice = async (orderIds: number[]) => {
    try {
      // 프린터 설정 가져오기
      const settingsRes = await fetch('/api/settings/printer')
      const settings = settingsRes.ok ? await settingsRes.json() : {}
      
      // 각 주문별로 거래명세표 출력
      for (const orderId of orderIds) {
        const printUrl = `/orders/${orderId}/print?type=invoice&printer=${encodeURIComponent(settings.invoicePrinter || '')}`
        window.open(printUrl, '_blank', 'width=800,height=600')
      }
    } catch (error) {
      console.error('Failed to print invoice:', error)
    }
  }

  // 출고 확인 모달 표시
  const handleShipping = () => {
    if (selectedItems.size === 0) { alert('출고할 주문을 선택해주세요.'); return }
    setShowConfirm(true)
  }

  // 실제 출고 실행
  const executeShipping = async () => {
    setShowConfirm(false)
    try {
      setShipping(true)
      const res = await fetch('/api/orders/ship/spare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: Array.from(selectedItems) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '출고 처리 실패')

      // 출고 완료된 주문 ID 추출
      const shippedOrderIds = data.shipped.map((s: any) => s.orderId)
      
      alert(`✅ ${data.shipped.length}건 출고 완료!`)
      
      // 거래명세표 자동 출력
      if (shippedOrderIds.length > 0) {
        await printInvoice(shippedOrderIds)
      }

      setSelectedItems(new Set())
      loadOrders()
    } catch (error: any) {
      alert(`❌ 출고 실패: ${error.message}`)
    } finally {
      setShipping(false)
    }
  }

  // 키보드 핸들러
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const stats = getFilterStats()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusArea('filter')
      setFocusedFilterIndex(stats.length > 0 ? 0 : -1)
      filterListRef.current?.focus()
    } else if (e.key === 'Enter' && stats.length > 0) {
      e.preventDefault()
      setSelectedFilterId(stats[0].id)
      setFocusArea('table')
      setFocusedRowIndex(0)
      setTimeout(() => tableRef.current?.focus(), 100)
    }
  }

  const handleFilterKeyDown = (e: KeyboardEvent) => {
    const stats = getFilterStats()
    const maxIndex = stats.length - 1
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedFilterIndex(prev => Math.min(prev + 1, maxIndex)); break
      case 'ArrowUp':
        e.preventDefault()
        if (focusedFilterIndex <= 0) { setFocusArea('search'); setFocusedFilterIndex(-1); searchInputRef.current?.focus() }
        else setFocusedFilterIndex(prev => prev - 1)
        break
      case 'Enter':
      case 'ArrowRight':
        e.preventDefault()
        if (e.key === 'Enter' && focusedFilterIndex >= 0 && stats[focusedFilterIndex]) setSelectedFilterId(stats[focusedFilterIndex].id)
        setFocusArea('table'); setFocusedRowIndex(0)
        setTimeout(() => tableRef.current?.focus(), 100)
        break
      case 'Escape': setFocusArea('search'); searchInputRef.current?.focus(); break
    }
  }

  const handleTableKeyDown = (e: KeyboardEvent) => {
    const maxIndex = filteredOrders.length - 1
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedRowIndex(prev => Math.min(prev + 1, maxIndex)); break
      case 'ArrowUp': e.preventDefault(); setFocusedRowIndex(prev => Math.max(prev - 1, 0)); break
      case ' ': e.preventDefault(); if (filteredOrders[focusedRowIndex]) toggleSelect(filteredOrders[focusedRowIndex].itemId); break
      case 'Enter':
        e.preventDefault()
        if (filteredOrders[focusedRowIndex]) {
          toggleSelect(filteredOrders[focusedRowIndex].itemId)
          if (focusedRowIndex < maxIndex) setFocusedRowIndex(prev => prev + 1)
        }
        break
      case 'a': if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleSelectAll() } break
      case 'Escape':
      case 'ArrowLeft': e.preventDefault(); setFocusArea('filter'); filterListRef.current?.focus(); break
    }
  }

  useEffect(() => {
    if (focusArea === 'table' && focusedRowIndex >= 0) {
      const row = tableRef.current?.children[focusedRowIndex] as HTMLElement
      row?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedRowIndex, focusArea])

  useEffect(() => {
    if (focusArea === 'filter' && focusedFilterIndex >= 0) {
      const items = filterListRef.current?.children
      if (items && items[focusedFilterIndex]) (items[focusedFilterIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
    }
  }, [focusedFilterIndex, focusArea])

  const selectedTotal = filteredOrders.filter(o => selectedItems.has(o.itemId)).reduce((sum, o) => sum + o.totalPrice, 0)
  const filterStats = getFilterStats()
  const filterLabels: Record<FilterType, string> = { store: '가맹점', deliveryStaff: '배송담당', group: '그룹', salesStaff: '영업담당', supplier: '매입처' }
  const filterOrder: FilterType[] = ['store', 'deliveryStaff', 'group', 'salesStaff', 'supplier']

  const ColumnResizer = ({ column }: { column: keyof ColumnWidths }) => (
    <div
      onMouseDown={handleColumnMouseDown(column)}
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', background: resizingColumn === column ? '#5d7a5d' : 'transparent', zIndex: 2 }}
      onMouseEnter={(e) => { if (!resizingColumn) e.currentTarget.style.background = '#ccc' }}
      onMouseLeave={(e) => { if (!resizingColumn) e.currentTarget.style.background = 'transparent' }}
    />
  )

  const updateColumnFilter = (key: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid #5d7a5d' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            여벌 출고
            <span style={{ fontSize: 12, background: '#eef4ee', color: '#5d7a5d', padding: '3px 8px', borderRadius: 4, marginLeft: 10, fontWeight: 500 }}>
              {filteredOrders.length}건 대기
            </span>
          </h1>
          <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10 }}>↑↓</kbd> 이동 
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10, marginLeft: 4 }}>Enter</kbd> 선택+다음
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10, marginLeft: 4 }}>F2</kbd> 출고
          </p>
        </div>
        <span style={{ fontSize: 13, color: '#666' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </span>
      </div>

      <div ref={containerRef} style={{ display: 'flex', height: 'calc(100vh - 170px)', userSelect: (isResizing || resizingColumn) ? 'none' : 'auto' }}>
        
        {/* 왼쪽: 필터 패널 */}
        <div style={{ width: leftPanelWidth, minWidth: 220, maxWidth: 450, background: '#f8f9fa', borderRadius: '8px 0 0 8px', border: '1px solid #ddd', borderRight: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, padding: '6px', background: '#5d7a5d' }}>
            {filterOrder.map(type => (
              <button key={type} onClick={() => handleFilterTypeChange(type)}
                style={{ padding: '6px 4px', border: 'none', borderRadius: 4, background: activeFilter === type ? '#fff' : 'rgba(255,255,255,0.15)', color: activeFilter === type ? '#5d7a5d' : '#fff', fontSize: 12, cursor: 'pointer', fontWeight: activeFilter === type ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {filterLabels[type]}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #ddd', background: '#fff' }}>
            <input ref={searchInputRef} type="text" placeholder={`${filterLabels[activeFilter]} 또는 전화번호 검색...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} onFocus={() => setFocusArea('search')}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div onClick={() => { setSelectedFilterId(null); setFocusedFilterIndex(-1) }}
            style={{ padding: '10px 14px', borderBottom: '1px solid #ddd', cursor: 'pointer', background: selectedFilterId === null ? '#eef4ee' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>전체</div><div style={{ fontSize: 12, color: '#666' }}>{orders.length}건</div></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#5d7a5d' }}>{orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}원</div>
          </div>
          <div ref={filterListRef} tabIndex={0} onKeyDown={handleFilterKeyDown} onFocus={() => setFocusArea('filter')} style={{ flex: 1, overflow: 'auto', outline: 'none' }}>
            {filterStats.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>{searchQuery ? '검색 결과 없음' : '대기 주문 없음'}</div>
            ) : filterStats.map((item, index) => (
              <div key={item.id} onClick={() => { setSelectedFilterId(item.id); setFocusedFilterIndex(index) }}
                style={{ padding: '10px 14px', borderBottom: '1px solid #eee', cursor: 'pointer', background: selectedFilterId === item.id ? '#eef4ee' : (focusArea === 'filter' && focusedFilterIndex === index ? '#e3e8e3' : '#fff'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', outline: focusArea === 'filter' && focusedFilterIndex === index ? '2px solid #5d7a5d' : 'none', outlineOffset: -2 }}>
                <div><div style={{ fontSize: 14 }}>{item.name}</div><div style={{ fontSize: 12, color: '#666' }}>{item.count}건</div></div>
                <div style={{ fontSize: 12, color: '#5d7a5d', fontWeight: 500 }}>{item.amount.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        </div>

        {/* 패널 리사이즈 핸들 */}
        <div onMouseDown={handlePanelMouseDown} style={{ width: 8, cursor: 'col-resize', background: isResizing === 'panel' ? '#5d7a5d' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => { if (!isResizing) e.currentTarget.style.background = '#e0e0e0' }}
          onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.background = 'transparent' }}>
          <div style={{ width: 4, height: 40, background: '#ccc', borderRadius: 2 }} />
        </div>

        {/* 오른쪽: 테이블 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #ddd', borderRadius: '0 8px 8px 0', background: '#fff' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 14 }}>로딩 중...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 14 }}>출고 대기 주문이 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                <thead>
                  {/* 컬럼 헤더 */}
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ width: columnWidths.checkbox, padding: '8px 4px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedItems.size === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16 }} />
                    </th>
                    <th style={{ width: columnWidths.store, padding: '8px 8px', textAlign: 'left', position: 'relative' }}>가맹점<ColumnResizer column="store" /></th>
                    <th style={{ width: columnWidths.date, padding: '8px 6px', textAlign: 'center', position: 'relative' }}>날짜<ColumnResizer column="date" /></th>
                    <th style={{ width: columnWidths.product || 'auto', padding: '8px 8px', textAlign: 'left', position: 'relative' }}>브랜드 / 상품명<ColumnResizer column="product" /></th>
                    <th style={{ width: columnWidths.sph, padding: '8px 4px', textAlign: 'center', position: 'relative' }}>SPH<ColumnResizer column="sph" /></th>
                    <th style={{ width: columnWidths.cyl, padding: '8px 4px', textAlign: 'center', position: 'relative' }}>CYL<ColumnResizer column="cyl" /></th>
                    <th style={{ width: columnWidths.qty, padding: '8px 4px', textAlign: 'center', position: 'relative' }}>수량<ColumnResizer column="qty" /></th>
                    <th style={{ width: columnWidths.price, padding: '8px 6px', textAlign: 'right', position: 'relative' }}>금액<ColumnResizer column="price" /></th>
                    <th style={{ width: columnWidths.delivery, padding: '8px 8px', textAlign: 'left', position: 'relative' }}>배송담당<ColumnResizer column="delivery" /></th>
                  </tr>
                  {/* 검색 필터 행 */}
                  <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd', position: 'sticky', top: 37, zIndex: 2 }}>
                    <th style={{ padding: '4px' }}></th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="검색" value={columnFilters.store} onChange={(e) => updateColumnFilter('store', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box' }} />
                    </th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="MM/DD" value={columnFilters.date} onChange={(e) => updateColumnFilter('date', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box', textAlign: 'center' }} />
                    </th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="브랜드/상품 검색" value={columnFilters.product} onChange={(e) => updateColumnFilter('product', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box' }} />
                    </th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="SPH" value={columnFilters.sph} onChange={(e) => updateColumnFilter('sph', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box', textAlign: 'center' }} />
                    </th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="CYL" value={columnFilters.cyl} onChange={(e) => updateColumnFilter('cyl', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box', textAlign: 'center' }} />
                    </th>
                    <th style={{ padding: '4px' }}></th>
                    <th style={{ padding: '4px' }}></th>
                    <th style={{ padding: '4px' }}>
                      <input type="text" placeholder="검색" value={columnFilters.delivery} onChange={(e) => updateColumnFilter('delivery', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, boxSizing: 'border-box' }} />
                    </th>
                  </tr>
                </thead>
                <tbody ref={tableRef} tabIndex={0} onKeyDown={handleTableKeyDown} onFocus={() => setFocusArea('table')} style={{ outline: 'none' }}>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.itemId} onClick={() => toggleSelect(order.itemId)}
                      style={{ borderBottom: '1px solid #eee', background: selectedItems.has(order.itemId) ? '#f0f7f0' : (focusArea === 'table' && focusedRowIndex === index ? '#e8f0e8' : undefined), cursor: 'pointer', outline: focusArea === 'table' && focusedRowIndex === index ? '2px solid #5d7a5d' : 'none', outlineOffset: -2 }}>
                      <td style={{ width: columnWidths.checkbox, padding: '8px 4px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedItems.has(order.itemId)} onChange={(e) => { e.stopPropagation(); toggleSelect(order.itemId) }} style={{ width: 16, height: 16 }} />
                      </td>
                      <td style={{ width: columnWidths.store, padding: '8px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {order.storeName}
                      </td>
                      <td style={{ width: columnWidths.date, padding: '8px 6px', textAlign: 'center', fontSize: 11, color: '#666' }}>
                        {new Date(order.orderedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ width: columnWidths.product, padding: '8px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 3, background: '#eef4ee', fontSize: 12, marginRight: 6, color: '#5d7a5d', fontWeight: 500 }}>{order.brandName}</span>
                        <span>{order.productName}</span>
                      </td>
                      <td style={{ width: columnWidths.sph, padding: '8px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{order.sph || '-'}</td>
                      <td style={{ width: columnWidths.cyl, padding: '8px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{order.cyl || '-'}</td>
                      <td style={{ width: columnWidths.qty, padding: '8px 4px', textAlign: 'center', fontWeight: 600 }}>{order.quantity}</td>
                      <td style={{ width: columnWidths.price, padding: '8px 6px', textAlign: 'right', fontWeight: 500 }}>{order.totalPrice.toLocaleString()}</td>
                      <td style={{ width: columnWidths.delivery, padding: '8px 8px', fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.deliveryStaffName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 하단 액션바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #ddd', marginTop: 10 }}>
            <div style={{ fontSize: 14 }}>
              선택: <strong>{selectedItems.size}</strong>건
              <span style={{ marginLeft: 10, color: '#5d7a5d', fontWeight: 600 }}>{selectedTotal.toLocaleString()}원</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setColumnFilters({ store: '', date: '', product: '', sph: '', cyl: '', delivery: '' })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12 }}>필터 초기화</button>
              <button onClick={() => setSelectedItems(new Set())} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13 }}>선택 해제</button>
              <button onClick={() => { console.log('🔘 Button clicked!'); handleShipping(); }} disabled={selectedItems.size === 0 || shipping}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 4, background: selectedItems.size === 0 ? '#ccc' : '#5d7a5d', color: '#fff', cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                {shipping ? '처리 중...' : `출고 (F2)`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 출고 확인 모달 */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="출고 확인"
        message={`${selectedItems.size}건의 아이템을 출고 처리하시겠습니까?`}
        confirmText="출고"
        cancelText="취소"
        onConfirm={executeShipping}
        onCancel={() => setShowConfirm(false)}
      />
    </Layout>
  )
}
