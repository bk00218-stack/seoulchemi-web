'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface ShippingItem {
  id: number
  orderNo: string
  store: string
  address: string
  items: string
  quantity: number
  status: string
  orderedAt: string
  shippedAt: string | null
  deliveredAt: string | null
  totalAmount: number
  trackingNo: string
}

interface Stats {
  confirmed: number
  shipped: number
  delivered: number
  todayDelivered: number
  weekShipped: number
}

const statusMap = {
  confirmed: { bg: '#e3f2fd', color: '#007aff', label: '출고대기' },
  shipped: { bg: '#fff3e0', color: '#ff9500', label: '배송중' },
  delivered: { bg: '#e8f5e9', color: '#34c759', label: '배송완료' },
}

export default function ShippingPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [data, setData] = useState<ShippingItem[]>([])
  const [stats, setStats] = useState<Stats>({ confirmed: 0, shipped: 0, delivered: 0, todayDelivered: 0, weekShipped: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/shipping?${params}`)
      const json = await res.json()
      setData(json.orders)
      setStats(json.stats)
    } catch (error) {
      console.error('Failed to fetch shipping data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  const handleSearch = () => {
    fetchData()
  }

  const columns: Column<ShippingItem>[] = [
    { key: 'orderNo', label: '주문번호', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'store', label: '가맹점', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'address', label: '배송지', width: '200px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'items', label: '상품', render: (v) => v as string },
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ background: '#f5f5f7', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
        {v as number}
      </span>
    )},
    { key: 'orderedAt', label: '주문일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'totalAmount', label: '금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'trackingNo', label: '송장번호', render: (v) => (
      v ? (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#34c759' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>미등록</span>
      )
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} statusMap={statusMap} /> },
  ]

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('주문을 선택해주세요.')
      return
    }
    
    const statusLabel = statusMap[newStatus as keyof typeof statusMap]?.label || newStatus
    if (!confirm(`${selectedIds.size}건의 상태를 '${statusLabel}'로 변경하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch('/api/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          status: newStatus,
        }),
      })
      
      if (res.ok) {
        alert(`${selectedIds.size}건의 상태가 변경되었습니다.`)
        setSelectedIds(new Set())
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        출고 확인
      </h2>

      <StatCardGrid>
        <StatCard label="출고 대기" value={stats.confirmed} unit="건" highlight icon="📦" />
        <StatCard label="배송 중" value={stats.shipped} unit="건" icon="🚚" />
        <StatCard label="오늘 배송완료" value={stats.todayDelivered} unit="건" icon="✅" />
        <StatCard label="이번 주 총 출고" value={stats.weekShipped} unit="건" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        dateRange
        actions={
          <>
            <OutlineButton onClick={() => window.print()}>🖨️ 출력</OutlineButton>
            <OutlineButton onClick={() => alert('송장 일괄등록 - 준비 중')}>📋 송장등록</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: `출고대기 (${stats.confirmed})`, value: 'confirmed' },
            { label: `배송중 (${stats.shipped})`, value: 'shipped' },
            { label: `배송완료 (${stats.delivered})`, value: 'delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="출고 내역이 없습니다"
        />
      )}

      {selectedIds.size > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px 20px', 
          background: '#fff', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#007aff', fontWeight: 500 }}>{selectedIds.size}건 선택됨</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleStatusChange('confirmed')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              출고대기
            </button>
            <button 
              onClick={() => handleStatusChange('shipped')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              배송시작
            </button>
            <button 
              onClick={() => handleStatusChange('delivered')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              배송완료
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
