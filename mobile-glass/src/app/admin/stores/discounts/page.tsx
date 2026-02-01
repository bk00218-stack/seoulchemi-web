'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface GroupDiscount {
  id: number
  group: string
  brand: string
  category: string
  discountRate: number
  minOrder: number
  validFrom: string
  validTo: string
  isActive: boolean
}

const sampleData: GroupDiscount[] = [
  { id: 1, group: 'A그룹', brand: '전체', category: '전체', discountRate: 15, minOrder: 0, validFrom: '2024-01-01', validTo: '2024-12-31', isActive: true },
  { id: 2, group: 'A그룹', brand: '에실로', category: '누진다초점', discountRate: 20, minOrder: 10, validFrom: '2024-01-01', validTo: '2024-06-30', isActive: true },
  { id: 3, group: 'B그룹', brand: '전체', category: '전체', discountRate: 10, minOrder: 0, validFrom: '2024-01-01', validTo: '2024-12-31', isActive: true },
  { id: 4, group: 'B그룹', brand: '호야', category: '전체', discountRate: 12, minOrder: 5, validFrom: '2024-01-01', validTo: '2024-03-31', isActive: true },
  { id: 5, group: 'C그룹', brand: '전체', category: '전체', discountRate: 5, minOrder: 0, validFrom: '2024-01-01', validTo: '2024-12-31', isActive: true },
]

export default function DiscountsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<GroupDiscount | null>(null)

  const columns: Column<GroupDiscount>[] = [
    { key: 'group', label: '그룹', render: (v) => (
      <span style={{ 
        background: '#e3f2fd',
        color: '#007aff',
        padding: '3px 10px', 
        borderRadius: '4px', 
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v as string}
      </span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ fontWeight: v === '전체' ? 400 : 500, color: v === '전체' ? '#86868b' : '#1d1d1f' }}>
        {v as string}
      </span>
    )},
    { key: 'category', label: '카테고리', render: (v) => (
      <span style={{ color: v === '전체' ? '#86868b' : '#666' }}>{v as string}</span>
    )},
    { key: 'discountRate', label: '할인율', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: '#34c759',
        fontSize: '15px'
      }}>
        {v}%
      </span>
    )},
    { key: 'minOrder', label: '최소주문', align: 'center', render: (v) => (
      v === 0 ? (
        <span style={{ color: '#86868b' }}>-</span>
      ) : (
        <span>{v}개 이상</span>
      )
    )},
    { key: 'validFrom', label: '적용기간', render: (_, row) => (
      <span style={{ fontSize: '12px', color: '#666' }}>
        {row.validFrom} ~ {row.validTo}
      </span>
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
        {v ? '적용중' : '비활성'}
      </span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => { setEditingDiscount(row); setShowModal(true); }}
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
        <button
          onClick={() => alert('삭제하시겠습니까?')}
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
          삭제
        </button>
      </div>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 할인율 설정
      </h2>

      <div style={{ 
        background: '#f0f7ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#007aff' }}>할인율 적용 우선순위</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              1. 브랜드+카테고리 지정 → 2. 브랜드만 지정 → 3. 전체 기본 할인율 순으로 적용됩니다.
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {['A그룹', 'B그룹', 'C그룹', 'D그룹'].map((group, idx) => {
          const baseDiscount = sampleData.find(d => d.group === group && d.brand === '전체')?.discountRate || 0
          return (
            <div key={idx} style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
              <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>{group}</div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
                {baseDiscount}%
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>기본</span>
              </div>
            </div>
          )
        })}
      </div>

      <SearchFilter
        placeholder="그룹, 브랜드 검색"
        filters={[
          { label: '그룹', key: 'group', options: [
            { label: 'A그룹', value: 'A' },
            { label: 'B그룹', value: 'B' },
            { label: 'C그룹', value: 'C' },
          ]},
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
          ]}
        ]}
        actions={
          <button
            onClick={() => { setEditingDiscount(null); setShowModal(true); }}
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
            + 할인율 추가
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="설정된 할인율이 없습니다"
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
            width: '480px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingDiscount ? '할인율 수정' : '할인율 추가'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹 *</label>
                <select defaultValue={editingDiscount?.group} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="">선택</option>
                  <option value="A그룹">A그룹</option>
                  <option value="B그룹">B그룹</option>
                  <option value="C그룹">C그룹</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드</label>
                <select defaultValue={editingDiscount?.brand} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="전체">전체</option>
                  <option value="에실로">에실로</option>
                  <option value="호야">호야</option>
                  <option value="칼자이스">칼자이스</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>카테고리</label>
                <select defaultValue={editingDiscount?.category} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="전체">전체</option>
                  <option value="단초점">단초점</option>
                  <option value="누진다초점">누진다초점</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>할인율 (%) *</label>
                <input type="number" defaultValue={editingDiscount?.discountRate} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>시작일</label>
                <input type="date" defaultValue={editingDiscount?.validFrom} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>종료일</label>
                <input type="date" defaultValue={editingDiscount?.validTo} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
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
