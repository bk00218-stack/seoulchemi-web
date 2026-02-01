'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface PurchaseItem {
  id: number
  purchaseNo: string
  date: string
  supplier: string
  brand: string
  product: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
}

const sampleData: PurchaseItem[] = [
  { id: 1, purchaseNo: 'PUR-2024-0001', date: '2024-01-15', supplier: '에실로코리아', brand: '에실로', product: '크리잘 사파이어 1.60', quantity: 100, unitPrice: 45000, totalPrice: 4500000, status: 'completed' },
  { id: 2, purchaseNo: 'PUR-2024-0002', date: '2024-01-14', supplier: '호야광학', brand: '호야', product: '블루컨트롤 1.60', quantity: 80, unitPrice: 38000, totalPrice: 3040000, status: 'completed' },
  { id: 3, purchaseNo: 'PUR-2024-0003', date: '2024-01-13', supplier: '칼자이스코리아', brand: '칼자이스', product: '드라이브세이프 1.67', quantity: 30, unitPrice: 120000, totalPrice: 3600000, status: 'pending' },
  { id: 4, purchaseNo: 'PUR-2024-0004', date: '2024-01-12', supplier: '니콘광학', brand: '니콘', product: '씨맥스 1.60', quantity: 50, unitPrice: 42000, totalPrice: 2100000, status: 'completed' },
  { id: 5, purchaseNo: 'PUR-2024-0005', date: '2024-01-11', supplier: '에실로코리아', brand: '에실로', product: '바리락스 X 1.60', quantity: 40, unitPrice: 85000, totalPrice: 3400000, status: 'cancelled' },
]

const statusMap = {
  pending: { bg: '#fff3e0', color: '#ff9500', label: '입고대기' },
  completed: { bg: '#e8f5e9', color: '#34c759', label: '입고완료' },
  cancelled: { bg: '#ffebee', color: '#ff3b30', label: '취소' },
}

export default function PurchasePage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const columns: Column<PurchaseItem>[] = [
    { key: 'purchaseNo', label: '매입번호', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'date', label: '일자', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'supplier', label: '매입처', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명' },
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ fontWeight: 600 }}>{(v as number).toLocaleString()}</span>
    )},
    { key: 'unitPrice', label: '단가', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'totalPrice', label: '합계', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => {
      const s = statusMap[v as keyof typeof statusMap] || statusMap.pending
      return (
        <span style={{ padding: '3px 8px', borderRadius: '4px', background: s.bg, color: s.color, fontSize: '11px', fontWeight: 500 }}>
          {s.label}
        </span>
      )
    }},
  ]

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(item => item.status === filter)

  const totalAmount = sampleData.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.totalPrice, 0)

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입내역
      </h2>

      <StatCardGrid>
        <StatCard label="이번 달 매입" value={16} unit="건" icon="📥" />
        <StatCard label="입고 대기" value={3} unit="건" highlight />
        <StatCard label="총 매입금액" value={(totalAmount / 10000).toLocaleString()} unit="만원" />
        <StatCard label="매입처" value={8} unit="곳" />
      </StatCardGrid>

      <SearchFilter
        placeholder="매입번호, 상품명 검색"
        dateRange
        filters={[
          { label: '매입처', key: 'supplier', options: [
            { label: '에실로코리아', value: 'essilor' },
            { label: '호야광학', value: 'hoya' },
            { label: '칼자이스코리아', value: 'zeiss' },
            { label: '니콘광학', value: 'nikon' },
          ]},
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
            { label: '니콘', value: 'nikon' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
            <button
              onClick={() => window.location.href = '/admin/purchase/new'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              + 매입등록
            </button>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '입고대기', value: 'pending' },
            { label: '입고완료', value: 'completed' },
            { label: '취소', value: 'cancelled' },
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
        emptyMessage="매입 내역이 없습니다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#fff', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#86868b' }}>
          총 {filteredData.length}건
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>
          합계: {filteredData.reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()}원
        </span>
      </div>
    </AdminLayout>
  )
}
