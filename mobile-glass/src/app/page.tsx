'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from './components/Layout'

const SIDEBAR = [
  {
    title: '주문',
    items: [
      { label: '온라인 여벌 주문', href: '/' },
      { label: '온라인 RX 주문', href: '/orders/rx' },
      { label: '주문 등록', href: '/orders/new' },
      { label: '명세표 출력이력', href: '/orders/print-history' },
    ]
  },
  {
    title: '출고',
    items: [
      { label: '전체 주문', href: '/orders/all' },
      { label: '여벌 출고', href: '/orders/shipping' },
      { label: 'RX 출고', href: '/orders/delivery' },
    ]
  }
]

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

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

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

  // Flatten for table display
  type Row = { order: Order; item?: Order['items'][0]; idx: number; isFirst: boolean; span: number }
  const rows: Row[] = []
  let idx = 0
  orders.forEach(order => {
    if (order.items.length === 0) {
      rows.push({ order, idx: ++idx, isFirst: true, span: 1 })
    } else {
      order.items.forEach((item, i) => {
        rows.push({ order, item, idx: ++idx, isFirst: i === 0, span: order.items.length })
      })
    }
  })

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: '오늘 주문', value: stats.totalOrders, unit: '건', color: '#374151' },
          { label: '대기중', value: stats.pendingOrders, unit: '건', color: '#f59e0b', bg: '#fef3c7' },
          { label: '출고완료', value: stats.completedOrders, unit: '건', color: '#10b981', bg: '#d1fae5' },
          { label: '총 매출', value: stats.totalRevenue.toLocaleString(), unit: '원', color: '#5d7a5d', bg: '#f0f7f0' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: stat.bg || '#fff',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
              {stat.value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        ...cardStyle,
        padding: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <select style={selectStyle}><option>가맹점 전체</option></select>
        <select style={selectStyle}><option>상태 전체</option><option>대기</option><option>발송준비</option><option>발송완료</option></select>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['주문', '반품', '전체'].map((t, i) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
              <input type="radio" name="type" defaultChecked={i === 2} style={{ accentColor: '#5d7a5d' }} /> {t}
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
              padding: '6px 12px', borderRadius: 20,
              border: '1px solid #e5e7eb', background: '#fff',
              fontSize: 12, color: '#4b5563', cursor: 'pointer'
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
        {/* Table Header Actions */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>주문 목록</span>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : `총 ${orders.length}건`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnStyle}>🖨️ 선택 출력</button>
          </div>
        </div>

        {/* Table */}
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                    주문 내역이 없습니다
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.order.id}-${row.item?.id || 0}-${row.idx}`}>
                    {row.isFirst && (
                      <td style={tdStyle} rowSpan={row.span}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.order.id)}
                          onChange={() => toggleSelect(row.order.id)}
                          style={{ accentColor: '#5d7a5d' }}
                        />
                      </td>
                    )}
                    <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>{row.idx}</td>
                    {row.isFirst && (
                      <td style={tdStyle} rowSpan={row.span}>
                        <span style={{ color: '#5d7a5d', fontWeight: 500 }}>{row.order.orderNo}</span>
                      </td>
                    )}
                    {row.isFirst && (
                      <td style={tdStyle} rowSpan={row.span}>{row.order.store.name}</td>
                    )}
                    <td style={tdStyle}>{row.item?.product?.brand?.name || '-'}</td>
                    <td style={tdStyle}>{row.item?.product?.name || '-'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.item?.sph || '-'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.item?.cyl || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{row.item?.quantity || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>
                      {row.item?.totalPrice?.toLocaleString() || '-'}
                    </td>
                    {row.isFirst && (
                      <td style={tdStyle} rowSpan={row.span}>
                        <StatusBadge status={row.order.status} />
                      </td>
                    )}
                    {row.isFirst && (
                      <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }} rowSpan={row.span}>
                        {new Date(row.order.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions */}
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
            <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
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
