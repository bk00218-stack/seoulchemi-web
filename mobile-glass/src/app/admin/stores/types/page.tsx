'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface StoreType {
  id: number
  code: string
  name: string
  description: string
  features: string[]
  storeCount: number
  isDefault: boolean
}

const sampleData: StoreType[] = [
  { id: 1, code: 'TYPE01', name: '프리미엄', description: 'VIP 가맹점, 전 상품 15% 할인', features: ['우선 출고', '전용 CS', '월말 정산'], storeCount: 12, isDefault: false },
  { id: 2, code: 'TYPE02', name: '일반', description: '기본 가맹점', features: ['기본 배송', '일반 CS'], storeCount: 45, isDefault: true },
  { id: 3, code: 'TYPE03', name: '도매', description: '대량 주문 가맹점', features: ['대량 할인', '월말 정산', '전용 담당자'], storeCount: 8, isDefault: false },
  { id: 4, code: 'TYPE04', name: '체인', description: '체인 안경원', features: ['본사 통합 정산', '재고 공유'], storeCount: 15, isDefault: false },
]

export default function TypesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<StoreType | null>(null)

  const columns: Column<StoreType>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '타입명', render: (v, row) => (
      <div>
        <span style={{ fontWeight: 500 }}>{v as string}</span>
        {row.isDefault && (
          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#e3f2fd', color: '#007aff', padding: '2px 6px', borderRadius: '4px' }}>
            기본
          </span>
        )}
      </div>
    )},
    { key: 'description', label: '설명', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'features', label: '특성', render: (v) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(v as string[]).map((feature, idx) => (
          <span key={idx} style={{ 
            background: '#f5f5f7',
            color: '#666',
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '11px' 
          }}>
            {feature}
          </span>
        ))}
      </div>
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
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingType(row); setShowModal(true); }}
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
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 타입 설정
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {sampleData.map((type) => (
          <div key={type.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>{type.name}</div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
              {type.storeCount}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
            </div>
          </div>
        ))}
      </div>

      <SearchFilter
        placeholder="타입명 검색"
        actions={
          <button
            onClick={() => { setEditingType(null); setShowModal(true); }}
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
            + 타입 추가
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 타입이 없습니다"
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
              {editingType ? '타입 수정' : '타입 추가'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>코드</label>
                <input type="text" defaultValue={editingType?.code} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>타입명 *</label>
                <input type="text" defaultValue={editingType?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input type="text" defaultValue={editingType?.description} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>특성 (쉼표로 구분)</label>
              <input type="text" defaultValue={editingType?.features.join(', ')} placeholder="우선 출고, 전용 CS" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={editingType?.isDefault} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px' }}>기본 타입으로 설정</span>
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
