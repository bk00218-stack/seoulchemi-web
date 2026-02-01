'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface Store {
  id: number
  code: string
  name: string
  group: string
  owner: string
  phone: string
  address: string
  joinDate: string
  lastOrderDate: string
  status: string
}

const sampleData: Store[] = [
  { id: 1, code: 'ST001', name: '강남안경', group: 'A그룹', owner: '김강남', phone: '02-1234-5678', address: '서울 강남구 테헤란로 123', joinDate: '2023-01-15', lastOrderDate: '2024-01-15', status: 'active' },
  { id: 2, code: 'ST002', name: '역삼안경원', group: 'A그룹', owner: '이역삼', phone: '02-2345-6789', address: '서울 강남구 역삼동 456', joinDate: '2023-02-20', lastOrderDate: '2024-01-14', status: 'active' },
  { id: 3, code: 'ST003', name: '신사안경', group: 'B그룹', owner: '박신사', phone: '02-3456-7890', address: '서울 강남구 신사동 789', joinDate: '2023-03-10', lastOrderDate: '2024-01-10', status: 'active' },
  { id: 4, code: 'ST004', name: '압구정광학', group: 'A그룹', owner: '최압구정', phone: '02-4567-8901', address: '서울 강남구 압구정로 321', joinDate: '2023-04-05', lastOrderDate: '2024-01-12', status: 'active' },
  { id: 5, code: 'ST005', name: '청담안경', group: 'C그룹', owner: '정청담', phone: '02-5678-9012', address: '서울 강남구 청담동 555', joinDate: '2023-05-15', lastOrderDate: '2023-12-20', status: 'inactive' },
]

export default function StoresPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  const columns: Column<Store>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'group', label: '그룹', render: (v) => (
      <span style={{ 
        background: v === 'A그룹' ? '#e3f2fd' : v === 'B그룹' ? '#e8f5e9' : '#fff3e0',
        color: v === 'A그룹' ? '#007aff' : v === 'B그룹' ? '#34c759' : '#ff9500',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as string}
      </span>
    )},
    { key: 'owner', label: '대표자' },
    { key: 'phone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'address', label: '주소', width: '200px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'lastOrderDate', label: '최근주문', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingStore(row); setShowModal(true); }}
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
        수정
      </button>
    )},
  ]

  const filteredData = filter === 'all' 
    ? sampleData 
    : sampleData.filter(s => s.status === filter)

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 관리
      </h2>

      <StatCardGrid>
        <StatCard label="총 가맹점" value={sampleData.length} unit="개" icon="🏪" />
        <StatCard label="활성" value={sampleData.filter(s => s.status === 'active').length} unit="개" />
        <StatCard label="이번 달 신규" value={2} unit="개" highlight />
        <StatCard label="그룹 수" value={3} unit="개" />
      </StatCardGrid>

      <SearchFilter
        placeholder="가맹점명, 코드, 연락처 검색"
        filters={[
          { label: '그룹', key: 'group', options: [
            { label: 'A그룹', value: 'A' },
            { label: 'B그룹', value: 'B' },
            { label: 'C그룹', value: 'C' },
          ]},
          { label: '지역', key: 'region', options: [
            { label: '서울', value: 'seoul' },
            { label: '경기', value: 'gyeonggi' },
            { label: '인천', value: 'incheon' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
            <button
              onClick={() => { setEditingStore(null); setShowModal(true); }}
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
              + 가맹점 등록
            </button>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '활성', value: 'active' },
            { label: '비활성', value: 'inactive' },
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
        emptyMessage="등록된 가맹점이 없습니다"
      />

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '520px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingStore ? '가맹점 수정' : '가맹점 등록'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>가맹점 코드</label>
                <input type="text" defaultValue={editingStore?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>안경원명 *</label>
                <input type="text" defaultValue={editingStore?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>대표자</label>
                <input type="text" defaultValue={editingStore?.owner} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처 *</label>
                <input type="tel" defaultValue={editingStore?.phone} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>주소</label>
              <input type="text" defaultValue={editingStore?.address} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹</label>
                <select defaultValue={editingStore?.group} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="">선택</option>
                  <option value="A그룹">A그룹</option>
                  <option value="B그룹">B그룹</option>
                  <option value="C그룹">C그룹</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
                <select defaultValue={editingStore?.status || 'active'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { alert('저장되었습니다.'); setShowModal(false); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
