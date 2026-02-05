'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import Link from 'next/link'

interface DashboardData {
  summary: {
    today: { orders: number; amount: number }
    yesterday: { orders: number; amount: number }
    thisWeek: { orders: number; amount: number }
    thisMonth: { orders: number; amount: number }
  }
  status: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
  }
  pendingOrders: {
    id: number
    orderNo: string
    storeName: string
    storeCode: string
    itemCount: number
    totalAmount: number
    orderedAt: string
  }[]
  todayShipping: {
    id: number
    orderNo: string
    storeName: string
    totalAmount: number
  }[]
  dailyTrend: {
    date: string
    orders: number
    amount: number
  }[]
  alerts: {
    overLimitStores: {
      id: number
      name: string
      code: string
      outstanding: number
      limit: number
      overBy: number
    }[]
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/orders/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>데이터를 불러올 수 없습니다.</div>
      </AdminLayout>
    )
  }

  const maxTrend = Math.max(...data.dailyTrend.map(d => d.orders), 1)

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>대시보드</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>오늘 주문</div>
          <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>{data.summary.today.orders}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{data.summary.today.amount.toLocaleString()}원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>어제</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>{data.summary.yesterday.orders}</div>
          <div style={{ fontSize: '14px', color: '#86868b' }}>{data.summary.yesterday.amount.toLocaleString()}원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>이번 주</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>{data.summary.thisWeek.orders}</div>
          <div style={{ fontSize: '14px', color: '#86868b' }}>{data.summary.thisWeek.amount.toLocaleString()}원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>이번 달</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>{data.summary.thisMonth.orders}</div>
          <div style={{ fontSize: '14px', color: '#86868b' }}>{data.summary.thisMonth.amount.toLocaleString()}원</div>
        </div>
      </div>

      {/* 주문 상태 + 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        {/* 주문 상태 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>주문 현황</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '대기', count: data.status.pending, color: '#f59e0b', bg: '#fef3c7' },
              { label: '확인', count: data.status.confirmed, color: '#3b82f6', bg: '#dbeafe' },
              { label: '출고', count: data.status.shipped, color: '#8b5cf6', bg: '#ede9fe' },
              { label: '완료', count: data.status.delivered, color: '#10b981', bg: '#d1fae5' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '14px' }}>{item.label}</span>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: item.bg,
                  color: item.color
                }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7일 추이 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>7일 주문 추이</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {data.dailyTrend.map((day, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>{day.orders}</div>
                <div style={{
                  width: '100%',
                  height: `${(day.orders / maxTrend) * 80}px`,
                  background: idx === data.dailyTrend.length - 1 ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  borderRadius: '4px',
                  minHeight: '4px'
                }} />
                <div style={{ fontSize: '11px', color: '#86868b' }}>
                  {new Date(day.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 대기 주문 + 경고 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* 대기 주문 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>대기 중인 주문</h2>
            <Link href="/admin/orders?status=pending" style={{ fontSize: '14px', color: '#007aff', textDecoration: 'none' }}>
              전체보기 →
            </Link>
          </div>
          {data.pendingOrders.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>
              대기 중인 주문이 없습니다 ✨
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.pendingOrders.slice(0, 5).map(order => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{order.storeName}</div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>
                      {order.orderNo} · {order.itemCount}개 품목
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.totalAmount.toLocaleString()}원</div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>
                      {new Date(order.orderedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 신용한도 초과 경고 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span> 신용한도 초과
          </h2>
          {data.alerts.overLimitStores.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>
              초과 가맹점이 없습니다 👍
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.alerts.overLimitStores.map(store => (
                <div
                  key={store.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{store.name}</div>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>
                    초과: {store.overBy.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868b' }}>
                    미수금 {store.outstanding.toLocaleString()}원 / 한도 {store.limit.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
