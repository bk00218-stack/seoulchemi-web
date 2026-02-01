'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface OrderItem {
  id: number
  orderNo: string
  store: string
  brand: string
  product: string
  sph: string
  cyl: string
  quantity: number
  amount: number
  status: string
  orderedAt: string
}

const sampleOrders: OrderItem[] = [
  { id: 1, orderNo: 'ORD-2024-0001', store: '강남안경', brand: '에실로', product: '크리잘 블루컷', sph: '-2.00', cyl: '-0.50', quantity: 2, amount: 120000, status: 'pending', orderedAt: '2024-01-15 14:30' },
  { id: 2, orderNo: 'ORD-2024-0002', store: '역삼안경원', brand: '호야', product: '블루컨트롤', sph: '-3.25', cyl: '-1.00', quantity: 1, amount: 85000, status: 'shipped', orderedAt: '2024-01-15 13:20' },
  { id: 3, orderNo: 'ORD-2024-0003', store: '신사안경', brand: '니콘', product: '씨맥스', sph: '-1.50', cyl: '0.00', quantity: 4, amount: 280000, status: 'delivered', orderedAt: '2024-01-15 11:45' },
  { id: 4, orderNo: 'ORD-2024-0004', store: '압구정광학', brand: '에실로', product: '바리락스', sph: '-2.75', cyl: '-0.75', quantity: 2, amount: 240000, status: 'pending', orderedAt: '2024-01-15 10:15' },
  { id: 5, orderNo: 'ORD-2024-0005', store: '청담안경', brand: '칼자이스', product: '드라이브세이프', sph: '-4.00', cyl: '-1.25', quantity: 1, amount: 350000, status: 'confirmed', orderedAt: '2024-01-15 09:30' },
]

export default function OrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [searchValue, setSearchValue] = useState('')

  const columns: Column<OrderItem>[] = [
    { key: 'orderNo', label: '주문번호', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'store', label: '가맹점' },
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#86868b' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명' },
    { key: 'sph', label: '도수', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
        S{row.sph} C{row.cyl}
      </span>
    )},
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
        {v as number}
      </span>
    )},
    { key: 'amount', label: '금액', align: 'right', render: (v) => `${(v as number).toLocaleString()}원` },
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'orderedAt', label: '주문일시', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
  ]

  const filteredOrders = filter === 'all' 
    ? sampleOrders 
    : sampleOrders.filter(o => o.status === filter)

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      alert('출력할 주문을 선택해주세요.')
      return
    }
    window.print()
  }

  const handleExport = () => {
    alert('엑셀 다운로드')
  }

  return (
    <AdminLayout activeMenu="order">
      <StatCardGrid>
        <StatCard label="오늘 주문" value={12} unit="건" icon="📦" />
        <StatCard label="대기중" value={5} unit="건" highlight />
        <StatCard label="출고완료" value={7} unit="건" />
        <StatCard label="총 매출" value="1,250,000" unit="원" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        onSearch={setSearchValue}
        dateRange
        actions={
          <>
            <OutlineButton onClick={handlePrint}>🖨️ 출력</OutlineButton>
            <OutlineButton onClick={handleExport}>📥 엑셀</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '대기', value: 'pending' },
            { label: '확인', value: 'confirmed' },
            { label: '출고', value: 'shipped' },
            { label: '완료', value: 'delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="주문 내역이 없습니다"
      />

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
          <span style={{ color: '#007aff', fontWeight: 500 }}>{selectedIds.size}개 선택됨</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>대기처리</button>
            <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>발송준비</button>
            <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>발송완료</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
