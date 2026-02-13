'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from './components/Layout'
import { ORDER_SIDEBAR } from './constants/sidebar'

interface Order {
  id: number
  orderNo: string
  status: string
  totalAmount: number
  createdAt: string
  store: { id: number; name: string; code: string }
  items: Array<{
    id: number
    quantity: number
    unitPrice: number
    totalPrice: number
    sph: string | null
    cyl: string | null
    product: {
      id: number
      name: string
      optionType: string
      brand: { name: string }
    }
  }>
}

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
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 })
  const [dashboard, setDashboard] = useState<DashboardData>({
    weeklyRevenue: [],
    topProducts: [],
    alerts: [],
    recentActivity: []
  })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'dashboard' | 'orders'>('dashboard')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/stats')
      ])
      const ordersData = await ordersRes.json()
      const statsData = await statsRes.json()
      setOrders(ordersData.orders || [])
      setStats(statsData)
      
      // 실제 API 데이터 사용
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

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  // 주간 매출 차트 최대값
  const maxRevenue = Math.max(...dashboard.weeklyRevenue.map(d => d.amount), 1)

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 탭 전환 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode('dashboard')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: viewMode === 'dashboard' ? '#5d7a5d' : '#f3f4f6',
            color: viewMode === 'dashboard' ? '#fff' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          📊 대시보드
        </button>
        <button
          onClick={() => setViewMode('orders')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: viewMode === 'orders' ? '#5d7a5d' : '#f3f4f6',
            color: viewMode === 'orders' ? '#fff' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          📦 주문관리
        </button>
      </div>

      {viewMode === 'dashboard' ? (
        <>
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
                background: stat.bg || '#fff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f3f4f6',
                cursor: 'pointer',
                transition: 'transform 0.2s'
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
                {dashboard.topProducts.map((p, i) => (
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
                  { icon: '➕', label: '새 주문', href: '/orders/new', color: '#5d7a5d' },
                  { icon: '🏪', label: '거래처 관리', href: '/stores', color: '#2563eb' },
                  { icon: '📦', label: '상품 관리', href: '/admin/products', color: '#7c3aed' },
                  { icon: '📊', label: '통계 보기', href: '/stats', color: '#ea580c' },
                  { icon: '🖨️', label: '인쇄 대기', href: '/orders/print-history', color: '#0891b2' },
                  { icon: '💳', label: '정산 관리', href: '/stores/settle', color: '#be185d' },
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
                {dashboard.recentActivity.map((activity, i) => (
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
        </>
      ) : (
        <>
          {/* 주문 관리 뷰 - 기존 코드 */}
          {/* Filters */}
          <div style={{
            ...cardStyle,
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 16
          }}>
            <select style={selectStyle}><option>가맹점 전체</option></select>
            <select style={selectStyle}><option>상태 전체</option><option>대기</option><option>발송준비</option><option>발송완료</option></select>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {['주문', '반품', '전체'].map((t, i) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, cursor: 'pointer', color: '#1f2937', fontWeight: 500 }}>
                  <input type="radio" name="type" defaultChecked={i === 2} style={{ accentColor: '#5d7a5d', width: 16, height: 16 }} /> {t}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
              <span style={{ color: '#9ca3af' }}>~</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['어제', '오늘', '이번주', '이번달'].map(label => (
                <button key={label} style={{
                  padding: '8px 14px', borderRadius: 20,
                  border: '1px solid #e5e7eb', background: '#fff',
                  fontSize: 14, color: '#374151', cursor: 'pointer', fontWeight: 500
                }}>{label}</button>
              ))}
            </div>
            <button style={{ ...btnStyle, background: '#5d7a5d', color: '#fff', border: 'none' }}>검색</button>
            <div style={{ flex: 1 }} />
            <button style={{ ...btnStyle, background: '#10b981', color: '#fff', border: 'none' }}>📥 엑셀 다운</button>
          </div>

          {/* Table */}
          <div style={{
            ...cardStyle,
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>주문 목록</span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : `총 ${orders.length}건`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnStyle}>🖨️ 선택 출력</button>
              </div>
            </div>

            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === orders.length && orders.length > 0} style={{ accentColor: '#5d7a5d' }} />
                    </th>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>주문번호</th>
                    <th style={thStyle}>가맹점</th>
                    <th style={thStyle}>브랜드</th>
                    <th style={thStyle}>상품명</th>
                    <th style={thStyle}>SPH</th>
                    <th style={thStyle}>CYL</th>
                    <th style={thStyle}>수량</th>
                    <th style={thStyle}>금액</th>
                    <th style={thStyle}>상태</th>
                    <th style={thStyle}>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                        주문 내역이 없습니다
                      </td>
                    </tr>
                  ) : (
                    orders.flatMap((order, oi) => {
                      if (order.items.length === 0) {
                        return [(
                          <tr key={order.id}>
                            <td style={tdStyle}>
                              <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} style={{ accentColor: '#5d7a5d' }} />
                            </td>
                            <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>{oi + 1}</td>
                            <td style={tdStyle}><span style={{ color: '#5d7a5d', fontWeight: 500 }}>{order.orderNo}</span></td>
                            <td style={tdStyle}>{order.store.name}</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}>-</td>
                            <td style={tdStyle}><StatusBadge status={order.status} /></td>
                            <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>
                              {new Date(order.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        )]
                      }
                      return order.items.map((item, ii) => (
                        <tr key={`${order.id}-${item.id}`}>
                          {ii === 0 && <td style={tdStyle} rowSpan={order.items.length}>
                            <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} style={{ accentColor: '#5d7a5d' }} />
                          </td>}
                          <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>{oi + 1}.{ii + 1}</td>
                          {ii === 0 && <td style={tdStyle} rowSpan={order.items.length}><span style={{ color: '#5d7a5d', fontWeight: 500 }}>{order.orderNo}</span></td>}
                          {ii === 0 && <td style={tdStyle} rowSpan={order.items.length}>{order.store.name}</td>}
                          <td style={tdStyle}>{item.product?.brand?.name || '-'}</td>
                          <td style={tdStyle}>{item.product?.name || '-'}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{item.sph || '-'}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{item.cyl || '-'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{item.totalPrice?.toLocaleString()}</td>
                          {ii === 0 && <td style={tdStyle} rowSpan={order.items.length}><StatusBadge status={order.status} /></td>}
                          {ii === 0 && <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }} rowSpan={order.items.length}>
                            {new Date(order.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>}
                        </tr>
                      ))
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={{ ...btnStyle, color: '#ef4444' }}>선택 삭제</button>
                <span style={{ fontSize: 14, color: '#374151', marginLeft: 8 }}>
                  선택: <strong>{selectedIds.size}</strong> / {orders.length}건
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnStyle}>대기처리</button>
                <button style={{ ...btnStyle, background: '#5d7a5d', color: '#fff', border: 'none' }}>발송준비</button>
                <button style={{ ...btnStyle, background: '#10b981', color: '#fff', border: 'none' }}>발송완료</button>
                <button style={{ ...btnStyle, background: '#ef4444', color: '#fff', border: 'none' }}>거래취소</button>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fef3c7', color: '#f59e0b', label: '대기' },
    confirmed: { bg: '#f0f7f0', color: '#5d7a5d', label: '확인' },
    shipped: { bg: '#dbeafe', color: '#2563eb', label: '발송준비' },
    delivered: { bg: '#d1fae5', color: '#10b981', label: '발송완료' },
    cancelled: { bg: '#fee2e2', color: '#ef4444', label: '취소' },
  }
  const { bg, color, label } = cfg[status] || cfg.pending
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: bg,
      color
    }}>{label}</span>
  )
}
