'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, selectStyle, inputStyle, cardStyle, thStyle, tdStyle } from '../../components/Layout'

const SIDEBAR = [
  {
    title: '후결제 주문',
    items: [
      { label: '여벌 주문내역', href: '/' },
      { label: 'RX 주문내역', href: '/orders/rx' },
      { label: '관리자 주문등록', href: '/orders/new' },
      { label: '명세표 출력이력', href: '/orders/print-history' },
    ]
  },
  {
    title: '출고관리',
    items: [
      { label: '전체 주문내역', href: '/orders/all' },
      { label: '출고 확인', href: '/orders/shipping' },
      { label: '출고 배송지 정보', href: '/orders/delivery' },
    ]
  }
]

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
  
  // 필터 상태
  const [storeFilter, setStoreFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all') // 주문/반품/전체
  const [dateType, setDateType] = useState('order') // 주문일/승인일
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  
  // 데이터 상태
  const [orders, setOrders] = useState<RxOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  
  // 컬럼 필터
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      // TODO: 실제 API 연동
      // 샘플 데이터
      const sampleOrders: RxOrder[] = [
        {
          id: 1,
          orderNo: 'RX250203-001',
          region: '',
          code: '2919391',
          groupName: '타우러스',
          storeName: '시크안경원 마포',
          approvalNo: '2919391',
          brandName: '케미매직폼',
          productName: '1.56 MF-애니원 PUV',
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

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false
    if (storeFilter && !order.storeName.includes(storeFilter)) return false
    
    // 컬럼 필터
    for (const [key, value] of Object.entries(columnFilters)) {
      if (value && !(order as any)[key]?.toString().toLowerCase().includes(value.toLowerCase())) {
        return false
      }
    }
    return true
  })

  // 통계
  const stats = {
    orderCount: filteredOrders.filter(o => o.orderType === 'order').reduce((sum, o) => sum + o.quantity, 0),
    totalOrderCount: orders.filter(o => o.orderType === 'order').reduce((sum, o) => sum + o.quantity, 0),
    returnCount: filteredOrders.filter(o => o.orderType === 'return').reduce((sum, o) => sum + o.quantity, 0),
    totalReturnCount: orders.filter(o => o.orderType === 'return').reduce((sum, o) => sum + o.quantity, 0),
    standardTotal: filteredOrders.reduce((sum, o) => sum + o.standardPrice * o.quantity, 0),
    discountTotal: filteredOrders.reduce((sum, o) => sum + o.discountPrice * o.quantity, 0),
  }

  // 선택 토글
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

  // 상태 변경
  async function handleStatusChange(newStatus: string) {
    if (selectedIds.size === 0) {
      alert('선택된 주문이 없습니다.')
      return
    }
    // TODO: API 연동
    alert(`${selectedIds.size}건을 "${newStatus}" 상태로 변경합니다.`)
  }

  // 날짜 빠른 선택
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
      case 'pending': return '대기'
      case 'preparing': return '발송준비'
      case 'shipped': return '발송완료'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fff3e0', color: '#e65100' }
      case 'preparing': return { bg: '#e3f2fd', color: '#1565c0' }
      case 'shipped': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'cancelled': return { bg: '#ffebee', color: '#c62828' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="주문">
      {/* 페이지 타이틀 */}
      <div style={{ 
        background: '#5d4e37', 
        color: '#fff', 
        padding: '12px 20px', 
        borderRadius: '8px 8px 0 0',
        fontSize: 15,
        fontWeight: 600
      }}>
        후결제 RX 주문내역
      </div>

      {/* 필터 영역 */}
      <div style={{ ...cardStyle, borderRadius: '0 0 8px 8px', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          {/* 가맹점 검색 */}
          <input
            type="text"
            placeholder="가맹점 전체"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            style={{ ...inputStyle, width: 160 }}
          />
          
          {/* 상태 필터 */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">상태 전체</option>
            <option value="pending">대기</option>
            <option value="preparing">발송준비</option>
            <option value="shipped">발송완료</option>
            <option value="cancelled">취소</option>
          </select>

          {/* 주문/반품/전체 */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[
              { label: '주문', value: 'order' },
              { label: '반품', value: 'return' },
              { label: '전체', value: 'all' },
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
          {/* 날짜 타입 */}
          <select 
            value={dateType} 
            onChange={(e) => setDateType(e.target.value)}
            style={{ ...selectStyle, width: 100 }}
          >
            <option value="order">주문일</option>
            <option value="approval">승인일</option>
          </select>

          {/* 날짜 범위 */}
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

          {/* 빠른 날짜 버튼 */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: '12월', value: 'month12' },
              { label: '01월', value: 'month1' },
              { label: '02월', value: 'month2' },
              { label: '어제', value: 'yesterday' },
              { label: '오늘', value: 'today' },
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
            검색
          </button>
        </div>
      </div>

      {/* 액션 버튼 & 통계 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle}>📢 공지사항</button>
          <button style={{ ...btnStyle, background: '#e65100', color: '#fff', border: 'none' }}>🖨️ 선택출력</button>
          <button style={{ ...btnStyle, background: '#1565c0', color: '#fff', border: 'none' }}>📥 전체</button>
          <button style={{ ...btnStyle, background: '#1565c0', color: '#fff', border: 'none' }}>📥 선택</button>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span>주문수량 : <strong>{stats.orderCount}/{stats.totalOrderCount}</strong></span>
          <span>반품수량 : <strong>{stats.returnCount}/{stats.totalReturnCount}</strong></span>
          <span>표준 합계금액 : <strong>{stats.standardTotal.toLocaleString()}</strong></span>
          <span>할인 합계금액 : <strong>{stats.discountTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* 테이블 */}
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
                <th style={thStyle}>지역</th>
                <th style={thStyle}>CODE</th>
                <th style={thStyle}>그룹명</th>
                <th style={thStyle}>가맹점명</th>
                <th style={thStyle}>승인번호</th>
                <th style={thStyle}>브랜드명</th>
                <th style={thStyle}>상품명</th>
                <th style={thStyle}>청광</th>
                <th style={thStyle}>변색</th>
                <th style={thStyle}>편광</th>
                <th style={thStyle}>수량</th>
                <th style={thStyle}>배송사</th>
                <th style={thStyle}>매입처명</th>
                <th style={thStyle}>표준공급가</th>
                <th style={thStyle}>상태</th>
              </tr>
              {/* 컬럼 필터 행 */}
              <tr style={{ background: '#fafafa' }}>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                {['region', 'code', 'groupName', 'storeName', 'approvalNo', 'brandName', 'productName'].map(col => (
                  <td key={col} style={{ padding: 4 }}>
                    <input
                      type="text"
                      placeholder="🔍"
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
                    로딩 중...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                    조회된 데이터가 없습니다
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
                      <td style={tdStyle}>{order.blueLight ? '✓' : ''}</td>
                      <td style={tdStyle}>{order.photochromic ? '✓' : ''}</td>
                      <td style={tdStyle}>{order.polarized ? '✓' : ''}</td>
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

      {/* 하단 액션 바 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 16,
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ ...btnStyle, color: 'var(--error)' }}>선택 삭제</button>
          <span style={{ fontSize: 13, color: 'var(--gray-600)', marginLeft: 8 }}>
            선택건수 : <strong>{selectedIds.size} / {filteredOrders.length}</strong> 건
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => handleStatusChange('pending')}
            style={btnStyle}
          >
            대기처리
          </button>
          <button 
            onClick={() => handleStatusChange('preparing')}
            style={{ ...btnStyle, background: '#fff3e0', color: '#e65100', border: '1px solid #e65100' }}
          >
            🚚 발송준비
          </button>
          <button 
            onClick={() => handleStatusChange('shipped')}
            style={{ ...btnStyle, background: '#e65100', color: '#fff', border: 'none' }}
          >
            🚚 발송완료
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
