'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import Link from 'next/link'

interface DashboardData {
  summary: {
    today: { orders: number; amount: number }
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
  alerts: {
    overLimitStores: {
      id: number
      name: string
      code: string
      outstanding: number
      limit: number
      overBy: number
    }[]
    pendingDeposits: number
  }
}

// 빠른 액션 버튼
const QuickAction = ({ icon, label, href }: { icon: string; label: string; href: string }) => (
  <Link
    href={href}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 12px',
      borderRadius: '12px',
      background: '#fff',
      textDecoration: 'none',
      color: 'inherit',
      border: '1px solid #e5e5e5',
    }}
  >
    <span style={{ fontSize: '24px' }}>{icon}</span>
    <span style={{ fontSize: '12px', fontWeight: 500, color: '#666' }}>{label}</span>
  </Link>
)

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/dashboard')
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>데이터를 불러올 수 없습니다.</p>
          <button onClick={fetchDashboard} style={{ padding: '8px 16px', marginTop: '12px' }}>
            다시 시도
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="order">
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>
          안녕하세요! 👋
        </h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 빠른 액션 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <QuickAction icon="📝" label="주문 등록" href="/admin/orders/new" />
          <QuickAction icon="📦" label="출고 확인" href="/admin/orders/shipping" />
          <QuickAction icon="🔍" label="주문 검색" href="/admin/orders" />
          <QuickAction icon="💳" label="입금 처리" href="/admin/stores/receivables/deposit" />
        </div>
      </div>

      {/* 오늘 요약 + 주문 상태 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* 오늘 주문 */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>오늘 주문</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>{data.summary.today.orders}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{data.summary.today.amount.toLocaleString()}원</div>
        </div>

        {/* 주문 상태 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>주문 현황</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: '대기', count: data.status.pending, color: '#f59e0b' },
              { label: '확인', count: data.status.confirmed, color: '#3b82f6' },
              { label: '출고', count: data.status.shipped, color: '#8b5cf6' },
              { label: '완료', count: data.status.delivered, color: '#10b981' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '14px' }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{item.count}</span>
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
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b' }}>
              대기 중인 주문이 없습니다 ✨
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.pendingOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  style={{
                    display: 'flex',
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
                    <div style={{ fontSize: '12px', color: '#86868b' }}>{order.orderNo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.totalAmount.toLocaleString()}원</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 알림 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>⚠️ 주의</h2>
          
          {data.alerts.overLimitStores.length === 0 && data.alerts.pendingDeposits === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b' }}>
              특이사항 없음 👍
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.alerts.pendingDeposits > 0 && (
                <Link href="/admin/stores/receivables/deposit" style={{ 
                  padding: '12px', borderRadius: '8px', background: '#fef3c7', 
                  textDecoration: 'none', color: '#92400e', fontSize: '14px'
                }}>
                  💰 입금 확인 대기: {data.alerts.pendingDeposits}건
                </Link>
              )}
              {data.alerts.overLimitStores.map(store => (
                <Link
                  key={store.id}
                  href={`/admin/stores/${store.id}`}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    textDecoration: 'none',
                    color: '#991b1b',
                    fontSize: '14px'
                  }}
                >
                  🚨 {store.name}: 한도 {store.overBy.toLocaleString()}원 초과
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
