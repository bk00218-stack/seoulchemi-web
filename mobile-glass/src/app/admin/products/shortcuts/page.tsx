'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Shortcut {
  id: number
  code: string
  product: string
  brand: string
  description: string
  usageCount: number
  isActive: boolean
}

const sampleData: Shortcut[] = [
  { id: 1, code: 'CS16', product: '크리잘 사파이어 1.60', brand: '에실로', description: '크리잘 사파이어', usageCount: 245, isActive: true },
  { id: 2, code: 'CB16', product: '크리잘 블루컷 1.60', brand: '에실로', description: '크리잘 블루컷', usageCount: 189, isActive: true },
  { id: 3, code: 'BC16', product: '블루컨트롤 1.60', brand: '호야', description: '호야 블루컨트롤', usageCount: 156, isActive: true },
  { id: 4, code: 'VX16', product: '바리락스 X 1.60', brand: '에실로', description: '바리락스 누진', usageCount: 98, isActive: true },
  { id: 5, code: 'DS17', product: '드라이브세이프 1.67', brand: '칼자이스', description: '자이스 드라이브', usageCount: 67, isActive: false },
]

export default function ShortcutsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)

  const columns: Column<Shortcut>[] = [
    { key: 'code', label: '단축코드', render: (v) => (
      <span style={{ 
        fontFamily: 'monospace', 
        fontSize: '14px', 
        fontWeight: 600,
        background: '#007aff',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '6px'
      }}>
        {v as string}
      </span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '연결 상품', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'description', label: '설명', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'usageCount', label: '사용횟수', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{(v as number).toLocaleString()}회</span>
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
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => { setEditingShortcut(row); setShowModal(true); }}
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
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        상품 단축코드 설정
      </h2>

      <div style={{ 
        background: '#f0f7ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#007aff' }}>단축코드 사용법</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              주문 등록 시 단축코드를 입력하면 연결된 상품이 자동으로 선택됩니다.
              자주 사용하는 상품에 짧은 코드를 설정해 주문 속도를 높이세요.
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 단축코드</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{sampleData.length}개</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {sampleData.filter(s => s.isActive).length}개
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 사용횟수</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {sampleData.reduce((sum, s) => sum + s.usageCount, 0).toLocaleString()}회
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="단축코드, 상품명 검색"
        actions={
          <button
            onClick={() => { setEditingShortcut(null); setShowModal(true); }}
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
            + 단축코드 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 단축코드가 없습니다"
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
            width: '440px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingShortcut ? '단축코드 수정' : '단축코드 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>단축코드 *</label>
              <input type="text" defaultValue={editingShortcut?.code} placeholder="예: CS16" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', textTransform: 'uppercase' }} />
              <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px' }}>영문+숫자 조합, 2~6자</div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연결 상품 *</label>
              <select defaultValue={editingShortcut?.product} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="">상품 선택</option>
                <option value="크리잘 사파이어 1.60">크리잘 사파이어 1.60</option>
                <option value="크리잘 블루컷 1.60">크리잘 블루컷 1.60</option>
                <option value="블루컨트롤 1.60">블루컨트롤 1.60</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input type="text" defaultValue={editingShortcut?.description} placeholder="단축코드 설명" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={editingShortcut?.isActive !== false} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px' }}>활성화</span>
              </label>
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
