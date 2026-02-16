'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent, MouseEvent } from 'react'
import Layout from '../../../components/Layout'
import { ORDER_SIDEBAR } from '../../../constants/sidebar'

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
}

interface Filters {
  suppliers: FilterOption[]
  stores: FilterOption[]
  groups: FilterOption[]
  salesStaffs: FilterOption[]
  deliveryStaffs: FilterOption[]
}

type FilterType = 'store' | 'deliveryStaff' | 'group' | 'salesStaff' | 'supplier'

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

  // 필터 상태
  const [activeFilter, setActiveFilter] = useState<FilterType>('store')
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 키보드 네비게이션
  const [focusedFilterIndex, setFocusedFilterIndex] = useState<number>(-1)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const [focusArea, setFocusArea] = useState<'search' | 'filter' | 'table'>('search')
  
  // 리사이즈 - 좌우 패널
  const [leftPanelWidth, setLeftPanelWidth] = useState(300)
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
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
          case 'supplier':
            params.set('supplierId', String(selectedFilterId))
            break
          case 'store':
            params.set('storeId', String(selectedFilterId))
            break
          case 'group':
            params.set('groupId', String(selectedFilterId))
            break
          case 'salesStaff':
            params.set('salesStaffId', String(selectedFilterId))
            break
          case 'deliveryStaff':
            params.set('deliveryStaffId', String(selectedFilterId))
            break
        }
      }

      const res = await fetch(`/api/orders/ship/spare?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrders(data.orders || [])
      setFilters(data.filters || {
        suppliers: [],
        stores: [],
        groups: [],
        salesStaffs: [],
        deliveryStaffs: []
      })
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, selectedFilterId])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 리사이즈 핸들러
  const handleMouseDown = (side: 'left' | 'right') => (e: MouseEvent) => {
    e.preventDefault()
    setIsResizing(side)
  }

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      
      if (isResizing === 'left') {
        const newWidth = e.clientX - containerRect.left
        setLeftPanelWidth(Math.max(220, Math.min(450, newWidth)))
      }
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }
  }, [isResizing])

  // 필터 타입별 목록
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

  // 필터 타입 변경
  const handleFilterTypeChange = (type: FilterType) => {
    setActiveFilter(type)
    setSelectedFilterId(null)
    setSearchQuery('')
    setFocusedFilterIndex(-1)
  }

  // 검색 필터링
  const getFilteredList = () => {
    const list = getFilterList()
    if (!searchQuery.trim()) return list
    const query = searchQuery.toLowerCase()
    return list.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.code && item.code.toLowerCase().includes(query))
    )
  }

  // 필터 아이템별 집계
  const getFilterStats = () => {
    const list = getFilteredList()
    return list.map(item => {
      let count = 0
      let amount = 0
      
      orders.forEach(order => {
        let matches = false
        switch (activeFilter) {
          case 'supplier': matches = order.supplierId === item.id; break
          case 'store': matches = order.storeId === item.id; break
          case 'group': matches = order.groupId === item.id; break
          case 'salesStaff': matches = order.salesStaffId === item.id; break
          case 'deliveryStaff': matches = order.deliveryStaffId === item.id; break
        }
        if (matches) {
          count++
          amount += order.totalPrice
        }
      })
      
      return { ...item, count, amount }
    }).filter(s => s.count > 0)
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === orders.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(orders.map(o => o.itemId)))
    }
  }

  // 개별 선택 (아이템별)
  const toggleSelect = (itemId: number) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setSelectedItems(newSet)
  }

  // 출고 처리
  const handleShipping = async () => {
    if (selectedItems.size === 0) {
      alert('출고할 주문을 선택해주세요.')
      return
    }

    if (!confirm(`${selectedItems.size}건의 아이템을 출고 처리하시겠습니까?`)) {
      return
    }

    try {
      setShipping(true)
      const res = await fetch('/api/orders/ship/spare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: Array.from(selectedItems) })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '출고 처리 실패')
      }

      alert(`✅ ${data.shipped.length}건 출고 완료!\n\n${data.shipped.map((s: any) => 
        `• ${s.storeName} (${s.orderNo}) - ${s.shippingAmount.toLocaleString()}원`
      ).join('\n')}`)

      setSelectedItems(new Set())
      loadOrders()
    } catch (error: any) {
      alert(`❌ 출고 실패: ${error.message}`)
    } finally {
      setShipping(false)
    }
  }

  // 검색창 키보드 핸들러
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

  // 키보드 핸들러 - 필터 리스트
  const handleFilterKeyDown = (e: KeyboardEvent) => {
    const stats = getFilterStats()
    const maxIndex = stats.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedFilterIndex(prev => Math.min(prev + 1, maxIndex))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (focusedFilterIndex <= 0) {
          setFocusArea('search')
          setFocusedFilterIndex(-1)
          searchInputRef.current?.focus()
        } else {
          setFocusedFilterIndex(prev => prev - 1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (focusedFilterIndex >= 0 && stats[focusedFilterIndex]) {
          setSelectedFilterId(stats[focusedFilterIndex].id)
        }
        setFocusArea('table')
        setFocusedRowIndex(0)
        setTimeout(() => tableRef.current?.focus(), 100)
        break
      case 'ArrowRight':
        e.preventDefault()
        setFocusArea('table')
        setFocusedRowIndex(0)
        tableRef.current?.focus()
        break
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault()
          setFocusArea('table')
          setFocusedRowIndex(0)
          tableRef.current?.focus()
        }
        break
      case 'Escape':
        setFocusArea('search')
        searchInputRef.current?.focus()
        break
    }
  }

  // 키보드 핸들러 - 테이블
  const handleTableKeyDown = (e: KeyboardEvent) => {
    const maxIndex = orders.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedRowIndex(prev => Math.min(prev + 1, maxIndex))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedRowIndex(prev => Math.max(prev - 1, 0))
        break
      case ' ':
        e.preventDefault()
        if (orders[focusedRowIndex]) {
          toggleSelect(orders[focusedRowIndex].itemId)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (orders[focusedRowIndex]) {
          toggleSelect(orders[focusedRowIndex].itemId)
          // 다음 행으로 이동
          if (focusedRowIndex < maxIndex) {
            setFocusedRowIndex(prev => prev + 1)
          }
        }
        break
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          toggleSelectAll()
        }
        break
      case 'Tab':
        if (e.shiftKey) {
          e.preventDefault()
          setFocusArea('filter')
          filterListRef.current?.focus()
        }
        break
      case 'Escape':
      case 'ArrowLeft':
        e.preventDefault()
        setFocusArea('filter')
        filterListRef.current?.focus()
        break
    }
  }

  // 포커스된 행이 보이도록 스크롤
  useEffect(() => {
    if (focusArea === 'table' && focusedRowIndex >= 0) {
      const row = tableRef.current?.children[focusedRowIndex] as HTMLElement
      row?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedRowIndex, focusArea])

  // 포커스된 필터가 보이도록 스크롤
  useEffect(() => {
    if (focusArea === 'filter' && focusedFilterIndex >= 0) {
      const items = filterListRef.current?.children
      if (items && items[focusedFilterIndex]) {
        (items[focusedFilterIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedFilterIndex, focusArea])

  // 선택된 아이템 합계
  const selectedTotal = orders
    .filter(o => selectedItems.has(o.itemId))
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const filterStats = getFilterStats()
  const filterLabels: Record<FilterType, string> = {
    store: '가맹점',
    deliveryStaff: '배송담당',
    group: '그룹',
    salesStaff: '영업담당',
    supplier: '매입처'
  }

  const filterOrder: FilterType[] = ['store', 'deliveryStaff', 'group', 'salesStaff', 'supplier']

  // 리사이즈 핸들 컴포넌트
  const ResizeHandle = ({ side }: { side: 'left' | 'right' }) => (
    <div
      onMouseDown={handleMouseDown(side)}
      style={{
        width: 8,
        cursor: 'col-resize',
        background: isResizing === side ? '#5d7a5d' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isResizing) e.currentTarget.style.background = '#e0e0e0'
      }}
      onMouseLeave={(e) => {
        if (!isResizing) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ 
        width: 4, 
        height: 40, 
        background: '#ccc',
        borderRadius: 2
      }} />
    </div>
  )

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            여벌 출고
            <span style={{ 
              fontSize: 12, 
              background: '#eef4ee', 
              color: '#5d7a5d',
              padding: '3px 8px',
              borderRadius: 4,
              marginLeft: 10,
              fontWeight: 500
            }}>
              {orders.length}건 대기
            </span>
          </h1>
          <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10 }}>↑↓</kbd> 이동 
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10, marginLeft: 4 }}>Enter</kbd> 선택+다음
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10, marginLeft: 4 }}>Space</kbd> 체크
            <kbd style={{ background: '#eee', padding: '2px 4px', borderRadius: 2, fontSize: 10, marginLeft: 4 }}>←</kbd> 필터로
          </p>
        </div>
        <span style={{ fontSize: 13, color: '#666' }}>
          {new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </span>
      </div>

      <div 
        ref={containerRef}
        style={{ 
          display: 'flex', 
          gap: 0, 
          height: 'calc(100vh - 170px)',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        
        {/* 왼쪽: 필터 패널 */}
        <div style={{ 
          width: leftPanelWidth,
          minWidth: 220,
          maxWidth: 450,
          background: '#f8f9fa',
          borderRadius: '8px 0 0 8px',
          border: '1px solid #ddd',
          borderRight: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* 필터 타입 탭 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 3,
            padding: '6px',
            background: '#5d7a5d',
          }}>
            {filterOrder.map(type => (
              <button
                key={type}
                onClick={() => handleFilterTypeChange(type)}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: 4,
                  background: activeFilter === type ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: activeFilter === type ? '#5d7a5d' : '#fff',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: activeFilter === type ? 600 : 400,
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {filterLabels[type]}
              </button>
            ))}
          </div>

          {/* 검색 입력 */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #ddd', background: '#fff' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`${filterLabels[activeFilter]} 검색...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setFocusArea('search')}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* 전체 보기 */}
          <div
            onClick={() => { setSelectedFilterId(null); setFocusedFilterIndex(-1) }}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedFilterId === null ? '#eef4ee' : '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>전체</div>
              <div style={{ fontSize: 12, color: '#666' }}>{orders.length}건</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#5d7a5d' }}>
              {orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}원
            </div>
          </div>
          
          {/* 필터 항목 목록 */}
          <div 
            ref={filterListRef}
            tabIndex={0}
            onKeyDown={handleFilterKeyDown}
            onFocus={() => setFocusArea('filter')}
            style={{ flex: 1, overflow: 'auto', outline: 'none' }}
          >
            {filterStats.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>
                {searchQuery ? '검색 결과 없음' : '대기 주문 없음'}
              </div>
            ) : (
              filterStats.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedFilterId(item.id); setFocusedFilterIndex(index) }}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedFilterId === item.id 
                      ? '#eef4ee' 
                      : (focusArea === 'filter' && focusedFilterIndex === index ? '#e3e8e3' : '#fff'),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    outline: focusArea === 'filter' && focusedFilterIndex === index ? '2px solid #5d7a5d' : 'none',
                    outlineOffset: -2
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{item.count}건</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5d7a5d', fontWeight: 500 }}>
                    {item.amount.toLocaleString()}원
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 왼쪽 리사이즈 핸들 */}
        <ResizeHandle side="left" />

        {/* 오른쪽: 주문 목록 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* 테이블 */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            border: '1px solid #ddd',
            borderRadius: '0 8px 8px 0',
            background: '#fff'
          }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 14 }}>
                로딩 중...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 14 }}>
                출고 대기 주문이 없습니다
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '10px 6px', textAlign: 'center', width: 32 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.size === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                        style={{ width: 16, height: 16 }}
                      />
                    </th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', width: 140 }}>가맹점</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left' }}>브랜드 / 상품명</th>
                    <th style={{ padding: '10px 6px', textAlign: 'center', width: 60 }}>SPH</th>
                    <th style={{ padding: '10px 6px', textAlign: 'center', width: 60 }}>CYL</th>
                    <th style={{ padding: '10px 6px', textAlign: 'center', width: 45 }}>수량</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', width: 75 }}>금액</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', width: 80 }}>배송담당</th>
                  </tr>
                </thead>
                <tbody
                  ref={tableRef}
                  tabIndex={0}
                  onKeyDown={handleTableKeyDown}
                  onFocus={() => setFocusArea('table')}
                  style={{ outline: 'none' }}
                >
                  {orders.map((order, index) => (
                    <tr 
                      key={order.itemId}
                      onClick={() => toggleSelect(order.itemId)}
                      style={{ 
                        borderBottom: '1px solid #eee',
                        background: selectedItems.has(order.itemId) 
                          ? '#f0f7f0' 
                          : (focusArea === 'table' && focusedRowIndex === index ? '#e8f0e8' : undefined),
                        cursor: 'pointer',
                        outline: focusArea === 'table' && focusedRowIndex === index ? '2px solid #5d7a5d' : 'none',
                        outlineOffset: -2
                      }}
                    >
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.has(order.itemId)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(order.itemId) }}
                          style={{ width: 16, height: 16 }}
                        />
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{order.storeName}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {order.storeCode} · {new Date(order.orderedAt).toLocaleString('ko-KR', {
                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: '#eef4ee',
                          fontSize: 12,
                          marginRight: 6,
                          color: '#5d7a5d',
                          fontWeight: 500
                        }}>
                          {order.brandName}
                        </span>
                        <span style={{ fontSize: 13 }}>{order.productName}</span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>
                        {order.sph || '-'}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>
                        {order.cyl || '-'}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 500, fontSize: 13 }}>
                        {order.totalPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#666' }}>
                        {order.deliveryStaffName || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 하단 액션바 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderTop: '1px solid #ddd',
            marginTop: 10
          }}>
            <div style={{ fontSize: 14 }}>
              선택: <strong>{selectedItems.size}</strong>건
              <span style={{ marginLeft: 10, color: '#5d7a5d', fontWeight: 600 }}>
                {selectedTotal.toLocaleString()}원
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedItems(new Set())}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                선택 해제
              </button>
              <button
                onClick={handleShipping}
                disabled={selectedItems.size === 0 || shipping}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 4,
                  background: selectedItems.size === 0 ? '#ccc' : '#5d7a5d',
                  color: '#fff',
                  cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {shipping ? '처리 중...' : `출고 처리 (${selectedItems.size}건)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
