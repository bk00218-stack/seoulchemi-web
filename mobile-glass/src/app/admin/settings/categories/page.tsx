'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Category {
  id: number
  code: string
  name: string
  type: string
  description: string
  sortOrder: number
  isActive: boolean
}

const sampleData: Category[] = [
  { id: 1, code: 'CAT01', name: '단초점', type: '렌즈타입', description: '일반 단초점 렌즈', sortOrder: 1, isActive: true },
  { id: 2, code: 'CAT02', name: '누진다초점', type: '렌즈타입', description: '누진 다초점 렌즈', sortOrder: 2, isActive: true },
  { id: 3, code: 'CAT03', name: '이중초점', type: '렌즈타입', description: '이중 초점 렌즈', sortOrder: 3, isActive: false },
  { id: 4, code: 'IDX01', name: '1.56', type: '굴절률', description: '저굴절 렌즈', sortOrder: 1, isActive: true },
  { id: 5, code: 'IDX02', name: '1.60', type: '굴절률', description: '중굴절 렌즈', sortOrder: 2, isActive: true },
  { id: 6, code: 'IDX03', name: '1.67', type: '굴절률', description: '고굴절 렌즈', sortOrder: 3, isActive: true },
  { id: 7, code: 'IDX04', name: '1.74', type: '굴절률', description: '초고굴절 렌즈', sortOrder: 4, isActive: true },
]

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [filterType, setFilterType] = useState('all')

  const columns: Column<Category>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '구분명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'type', label: '타입', render: (v) => (
      <span style={{ 
        background: v === '렌즈타입' ? '#e3f2fd' : '#e8f5e9',
        color: v === '렌즈타입' ? '#007aff' : '#34c759',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as string}
      </span>
    )},
    { key: 'description', label: '설명', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'sortOrder', label: '순서', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}</span>
    )},
    { key: 'isActive', label: '상태', render: (v) => (
      <span style={{ 
        padding: '3px 8px', 
        borderRadius: '4px', 
        background: v ? '#e8f5e9' : '#f5f5f5',
        color: v ? '#34c759' : '#86868b',
        fontSize: '11px',
        fontWeight: 500
      }}>
        {v ? '활성' : '비활성'}
      </span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingCategory(row); setShowModal(true); }}
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

  const filteredData = filterType === 'all' 
    ? sampleData 
    : sampleData.filter(c => c.type === filterType)

  const types = [...new Set(sampleData.map(c => c.type))]

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        구분설정
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {types.map((type) => (
          <div key={type} style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>{type}</div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
              {sampleData.filter(c => c.type === type).length}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
            </div>
          </div>
        ))}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>비활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {sampleData.filter(c => !c.isActive).length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="구분명 검색"
        filters={[
          { label: '타입', key: 'type', options: [
            { label: '렌즈타입', value: '렌즈타입' },
            { label: '굴절률', value: '굴절률' },
          ], value: filterType === 'all' ? '' : filterType, onChange: (v) => setFilterType(v || 'all') }
        ]}
        actions={
          <button
            onClick={() => { setEditingCategory(null); setShowModal(true); }}
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
            + 구분 추가
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="등록된 구분이 없습니다"
      />

      {/* 모달 */}
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
              {editingCategory ? '구분 수정' : '구분 추가'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>코드</label>
                <input type="text" defaultValue={editingCategory?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>구분명 *</label>
                <input type="text" defaultValue={editingCategory?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>타입 *</label>
              <select defaultValue={editingCategory?.type} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="">선택</option>
                <option value="렌즈타입">렌즈타입</option>
                <option value="굴절률">굴절률</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input type="text" defaultValue={editingCategory?.description} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>정렬순서</label>
                <input type="number" defaultValue={editingCategory?.sortOrder} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={editingCategory?.isActive !== false} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px' }}>활성화</span>
                </label>
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
