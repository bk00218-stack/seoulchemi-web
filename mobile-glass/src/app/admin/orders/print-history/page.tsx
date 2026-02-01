'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface PrintHistory {
  id: number
  printedAt: string
  orderNo: string
  store: string
  printType: string
  printedBy: string
  pageCount: number
}

const sampleData: PrintHistory[] = [
  { id: 1, printedAt: '2024-01-15 16:30:22', orderNo: 'ORD-2024-0001', store: '강남안경', printType: '거래명세서', printedBy: '관리자', pageCount: 1 },
  { id: 2, printedAt: '2024-01-15 15:45:10', orderNo: 'ORD-2024-0002', store: '역삼안경원', printType: '출고명세서', printedBy: '관리자', pageCount: 2 },
  { id: 3, printedAt: '2024-01-15 14:20:33', orderNo: 'RX-2024-0001', store: '신사안경', printType: '거래명세서', printedBy: '관리자', pageCount: 1 },
  { id: 4, printedAt: '2024-01-15 13:15:44', orderNo: 'STK-2024-0003', store: '압구정광학', printType: '납품확인서', printedBy: '관리자', pageCount: 1 },
  { id: 5, printedAt: '2024-01-15 11:30:55', orderNo: 'ORD-2024-0005', store: '청담안경', printType: '거래명세서', printedBy: '김대리', pageCount: 3 },
  { id: 6, printedAt: '2024-01-14 17:20:11', orderNo: 'ORD-2024-0004', store: '강남안경', printType: '출고명세서', printedBy: '관리자', pageCount: 1 },
  { id: 7, printedAt: '2024-01-14 16:10:22', orderNo: 'RX-2024-0002', store: '선릉안경', printType: '거래명세서', printedBy: '관리자', pageCount: 2 },
]

export default function PrintHistoryPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const columns: Column<PrintHistory>[] = [
    { key: 'printedAt', label: '출력일시', render: (v) => (
      <span style={{ color: '#1d1d1f', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'orderNo', label: '주문번호', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'store', label: '가맹점' },
    { key: 'printType', label: '출력유형', render: (v) => (
      <span style={{ 
        background: v === '거래명세서' ? '#e8f5e9' : v === '출고명세서' ? '#e3f2fd' : '#fff3e0',
        color: v === '거래명세서' ? '#2e7d32' : v === '출고명세서' ? '#007aff' : '#ff9500',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v as string}
      </span>
    )},
    { key: 'printedBy', label: '출력자', render: (v) => (
      <span style={{ color: '#666' }}>{v as string}</span>
    )},
    { key: 'pageCount', label: '페이지', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}장</span>
    )},
    { key: 'id', label: '재출력', align: 'center', render: (v) => (
      <button
        onClick={() => alert(`주문 ${v} 재출력`)}
        style={{
          padding: '4px 10px',
          borderRadius: '4px',
          background: '#f5f5f7',
          color: '#007aff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        🖨️ 재출력
      </button>
    )},
  ]

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        명세표 출력이력
      </h2>

      <StatCardGrid>
        <StatCard label="오늘 출력" value={5} unit="건" icon="🖨️" />
        <StatCard label="이번 주 출력" value={32} unit="건" />
        <StatCard label="이번 달 출력" value={147} unit="건" />
        <StatCard label="총 페이지" value={203} unit="장" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        dateRange
        filters={[
          { label: '출력유형', key: 'type', options: [
            { label: '거래명세서', value: 'invoice' },
            { label: '출고명세서', value: 'shipping' },
            { label: '납품확인서', value: 'delivery' },
          ]},
          { label: '출력자', key: 'user', options: [
            { label: '관리자', value: 'admin' },
            { label: '김대리', value: 'kim' },
          ]}
        ]}
        actions={
          <OutlineButton onClick={() => alert('출력 이력 내보내기')}>📥 내보내기</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="출력 이력이 없습니다"
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
          총 {sampleData.length}건의 출력 이력
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              if (selectedIds.size === 0) {
                alert('선택된 항목이 없습니다.')
                return
              }
              alert(`${selectedIds.size}건 일괄 재출력`)
            }}
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
            선택 재출력
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
