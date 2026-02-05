'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Order {
  id: number
  orderNo: string
  storeName: string
  storeCode: string
  status: string
  totalAmount: number
  itemCount: number
  orderedAt: string
  items: {
    id: number
    productName: string
    brandName: string
    quantity: number
    sph?: string
    cyl?: string
  }[]
}

const WORKFLOW_STEPS = [
  { key: 'confirmed', label: '확인됨', icon: '📋', nextAction: 'picking', nextLabel: '피킹 시작' },
  { key: 'picking', label: '피킹중', icon: '🔍', nextAction: 'packed', nextLabel: '포장 완료' },
  { key: 'packed', label: '포장완료', icon: '📦', nextAction: 'shipped', nextLabel: '출고 처리' },
  { key: 'shipped', label: '출고완료', icon: '🚚', nextAction: null, nextLabel: null },
]

export default function ShippingWorkflowPage() {
  const [orders, setOrders] = useState<{ [key: string]: Order[] }>({
    confirmed: [],
    picking: [],
    packed: [],
    shipped: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [courier, setCourier] = useState('')
  const [trackingNo, setTrackingNo] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // 각 상태별 주문 조회
      const statuses = ['confirmed', 'picking', 'packed', 'shipped']
      const results: { [key: string]: Order[] } = {}

      for (const status of statuses) {
        // shipped는 오늘 것만
        const params = new URLSearchParams({ status, limit: '50' })
        if (status === 'shipped') {
          const today = new Date().toISOString().slice(0, 10)
          params.set('startDate', today)
        }

        const res = await fetch(`/api/orders?${params}`)
        if (res.ok) {
          const data = await res.json()
          results[status] = data.orders || []
        }
      }

      setOrders(results)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const moveToNextStep = async (order: Order, nextStatus: string) => {
    // 출고 처리 시 택배사/운송장 필요
    if (nextStatus === 'shipped') {
      if (!courier || !trackingNo) {
        alert('택배사와 운송장 번호를 입력해주세요.')
        return
      }
    }

    try {
      const body: any = {
        status: nextStatus,
        processedBy: '관리자'
      }

      if (nextStatus === 'shipped') {
        body.courier = courier
        body.trackingNo = trackingNo
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setSelectedOrder(null)
        setCourier('')
        setTrackingNo('')
        fetchOrders()
      } else {
        const data = await res.json()
        alert(data.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  const getStepConfig = (status: string) => {
    return WORKFLOW_STEPS.find(s => s.key === status) || WORKFLOW_STEPS[0]
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          출고 워크플로우
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          주문을 단계별로 처리합니다: 확인 → 피킹 → 포장 → 출고
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {WORKFLOW_STEPS.map(step => {
            const stepOrders = orders[step.key] || []
            
            return (
              <div key={step.key} style={{
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {/* 헤더 */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>{step.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</span>
                  <span style={{
                    marginLeft: 'auto',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'var(--primary-light)',
                    color: 'var(--primary)'
                  }}>
                    {stepOrders.length}
                  </span>
                </div>

                {/* 주문 목록 */}
                <div style={{ padding: '8px', maxHeight: '60vh', overflow: 'auto' }}>
                  {stepOrders.length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '13px'
                    }}>
                      주문이 없습니다
                    </div>
                  ) : (
                    stepOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: 'var(--bg-primary)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {order.storeName}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {order.itemCount}개
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          {order.orderNo}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--primary)' }}>
                          {order.totalAmount.toLocaleString()}원
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  {selectedOrder.storeName}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedOrder.orderNo}
                </p>
              </div>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'var(--primary-light)',
                color: 'var(--primary)'
              }}>
                {getStepConfig(selectedOrder.status).label}
              </span>
            </div>

            {/* 품목 목록 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                품목 ({selectedOrder.items?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.brandName}</div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</div>
                        {(item.sph || item.cyl) && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {item.sph && `SPH: ${item.sph}`} {item.cyl && `CYL: ${item.cyl}`}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        x{item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 출고 처리 시 택배 정보 */}
            {getStepConfig(selectedOrder.status).nextAction === 'shipped' && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                  배송 정보
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      택배사
                    </label>
                    <select
                      value={courier}
                      onChange={e => setCourier(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '14px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">선택</option>
                      <option value="CJ대한통운">CJ대한통운</option>
                      <option value="한진택배">한진택배</option>
                      <option value="롯데택배">롯데택배</option>
                      <option value="우체국택배">우체국택배</option>
                      <option value="로젠택배">로젠택배</option>
                      <option value="직접배송">직접배송</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      운송장 번호
                    </label>
                    <input
                      type="text"
                      value={trackingNo}
                      onChange={e => setTrackingNo(e.target.value)}
                      placeholder="운송장 번호"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '14px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setCourier('')
                  setTrackingNo('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                닫기
              </button>
              {getStepConfig(selectedOrder.status).nextAction && (
                <button
                  onClick={() => moveToNextStep(selectedOrder, getStepConfig(selectedOrder.status).nextAction!)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {getStepConfig(selectedOrder.status).nextLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
