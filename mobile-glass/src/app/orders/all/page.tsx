'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

interface Store {
  id: number
  name: string
  code: string
  phone?: string
  address?: string
}

interface OrderItem {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  totalPrice: number
  sph?: string
  cyl?: string
  product: {
    name: string
    brand: { name: string }
  }
}

interface Order {
  id: number
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  memo?: string
  orderedAt: string
  store: Store
  items: OrderItem[]
}

const ORDER_TYPES = ['?�체', '?�벌', '착색', 'RX', '기�?']

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '?��?, color: '#f59e0b' },
  confirmed: { label: '?�인', color: '#3b82f6' },
  shipped: { label: '출고', color: '#10b981' },
  delivered: { label: '배송?�료', color: '#6b7280' },
  cancelled: { label: '취소', color: '#ef4444' },
}

export default function AllOrdersPage() {
  const [selectedType, setSelectedType] = useState('?�체')
  const [storeSearch, setStoreSearch] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)

  // 거래�?목록 로드
  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        if (data.stores) setStores(data.stores)
      })
      .catch(console.error)
  }, [])

  // 거래�?검???�터
  useEffect(() => {
    if (storeSearch.trim()) {
      const filtered = stores.filter(s => 
        s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(storeSearch.toLowerCase())
      )
      setFilteredStores(filtered)
      setShowStoreDropdown(true)
    } else {
      setFilteredStores([])
      setShowStoreDropdown(false)
    }
  }, [storeSearch, stores])

  // 주문 목록 로드
  useEffect(() => {
    if (!selectedStore) {
      setOrders([])
      return
    }
    
    setLoading(true)
    const params = new URLSearchParams({
      storeId: selectedStore.id.toString()
    })
    if (selectedType !== '?�체') {
      params.append('orderType', selectedType)
    }
    
    fetch(`/api/orders?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders)
        else setOrders([])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedStore, selectedType])

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
    setStoreSearch(store.name)
    setShowStoreDropdown(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '??
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>?�체 주문?�역</h1>
      </div>
      
      {/* 주문구분 ??*/}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {ORDER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              background: selectedType === type ? '#3b82f6' : '#f1f5f9',
              color: selectedType === type ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 거래�?검??*/}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
            거래�?검??
          </label>
          <input
            type="text"
            value={storeSearch}
            onChange={e => {
              setStoreSearch(e.target.value)
              if (!e.target.value) setSelectedStore(null)
            }}
            placeholder="거래처명 ?�는 코드�?검??.."
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '12px 16px',
              fontSize: 15,
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              outline: 'none',
            }}
            onFocus={() => storeSearch && setShowStoreDropdown(true)}
          />
          
          {/* ?�롭?�운 */}
          {showStoreDropdown && filteredStores.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              maxWidth: 400,
              maxHeight: 300,
              overflowY: 'auto',
              background: 'var(--bg-primary)',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              marginTop: 4
            }}>
              {filteredStores.map(store => (
                <div
                  key={store.id}
                  onClick={() => handleStoreSelect(store)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>{store.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{store.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedStore && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#f0f9ff', 
            borderRadius: 8,
            border: '1px solid #bae6fd'
          }}>
            <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
              {selectedStore.name}
            </div>
            <div style={{ fontSize: 13, color: '#0284c7' }}>
              코드: {selectedStore.code}
              {selectedStore.phone && ` | ??${selectedStore.phone}`}
            </div>
          </div>
        )}
      </div>

      {/* 주문 목록 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {!selectedStore ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>?��</div>
            <p>거래처�? 검?�하??주문?�역???�인?�세??/p>
          </div>
        ) : loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>??/div>
            <p>로딩 �?..</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>?��</div>
            <p>주문 ?�역???�습?�다</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>주문번호</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>주문?�시</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>구분</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>?�품??/th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>금액</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>?�태</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: '#6b7280' }
                return (
                  <tr 
                    key={order.id} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 600, color: '#3b82f6' }}>{order.orderNo}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 14 }}>
                      {formatDate(order.orderedAt)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        background: order.orderType === '?�벌' ? '#dbeafe' : 
                                   order.orderType === '착색' ? '#fef3c7' :
                                   order.orderType === 'RX' ? '#dcfce7' : '#f3e8ff',
                        color: order.orderType === '?�벌' ? '#1d4ed8' : 
                               order.orderType === '착색' ? '#b45309' :
                               order.orderType === 'RX' ? '#15803d' : '#7c3aed'
                      }}>
                        {order.orderType}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#374151' }}>
                      {order.items?.length || 0}�?
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        background: `${statusInfo.color}20`,
                        color: statusInfo.color
                      }}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ?�약 */}
      {orders.length > 0 && (
        <div style={{ 
          marginTop: 20, 
          padding: 20, 
          background: '#f8fafc', 
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 32
        }}>
          <div>
            <span style={{ color: '#64748b', marginRight: 8 }}>�?주문:</span>
            <span style={{ fontWeight: 700, color: '#1f2937' }}>{orders.length}�?/span>
          </div>
          <div>
            <span style={{ color: '#64748b', marginRight: 8 }}>�?금액:</span>
            <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 18 }}>
              {formatPrice(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </span>
          </div>
        </div>
      )}
    </Layout>
  )
}
