'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Group {
  id: number
  name: string
  description: string
  storeCount: number
  discountRate: number
  createdAt: string
}

interface Store {
  id: number
  code: string
  name: string
  group: string
}

const groupsData: Group[] = [
  { id: 1, name: 'A그룹', description: 'VIP 가맹점', storeCount: 15, discountRate: 15, createdAt: '2023-01-01' },
  { id: 2, name: 'B그룹', description: '우수 가맹점', storeCount: 28, discountRate: 10, createdAt: '2023-01-01' },
  { id: 3, name: 'C그룹', description: '일반 가맹점', storeCount: 45, discountRate: 5, createdAt: '2023-01-01' },
  { id: 4, name: 'D그룹', description: '신규 가맹점', storeCount: 12, discountRate: 3, createdAt: '2023-06-01' },
]

const storesData: Store[] = [
  { id: 1, code: 'ST001', name: '강남안경', group: 'A그룹' },
  { id: 2, code: 'ST002', name: '역삼안경원', group: 'A그룹' },
  { id: 3, code: 'ST003', name: '신사안경', group: 'B그룹' },
  { id: 4, code: 'ST004', name: '압구정광학', group: 'B그룹' },
  { id: 5, code: 'ST005', name: '청담안경', group: 'C그룹' },
]

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const groupColumns: Column<Group>[] = [
    { key: 'name', label: '그룹명', render: (v) => (
      <span 
        style={{ fontWeight: 600, color: '#007aff', cursor: 'pointer' }}
        onClick={() => setSelectedGroup(groupsData.find(g => g.name === v) || null)}
      >
        {v as string}
      </span>
    )},
    { key: 'description', label: '설명', render: (v) => (
      <span style={{ color: '#666' }}>{v as string}</span>
    )},
    { key: 'storeCount', label: '가맹점 수', align: 'center', render: (v) => (
      <span style={{ 
        background: '#e3f2fd', 
        color: '#007aff', 
        padding: '3px 10px', 
        borderRadius: '12px', 
        fontSize: '13px',
        fontWeight: 500
      }}>
        {v as number}개
      </span>
    )},
    { key: 'discountRate', label: '기본 할인율', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500, color: '#34c759' }}>{v}%</span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingGroup(row); setShowModal(true); }}
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

  const storeColumns: Column<Store>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'group', label: '현재 그룹', render: (v) => (
      <span style={{ 
        background: '#e3f2fd',
        color: '#007aff',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as string}
      </span>
    )},
    { key: 'id', label: '그룹 변경', align: 'center', render: (_, row) => (
      <select 
        defaultValue={row.group}
        onChange={(e) => alert(`${row.name}을 ${e.target.value}로 변경`)}
        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e5e5', fontSize: '12px' }}
      >
        {groupsData.map(g => (
          <option key={g.id} value={g.name}>{g.name}</option>
        ))}
      </select>
    )},
  ]

  const filteredStores = selectedGroup 
    ? storesData.filter(s => s.group === selectedGroup.name)
    : storesData

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 가맹점 연결
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 그룹 목록 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>그룹 목록</h3>
            <button
              onClick={() => { setEditingGroup(null); setShowModal(true); }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              + 그룹 추가
            </button>
          </div>
          <DataTable
            columns={groupColumns}
            data={groupsData}
            emptyMessage="등록된 그룹이 없습니다"
          />
        </div>

        {/* 가맹점 목록 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
              {selectedGroup ? `${selectedGroup.name} 가맹점` : '전체 가맹점'}
            </h3>
            {selectedGroup && (
              <button
                onClick={() => setSelectedGroup(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: '#f5f5f7',
                  color: '#666',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                전체보기
              </button>
            )}
          </div>
          <DataTable
            columns={storeColumns}
            data={filteredStores}
            emptyMessage="가맹점이 없습니다"
          />
        </div>
      </div>

      {/* 그룹 등록/수정 모달 */}
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
            width: '400px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingGroup ? '그룹 수정' : '그룹 추가'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹명 *</label>
              <input type="text" defaultValue={editingGroup?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input type="text" defaultValue={editingGroup?.description} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>기본 할인율 (%)</label>
              <input type="number" defaultValue={editingGroup?.discountRate} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
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
