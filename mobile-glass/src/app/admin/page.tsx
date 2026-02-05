'use client'

import { useState, useEffect, useCallback } from 'react'
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
    lowStockCount: number
    pendingDeposits: number
  }
}

// 빠른 액션 버튼
const QuickAction = ({ icon, label, href, color = '#007aff' }: { icon: string; label: string; href: string; color?: string }) => (
  <Link
    href={href}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      borderRadius: '12px',
      background: '#fff',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'transform 0.2s, box-shadow 0.2s',
      border: '1px solid #e5e7eb',
    }}
  >
    <span style={{ fontSize: '24px' }}>{icon}</span>
    <span style={{ fontSize: '12px', fontWeight: 500, color: '#666' }}>{label}</span>
  </Link>
)

// 할 일 아이템
const TodoItem = ({ icon, label, count, href, urgent = false }: { icon: string; label: string; count: number; href: string; urgent?: boolean }) => (
  <Link
    href={href}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderRadius: '10px',
      background: urgent ? '#fef2f2' : '#f9fafb',
      textDecoration: 'none',
      color: 'inherit',
      border: urgent ? '1px solid #fecaca' : '1px solid transparent',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
    </div>
    <span style={{
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 600,
      background: urgent ? '#dc2626' : '#007aff',
      color: '#fff',
    }}>
      {count}
    </span>
  </Link>
)

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/orders/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    // 30초마다 자동 새로고침
    const interval = setInterval(() => fetchDashboard(true), 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        fetchDashboard(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fetchDashboard])

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>😢</div>
          데이터를 불러올 수 없습니다.
          <button 
            onClick={() => fetchDashboard()} 
            style={{ display: 'block', margin: '16px auto', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', cursor: 'pointer' }}
          >
            다시 시도
          </button>
        </div>
      </AdminLayout>
    )
  }

  const maxTrend = Math.max(...data.dailyTrend.map(d => d.orders), 1)
  
  // 오늘 할 일 계산
  const todoItems = [
    { icon: '📦', label: '출고 대기', count: data.status.confirmed, href: '/admin/orders/shipping', urgent: data.status.confirmed > 10 },
    { icon: '✅', label: '주문 확인 필요', count: data.status.pending, href: '/admin/orders?status=pending', urgent: data.status.pending > 5 },
    { icon: '💰', label: '입금 확인', count: data.alerts.pendingDeposits || 0, href: '/admin/stores/receivables/deposit', urgent: false },
    { icon: '📉', label: '재고 부족', count: data.alerts.lowStockCount || 0, href: '/admin/purchase/reorder', urgent: (data.alerts.lowStockCount || 0) > 0 },
  ].filter(item => item.count > 0)

  return (
    <AdminLayout activeMenu="order">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>
            안녕하세요! 👋
          </h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#86868b' }}>
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
            </span>
          )}
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            새로고침
          </button>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#86868b', marginBottom: '12px' }}>빠른 액션</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          <QuickAction icon="📝" label="주문 등록" href="/admin/orders/new" />
          <QuickAction icon="📦" label="출고 확인" href="/admin/orders/shipping" />
          <QuickAction icon="🔍" label="주문 검색" href="/admin/orders" />
          <QuickAction icon="📊" label="재고 현황" href="/admin/products/inventory" />
          <QuickAction icon="💳" label="입금 처리" href="/admin/stores/receivables/deposit" />
          <QuickAction icon="📈" label="매출 통계" href="/admin/stats" />
        </div>
      </div>

      {/* 오늘 할 일 + 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        {/* 오늘 할 일 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 오늘 할 일
            {todoItems.length > 0 && (
              <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: '#007aff', color: '#fff' }}>
                {todoItems.length}
              </span>
            )}
          </h2>
          {todoItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontSize: '14px' }}>모든 일을 완료했어요!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todoItems.map((item, idx) => (
                <TodoItem key={idx} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>오늘 주문</div>
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>{data.summary.today.orders}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>{data.summary.today.amount.toLocaleString()}원</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>어제</div>
            <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>{data.summary.yesterday.orders}</div>
            <div style={{ fontSize: '14px', color: '#86868b' }}>{data.summary.yesterday.amount.toLocaleString()}원</div>
            {data.summary.today.orders > data.summary.yesterday.orders && (
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px' }}>
                ↑ {data.summary.today.orders - data.summary.yesterday.orders}건 증가
              </div>
            )}
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
      </div>

      {/* 주문 상태 + 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        {/* 주문 상태 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>주문 현황</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '대기', count: data.status.pending, color: '#f59e0b', bg: '#fef3c7', href: '/admin/orders?status=pending' },
              { label: '확인', count: data.status.confirmed, color: '#3b82f6', bg: '#dbeafe', href: '/admin/orders?status=confirmed' },
              { label: '출고', count: data.status.shipped, color: '#8b5cf6', bg: '#ede9fe', href: '/admin/orders?status=shipped' },
              { label: '완료', count: data.status.delivered, color: '#10b981', bg: '#d1fae5', href: '/admin/orders?status=delivered' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}
              >
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
              </Link>
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
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
              대기 중인 주문이 없습니다
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
            ⚠️ 신용한도 초과
          </h2>
          {data.alerts.overLimitStores.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👍</div>
              초과 가맹점이 없습니다
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.alerts.overLimitStores.map(store => (
                <Link
                  key={store.id}
                  href={`/admin/stores/${store.id}`}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{store.name}</div>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>
                    초과: {store.overBy.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868b' }}>
                    미수금 {store.outstanding.toLocaleString()}원 / 한도 {store.limit.toLocaleString()}원
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  )
}
