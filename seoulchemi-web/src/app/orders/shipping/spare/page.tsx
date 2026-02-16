'use client'

import { useState, useEffect, useCallback } from 'react'
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

type FilterType = 'supplier' | 'store' | 'group' | 'salesStaff' | 'deliveryStaff'

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
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set()) // itemId 기준

  // 필터 상태
  const [activeFilter, setActiveFilter] = useState<FilterType>('supplier')
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null)

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
  }

  // 필터 아이템별 집계
  const getFilterStats = () => {
    const list = getFilterList()
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
      loadOrders() // 새로고침
    } catch (error: any) {
      alert(`❌ 출고 실패: ${error.message}`)
    } finally {
      setShipping(false)
    }
  }

  // 선택된 아이템 합계
  const selectedTotal = orders
    .filter(o => selectedItems.has(o.itemId))
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const filterStats = getFilterStats()
  const filterLabels: Record<FilterType, string> = {
    supplier: '매입처별',
    store: '가맹점별',
    group: '그룹별',
    salesStaff: '영업담당별',
    deliveryStaff: '배송담당별'
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
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
              padding: '2px 8px',
              borderRadius: 4,
              marginLeft: 10,
              fontWeight: 500
            }}>
              {orders.length}건 대기
            </span>
          </h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            여벌 주문건 출고 전용 (개별 아이템 선택 가능)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666' }}>
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 15, height: 'calc(100vh - 180px)' }}>
        
        {/* 왼쪽: 필터 패널 */}
        <div style={{ 
          background: '#f8f9fa',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 필터 타입 탭 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            padding: '8px 10px',
            background: '#5d7a5d',
          }}>
            {(Object.keys(filterLabels) as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => handleFilterTypeChange(type)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 3,
                  background: activeFilter === type ? '#fff' : 'rgba(255,255,255,0.2)',
                  color: activeFilter === type ? '#5d7a5d' : '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: activeFilter === type ? 600 : 400
                }}
              >
                {filterLabels[type]}
              </button>
            ))}
          </div>
          
          {/* 전체 보기 */}
          <div
            onClick={() => setSelectedFilterId(null)}
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedFilterId === null ? '#eef4ee' : '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>전체</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {orders.length}건 대기
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#5d7a5d' }}>
              {orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}원
            </div>
          </div>
          
          {/* 필터 항목 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filterStats.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>
                해당 필터에 대기 주문이 없습니다
              </div>
            ) : (
              filterStats.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFilterId(item.id)}
                  style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedFilterId === item.id ? '#eef4ee' : '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {item.count}건 대기
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5d7a5d' }}>
                    {item.amount.toLocaleString()}원
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* 테이블 */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#fff'
          }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                로딩 중...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                출고 대기 주문이 없습니다
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 30 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.size === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>가맹점</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>상품명</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>SPH</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>CYL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>수량</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>금액</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>매입처</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>그룹</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr 
                      key={order.itemId}
                      style={{ 
                        borderBottom: '1px solid #eee',
                        background: selectedItems.has(order.itemId) ? '#f0f7f0' : undefined
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.has(order.itemId)}
                          onChange={() => toggleSelect(order.itemId)}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 500 }}>{order.storeName}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {order.storeCode} · {new Date(order.orderedAt).toLocaleString('ko-KR', {
                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: '#eef4ee',
                          fontSize: 11,
                          marginRight: 5
                        }}>
                          {order.brandName}
                        </span>
                        {order.productName}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                        {order.sph || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                        {order.cyl || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>
                        {order.totalPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: '#666' }}>
                        {order.supplierName || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: '#666' }}>
                        {order.groupName || '-'}
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
            padding: '12px 0',
            borderTop: '1px solid #ddd',
            marginTop: 10
          }}>
            <div style={{ fontSize: 13 }}>
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
                  fontSize: 12
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
                  fontSize: 12,
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
