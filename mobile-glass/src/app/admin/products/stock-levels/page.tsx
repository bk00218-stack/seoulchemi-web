'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'

interface StockLevel {
  id: number
  brand: string
  product: string
  minStock: number
  maxStock: number
  reorderPoint: number
  currentStock: number
  status: 'normal' | 'low' | 'out'
}

const sampleData: StockLevel[] = [
  { id: 1, brand: '에실로', product: '크리잘 사파이어 1.60', minStock: 10, maxStock: 100, reorderPoint: 20, currentStock: 45, status: 'normal' },
  { id: 2, brand: '에실로', product: '크리잘 블루컷 1.60', minStock: 10, maxStock: 80, reorderPoint: 15, currentStock: 12, status: 'low' },
  { id: 3, brand: '호야', product: '블루컨트롤 1.60', minStock: 8, maxStock: 60, reorderPoint: 15, currentStock: 35, status: 'normal' },
  { id: 4, brand: '칼자이스', product: '드라이브세이프 1.67', minStock: 5, maxStock: 30, reorderPoint: 10, currentStock: 3, status: 'low' },
  { id: 5, brand: '니콘', product: '씨맥스 1.60', minStock: 10, maxStock: 50, reorderPoint: 15, currentStock: 0, status: 'out' },
]

export default function StockLevelsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StockLevel | null>(null)

  const statusLabels = {
    normal: { bg: '#e8f5e9', color: '#34c759', label: '정상' },
    low: { bg: '#fff3e0', color: '#ff9500', label: '부족' },
    out: { bg: '#ffebee', color: '#ff3b30', label: '품절' }
  }

  const columns: Column<StockLevel>[] = [
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'minStock', label: '최소재고', align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{v as number}</span>
    )},
    { key: 'reorderPoint', label: '발주점', align: 'center', render: (v) => (
      <span style={{ color: '#ff9500', fontWeight: 500 }}>{v as number}</span>
    )},
    { key: 'maxStock', label: '최대재고', align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{v as number}</span>
    )},
    { key: 'currentStock', label: '현재재고', align: 'center', render: (v, row) => (
      <span style={{ 
        fontWeight: 600,
        color: row.status === 'out' ? '#ff3b30' : row.status === 'low' ? '#ff9500' : '#34c759'
      }}>
        {v as number}
      </span>
    )},
    { key: 'status', label: '상태', render: (v) => {
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
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingItem(row); setShowModal(true); }}
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
        설정
      </button>
    )},
  ]

  const lowStockItems = sampleData.filter(d => d.status === 'low')
  const outOfStockItems = sampleData.filter(d => d.status === 'out')

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        적정재고 설정
      </h2>

      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div style={{ 
          background: outOfStockItems.length > 0 ? '#ffebee' : '#fff3e0', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '24px',
          border: `1px solid ${outOfStockItems.length > 0 ? '#ff3b3020' : '#ff950020'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: outOfStockItems.length > 0 ? '#ff3b30' : '#ff9500' }}>
                재고 주의
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {outOfStockItems.length > 0 && `품절 상품 ${outOfStockItems.length}개`}
                {outOfStockItems.length > 0 && lowStockItems.length > 0 && ', '}
                {lowStockItems.length > 0 && `재고 부족 상품 ${lowStockItems.length}개`}
                가 있습니다. 발주를 확인해주세요.
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{sampleData.length}개</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>정상</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {sampleData.filter(d => d.status === 'normal').length}개
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>부족</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {lowStockItems.length}개
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>
            {outOfStockItems.length}개
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="상품명 검색"
        filters={[
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
            { label: '니콘', value: 'nikon' },
          ]},
          { label: '상태', key: 'status', options: [
            { label: '정상', value: 'normal' },
            { label: '부족', value: 'low' },
            { label: '품절', value: 'out' },
          ]}
        ]}
        actions={
          <OutlineButton onClick={() => alert('일괄 설정')}>⚙️ 일괄 설정</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="상품이 없습니다"
      />

      {/* 설정 모달 */}
      {showModal && editingItem && (
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>적정재고 설정</h3>
            <p style={{ fontSize: '14px', color: '#86868b', marginBottom: '20px' }}>{editingItem.product}</p>
            
            <div style={{ background: '#f5f5f7', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>현재 재고</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: editingItem.status === 'out' ? '#ff3b30' : editingItem.status === 'low' ? '#ff9500' : '#34c759' }}>
                {editingItem.currentStock}개
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>최소재고</label>
                <input type="number" defaultValue={editingItem.minStock} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#ff9500' }}>발주점</label>
                <input type="number" defaultValue={editingItem.reorderPoint} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ff9500', fontSize: '14px', textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>최대재고</label>
                <input type="number" defaultValue={editingItem.maxStock} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', textAlign: 'center' }} />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '16px' }}>
              💡 발주점 이하로 재고가 떨어지면 재고 부족 알림이 표시됩니다.
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
