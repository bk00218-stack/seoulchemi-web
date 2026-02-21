'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface OrderItem {
  id: number
  productName: string
  brandName: string
  optionType: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sph: string | null
  cyl: string | null
  axis: string | null
}

interface Order {
  id: number
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  memo: string | null
  createdAt: string
  orderedAt: string
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '주문접수', color: '#ff9500', bg: '#fff8f0' },
  confirmed: { label: '주문확인', color: '#007aff', bg: '#f0f7ff' },
  shipped: { label: '출고완료', color: '#af52de', bg: '#faf0ff' },
  delivered: { label: '배송완료', color: '#34c759', bg: '#f0fff4' },
  cancelled: { label: '취소', color: '#ff3b30', bg: '#fff2f2' },
}

const PAGE_SIZE = 20

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/store/orders')
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const visibleOrders = filteredOrders.slice(0, visibleCount)
  const hasMore = filteredOrders.length > visibleCount

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          주문내역
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          주문하신 내역을 확인하세요
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? 8 : 16,
        marginBottom: isMobile ? 16 : 24,
      }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div
            key={key}
            style={{
              ...cardStyle,
              borderLeft: `4px solid ${config.color}`,
              cursor: 'pointer',
              padding: isMobile ? 10 : 16,
            }}
            onClick={() => setFilter(key === filter ? 'all' : key)}
          >
            <div style={{ fontSize: isMobile ? 11 : 13, color: '#86868b' }}>{config.label}</div>
            <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: config.color, marginTop: 4 }}>
              {orders.filter(o => o.status === key).length}
              <span style={{ fontSize: 14, fontWeight: 400 }}>건</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: isMobile ? 12 : 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 20, border: 'none',
              background: filter === 'all' ? '#007aff' : '#f5f5f7',
              color: filter === 'all' ? 'white' : '#1d1d1f',
              cursor: 'pointer',
            }}
          >전체 ({orders.length})</button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = orders.filter(o => o.status === key).length
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 20, border: 'none',
                  background: filter === key ? config.color : '#f5f5f7',
                  color: filter === key ? 'white' : '#1d1d1f',
                  cursor: 'pointer',
                }}
              >{config.label} ({count})</button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>
            <div style={{ fontSize: 16 }}>로딩 중...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16 }}>주문내역이 없습니다</div>
          </div>
        ) : isMobile ? (
          /* Mobile: Card layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleOrders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending
              const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
              const firstItem = order.items[0]
              return (
                <div key={order.id} style={{
                  padding: 16, borderRadius: 12,
                  border: '1px solid #e9ecef', cursor: 'pointer',
                }} onClick={() => setSelectedOrder(order)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{order.orderNo}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600, background: status.bg, color: status.color,
                    }}>{status.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#1d1d1f', marginBottom: 4 }}>
                    {firstItem ? `${firstItem.brandName} ${firstItem.productName}` : '-'}
                    {order.items.length > 1 && <span style={{ color: '#86868b' }}> 외 {order.items.length - 1}건</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#86868b' }}>
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')} · {totalQty}개
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>
                      {order.totalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Desktop: Table layout */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문번호</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문일시</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상품</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>수량</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문금액</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상태</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상세</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map(order => {
                const status = statusConfig[order.status] || statusConfig.pending
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
                const firstItem = order.items[0]
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                    <td style={{ padding: '16px 8px', fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      {order.orderNo}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, color: '#86868b' }}>
                      {new Date(order.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, color: '#1d1d1f' }}>
                      {firstItem ? (
                        <>
                          {firstItem.brandName} {firstItem.productName}
                          {order.items.length > 1 && (
                            <span style={{ color: '#86868b', fontSize: 12 }}> 외 {order.items.length - 1}건</span>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'center', color: '#1d1d1f' }}>
                      {totalQty}개
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#1d1d1f' }}>
                      {order.totalAmount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600, background: status.bg, color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 500,
                          color: '#007aff', background: 'transparent',
                          border: '1px solid #007aff', borderRadius: 6, cursor: 'pointer',
                        }}
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              style={{
                padding: '10px 24px', fontSize: 14, fontWeight: 500,
                color: '#007aff', background: '#f0f7ff',
                border: '1px solid #007aff', borderRadius: 10, cursor: 'pointer',
              }}
            >
              더보기 ({filteredOrders.length - visibleCount}건 남음)
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: isMobile ? '20px 20px 0 0' : 20,
              padding: isMobile ? 24 : 32,
              width: isMobile ? '100%' : '90%',
              maxWidth: 600,
              maxHeight: isMobile ? '85vh' : '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
                주문 상세
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#86868b' }}
              >✕</button>
            </div>

            {/* Order Info */}
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12, marginBottom: 24,
              padding: 16, background: '#f9fafb', borderRadius: 12,
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>주문번호</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>{selectedOrder.orderNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>상태</div>
                <div style={{ marginTop: 2 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: (statusConfig[selectedOrder.status] || statusConfig.pending).bg,
                    color: (statusConfig[selectedOrder.status] || statusConfig.pending).color,
                  }}>
                    {(statusConfig[selectedOrder.status] || statusConfig.pending).label}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>주문일시</div>
                <div style={{ fontSize: 14, color: '#1d1d1f', marginTop: 2 }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>주문유형</div>
                <div style={{ fontSize: 14, color: '#1d1d1f', marginTop: 2 }}>
                  {selectedOrder.orderType === 'rx' ? 'RX (맞춤)' : '여벌'}
                </div>
              </div>
            </div>

            {/* Items */}
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: '0 0 12px' }}>
              주문 상품 ({selectedOrder.items.length}개)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {selectedOrder.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: '#f9fafb', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600 }}>{item.brandName}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', marginTop: 2 }}>
                      {item.productName}
                      {item.sph && (
                        <span style={{ fontSize: 12, color: '#86868b', marginLeft: 8 }}>
                          ({item.sph}/{item.cyl})
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#86868b' }}>{item.quantity}개</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      {item.totalPrice.toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '16px 0', borderTop: '2px solid #e5e5e5',
            }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>합계</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#007aff' }}>
                {selectedOrder.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
