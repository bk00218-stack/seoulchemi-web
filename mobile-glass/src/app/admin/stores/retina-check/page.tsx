'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface RetinaStore {
  id: number
  code: string
  name: string
  phone: string
  retinaStatus: 'registered' | 'not_registered' | 'pending'
  retinaId: string | null
  checkedAt: string | null
  linkedAt: string | null
}

const sampleData: RetinaStore[] = [
  { id: 1, code: 'ST001', name: '강남안경', phone: '02-1234-5678', retinaStatus: 'registered', retinaId: 'RET001', checkedAt: '2024-01-15', linkedAt: '2024-01-10' },
  { id: 2, code: 'ST002', name: '역삼안경원', phone: '02-2345-6789', retinaStatus: 'registered', retinaId: 'RET002', checkedAt: '2024-01-15', linkedAt: '2024-01-12' },
  { id: 3, code: 'ST003', name: '신사안경', phone: '02-3456-7890', retinaStatus: 'not_registered', retinaId: null, checkedAt: '2024-01-15', linkedAt: null },
  { id: 4, code: 'ST004', name: '압구정광학', phone: '02-4567-8901', retinaStatus: 'pending', retinaId: null, checkedAt: '2024-01-14', linkedAt: null },
  { id: 5, code: 'ST005', name: '청담안경', phone: '02-5678-9012', retinaStatus: 'registered', retinaId: 'RET005', checkedAt: '2024-01-13', linkedAt: '2024-01-05' },
]

const statusLabels = {
  registered: { bg: '#e8f5e9', color: '#34c759', label: '가입완료' },
  not_registered: { bg: '#ffebee', color: '#ff3b30', label: '미가입' },
  pending: { bg: '#fff3e0', color: '#ff9500', label: '확인중' },
}

export default function RetinaCheckPage() {
  const [filter, setFilter] = useState('all')

  const columns: Column<RetinaStore>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'phone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'retinaStatus', label: '레티나 상태', render: (v) => {
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
    { key: 'retinaId', label: '레티나 ID', render: (v) => (
      v ? (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#007aff' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7' }}>-</span>
      )
    )},
    { key: 'checkedAt', label: '확인일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string || '-'}</span>
    )},
    { key: 'linkedAt', label: '연동일', render: (v) => (
      v ? (
        <span style={{ color: '#34c759', fontSize: '12px' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7' }}>-</span>
      )
    )},
    { key: 'id', label: '확인', align: 'center', render: (_, row) => (
      <button
        onClick={() => alert(`${row.name} 레티나 가입 확인 중...`)}
        style={{
          padding: '4px 10px',
          borderRadius: '4px',
          background: row.retinaStatus === 'registered' ? '#e8f5e9' : '#f5f5f7',
          color: row.retinaStatus === 'registered' ? '#34c759' : '#007aff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        {row.retinaStatus === 'registered' ? '확인완료' : '확인하기'}
      </button>
    )},
  ]

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(s => s.retinaStatus === filter)

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        레티나 가입여부 확인
      </h2>

      <StatCardGrid>
        <StatCard label="전체 가맹점" value={sampleData.length} unit="개" icon="🏪" />
        <StatCard label="레티나 가입" value={sampleData.filter(s => s.retinaStatus === 'registered').length} unit="개" />
        <StatCard label="미가입" value={sampleData.filter(s => s.retinaStatus === 'not_registered').length} unit="개" highlight />
        <StatCard label="확인중" value={sampleData.filter(s => s.retinaStatus === 'pending').length} unit="개" />
      </StatCardGrid>

      <SearchFilter
        placeholder="안경원명, 코드 검색"
        actions={
          <>
            <OutlineButton onClick={() => alert('전체 가맹점 레티나 가입여부 확인')}>🔄 일괄 확인</OutlineButton>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '가입완료', value: 'registered' },
            { label: '미가입', value: 'not_registered' },
            { label: '확인중', value: 'pending' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="가맹점이 없습니다"
      />
    </AdminLayout>
  )
}
