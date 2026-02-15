'use client'

import { useState } from 'react'

interface Order {
  id: string
  date: string
  items: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
}

const statusConfig = {
  pending: { label: '주문접수', color: '#ff9500', bg: '#fff8f0' },
  confirmed: { label: '주문확인', color: '#007aff', bg: '#f0f7ff' },
  shipped: { label: '출고완료', color: '#af52de', bg: '#faf0ff' },
  delivered: { label: '배송완료', color: '#34c759', bg: '#f0fff4' },
}

export default function StoreOrdersPage() {
  // 샘플 주문 데이터
  const [orders] = useState<Order[]>([
    { id: 'ORD-20260203-001', date: '2026-02-03 14:30', items: 3, total: 125000, status: 'shipped' },
    { id: 'ORD-20260202-005', date: '2026-02-02 11:20', items: 2, total: 83500, status: 'delivered' },
    { id: 'ORD-20260201-012', date: '2026-02-01 16:45', items: 5, total: 215000, status: 'delivered' },
    { id: 'ORD-20260131-008', date: '2026-01-31 09:15', items: 1, total: 41050, status: 'delivered' },
  ])

  const [filter, setFilter] = useState<string>('all')

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          주문내역
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          주문하신 내역을 확인하세요
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div 
            key={key}
            style={{ ...cardStyle, borderLeft: `4px solid ${config.color}`, cursor: 'pointer' }}
            onClick={() => setFilter(key)}
          >
            <div style={{ fontSize: 13, color: '#86868b' }}>{config.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: config.color, marginTop: 4 }}>
              {orders.filter(o => o.status === key).length}
              <span style={{ fontSize: 14, fontWeight: 400 }}>건</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 20,
              border: 'none',
              background: filter === 'all' ? '#007aff' : '#f5f5f7',
              color: filter === 'all' ? 'white' : '#1d1d1f',
              cursor: 'pointer',
            }}
          >전체</button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 20,
                border: 'none',
                background: filter === key ? config.color : '#f5f5f7',
                color: filter === key ? 'white' : '#1d1d1f',
                cursor: 'pointer',
              }}
            >{config.label}</button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={cardStyle}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16 }}>주문내역이 없습니다</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문번호</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문일시</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상품수</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#86868b' }}>주문금액</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상태</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#86868b' }}>상세</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const status = statusConfig[order.status]
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                    <td style={{ padding: '16px 8px', fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      {order.id}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, color: '#86868b' }}>
                      {order.date}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'center', color: '#1d1d1f' }}>
                      {order.items}개
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#1d1d1f' }}>
                      {order.total.toLocaleString()}원
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <button style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#007aff',
                        background: 'transparent',
                        border: '1px solid #007aff',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
