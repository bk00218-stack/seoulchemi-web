'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../components/Navigation'

interface OrderItem {
  id: number
  sph: string | null
  cyl: string | null
  axis: string | null
  quantity: number
  totalPrice: number
  product: {
    name: string
    optionType: string
    brand: { name: string }
  }
}

interface Order {
  id: number
  orderNo: string
  status: string
  totalAmount: number
  orderedAt: string
  store: { name: string }
  items: OrderItem[]
}

interface Stats {
  total: number
  pending: number
  shipped: number
  todayOrders: number
  totalAmount: number
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, shipped: 0, todayOrders: 0, totalAmount: 0 })
  const [filter, setFilter] = useState<string>('all')
  const [orderType, setOrderType] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const allItemIds = (orders || []).flatMap(o => o.items.map(i => i.id))

  useEffect(() => {
    loadData()
  }, [filter, orderType])

  const loadData = async () => {
    setLoading(true)
    const [ordersRes, statsRes] = await Promise.all([
      fetch(`/api/admin/orders?status=${filter}&type=${orderType}`),
      fetch('/api/admin/stats')
    ])
    const ordersData = await ordersRes.json()
    setOrders(ordersData.orders || [])
    setStats(await statsRes.json())
    setLoading(false)
    setSelectedItems(new Set())
  }

  const toggleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === allItemIds.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(allItemIds))
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (selectedItems.size === 0) {
      alert('상품을 선택해주세요.')
      return
    }
    
    const orderIds = new Set<number>()
    orders.forEach(order => {
      order.items.forEach(item => {
        if (selectedItems.has(item.id)) {
          orderIds.add(order.id)
        }
      })
    })
    
    await fetch('/api/admin/orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: Array.from(orderIds), status: newStatus })
    })
    
    loadData()
  }

  const handlePrint = () => {
    if (selectedItems.size === 0) {
      alert('출력할 상품을 선택해주세요.')
      return
    }
    window.print()
  }

  const handleDownload = () => {
    if (selectedItems.size === 0) {
      alert('다운로드할 상품을 선택해주세요.')
      return
    }
    const selectedOrders = orders.filter(o => o.items.some(i => selectedItems.has(i.id)))
    let csv = '주문번호,가맹점,브랜드,상품명,수량,도수,금액,상태,일시\n'
    selectedOrders.forEach(order => {
      order.items.filter(i => selectedItems.has(i.id)).forEach(item => {
        csv += `${order.orderNo},${order.store.name},${item.product.brand.name},${item.product.name},${item.quantity},${item.sph || '-'},${item.totalPrice},${order.status},${order.orderedAt}\n`
      })
    })
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `주문내역_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const allSelected = allItemIds.length > 0 && selectedItems.size === allItemIds.length

  return (
    <AdminLayout activeMenu="order">
      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="오늘 주문" value={stats.todayOrders || 0} unit="건" />
        <StatCard label="대기중" value={stats.pending || 0} unit="건" highlight />
        <StatCard label="출고완료" value={stats.shipped || 0} unit="건" />
        <StatCard label="총 매출" value={(stats.totalAmount || 0).toLocaleString()} unit="원" />
      </div>

      {/* 필터 + 출력 버튼 */}
      <div style={{ 
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>전체</FilterButton>
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>대기</FilterButton>
          <FilterButton active={filter === 'shipped'} onClick={() => setFilter('shipped')}>출고</FilterButton>
          <FilterButton active={filter === 'delivered'} onClick={() => setFilter('delivered')}>완료</FilterButton>
          
          <div style={{ width: '1px', height: '20px', background: '#e5e5e5', margin: '0 8px' }} />
          
          {selectedItems.size > 0 && (
            <span style={{ color: '#007aff', fontSize: '14px', fontWeight: 500 }}>
              {selectedItems.size}개 선택
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <OutlineButton onClick={handlePrint}>🖨️ 선택출력</OutlineButton>
          <OutlineButton onClick={handleDownload}>📥 양식다운</OutlineButton>
        </div>
      </div>

      {/* 주문 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
              <Th>주문번호</Th>
              <Th>가맹점</Th>
              <Th>브랜드</Th>
              <Th>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  상품명
                </div>
              </Th>
              <Th align="center">수량</Th>
              <Th>도수</Th>
              <Th align="right">금액</Th>
              <Th>상태</Th>
              <Th>일시</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
                  로딩중...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
                  주문이 없습니다
                </td>
              </tr>
            ) : (
              orders.map(order => (
                order.items.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid #f5f5f5',
                      background: selectedItems.has(item.id) ? '#f0f7ff' : 'transparent'
                    }}
                  >
                    {idx === 0 ? (
                      <>
                        <Td rowSpan={order.items.length} style={{ fontWeight: 500, verticalAlign: 'middle' }}>
                          {order.orderNo}
                        </Td>
                        <Td rowSpan={order.items.length} style={{ verticalAlign: 'middle' }}>
                          {order.store.name}
                        </Td>
                      </>
                    ) : null}
                    <Td>
                      <span style={{ 
                        color: '#86868b', 
                        fontSize: '11px',
                        background: '#f5f5f5',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {item.product.brand.name}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 500 }}>{item.product.name}</span>
                      </div>
                    </Td>
                    <Td align="center">
                      <span style={{ 
                        background: '#e8f5e9', 
                        color: '#2e7d32',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {item.quantity}
                      </span>
                    </Td>
                    <Td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                      {item.sph ? `S${item.sph} C${item.cyl} A${item.axis}` : '-'}
                    </Td>
                    <Td align="right" style={{ fontWeight: 500 }}>
                      {item.totalPrice.toLocaleString()}원
                    </Td>
                    {idx === 0 ? (
                      <>
                        <Td rowSpan={order.items.length} style={{ verticalAlign: 'middle' }}>
                          <StatusBadge status={order.status} />
                        </Td>
                        <Td rowSpan={order.items.length} style={{ color: '#86868b', fontSize: '12px', verticalAlign: 'middle' }}>
                          {new Date(order.orderedAt).toLocaleString('ko-KR', { 
                            month: 'numeric', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Td>
                      </>
                    ) : null}
                  </tr>
                ))
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 액션 */}
      <div style={{ 
        marginTop: '16px',
        padding: '16px 20px',
        background: '#fff',
        borderRadius: '12px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#86868b' }}>
          {selectedItems.size > 0 ? `${selectedItems.size}개 상품 선택됨` : '상품을 선택하세요'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton color="#ff9500" onClick={() => updateStatus('pending')} disabled={selectedItems.size === 0}>
            대기처리
          </ActionButton>
          <ActionButton color="#007aff" onClick={() => updateStatus('shipped')} disabled={selectedItems.size === 0}>
            발송준비
          </ActionButton>
          <ActionButton color="#34c759" onClick={() => updateStatus('delivered')} disabled={selectedItems.size === 0}>
            발송완료
          </ActionButton>
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ label, value, unit, highlight }: { label: string; value: number | string; unit: string; highlight?: boolean }) {
  return (
    <div style={{ 
      background: '#fff',
      borderRadius: '12px',
      padding: '16px 20px',
      border: highlight ? '2px solid #007aff' : 'none'
    }}>
      <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
        {value}
        <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>{unit}</span>
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ 
      padding: '6px 14px',
      borderRadius: '16px',
      background: active ? '#1d1d1f' : 'transparent',
      color: active ? '#fff' : '#1d1d1f',
      border: 'none',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer'
    }}>
      {children}
    </button>
  )
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ 
      padding: '6px 12px',
      borderRadius: '6px',
      background: '#fff',
      color: '#1d1d1f',
      border: '1px solid #e5e5e5',
      fontSize: '13px',
      cursor: 'pointer'
    }}>
      {children}
    </button>
  )
}

function Th({ children, align, style }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center'; style?: React.CSSProperties }) {
  return (
    <th style={{ 
      padding: '12px 14px',
      textAlign: align || 'left',
      fontSize: '11px',
      fontWeight: 500,
      color: '#86868b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      ...style
    }}>
      {children}
    </th>
  )
}

function Td({ children, rowSpan, align, style }: { children: React.ReactNode; rowSpan?: number; align?: 'left' | 'right' | 'center'; style?: React.CSSProperties }) {
  return (
    <td rowSpan={rowSpan} style={{ 
      padding: '12px 14px',
      textAlign: align || 'left',
      fontSize: '13px',
      color: '#1d1d1f',
      verticalAlign: 'top',
      ...style
    }}>
      {children}
    </td>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fff3e0', color: '#ff9500', label: '대기' },
    confirmed: { bg: '#e3f2fd', color: '#007aff', label: '확인' },
    shipped: { bg: '#e8f5e9', color: '#34c759', label: '발송준비' },
    delivered: { bg: '#f3e5f5', color: '#af52de', label: '발송완료' },
    cancelled: { bg: '#ffebee', color: '#ff3b30', label: '취소' }
  }
  const s = styles[status] || styles.pending
  
  return (
    <span style={{ 
      padding: '3px 8px',
      borderRadius: '4px',
      background: s.bg,
      color: s.color,
      fontSize: '11px',
      fontWeight: 500
    }}>
      {s.label}
    </span>
  )
}

function ActionButton({ children, color, onClick, disabled }: { children: React.ReactNode; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      style={{ 
        padding: '8px 16px',
        borderRadius: '6px',
        background: disabled ? '#e5e5e5' : color,
        color: disabled ? '#86868b' : '#fff',
        border: 'none',
        fontSize: '13px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  )
}
