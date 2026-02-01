'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface InventoryItem {
  id: number
  code: string
  brand: string
  product: string
  sph: string
  cyl: string
  currentStock: number
  newStock: number
  difference: number
}

const sampleData: InventoryItem[] = [
  { id: 1, code: 'PRD001', brand: '에실로', product: '크리잘 사파이어 1.60', sph: '-2.00', cyl: '-0.50', currentStock: 15, newStock: 15, difference: 0 },
  { id: 2, code: 'PRD001', brand: '에실로', product: '크리잘 사파이어 1.60', sph: '-2.50', cyl: '-0.75', currentStock: 8, newStock: 8, difference: 0 },
  { id: 3, code: 'PRD002', brand: '호야', product: '블루컨트롤 1.60', sph: '-3.00', cyl: '-1.00', currentStock: 12, newStock: 12, difference: 0 },
  { id: 4, code: 'PRD003', brand: '니콘', product: '씨맥스 1.60', sph: '-1.50', cyl: '0.00', currentStock: 5, newStock: 5, difference: 0 },
  { id: 5, code: 'PRD004', brand: '칼자이스', product: '드라이브세이프 1.67', sph: '-2.25', cyl: '-0.50', currentStock: 3, newStock: 3, difference: 0 },
]

export default function InventoryPage() {
  const [data, setData] = useState(sampleData)
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const updateStock = (id: number, newValue: number) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, newStock: newValue, difference: newValue - item.currentStock }
      }
      return item
    }))
  }

  const columns: Column<InventoryItem>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'sph', label: 'SPH', align: 'center', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'cyl', label: 'CYL', align: 'center', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'currentStock', label: '현재재고', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}</span>
    )},
    { key: 'newStock', label: '수정재고', align: 'center', render: (_, row) => (
      <input
        type="number"
        value={row.newStock}
        onChange={(e) => updateStock(row.id, parseInt(e.target.value) || 0)}
        style={{
          width: '70px',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #e5e5e5',
          fontSize: '14px',
          textAlign: 'center'
        }}
      />
    )},
    { key: 'difference', label: '증감', align: 'center', render: (v) => {
      const diff = v as number
      if (diff === 0) return <span style={{ color: '#86868b' }}>-</span>
      return (
        <span style={{ 
          color: diff > 0 ? '#34c759' : '#ff3b30',
          fontWeight: 600
        }}>
          {diff > 0 ? '+' : ''}{diff}
        </span>
      )
    }},
  ]

  const changedItems = data.filter(d => d.difference !== 0)

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        일괄재고수정
      </h2>

      <StatCardGrid>
        <StatCard label="총 상품 종류" value={data.length} unit="개" icon="📦" />
        <StatCard label="총 재고" value={data.reduce((sum, d) => sum + d.currentStock, 0)} unit="개" />
        <StatCard label="수정 예정" value={changedItems.length} unit="개" highlight />
        <StatCard 
          label="재고 증감" 
          value={data.reduce((sum, d) => sum + d.difference, 0)} 
          unit="개"
        />
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
          { label: 'SPH', key: 'sph', options: [
            { label: '-1.00 ~ -2.00', value: '-1' },
            { label: '-2.00 ~ -3.00', value: '-2' },
            { label: '-3.00 ~ -4.00', value: '-3' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 업로드')}>📤 엑셀 업로드</OutlineButton>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀 다운로드</OutlineButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="재고 데이터가 없습니다"
      />

      {changedItems.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px 20px', 
          background: '#fff', 
          borderRadius: '12px',
          border: '2px solid #007aff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>
                {changedItems.length}개 상품의 재고가 변경됩니다
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                총 {data.reduce((sum, d) => sum + Math.abs(d.difference), 0)}개 변동
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setData(sampleData)}
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                초기화
              </button>
              <button 
                onClick={() => alert('재고가 수정되었습니다.')}
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                재고 수정 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
