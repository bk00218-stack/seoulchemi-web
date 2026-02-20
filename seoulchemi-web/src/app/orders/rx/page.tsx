'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { btnStyle, selectStyle, inputStyle, cardStyle, thStyle, tdStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

interface ApiOrder {
  id: number
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  createdAt: string
  orderedAt: string
  memo: string | null
  store: {
    id: number
    name: string
    code: string
    group?: { name: string } | null
  }
  items: Array<{
    id: number
    quantity: number
    unitPrice: number
    totalPrice: number
    sph: string | null
    cyl: string | null
    axis: string | null
    product: {
      id: number
      name: string
      optionType: string | null
      brand: { name: string } | null
    }
  }>
}

// 주문 아이템 단위로 플래트닝한 행
interface RxRow {
  orderId: number
  itemId: number
  orderNo: string
  storeCode: string
  storeName: string
  groupName: string
  brandName: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sph: string | null
  cyl: string | null
  axis: string | null
  status: string
  orderedAt: string
}

export default function RxOrdersPage() {
  const { toast } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })()

  // 필터 상태
  const [storeFilter, setStoreFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState(weekAgo)
  const [dateTo, setDateTo] = useState(today)

  // 데이터 상태
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [rows, setRows] = useState<RxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set()) // orderId 기준

  // 컬럼 필터
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        productType: 'rx',
        from: dateFrom,
        to: dateTo,
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      const apiOrders: ApiOrder[] = data.orders || []
      setOrders(apiOrders)

      // 주문 아이템 단위로 플래트닝
      const flatRows: RxRow[] = []
      for (const order of apiOrders) {
        for (const item of order.items) {
          flatRows.push({
            orderId: order.id,
            itemId: item.id,
            orderNo: order.orderNo,
            storeCode: order.store.code,
            storeName: order.store.name,
            groupName: order.store.group?.name || '',
            brandName: item.product.brand?.name || '',
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            sph: item.sph,
            cyl: item.cyl,
            axis: item.axis,
            status: order.status,
            orderedAt: order.orderedAt,
          })
        }
      }
      setRows(flatRows)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // 필터링
  const filteredRows = rows.filter(row => {
    if (storeFilter && !row.storeName.includes(storeFilter) && !row.storeCode.includes(storeFilter)) return false

    // 컬럼 필터
    for (const [key, value] of Object.entries(columnFilters)) {
      if (value && !(row as any)[key]?.toString().toLowerCase().includes(value.toLowerCase())) {
        return false
      }
    }
    return true
  })

  // 통계
  const stats = {
    totalQty: filteredRows.reduce((sum, r) => sum + r.quantity, 0),
    totalAmount: filteredRows.reduce((sum, r) => sum + r.totalPrice, 0),
    pendingCount: filteredRows.filter(r => r.status === 'pending' || r.status === '대기').length,
  }

  // 선택 토글 (orderId 기준)
  const toggleSelect = (orderId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) newSet.delete(orderId)
      else newSet.add(orderId)
      return newSet
    })
  }

  const toggleSelectAll = () => {
    const allOrderIds = new Set(filteredRows.map(r => r.orderId))
    if (selectedIds.size === allOrderIds.size) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(allOrderIds)
    }
  }

  // 상태 변경
  async function handleStatusChange(newStatus: string) {
    if (selectedIds.size === 0) {
      toast.warning('선택된 주문이 없습니다.')
      return
    }
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      )
      const successCount = results.filter(r => r.ok).length
      toast.success(`${successCount}건 상태 변경 완료`)
      setSelectedIds(new Set())
      fetchOrders()
    } catch (error) {
      toast.error('상태 변경 실패')
    }
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
      case 'week':
        from.setDate(from.getDate() - 7)
        break
      case 'month':
        from.setDate(from.getDate() - 30)
        break
      case 'month1':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 0, 31)
        break
      case 'month2':
        from = new Date(now.getFullYear(), 1, 1)
        to = new Date(now.getFullYear(), 1, 29)
        break
    }

    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '대기'
      case '대기': return '대기'
      case 'confirmed': case '확인': return '확인'
      case 'shipped': case '출고': return '출고'
      case 'delivered': case '배송완료': return '배송완료'
      case 'cancelled': case '취소': return '취소'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': case '대기': return { bg: '#fff3e0', color: '#e65100' }
      case 'confirmed': case '확인': return { bg: '#dbeafe', color: '#1e40af' }
      case 'shipped': case '출고': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'delivered': case '배송완료': return { bg: '#f3f4f6', color: '#374151' }
      case 'cancelled': case '취소': return { bg: '#ffebee', color: '#c62828' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 페이지 타이틀 */}
      <div style={{
        background: '#5d4e37',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px 8px 0 0',
        fontSize: 16,
        fontWeight: 600
      }}>
        온라인 RX 주문
      </div>

      {/* 필터 영역 */}
      <div style={{ ...cardStyle, borderRadius: '0 0 8px 8px', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          {/* 가맹점 검색 */}
          <input
            type="text"
            placeholder="가맹점 검색..."
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
            <option value="confirmed">확인</option>
            <option value="shipped">출고</option>
            <option value="delivered">배송완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
              { label: '오늘', value: 'today' },
              { label: '어제', value: 'yesterday' },
              { label: '1주일', value: 'week' },
              { label: '1개월', value: 'month' },
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

      {/* 통계 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => handleStatusChange('확인')}
                style={{ ...btnStyle, background: '#dbeafe', color: '#1e40af', border: 'none' }}
              >
                확인처리 ({selectedIds.size})
              </button>
              <button
                onClick={() => handleStatusChange('출고')}
                style={{ ...btnStyle, background: '#d1fae5', color: '#065f46', border: 'none' }}
              >
                출고처리 ({selectedIds.size})
              </button>
              <button
                onClick={() => handleStatusChange('취소')}
                style={{ ...btnStyle, color: 'var(--error)' }}
              >
                취소 ({selectedIds.size})
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span>조회: <strong>{filteredRows.length}</strong>건</span>
          <span>대기: <strong>{stats.pendingCount}</strong>건</span>
          <span>총수량: <strong>{stats.totalQty}</strong></span>
          <span>합계금액: <strong>{stats.totalAmount.toLocaleString()}</strong>원</span>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === new Set(filteredRows.map(r => r.orderId)).size}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>주문번호</th>
                <th style={thStyle}>가맹점코드</th>
                <th style={thStyle}>가맹점명</th>
                <th style={thStyle}>브랜드</th>
                <th style={thStyle}>상품명</th>
                <th style={thStyle}>SPH</th>
                <th style={thStyle}>CYL</th>
                <th style={thStyle}>AXIS</th>
                <th style={thStyle}>수량</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>주문일</th>
                <th style={thStyle}>관리</th>
              </tr>
              {/* 컬럼 필터 행 */}
              <tr style={{ background: '#fafafa' }}>
                <td style={{ padding: 4 }}></td>
                <td style={{ padding: 4 }}></td>
                {['orderNo', 'storeCode', 'storeName', 'brandName', 'productName'].map(col => (
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
                  <td colSpan={15} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                    조회된 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const statusStyle = getStatusColor(row.status)
                  return (
                    <tr key={`${row.orderId}-${row.itemId}`} style={{ background: selectedIds.has(row.orderId) ? 'var(--primary-light)' : undefined }}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.orderId)}
                          onChange={() => toggleSelect(row.orderId)}
                        />
                      </td>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 500 }}>{row.orderNo}</td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{row.storeCode}</td>
                      <td style={tdStyle}>{row.storeName}</td>
                      <td style={tdStyle}>{row.brandName}</td>
                      <td style={tdStyle}>{row.productName}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12 }}>{row.sph || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12 }}>{row.cyl || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12 }}>{row.axis || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{row.quantity}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.totalPrice.toLocaleString()}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}>
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>
                        {new Date(row.orderedAt).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <select
                          value={row.status}
                          onChange={(e) => {
                            fetch(`/api/orders/${row.orderId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: e.target.value })
                            }).then(() => fetchOrders())
                          }}
                          style={{ ...selectStyle, fontSize: 12, padding: '4px 8px' }}
                        >
                          <option value="pending">대기</option>
                          <option value="confirmed">확인</option>
                          <option value="shipped">출고</option>
                          <option value="delivered">배송완료</option>
                          <option value="cancelled">취소</option>
                        </select>
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
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            선택: <strong>{selectedIds.size}</strong> / {new Set(filteredRows.map(r => r.orderId)).size} 건
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
            onClick={() => handleStatusChange('confirmed')}
            style={{ ...btnStyle, background: '#dbeafe', color: '#1e40af', border: '1px solid #1e40af' }}
          >
            확인처리
          </button>
          <button
            onClick={() => handleStatusChange('shipped')}
            style={{ ...btnStyle, background: '#e65100', color: '#fff', border: 'none' }}
          >
            출고처리
          </button>
          <button
            onClick={() => handleStatusChange('cancelled')}
            style={{ ...btnStyle, color: 'var(--error)' }}
          >
            취소
          </button>
        </div>
      </div>
    </Layout>
  )
}
