'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

type OrderType = '전체' | '여벌' | '착색' | 'RX'

interface ShippingOrder {
  id: number
  itemId: number
  orderNo: string
  storeId: number
  storeName: string
  storeCode: string
  productId: number
  productName: string
  brandId: number
  brandName: string
  supplierId: number | null
  sph: string | null
  cyl: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  orderType: string
  orderedAt: string
  status: string
}

interface Supplier {
  id: number
  name: string
}

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<OrderType>('전체')
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)
  const [orders, setOrders] = useState<ShippingOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [shipping, setShipping] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())

  // 데이터 로드
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders/ship')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrders(data.orders || [])
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // orderType 매핑
  const orderTypeMap: Record<string, string> = {
    'stock': '여벌',
    'rx': 'RX',
    '여벌': '여벌',
    '착색': '착색',
    'RX': 'RX'
  }

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    const displayType = orderTypeMap[order.orderType] || order.orderType
    const matchesTab = activeTab === '전체' || displayType === activeTab
    const matchesSupplier = selectedSupplier === null || order.supplierId === selectedSupplier
    return matchesTab && matchesSupplier
  })

  // 주문 ID별로 그룹화 (같은 주문의 여러 아이템)
  const orderGroups = new Map<number, ShippingOrder[]>()
  filteredOrders.forEach(order => {
    if (!orderGroups.has(order.id)) {
      orderGroups.set(order.id, [])
    }
    orderGroups.get(order.id)!.push(order)
  })

  // 탭별 카운트
  const tabCounts = {
    '전체': orders.length,
    '여벌': orders.filter(o => orderTypeMap[o.orderType] === '여벌').length,
    '착색': orders.filter(o => orderTypeMap[o.orderType] === '착색').length,
    'RX': orders.filter(o => orderTypeMap[o.orderType] === 'RX').length,
  }

  // 매입처별 집계
  const supplierStats = suppliers.map(s => {
    const supplierOrders = orders.filter(o => o.supplierId === s.id)
    return {
      ...s,
      pendingCount: supplierOrders.length,
      pendingAmount: supplierOrders.reduce((sum, o) => sum + o.totalPrice, 0)
    }
  }).filter(s => s.pendingCount > 0)

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedOrders.size === orderGroups.size) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orderGroups.keys()))
    }
  }

  // 개별 선택
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedOrders)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedOrders(newSet)
  }

  // 출고 처리
  const handleShipping = async () => {
    if (selectedOrders.size === 0) {
      alert('출고할 주문을 선택해주세요.')
      return
    }

    if (!confirm(`${selectedOrders.size}건의 주문을 출고 처리하시겠습니까?`)) {
      return
    }

    try {
      setShipping(true)
      const res = await fetch('/api/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '출고 처리 실패')
      }

      alert(`✅ ${data.shipped.length}건 출고 완료!\n\n${data.shipped.map((s: any) => 
        `• ${s.storeName} (${s.orderNo}) - ${s.totalAmount.toLocaleString()}원`
      ).join('\n')}`)

      setSelectedOrders(new Set())
      loadOrders() // 새로고침
    } catch (error: any) {
      alert(`❌ 출고 실패: ${error.message}`)
    } finally {
      setShipping(false)
    }
  }

  // 선택된 주문 합계
  const selectedTotal = Array.from(selectedOrders).reduce((sum, orderId) => {
    const orderItems = orderGroups.get(orderId) || []
    return sum + orderItems.reduce((s, item) => s + item.totalPrice, 0)
  }, 0)

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
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>전표발행 (출고 확인)</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            출고 처리 → 재고 차감 + 거래처 잔액 증가 + 거래내역 생성
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

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 15, height: 'calc(100vh - 180px)' }}>
        
        {/* 왼쪽: 매입처별 대기량 */}
        <div style={{ 
          background: '#f8f9fa',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 15px',
            background: '#5d7a5d',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600
          }}>
            매입처별 출고 대기
          </div>
          
          {/* 전체 보기 */}
          <div
            onClick={() => setSelectedSupplier(null)}
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedSupplier === null ? '#eef4ee' : '#fff',
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
          
          {/* 매입처 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {supplierStats.map(supplier => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier.id)}
                style={{
                  padding: '10px 15px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: selectedSupplier === supplier.id ? '#eef4ee' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: 13 }}>{supplier.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {supplier.pendingCount}건 대기
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#5d7a5d' }}>
                  {supplier.pendingAmount.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 주문 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['전체', '여벌', '착색', 'RX'] as OrderType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 4,
                  background: activeTab === tab ? '#5d7a5d' : '#e9ecef',
                  color: activeTab === tab ? '#fff' : '#333',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {tab} {tabCounts[tab]}
              </button>
            ))}
          </div>

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
            ) : filteredOrders.length === 0 ? (
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
                        checked={selectedOrders.size === orderGroups.size && orderGroups.size > 0}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr 
                      key={`${order.id}-${order.itemId}`}
                      style={{ 
                        borderBottom: '1px solid #eee',
                        background: selectedOrders.has(order.id) ? '#f0f7f0' : undefined
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
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
                        {suppliers.find(s => s.id === order.supplierId)?.name || '-'}
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
              선택: <strong>{selectedOrders.size}</strong>건
              <span style={{ marginLeft: 10, color: '#5d7a5d', fontWeight: 600 }}>
                {selectedTotal.toLocaleString()}원
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedOrders(new Set())}
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
                disabled={selectedOrders.size === 0 || shipping}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 4,
                  background: selectedOrders.size === 0 ? '#ccc' : '#5d7a5d',
                  color: '#fff',
                  cursor: selectedOrders.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {shipping ? '처리 중...' : `출고 처리 (${selectedOrders.size}건)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
