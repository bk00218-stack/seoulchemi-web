'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'

interface Brand {
  id: number
  code: string
  name: string
  nameEn: string
  supplier: string
  productCount: number
  status: string
  createdAt: string
}

const sampleData: Brand[] = [
  { id: 1, code: 'BRD001', name: '에실로', nameEn: 'Essilor', supplier: '에실로코리아', productCount: 45, status: 'active', createdAt: '2023-01-01' },
  { id: 2, code: 'BRD002', name: '호야', nameEn: 'Hoya', supplier: '호야광학', productCount: 32, status: 'active', createdAt: '2023-01-15' },
  { id: 3, code: 'BRD003', name: '칼자이스', nameEn: 'Carl Zeiss', supplier: '칼자이스코리아', productCount: 28, status: 'active', createdAt: '2023-02-01' },
  { id: 4, code: 'BRD004', name: '니콘', nameEn: 'Nikon', supplier: '니콘광학', productCount: 18, status: 'active', createdAt: '2023-02-20' },
  { id: 5, code: 'BRD005', name: '로덴스톡', nameEn: 'Rodenstock', supplier: '로덴스톡', productCount: 12, status: 'inactive', createdAt: '2023-03-10' },
  { id: 6, code: 'BRD006', name: '케미', nameEn: 'Chemi', supplier: '케미렌즈', productCount: 22, status: 'active', createdAt: '2023-04-01' },
]

export default function BrandsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const columns: Column<Brand>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '브랜드명', render: (v) => (
      <span style={{ fontWeight: 600 }}>{v as string}</span>
    )},
    { key: 'nameEn', label: '영문명', render: (v) => (
      <span style={{ color: '#666' }}>{v as string}</span>
    )},
    { key: 'supplier', label: '매입처' },
    { key: 'productCount', label: '상품 수', align: 'center', render: (v) => (
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
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'createdAt', label: '등록일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingBrand(row); setShowModal(true); }}
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

  const totalProducts = sampleData.reduce((sum, b) => sum + b.productCount, 0)

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        브랜드 관리
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 브랜드</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
            {sampleData.length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {sampleData.filter(b => b.status === 'active').length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>비활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {sampleData.filter(b => b.status === 'inactive').length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {totalProducts}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="브랜드명 검색"
        actions={
          <button
            onClick={() => { setEditingBrand(null); setShowModal(true); }}
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
            + 브랜드 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 브랜드가 없습니다"
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
            width: '440px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingBrand ? '브랜드 수정' : '브랜드 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드명 *</label>
              <input type="text" defaultValue={editingBrand?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>영문명</label>
                <input type="text" defaultValue={editingBrand?.nameEn} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>코드</label>
                <input type="text" defaultValue={editingBrand?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>매입처</label>
              <select defaultValue={editingBrand?.supplier} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="">선택</option>
                <option value="에실로코리아">에실로코리아</option>
                <option value="호야광학">호야광학</option>
                <option value="칼자이스코리아">칼자이스코리아</option>
                <option value="니콘광학">니콘광학</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
              <select defaultValue={editingBrand?.status || 'active'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
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
