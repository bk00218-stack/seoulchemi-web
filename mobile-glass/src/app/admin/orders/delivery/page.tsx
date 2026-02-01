'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'

interface DeliveryInfo {
  id: number
  storeCode: string
  storeName: string
  contact: string
  phone: string
  address: string
  zipCode: string
  deliveryNote: string
  isDefault: boolean
}

const sampleData: DeliveryInfo[] = [
  { id: 1, storeCode: 'ST001', storeName: '강남안경', contact: '김강남', phone: '02-1234-5678', address: '서울특별시 강남구 테헤란로 123 삼성빌딩 1층', zipCode: '06232', deliveryNote: '1층 안경원으로 배송', isDefault: true },
  { id: 2, storeCode: 'ST002', storeName: '역삼안경원', contact: '이역삼', phone: '02-2345-6789', address: '서울특별시 강남구 역삼동 456-78 역삼타워 B1', zipCode: '06241', deliveryNote: '지하 1층 후문으로', isDefault: true },
  { id: 3, storeCode: 'ST003', storeName: '신사안경', contact: '박신사', phone: '02-3456-7890', address: '서울특별시 강남구 신사동 654-32', zipCode: '06024', deliveryNote: '', isDefault: true },
  { id: 4, storeCode: 'ST004', storeName: '압구정광학', contact: '최압구정', phone: '02-4567-8901', address: '서울특별시 강남구 압구정로 321 로데오프라자 2층', zipCode: '06019', deliveryNote: '2층 엘리베이터 앞', isDefault: true },
  { id: 5, storeCode: 'ST005', storeName: '청담안경', contact: '정청담', phone: '02-5678-9012', address: '서울특별시 강남구 청담동 89-12', zipCode: '06053', deliveryNote: '경비실에 맡겨주세요', isDefault: true },
  { id: 6, storeCode: 'ST006', storeName: '선릉안경', contact: '한선릉', phone: '02-6789-0123', address: '서울특별시 강남구 선릉로 555 선릉빌딩 3층', zipCode: '06160', deliveryNote: '', isDefault: true },
]

export default function DeliveryPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)

  const columns: Column<DeliveryInfo>[] = [
    { key: 'storeCode', label: '가맹점코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'storeName', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'contact', label: '담당자' },
    { key: 'phone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'address', label: '배송주소', width: '280px', render: (v, row) => (
      <div>
        <div style={{ fontSize: '13px', color: '#1d1d1f' }}>{v as string}</div>
        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>{row.zipCode}</div>
      </div>
    )},
    { key: 'deliveryNote', label: '배송메모', render: (v) => (
      v ? (
        <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>"{v as string}"</span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>-</span>
      )
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => setEditingId(row.id)}
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
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        출고 배송지 정보
      </h2>

      <div style={{ 
        background: '#f0f7ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📍</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#007aff' }}>배송지 관리 안내</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              가맹점별 기본 배송지 정보를 관리합니다. 배송지 변경 시 해당 가맹점의 모든 주문에 적용됩니다.
            </div>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="가맹점명, 주소 검색"
        filters={[
          { label: '지역', key: 'region', options: [
            { label: '서울', value: 'seoul' },
            { label: '경기', value: 'gyeonggi' },
            { label: '인천', value: 'incheon' },
          ]}
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
            <OutlineButton onClick={() => alert('배송지 일괄수정')}>✏️ 일괄수정</OutlineButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="배송지 정보가 없습니다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#fff', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#86868b' }}>
          총 {sampleData.length}개 가맹점
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#86868b' }}>최근 업데이트: 2024-01-15 14:30</span>
        </div>
      </div>

      {/* 수정 모달 */}
      {editingId && (
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
            width: '480px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>배송지 수정</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>담당자</label>
              <input type="text" defaultValue={sampleData.find(d => d.id === editingId)?.contact} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처</label>
              <input type="text" defaultValue={sampleData.find(d => d.id === editingId)?.phone} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>배송주소</label>
              <input type="text" defaultValue={sampleData.find(d => d.id === editingId)?.address} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>배송메모</label>
              <textarea defaultValue={sampleData.find(d => d.id === editingId)?.deliveryNote} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setEditingId(null)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { alert('저장되었습니다.'); setEditingId(null); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
