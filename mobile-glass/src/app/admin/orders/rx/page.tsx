'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'
import { downloadExcel, ExcelColumn } from '@/lib/excel'

interface RxOrder {
  id: number
  orderNo: string
  store: string
  brand: string
  product: string
  rightSph: string
  rightCyl: string
  rightAxis: string
  leftSph: string
  leftCyl: string
  leftAxis: string
  pd: string
  add: string
  quantity: number
  amount: number
  status: string
  orderedAt: string
}

interface Stats {
  monthlyOrders: number
  pending: number
  totalAmount: number
  avgAmount: number
}

export default function RxOrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [data, setData] = useState<RxOrder[]>([])
  const [stats, setStats] = useState<Stats>({ monthlyOrders: 0, pending: 0, totalAmount: 0, avgAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/orders/rx?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.orders)
      setStats(json.stats)
    } catch (error) {
      console.error('Failed to fetch RX orders:', error)
    }
    setLoading(false)
  }, [filter, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData()

  const handleExcelDownload = () => {
    const excelColumns: ExcelColumn[] = [
      { key: 'orderNo', label: '주문번호' },
      { key: 'orderedAt', label: '주문일시' },
      { key: 'store', label: '가맹점' },
      { key: 'brand', label: '브랜드' },
      { key: 'product', label: '상품명' },
      { key: 'rightSph', label: 'R SPH' },
      { key: 'rightCyl', label: 'R CYL' },
      { key: 'rightAxis', label: 'R AXIS' },
      { key: 'leftSph', label: 'L SPH' },
      { key: 'leftCyl', label: 'L CYL' },
      { key: 'leftAxis', label: 'L AXIS' },
      { key: 'pd', label: 'PD' },
      { key: 'add', label: 'ADD' },
      { key: 'amount', label: '금액', format: (v) => v.toLocaleString() },
      { key: 'status', label: '상태', format: (v) => ({ pending: '대기', confirmed: '제작중', shipped: '출고', delivered: '완료' }[v] || v) },
    ]
    
    const exportData = selectedIds.size > 0 
      ? data.filter(d => selectedIds.has(d.id))
      : data
    
    downloadExcel(exportData, excelColumns, `RX주문_${new Date().toISOString().split('T')[0]}`)
    alert(`${exportData.length}건이 다운로드되었습니다.`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('주문을 선택해주세요.')
      return
    }
    
    const labels: Record<string, string> = {
      pending: '대기',
      confirmed: '제작중',
      shipped: '출고',
      delivered: '완료'
    }
    
    if (!confirm(`${selectedIds.size}건을 '${labels[newStatus] || newStatus}'(으)로 변경하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch('/api/orders/rx', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), status: newStatus }),
      })
      
      if (res.ok) {
        alert(`${selectedIds.size}건의 상태가 변경되었습니다.`)
        setSelectedIds(new Set())
        fetchData()
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.')
    }
  }

  const columns: Column<RxOrder>[] = [
    { key: 'orderNo', label: '주문번호', render: (v) => <span style={{ fontWeight: 500, color: '#af52de' }}>{v as string}</span> },
    { key: 'store', label: '가맹점' },
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#f3e5f5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#af52de' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'rightSph', label: 'R (SPH/CYL/AXIS)', width: '140px', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1d1d1f' }}>
        {row.rightSph}/{row.rightCyl}/{row.rightAxis}°
      </span>
    )},
    { key: 'leftSph', label: 'L (SPH/CYL/AXIS)', width: '140px', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1d1d1f' }}>
        {row.leftSph}/{row.leftCyl}/{row.leftAxis}°
      </span>
    )},
    { key: 'pd', label: 'PD', align: 'center' },
    { key: 'add', label: 'ADD', align: 'center', render: (v) => (
      <span style={{ color: '#007aff', fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'amount', label: '금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
  ]

  const filteredData = filter === 'all' ? data : data.filter(o => o.status === filter)

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        RX 주문내역
      </h2>

      <StatCardGrid>
        <StatCard label="이번 달 RX 주문" value={stats.monthlyOrders} unit="건" icon="👓" />
        <StatCard label="제작 대기" value={stats.pending} unit="건" highlight />
        <StatCard label="총 주문금액" value={stats.totalAmount.toLocaleString()} unit="원" />
        <StatCard label="평균 단가" value={stats.avgAmount.toLocaleString()} unit="원" />
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
            <OutlineButton onClick={handleExcelDownload}>📥 엑셀</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '대기', value: 'pending' },
            { label: '제작중', value: 'confirmed' },
            { label: '출고', value: 'shipped' },
            { label: '완료', value: 'delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>로딩 중...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="RX 주문 내역이 없습니다"
        />
      )}

      {/* RX 상세 정보 안내 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#f0f7ff', 
        borderRadius: '12px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ fontSize: '13px', color: '#007aff', fontWeight: 500, marginBottom: '8px' }}>
          💡 RX 주문 안내
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          RX 주문은 개인 맞춤 제작 상품으로, 주문 확인 후 제작이 시작됩니다. 
          제작 기간은 브랜드 및 렌즈 타입에 따라 3~7일 소요됩니다.
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ 
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px', 
          background: '#fff', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 100,
        }}>
          <span style={{ color: '#af52de', fontWeight: 500 }}>{selectedIds.size}건 선택됨</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleStatusChange('pending')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>대기처리</button>
            <button onClick={() => handleStatusChange('confirmed')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#af52de', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>제작시작</button>
            <button onClick={() => handleStatusChange('shipped')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>발송완료</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
