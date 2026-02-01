'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton, PrimaryButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface ShippingItem {
  id: number
  orderNo: string
  store: string
  address: string
  items: string
  quantity: number
  status: string
  expectedDate: string
  trackingNo: string
}

const sampleData: ShippingItem[] = [
  { id: 1, orderNo: 'ORD-2024-0001', store: '강남안경', address: '서울 강남구 테헤란로 123', items: '크리잘 블루컷 외 1종', quantity: 3, status: 'ready', expectedDate: '2024-01-16', trackingNo: '' },
  { id: 2, orderNo: 'ORD-2024-0002', store: '역삼안경원', address: '서울 강남구 역삼동 456', items: '블루컨트롤', quantity: 2, status: 'shipped', expectedDate: '2024-01-16', trackingNo: '1234567890' },
  { id: 3, orderNo: 'ORD-2024-0003', store: '신사안경', address: '서울 강남구 신사동 789', items: '씨맥스 2종', quantity: 4, status: 'delivered', expectedDate: '2024-01-15', trackingNo: '9876543210' },
  { id: 4, orderNo: 'ORD-2024-0004', store: '압구정광학', address: '서울 강남구 압구정로 321', items: '바리락스', quantity: 2, status: 'ready', expectedDate: '2024-01-17', trackingNo: '' },
  { id: 5, orderNo: 'RX-2024-0001', store: '청담안경', address: '서울 강남구 청담동 555', items: '드라이브세이프', quantity: 1, status: 'preparing', expectedDate: '2024-01-18', trackingNo: '' },
]

const statusMap = {
  preparing: { bg: '#fff3e0', color: '#ff9500', label: '출고준비' },
  ready: { bg: '#e3f2fd', color: '#007aff', label: '출고대기' },
  shipped: { bg: '#e8f5e9', color: '#34c759', label: '배송중' },
  delivered: { bg: '#f3e5f5', color: '#af52de', label: '배송완료' },
}

export default function ShippingPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

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
    { key: 'expectedDate', label: '예상일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
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

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(item => item.status === filter)

  const handleStatusChange = (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('주문을 선택해주세요.')
      return
    }
    alert(`${selectedIds.size}건의 상태를 '${statusMap[newStatus as keyof typeof statusMap]?.label}'로 변경합니다.`)
  }

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        출고 확인
      </h2>

      <StatCardGrid>
        <StatCard label="출고 대기" value={8} unit="건" highlight icon="📦" />
        <StatCard label="배송 중" value={12} unit="건" icon="🚚" />
        <StatCard label="오늘 배송완료" value={5} unit="건" icon="✅" />
        <StatCard label="이번 주 총 출고" value={47} unit="건" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        dateRange
        actions={
          <>
            <OutlineButton onClick={() => window.print()}>🖨️ 출력</OutlineButton>
            <OutlineButton onClick={() => alert('송장 일괄등록')}>📋 송장등록</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '출고준비', value: 'preparing' },
            { label: '출고대기', value: 'ready' },
            { label: '배송중', value: 'shipped' },
            { label: '배송완료', value: 'delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="출고 내역이 없습니다"
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
          <span style={{ color: '#007aff', fontWeight: 500 }}>{selectedIds.size}건 선택됨</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleStatusChange('ready')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              출고대기
            </button>
            <button 
              onClick={() => handleStatusChange('shipped')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              배송시작
            </button>
            <button 
              onClick={() => handleStatusChange('delivered')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#af52de', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              배송완료
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
