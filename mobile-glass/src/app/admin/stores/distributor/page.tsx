'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface DistributorRequest {
  id: number
  storeName: string
  storePhone: string
  distributorCode: string
  distributorName: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  processedAt: string | null
  processedBy: string | null
  memo: string
}

const sampleData: DistributorRequest[] = [
  { id: 1, storeName: '강남안경', storePhone: '02-1234-5678', distributorCode: 'DIST001', distributorName: '서울광학유통', requestedAt: '2024-01-15 14:30', status: 'pending', processedAt: null, processedBy: null, memo: '' },
  { id: 2, storeName: '역삼안경원', storePhone: '02-2345-6789', distributorCode: 'DIST002', distributorName: '강남렌즈유통', requestedAt: '2024-01-14 11:20', status: 'pending', processedAt: null, processedBy: null, memo: '' },
  { id: 3, storeName: '신사안경', storePhone: '02-3456-7890', distributorCode: 'DIST001', distributorName: '서울광학유통', requestedAt: '2024-01-13 16:45', status: 'approved', processedAt: '2024-01-13 17:00', processedBy: '관리자', memo: '' },
  { id: 4, storeName: '압구정광학', storePhone: '02-4567-8901', distributorCode: 'DIST003', distributorName: '프리미엄옵틱스', requestedAt: '2024-01-12 09:30', status: 'rejected', processedAt: '2024-01-12 10:15', processedBy: '관리자', memo: '유통사 코드 불일치' },
  { id: 5, storeName: '청담안경', storePhone: '02-5678-9012', distributorCode: 'DIST001', distributorName: '서울광학유통', requestedAt: '2024-01-10 13:20', status: 'approved', processedAt: '2024-01-10 14:00', processedBy: '관리자', memo: '' },
]

const statusLabels = {
  pending: { bg: '#fff3e0', color: '#ff9500', label: '대기' },
  approved: { bg: '#e8f5e9', color: '#34c759', label: '승인' },
  rejected: { bg: '#ffebee', color: '#ff3b30', label: '거절' },
}

export default function DistributorPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const columns: Column<DistributorRequest>[] = [
    { key: 'storeName', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'storePhone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'distributorCode', label: '유통사 코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'distributorName', label: '유통사명', render: (v) => (
      <span style={{ color: '#666' }}>{v as string}</span>
    )},
    { key: 'requestedAt', label: '요청일시', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'status', label: '상태', render: (v) => {
      const s = statusLabels[v as keyof typeof statusLabels]
      return (
        <span style={{ 
          padding: '3px 8px', 
          borderRadius: '4px', 
          background: s.bg,
          color: s.color,
          fontSize: '11px',
          fontWeight: 500
        }}>
          {s.label}
        </span>
      )
    }},
    { key: 'id', label: '처리', align: 'center', render: (_, row) => (
      row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={() => alert(`${row.storeName} 승인`)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: '#e8f5e9',
              color: '#34c759',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            승인
          </button>
          <button
            onClick={() => alert(`${row.storeName} 거절`)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: '#ffebee',
              color: '#ff3b30',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            거절
          </button>
        </div>
      ) : (
        <span style={{ color: '#86868b', fontSize: '12px' }}>
          {row.processedAt?.split(' ')[0]}
        </span>
      )
    )},
  ]

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(s => s.status === filter)

  const pendingCount = sampleData.filter(s => s.status === 'pending').length

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        유통사 코드 승인
      </h2>

      {pendingCount > 0 && (
        <div style={{ 
          background: '#fff3e0', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '24px',
          border: '1px solid #ff950020'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#ff9500' }}>승인 대기 중인 요청이 있습니다</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {pendingCount}건의 유통사 코드 승인 요청을 처리해주세요.
              </div>
            </div>
          </div>
        </div>
      )}

      <StatCardGrid>
        <StatCard label="전체 요청" value={sampleData.length} unit="건" icon="📋" />
        <StatCard label="대기중" value={pendingCount} unit="건" highlight />
        <StatCard label="승인" value={sampleData.filter(s => s.status === 'approved').length} unit="건" />
        <StatCard label="거절" value={sampleData.filter(s => s.status === 'rejected').length} unit="건" />
      </StatCardGrid>

      <SearchFilter
        placeholder="안경원명, 유통사 검색"
        dateRange
        actions={
          <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '대기', value: 'pending' },
            { label: '승인', value: 'approved' },
            { label: '거절', value: 'rejected' },
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
        emptyMessage="유통사 코드 요청이 없습니다"
      />

      {selectedIds.size > 0 && filter === 'all' && (
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
            <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>일괄 승인</button>
            <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff3b30', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>일괄 거절</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
