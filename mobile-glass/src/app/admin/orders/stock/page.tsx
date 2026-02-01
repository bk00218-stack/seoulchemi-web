'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface StockOrder {
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

const sampleOrders: StockOrder[] = [
  { id: 1, orderNo: 'STK-2024-0001', store: '강남안경', brand: '에실로', product: '크리잘 사파이어', sph: '-2.00', cyl: '-0.50', quantity: 10, amount: 500000, status: 'pending', orderedAt: '2024-01-15 14:30' },
  { id: 2, orderNo: 'STK-2024-0002', store: '역삼안경원', brand: '호야', product: '블루컨트롤', sph: '-3.00', cyl: '-0.75', quantity: 20, amount: 850000, status: 'shipped', orderedAt: '2024-01-15 13:20' },
  { id: 3, orderNo: 'STK-2024-0003', store: '신사안경', brand: '니콘', product: '라이트 4', sph: '-1.50', cyl: '0.00', quantity: 30, amount: 1200000, status: 'delivered', orderedAt: '2024-01-15 11:45' },
  { id: 4, orderNo: 'STK-2024-0004', store: '압구정광학', brand: '에실로', product: '바리락스 X', sph: '-2.50', cyl: '-1.00', quantity: 15, amount: 900000, status: 'pending', orderedAt: '2024-01-15 10:15' },
  { id: 5, orderNo: 'STK-2024-0005', store: '청담안경', brand: '칼자이스', product: '클리어뷰', sph: '-4.00', cyl: '-0.50', quantity: 8, amount: 640000, status: 'confirmed', orderedAt: '2024-01-15 09:30' },
]

export default function StockOrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const columns: Column<StockOrder>[] = [
    { key: 'orderNo', label: '주문번호', render: (v) => <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span> },
    { key: 'store', label: '가맹점' },
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'sph', label: 'SPH/CYL', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
        {row.sph} / {row.cyl}
      </span>
    )},
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ background: '#fff3e0', color: '#ff9500', padding: '2px 10px', borderRadius: '4px', fontWeight: 600 }}>
        {v as number}
      </span>
    )},
    { key: 'amount', label: '금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'orderedAt', label: '주문일시', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
  ]

  const filteredOrders = filter === 'all' 
    ? sampleOrders 
    : sampleOrders.filter(o => o.status === filter)

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        여벌 주문내역
      </h2>

      <StatCardGrid>
        <StatCard label="이번 달 여벌 주문" value={83} unit="건" icon="📦" />
        <StatCard label="대기중" value={12} unit="건" highlight />
        <StatCard label="총 주문금액" value="4,090,000" unit="원" />
        <StatCard label="평균 주문량" value={15} unit="개" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        dateRange
        filters={[
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '니콘', value: 'nikon' },
            { label: '칼자이스', value: 'zeiss' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => window.print()}>🖨️ 출력</OutlineButton>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
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
        emptyMessage="여벌 주문 내역이 없습니다"
      />
    </AdminLayout>
  )
}
