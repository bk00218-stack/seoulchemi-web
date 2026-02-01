'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton, PrimaryButton } from '../../../components/SearchFilter'

interface Supplier {
  id: number
  code: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  brands: string[]
  status: string
  createdAt: string
}

const sampleData: Supplier[] = [
  { id: 1, code: 'SUP001', name: '에실로코리아', contact: '김에실', phone: '02-1234-5678', email: 'essilor@example.com', address: '서울시 강남구 테헤란로 123', brands: ['에실로', '바리락스', '크리잘'], status: 'active', createdAt: '2023-01-01' },
  { id: 2, code: 'SUP002', name: '호야광학', contact: '이호야', phone: '02-2345-6789', email: 'hoya@example.com', address: '서울시 서초구 반포대로 456', brands: ['호야', '블루컨트롤'], status: 'active', createdAt: '2023-02-15' },
  { id: 3, code: 'SUP003', name: '칼자이스코리아', contact: '박자이스', phone: '02-3456-7890', email: 'zeiss@example.com', address: '서울시 강남구 역삼동 789', brands: ['칼자이스'], status: 'active', createdAt: '2023-03-20' },
  { id: 4, code: 'SUP004', name: '니콘광학', contact: '최니콘', phone: '02-4567-8901', email: 'nikon@example.com', address: '서울시 송파구 올림픽로 321', brands: ['니콘', '씨맥스'], status: 'inactive', createdAt: '2023-04-10' },
  { id: 5, code: 'SUP005', name: '로덴스톡', contact: '정로덴', phone: '02-5678-9012', email: 'rodenstock@example.com', address: '서울시 마포구 상암동 654', brands: ['로덴스톡'], status: 'active', createdAt: '2023-05-05' },
]

export default function SuppliersPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const columns: Column<Supplier>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '매입처명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'contact', label: '담당자' },
    { key: 'phone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'email', label: '이메일', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'brands', label: '취급브랜드', render: (v) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(v as string[]).map((brand, idx) => (
          <span key={idx} style={{ background: '#e3f2fd', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#007aff' }}>
            {brand}
          </span>
        ))}
      </div>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingSupplier(row); setShowModal(true); }}
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

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입처 관리
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 매입처</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
            {sampleData.length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>곳</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {sampleData.filter(s => s.status === 'active').length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>곳</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>비활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {sampleData.filter(s => s.status === 'inactive').length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>곳</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="매입처명, 담당자 검색"
        actions={
          <button
            onClick={() => { setEditingSupplier(null); setShowModal(true); }}
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
            + 매입처 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 매입처가 없습니다"
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
              {editingSupplier ? '매입처 수정' : '매입처 등록'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>매입처명 *</label>
                <input type="text" defaultValue={editingSupplier?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>코드</label>
                <input type="text" defaultValue={editingSupplier?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>담당자</label>
                <input type="text" defaultValue={editingSupplier?.contact} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처</label>
                <input type="text" defaultValue={editingSupplier?.phone} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>이메일</label>
              <input type="email" defaultValue={editingSupplier?.email} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>주소</label>
              <input type="text" defaultValue={editingSupplier?.address} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>취급 브랜드</label>
              <input type="text" defaultValue={editingSupplier?.brands.join(', ')} placeholder="쉼표로 구분하여 입력" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
              <select defaultValue={editingSupplier?.status || 'active'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
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
