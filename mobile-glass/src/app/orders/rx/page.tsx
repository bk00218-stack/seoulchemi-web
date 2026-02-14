'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, selectStyle, inputStyle, cardStyle, thStyle, tdStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

interface RxOrder {
  id: number
  orderNo: string
  region: string
  code: string
  groupName: string
  storeName: string
  approvalNo: string
  brandName: string
  productName: string
  blueLight: boolean
  photochromic: boolean
  polarized: boolean
  quantity: number
  courier: string
  supplier: string
  standardPrice: number
  discountPrice: number
  status: string
  orderType: string
  orderedAt: string
}

export default function RxOrdersPage() {
  const today = new Date().toISOString().split('T')[0]
  
  // ?�터 ?�태
  const [storeFilter, setStoreFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all') // 주문/반품/?�체
  const [dateType, setDateType] = useState('order') // 주문???�인??
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  
  // ?�이???�태
  const [orders, setOrders] = useState<RxOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  
  // 컬럼 ?�터
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      // TODO: ?�제 API ?�동
      // ?�플 ?�이??
      const sampleOrders: RxOrder[] = [
        {
          id: 1,
          orderNo: 'RX250203-001',
          region: '',
          code: '2919391',
          groupName: '?�?�러??,
          storeName: '?�크?�경??마포',
          approvalNo: '2919391',
          brandName: '케미매직폼',
          productName: '1.56 MF-?�니??PUV',
          blueLight: false,
          photochromic: false,
          polarized: false,
          quantity: 2,
          courier: '',
          supplier: '',
          standardPrice: 12300,
          discountPrice: 12300,
          status: 'pending',
          orderType: 'order',
          orderedAt: today,
        },
      ]
      setOrders(sampleOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // ?�터링된 주문
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false
    if (storeFilter && !order.storeName.includes(storeFilter)) return false
    
    // 컬럼 ?�터
    for (const [key, value] of Object.entries(columnFilters)) {
      if (value && !(order as any)[key]?.toString().toLowerCase().includes(value.toLowerCase())) {
        return false
      }
    }
    return true
  })

  // ?�계
  const stats = {
    orderCount: filteredOrders.filter(o => o.orderType === 'order').reduce((sum, o) => sum + o.quantity, 0),
    totalOrderCount: orders.filter(o => o.orderType === 'order').reduce((sum, o) => sum + o.quantity, 0),
    returnCount: filteredOrders.filter(o => o.orderType === 'return').reduce((sum, o) => sum + o.quantity, 0),
    totalReturnCount: orders.filter(o => o.orderType === 'return').reduce((sum, o) => sum + o.quantity, 0),
    standardTotal: filteredOrders.reduce((sum, o) => sum + o.standardPrice * o.quantity, 0),
    discountTotal: filteredOrders.reduce((sum, o) => sum + o.discountPrice * o.quantity, 0),
  }

  // ?�택 ?��?
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
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

  // ?�태 변�?
  async function handleStatusChange(newStatus: string) {
    if (selectedIds.size === 0) {
      alert('?�택??주문???�습?�다.')
      return
    }
    // TODO: API ?�동
    alert(`${selectedIds.size}건을 "${newStatus}" ?�태�?변경합?�다.`)
  }

  // ?�짜 빠른 ?�택
  const setQuickDate = (type: string) => {
    const now = new Date()
    let from = new Date()
    let to = new Date()
    
    switch (type) {
      case 'today':
        break
      case 'yesterday':
        from.setDate(from.getDate() - 1)
        to.setDate(to.getDate() - 1)
        break
      case 'month1':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 0, 31)
        break
      case 'month2':
        from = new Date(now.getFullYear(), 1, 1)
        to = new Date(now.getFullYear(), 1, 29)
        break
      case 'month12':
        from = new Date(now.getFullYear() - 1, 11, 1)
        to = new Date(now.getFullYear() - 1, 11, 31)
        break
    }
    
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '?��?
      case 'preparing': return '발송준�?
      case 'shipped': return '발송?�료'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fff3e0', color: '#e65100' }
      case 'preparing': return { bg: '#eef4ee', color: '#4a6b4a' }
      case 'shipped': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'cancelled': return { bg: '#ffebee', color: '#c62828' }
      default: return { bg: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }
    }
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* ?�이지 ?�?��? */}
      <div style={{ 
        background: '#5d4e37', 
        color: '#fff', 
        padding: '12px 20px', 
        borderRadius: '8px 8px 0 0',
        fontSize: 16,
        fontWeight: 600
      }}>
        ?�결??RX 주문?�역
      </div>

      {/* ?�터 ?�역 */}
      <div style={{ ...cardStyle, borderRadius: '0 0 8px 8px', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          {/* 가맹점 검??*/}
          <input
            type="text"
            placeholder="가맹점 ?�체"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            style={{ ...inputStyle, width: 160 }}
          />
          
          {/* ?�태 ?�터 */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">?�태 ?�체</option>
            <option value="pending">?��?/option>
            <option value="preparing">발송준�?/option>
            <option value="shipped">발송?�료</option>
            <option value="cancelled">취소</option>
          </select>

          {/* 주문/반품/?�체 */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[
              { label: '주문', value: 'order' },
              { label: '반품', value: 'return' },
              { label: '?�체', value: 'all' },
            ].map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderTypeFilter === opt.value}
                  onChange={() => setOrderTypeFilter(opt.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* ?�짜 ?�??*/}
          <select 
            value={dateType} 
            onChange={(e) => setDateType(e.target.value)}
            style={{ ...selectStyle, width: 100 }}
          >
            <option value="order">주문??/option>
            <option value="approval">?�인??/option>
          </select>

          {/* ?�짜 범위 */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: 'var(--gray-400)' }}>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={inputStyle}
          />

          {/* 빠른 ?�짜 버튼 */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: '12??, value: 'month12' },
              { label: '01??, value: 'month1' },
              { label: '02??, value: 'month2' },
              { label: '?�제', value: 'yesterday' },
              { label: '?�늘', value: 'today' },
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => setQuickDate(btn.value)}
                style={{
                  ...btnStyle,
                  padding: '6px 12px',
                  fontSize: 12,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            style={{
              ...btnStyle,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
            }}
          >
            검??
          </button>
        </div>
      </div>

      {/* ?�션 버튼 & ?�계 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle}>?�� 공�??�항</button>
          <button style={{ ...btnStyle, background: '#e65100', color: '#fff', border: 'none' }}>?���??�택출력</button>
          <button style={{ ...btnStyle, background: '#4a6b4a', color: '#fff', border: 'none' }}>?�� ?�체</button>
          <button style={{ ...btnStyle, background: '#4a6b4a', color: '#fff', border: 'none' }}>?�� ?�택</button>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span>주문?�량 : <strong>{stats.orderCount}/{stats.totalOrderCount}</strong></span>
          <span>반품?�량 : <strong>{stats.returnCount}/{stats.totalReturnCount}</strong></span>
          <span>?��? ?�계금액 : <strong>{stats.standardTotal.toLocaleString()}</strong></span>
          <span>?�인 ?�계금액 : <strong>{stats.discountTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ?�이�?*/}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>지??/th>
                <th style={thStyle}>CODE</th>
                <th style={thStyle}>그룹�?/th>
                <th style={thStyle}>가맹점�?/th>
                <th style={thStyle}>?�인번호</th>
                <th style={thStyle}>브랜?�명</th>
                <th style={thStyle}>?�품�?/th>
                <th style={thStyle}>�?��</th>
                <th style={thStyle}>변??/th>
                <th style={thStyle}>?�광</th>
                <th style={thStyle}>?�량</th>
                <th style={thStyle}>배송??/th>
                <th style={thStyle}>매입처명</th>
                <th style={thStyle}>?��?공급가</th>
                <th style={thStyle}>?�태</th>
              </tr>
              {/* 컬럼 ?�터 ??*/}
              <tr style={{ background: '#fafafa' }}>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                {['region', 'code', 'groupName', 'storeName', 'approvalNo', 'brandName', 'productName'].map(col => (
                  <td key={col} style={{ padding: 4 }}>
                    <input
                      type="text"
                      placeholder="?��"
                      value={columnFilters[col] || ''}
                      onChange={(e) => setColumnFilters(prev => ({ ...prev, [col]: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '4px 6px', 
                        fontSize: 11, 
                        border: '1px solid var(--gray-200)',
                        borderRadius: 4,
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={17} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                    로딩 �?..
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                    조회???�이?��? ?�습?�다
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const statusStyle = getStatusColor(order.status)
                  return (
                    <tr key={order.id} style={{ background: selectedIds.has(order.id) ? 'var(--primary-light)' : undefined }}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                        />
                      </td>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>{order.region || '-'}</td>
                      <td style={tdStyle}>{order.code}</td>
                      <td style={{ ...tdStyle, color: 'var(--primary)' }}>{order.groupName}</td>
                      <td style={tdStyle}>{order.storeName}</td>
                      <td style={tdStyle}>{order.approvalNo}</td>
                      <td style={tdStyle}>{order.brandName}</td>
                      <td style={tdStyle}>{order.productName}</td>
                      <td style={tdStyle}>{order.blueLight ? '?? : ''}</td>
                      <td style={tdStyle}>{order.photochromic ? '?? : ''}</td>
                      <td style={tdStyle}>{order.polarized ? '?? : ''}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{order.quantity}</td>
                      <td style={tdStyle}>{order.courier || '-'}</td>
                      <td style={tdStyle}>{order.supplier || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{order.standardPrice.toLocaleString()}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ?�단 ?�션 �?*/}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 16,
        padding: '12px 16px',
        background: 'var(--bg-primary)',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ ...btnStyle, color: 'var(--error)' }}>?�택 ??��</button>
          <span style={{ fontSize: 13, color: 'var(--gray-600)', marginLeft: 8 }}>
            ?�택건수 : <strong>{selectedIds.size} / {filteredOrders.length}</strong> �?
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => handleStatusChange('pending')}
            style={btnStyle}
          >
            ?�기처�?
          </button>
          <button 
            onClick={() => handleStatusChange('preparing')}
            style={{ ...btnStyle, background: '#fff3e0', color: '#e65100', border: '1px solid #e65100' }}
          >
            ?�� 발송준�?
          </button>
          <button 
            onClick={() => handleStatusChange('shipped')}
            style={{ ...btnStyle, background: '#e65100', color: '#fff', border: 'none' }}
          >
            ?�� 발송?�료
          </button>
          <button 
            onClick={() => handleStatusChange('cancelled')}
            style={{ ...btnStyle, color: 'var(--error)' }}
          >
            거래취소
          </button>
        </div>
      </div>
    </Layout>
  )
}
