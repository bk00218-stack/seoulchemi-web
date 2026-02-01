'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface IntegrationStore {
  id: number
  code: string
  name: string
  retinaId: string
  optCoreId: string
  integrationStatus: 'integrated' | 'pending' | 'not_integrated'
  lastSyncAt: string | null
  totalOrders: number
  totalAmount: number
}

const sampleData: IntegrationStore[] = [
  { id: 1, code: 'ST001', name: '강남안경', retinaId: 'RET001', optCoreId: 'OPT001', integrationStatus: 'integrated', lastSyncAt: '2024-01-15 14:30', totalOrders: 156, totalAmount: 12500000 },
  { id: 2, code: 'ST002', name: '역삼안경원', retinaId: 'RET002', optCoreId: 'OPT002', integrationStatus: 'integrated', lastSyncAt: '2024-01-15 13:45', totalOrders: 98, totalAmount: 8700000 },
  { id: 3, code: 'ST003', name: '신사안경', retinaId: 'RET003', optCoreId: 'OPT003', integrationStatus: 'pending', lastSyncAt: null, totalOrders: 45, totalAmount: 3200000 },
  { id: 4, code: 'ST004', name: '압구정광학', retinaId: 'RET004', optCoreId: 'OPT004', integrationStatus: 'not_integrated', lastSyncAt: null, totalOrders: 0, totalAmount: 0 },
  { id: 5, code: 'ST005', name: '청담안경', retinaId: 'RET005', optCoreId: 'OPT005', integrationStatus: 'integrated', lastSyncAt: '2024-01-15 12:00', totalOrders: 234, totalAmount: 19800000 },
]

const statusLabels = {
  integrated: { bg: '#e8f5e9', color: '#34c759', label: '연동완료' },
  pending: { bg: '#fff3e0', color: '#ff9500', label: '연동중' },
  not_integrated: { bg: '#f5f5f5', color: '#86868b', label: '미연동' },
}

export default function IntegrationPage() {
  const [filter, setFilter] = useState('all')

  const columns: Column<IntegrationStore>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'retinaId', label: '레티나 ID', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'optCoreId', label: 'OptiCore ID', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#af52de' }}>{v as string}</span>
    )},
    { key: 'integrationStatus', label: '연동상태', render: (v) => {
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
    { key: 'lastSyncAt', label: '최근 동기화', render: (v) => (
      v ? (
        <span style={{ color: '#666', fontSize: '12px' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7' }}>-</span>
      )
    )},
    { key: 'totalOrders', label: '주문수', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}</span>
    )},
    { key: 'totalAmount', label: '정산금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{((v as number) / 10000).toLocaleString()}만원</span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      row.integrationStatus === 'integrated' ? (
        <button
          onClick={() => alert(`${row.name} 동기화 시작`)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#e3f2fd',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          동기화
        </button>
      ) : row.integrationStatus === 'pending' ? (
        <span style={{ color: '#ff9500', fontSize: '12px' }}>진행중...</span>
      ) : (
        <button
          onClick={() => alert(`${row.name} 연동 시작`)}
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
          연동하기
        </button>
      )
    )},
  ]

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(s => s.integrationStatus === filter)

  const integratedStores = sampleData.filter(s => s.integrationStatus === 'integrated')
  const totalAmount = integratedStores.reduce((sum, s) => sum + s.totalAmount, 0)

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        레티나 가맹점 정산통합
      </h2>

      <div style={{ 
        background: '#f0f7ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔗</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#007aff' }}>정산 통합 안내</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              레티나와 OptiCore 가맹점 계정을 연동하여 정산 데이터를 통합 관리합니다.
              연동된 가맹점은 두 시스템의 주문 및 정산 내역을 한 곳에서 확인할 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      <StatCardGrid>
        <StatCard label="전체 가맹점" value={sampleData.length} unit="개" icon="🏪" />
        <StatCard label="연동 완료" value={integratedStores.length} unit="개" />
        <StatCard label="통합 정산액" value={(totalAmount / 10000).toLocaleString()} unit="만원" highlight />
        <StatCard label="총 주문" value={integratedStores.reduce((sum, s) => sum + s.totalOrders, 0)} unit="건" />
      </StatCardGrid>

      <SearchFilter
        placeholder="안경원명, ID 검색"
        actions={
          <>
            <OutlineButton onClick={() => alert('전체 동기화')}>🔄 전체 동기화</OutlineButton>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '연동완료', value: 'integrated' },
            { label: '연동중', value: 'pending' },
            { label: '미연동', value: 'not_integrated' },
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
