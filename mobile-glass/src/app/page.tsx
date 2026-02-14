'use client'

import { useEffect, useState } from 'react'
import Layout, { cardStyle } from './components/Layout'
import { ORDER_SIDEBAR } from './constants/sidebar'

interface Stats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
}

interface DashboardData {
  weeklyRevenue: { day: string; amount: number }[]
  topProducts: { name: string; brand: string; count: number }[]
  alerts: { type: 'warning' | 'danger' | 'info'; message: string }[]
  recentActivity: { time: string; action: string; detail: string }[]
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 })
  const [dashboard, setDashboard] = useState<DashboardData>({
    weeklyRevenue: [],
    topProducts: [],
    alerts: [],
    recentActivity: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const statsRes = await fetch('/api/admin/stats')
      const statsData = await statsRes.json()
      setStats(statsData)
      
      setDashboard({
        weeklyRevenue: statsData.weeklyRevenue || [],
        topProducts: statsData.topProducts || [],
        alerts: statsData.alerts || [],
        recentActivity: statsData.recentActivity || []
      })
    } catch (e) {
      console.error(e)
    }
  }

  const maxRevenue = Math.max(...dashboard.weeklyRevenue.map(d => d.amount), 1)

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 알림 패널 */}
      {dashboard.alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {dashboard.alerts.map((alert, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: alert.type === 'danger' ? '#fee2e2' : alert.type === 'warning' ? '#fef3c7' : '#dbeafe',
              color: alert.type === 'danger' ? '#dc2626' : alert.type === 'warning' ? '#d97706' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 500
            }}>
              {alert.type === 'warning' ? '⚠️' : alert.type === 'danger' ? '🚨' : 'ℹ️'} {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: '오늘 주문', value: stats.totalOrders, unit: '건', color: '#374151', icon: '📦' },
          { label: '대기중', value: stats.pendingOrders, unit: '건', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
          { label: '출고완료', value: stats.completedOrders, unit: '건', color: '#10b981', bg: '#d1fae5', icon: '✅' },
          { label: '총 매출', value: stats.totalRevenue.toLocaleString(), unit: '원', color: '#5d7a5d', bg: '#f0f7f0', icon: '💰' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: stat.bg || 'var(--bg-primary)',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                  {stat.value}<span style={{ fontSize: 15, fontWeight: 500, marginLeft: 4 }}>{stat.unit}</span>
                </div>
              </div>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 & 인기상품 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* 주간 매출 차트 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📈 주간 매출</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {dashboard.weeklyRevenue.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                  {(d.amount / 10000).toFixed(0)}만
                </div>
                <div style={{
                  width: '100%',
                  height: `${(d.amount / maxRevenue) * 120}px`,
                  background: i === dashboard.weeklyRevenue.length - 3 ? '#5d7a5d' : '#e5e7eb',
                  borderRadius: 6,
                  minHeight: 4,
                  transition: 'height 0.3s'
                }} />
                <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{d.day}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            주간 총 매출: <strong style={{ color: '#5d7a5d' }}>{(dashboard.weeklyRevenue.reduce((a, b) => a + b.amount, 0) / 10000).toFixed(0)}만원</strong>
          </div>
        </div>

        {/* 인기 상품 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>🏆 인기 상품 TOP 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dashboard.topProducts.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>데이터 없음</div>
            ) : dashboard.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : '#e5e7eb',
                  color: i < 3 ? '#fff' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{p.brand}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5d7a5d' }}>{p.count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 빠른 액션 & 최근 활동 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 빠른 액션 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>⚡ 빠른 실행</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { icon: '📋', label: '온라인 여벌 주문', href: '/orders/online-spare', color: '#5d7a5d' },
              { icon: '🔬', label: '온라인 RX 주문', href: '/orders/rx', color: '#2563eb' },
              { icon: '➕', label: '새 주문 등록', href: '/orders/new', color: '#7c3aed' },
              { icon: '📦', label: '상품 관리', href: '/products', color: '#ea580c' },
              { icon: '🏪', label: '가맹점 관리', href: '/stores', color: '#0891b2' },
              { icon: '📊', label: '통계 보기', href: '/stats', color: '#be185d' },
            ].map((action, i) => (
              <a key={i} href={action.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 10,
                background: '#f9fafb', border: '1px solid #e5e7eb',
                textDecoration: 'none', color: '#1f2937',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: 20 }}>{action.icon}</span>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>🕐 최근 활동</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dashboard.recentActivity.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>최근 활동 없음</div>
            ) : dashboard.recentActivity.map((activity, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: i < dashboard.recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: activity.action === '주문' ? '#dbeafe' : activity.action === '출고' ? '#d1fae5' : '#fef3c7',
                  color: activity.action === '주문' ? '#2563eb' : activity.action === '출고' ? '#059669' : '#d97706'
                }}>{activity.action}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#374151' }}>{activity.detail}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
