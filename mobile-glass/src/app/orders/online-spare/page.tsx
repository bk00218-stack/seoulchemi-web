'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '@/app/components/Layout'
import { ORDER_SIDEBAR } from '@/app/constants/sidebar'

interface Order {
  id: number
  orderNo: string
  status: string
  totalAmount: number
  createdAt: string
  memo?: string
  store: {
    id: number
    name: string
    code: string
  }
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

const statusColors: Record<string, string> = {
  '대기': '#fef3c7',
  '확인': '#dbeafe',
  '가공중': '#e0e7ff',
  '출고': '#d1fae5',
  '배송완료': '#f3f4f6',
  '취소': '#fee2e2',
}

const statusTextColors: Record<string, string> = {
  '대기': '#92400e',
  '확인': '#1e40af',
  '가공중': '#4338ca',
  '출고': '#065f46',
  '배송완료': '#374151',
  '취소': '#991b1b',
}

export default function OnlineSpareOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchOrders()
  }, [dateFrom, dateTo, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
        optionType: '안경렌즈 여벌',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      order.orderNo.toLowerCase().includes(term) ||
      order.store.name.toLowerCase().includes(term) ||
      order.store.code.toLowerCase().includes(term)
    )
  })

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return
    
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      )
      setSelectedIds(new Set())
      fetchOrders()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === '대기').length,
    confirmed: filteredOrders.filter(o => o.status === '확인').length,
    shipped: filteredOrders.filter(o => o.status === '출고').length,
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>온라인 여벌 주문</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          안경원에서 온라인으로 들어온 여벌 렌즈 주문을 관리합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, background: '#fff' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>전체 주문</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-800)' }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400 }}>건</span></div>
        </div>
        <div style={{ ...cardStyle, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#92400e' }}>대기중</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#92400e' }}>{stats.pending}<span style={{ fontSize: 14, fontWeight: 400 }}>건</span></div>
        </div>
        <div style={{ ...cardStyle, background: '#dbeafe' }}>
          <div style={{ fontSize: 12, color: '#1e40af' }}>확인</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{stats.confirmed}<span style={{ fontSize: 14, fontWeight: 400 }}>건</span></div>
        </div>
        <div style={{ ...cardStyle, background: '#d1fae5' }}>
          <div style={{ fontSize: 12, color: '#065f46' }}>출고</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>{stats.shipped}<span style={{ fontSize: 14, fontWeight: 400 }}>건</span></div>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 16, 
        padding: 16, 
        background: '#fff', 
        borderRadius: 12,
        border: '1px solid var(--gray-200)',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--gray-600)' }}>상태</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...selectStyle, width: 120 }}
          >
            <option value="all">전체</option>
            <option value="대기">대기</option>
            <option value="확인">확인</option>
            <option value="가공중">가공중</option>
            <option value="출고">출고</option>
            <option value="배송완료">배송완료</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <input
            type="text"
            placeholder="주문번호, 가맹점명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, flex: 1, maxWidth: 300 }}
          />
        </div>

        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleBulkStatusChange('확인')}
              style={{ ...btnStyle, background: '#dbeafe', color: '#1e40af', border: 'none' }}
            >
              확인처리 ({selectedIds.size})
            </button>
            <button
              onClick={() => handleBulkStatusChange('출고')}
              style={{ ...btnStyle, background: '#d1fae5', color: '#065f46', border: 'none' }}
            >
              출고처리 ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {/* 주문 목록 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        border: '1px solid var(--gray-200)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            로딩 중...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            주문이 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={thStyle}>주문번호</th>
                <th style={thStyle}>가맹점</th>
                <th style={thStyle}>상품</th>
                <th style={thStyle}>수량</th>
                <th style={thStyle}>금액</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>주문일시</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{order.orderNo}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{order.store.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{order.store.code}</div>
                  </td>
                  <td style={tdStyle}>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} style={{ fontSize: 12 }}>
                        {item.product.brand.name} {item.product.name}
                        {item.sph && ` (${item.sph}/${item.cyl})`}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        외 {order.items.length - 2}건
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>
                    {order.totalAmount.toLocaleString()}원
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: statusColors[order.status] || '#f3f4f6',
                      color: statusTextColors[order.status] || '#374151',
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>
                    {new Date(order.createdAt).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ ...selectStyle, fontSize: 12, padding: '4px 8px' }}
                    >
                      <option value="대기">대기</option>
                      <option value="확인">확인</option>
                      <option value="가공중">가공중</option>
                      <option value="출고">출고</option>
                      <option value="배송완료">배송완료</option>
                      <option value="취소">취소</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
