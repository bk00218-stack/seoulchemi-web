'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface RxProduct {
  id: number
  code: string
  brand: string
  name: string
  lensType: string
  material: string
  refractionIndex: string
  addRange: string
  basePrice: number
  productionDays: number
  status: string
}

const sampleData: RxProduct[] = [
  { id: 1, code: 'RX001', brand: '에실로', name: '바리락스 X', lensType: '누진다초점', material: '플라스틱', refractionIndex: '1.60', addRange: '+0.75 ~ +3.50', basePrice: 350000, productionDays: 5, status: 'active' },
  { id: 2, code: 'RX002', brand: '에실로', name: '바리락스 E', lensType: '누진다초점', material: '플라스틱', refractionIndex: '1.67', addRange: '+0.75 ~ +3.00', basePrice: 420000, productionDays: 5, status: 'active' },
  { id: 3, code: 'RX003', brand: '호야', name: '루스나', lensType: '누진다초점', material: '플라스틱', refractionIndex: '1.60', addRange: '+1.00 ~ +3.50', basePrice: 280000, productionDays: 4, status: 'active' },
  { id: 4, code: 'RX004', brand: '칼자이스', name: '프로그레시브 퓨어', lensType: '누진다초점', material: '플라스틱', refractionIndex: '1.60', addRange: '+0.75 ~ +3.50', basePrice: 480000, productionDays: 7, status: 'active' },
  { id: 5, code: 'RX005', brand: '니콘', name: '프레지오', lensType: '누진다초점', material: '플라스틱', refractionIndex: '1.67', addRange: '+1.00 ~ +3.00', basePrice: 320000, productionDays: 5, status: 'inactive' },
]

export default function RxProductsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<RxProduct | null>(null)

  const columns: Column<RxProduct>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#af52de' }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#f3e5f5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#af52de' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'lensType', label: '렌즈타입', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'refractionIndex', label: '굴절률', align: 'center', render: (v) => (
      <span style={{ background: '#f5f5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'addRange', label: 'ADD 범위', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'basePrice', label: '기본가', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'productionDays', label: '제작기간', align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{v}일</span>
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

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        RX 상품 관리
      </h2>

      <div style={{ 
        background: '#f3e5f5', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #af52de20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>👓</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#af52de' }}>RX 상품 안내</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              RX 상품은 개인 맞춤 처방 렌즈입니다. 처방 정보에 따라 개별 제작되며, 
              브랜드별로 제작 기간이 다를 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      <StatCardGrid>
        <StatCard label="총 RX 상품" value={sampleData.length} unit="개" icon="👓" />
        <StatCard label="활성 상품" value={sampleData.filter(p => p.status === 'active').length} unit="개" />
        <StatCard label="평균 제작기간" value={5} unit="일" />
        <StatCard label="평균 가격" value="370,000" unit="원" />
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
          { label: '굴절률', key: 'index', options: [
            { label: '1.60', value: '1.60' },
            { label: '1.67', value: '1.67' },
            { label: '1.74', value: '1.74' },
          ]}
        ]}
        actions={
          <button
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#af52de',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + RX상품 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 RX 상품이 없습니다"
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
              {editingProduct ? 'RX 상품 수정' : 'RX 상품 등록'}
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>렌즈타입</label>
                <select defaultValue={editingProduct?.lensType} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="누진다초점">누진다초점</option>
                  <option value="단초점">단초점</option>
                  <option value="이중초점">이중초점</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>굴절률</label>
                <select defaultValue={editingProduct?.refractionIndex} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="1.60">1.60</option>
                  <option value="1.67">1.67</option>
                  <option value="1.74">1.74</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ADD 범위</label>
                <input type="text" defaultValue={editingProduct?.addRange} placeholder="+0.75 ~ +3.50" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>제작기간 (일)</label>
                <input type="number" defaultValue={editingProduct?.productionDays} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>기본가 *</label>
                <input type="number" defaultValue={editingProduct?.basePrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
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
              <button onClick={() => { alert('저장되었습니다.'); setShowModal(false); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#af52de', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
