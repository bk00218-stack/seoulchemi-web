'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import Link from 'next/link'
import useSWR from 'swr'

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

const fetcher = (url: string) => fetch(url).then(res => res.json())

// 스켈레톤 컴포넌트
const Skeleton = ({ width = '100%', height = '20px', radius = '4px' }: { width?: string; height?: string; radius?: string }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }}
  />
)

// 스켈레톤 대시보드
const DashboardSkeleton = () => (
  <AdminLayout activeMenu="order">
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    
    {/* 헤더 */}
    <div style={{ marginBottom: '24px' }}>
      <Skeleton width="200px" height="32px" radius="8px" />
      <div style={{ marginTop: '8px' }}>
        <Skeleton width="150px" height="16px" />
      </div>
    </div>

    {/* 빠른 액션 */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: '16px 12px', borderRadius: '12px', background: '#fff', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Skeleton width="32px" height="32px" radius="8px" />
            <Skeleton width="50px" height="14px" />
          </div>
        ))}
      </div>
    </div>

    {/* 오늘 요약 + 주문 상태 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', opacity: 0.7 }}>
        <Skeleton width="80px" height="16px" />
        <div style={{ marginTop: '12px' }}>
          <Skeleton width="60px" height="40px" radius="8px" />
        </div>
        <div style={{ marginTop: '8px' }}>
          <Skeleton width="100px" height="16px" />
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <Skeleton width="100px" height="20px" radius="6px" />
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton width="8px" height="8px" radius="50%" />
              <Skeleton width="40px" height="14px" />
              <div style={{ marginLeft: 'auto' }}>
                <Skeleton width="24px" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 대기 주문 + 경고 */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Skeleton width="120px" height="20px" />
          <Skeleton width="80px" height="16px" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: '12px', borderRadius: '8px', background: '#f9fafb', marginBottom: '8px' }}>
            <Skeleton width="120px" height="16px" />
            <div style={{ marginTop: '4px' }}>
              <Skeleton width="80px" height="12px" />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <Skeleton width="80px" height="20px" />
        <div style={{ marginTop: '16px' }}>
          <Skeleton width="100%" height="40px" radius="8px" />
        </div>
      </div>
    </div>
  </AdminLayout>
)

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
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <span style={{ fontSize: '24px' }}>{icon}</span>
    <span style={{ fontSize: '12px', fontWeight: 500, color: '#666' }}>{label}</span>
  </Link>
)

export default function DashboardPage() {
  // SWR로 데이터 캐싱 + 자동 재검증
  const { data, error, isLoading } = useSWR<DashboardData>(
    '/api/orders/dashboard',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30초간 중복 요청 방지
      keepPreviousData: true, // 새 데이터 로딩 중 이전 데이터 유지
    }
  )

  // 스켈레톤 표시 (첫 로딩시만)
  if (isLoading && !data) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>데이터를 불러올 수 없습니다.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '8px 16px', 
              marginTop: '12px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
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
                    color: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
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
