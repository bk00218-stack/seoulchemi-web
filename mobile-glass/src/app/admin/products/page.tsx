'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface Product {
  id: number
  code: string
  brand: string
  name: string
  optionType: string
  refractionIndex: string
  price: number
  stockPrice: number
  stock: number
  status: string
}

const sampleData: Product[] = [
  { id: 1, code: 'PRD001', brand: '에실로', name: '크리잘 사파이어', optionType: '단초점', refractionIndex: '1.60', price: 85000, stockPrice: 45000, stock: 120, status: 'active' },
  { id: 2, code: 'PRD002', brand: '에실로', name: '크리잘 블루컷', optionType: '단초점', refractionIndex: '1.60', price: 75000, stockPrice: 40000, stock: 85, status: 'active' },
  { id: 3, code: 'PRD003', brand: '호야', name: '블루컨트롤', optionType: '단초점', refractionIndex: '1.60', price: 68000, stockPrice: 38000, stock: 95, status: 'active' },
  { id: 4, code: 'PRD004', brand: '에실로', name: '바리락스 X', optionType: '누진다초점', refractionIndex: '1.60', price: 350000, stockPrice: 180000, stock: 25, status: 'active' },
  { id: 5, code: 'PRD005', brand: '칼자이스', name: '드라이브세이프', optionType: '단초점', refractionIndex: '1.67', price: 320000, stockPrice: 160000, stock: 15, status: 'active' },
  { id: 6, code: 'PRD006', brand: '니콘', name: '씨맥스', optionType: '단초점', refractionIndex: '1.60', price: 72000, stockPrice: 35000, stock: 0, status: 'inactive' },
]

export default function ProductsPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const columns: Column<Product>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionType', label: '옵션', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'refractionIndex', label: '굴절률', align: 'center', render: (v) => (
      <span style={{ background: '#f5f5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'price', label: '판매가', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'stockPrice', label: '매입가', align: 'right', render: (v) => (
      <span style={{ color: '#86868b' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'stock', label: '재고', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: (v as number) === 0 ? '#ff3b30' : (v as number) < 20 ? '#ff9500' : '#34c759' 
      }}>
        {v as number}
      </span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingProduct(row); setShowModal(true); }}
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
    : sampleData.filter(p => p.status === filter)

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        판매상품 관리
      </h2>

      <StatCardGrid>
        <StatCard label="총 상품" value={sampleData.length} unit="개" icon="📦" />
        <StatCard label="활성 상품" value={sampleData.filter(p => p.status === 'active').length} unit="개" />
        <StatCard label="재고 부족" value={sampleData.filter(p => p.stock < 20 && p.stock > 0).length} unit="개" highlight />
        <StatCard label="품절" value={sampleData.filter(p => p.stock === 0).length} unit="개" />
      </StatCardGrid>

      <SearchFilter
        placeholder="상품코드, 상품명 검색"
        filters={[
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
            { label: '니콘', value: 'nikon' },
          ]},
          { label: '옵션', key: 'option', options: [
            { label: '단초점', value: 'single' },
            { label: '누진다초점', value: 'progressive' },
          ]},
          { label: '굴절률', key: 'index', options: [
            { label: '1.56', value: '1.56' },
            { label: '1.60', value: '1.60' },
            { label: '1.67', value: '1.67' },
            { label: '1.74', value: '1.74' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
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
              + 상품 등록
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
        emptyMessage="등록된 상품이 없습니다"
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
              {editingProduct ? '상품 수정' : '상품 등록'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>브랜드 *</label>
                <select defaultValue={editingProduct?.brand} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="">선택</option>
                  <option value="에실로">에실로</option>
                  <option value="호야">호야</option>
                  <option value="칼자이스">칼자이스</option>
                  <option value="니콘">니콘</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상품코드</label>
                <input type="text" defaultValue={editingProduct?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상품명 *</label>
              <input type="text" defaultValue={editingProduct?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>옵션 타입</label>
                <select defaultValue={editingProduct?.optionType} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="단초점">단초점</option>
                  <option value="누진다초점">누진다초점</option>
                  <option value="이중초점">이중초점</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>굴절률</label>
                <select defaultValue={editingProduct?.refractionIndex} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="1.56">1.56</option>
                  <option value="1.60">1.60</option>
                  <option value="1.67">1.67</option>
                  <option value="1.74">1.74</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>판매가 *</label>
                <input type="number" defaultValue={editingProduct?.price} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>매입가</label>
                <input type="number" defaultValue={editingProduct?.stockPrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>재고</label>
                <input type="number" defaultValue={editingProduct?.stock} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
                <select defaultValue={editingProduct?.status || 'active'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
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
