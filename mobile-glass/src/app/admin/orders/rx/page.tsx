'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

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

const sampleOrders: RxOrder[] = [
  { id: 1, orderNo: 'RX-2024-0001', store: '강남안경', brand: '에실로', product: '바리락스 X', rightSph: '-2.00', rightCyl: '-0.50', rightAxis: '180', leftSph: '-2.25', leftCyl: '-0.75', leftAxis: '175', pd: '62', add: '+2.00', quantity: 1, amount: 350000, status: 'pending', orderedAt: '2024-01-15 14:30' },
  { id: 2, orderNo: 'RX-2024-0002', store: '역삼안경원', brand: '호야', product: '루스나', rightSph: '-3.00', rightCyl: '-1.00', rightAxis: '90', leftSph: '-2.75', leftCyl: '-0.75', leftAxis: '85', pd: '64', add: '+1.50', quantity: 1, amount: 280000, status: 'shipped', orderedAt: '2024-01-15 13:20' },
  { id: 3, orderNo: 'RX-2024-0003', store: '신사안경', brand: '칼자이스', product: '프로그레시브', rightSph: '-1.50', rightCyl: '-0.25', rightAxis: '170', leftSph: '-1.75', leftCyl: '-0.50', leftAxis: '165', pd: '60', add: '+2.50', quantity: 1, amount: 450000, status: 'delivered', orderedAt: '2024-01-15 11:45' },
  { id: 4, orderNo: 'RX-2024-0004', store: '압구정광학', brand: '니콘', product: '프레지오', rightSph: '-4.00', rightCyl: '-1.25', rightAxis: '5', leftSph: '-3.75', leftCyl: '-1.00', leftAxis: '175', pd: '66', add: '+1.75', quantity: 1, amount: 320000, status: 'pending', orderedAt: '2024-01-15 10:15' },
]

export default function RxOrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

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

  const filteredOrders = filter === 'all' 
    ? sampleOrders 
    : sampleOrders.filter(o => o.status === filter)

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        RX 주문내역
      </h2>

      <StatCardGrid>
        <StatCard label="이번 달 RX 주문" value={47} unit="건" icon="👓" />
        <StatCard label="제작 대기" value={8} unit="건" highlight />
        <StatCard label="총 주문금액" value="14,100,000" unit="원" />
        <StatCard label="평균 단가" value="300,000" unit="원" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        dateRange
        filters={[
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
            { label: '니콘', value: 'nikon' },
          ]},
          { label: '렌즈타입', key: 'type', options: [
            { label: '누진다초점', value: 'progressive' },
            { label: '단초점', value: 'single' },
            { label: '이중초점', value: 'bifocal' },
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
            { label: '제작중', value: 'confirmed' },
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
        emptyMessage="RX 주문 내역이 없습니다"
      />

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
    </AdminLayout>
  )
}
