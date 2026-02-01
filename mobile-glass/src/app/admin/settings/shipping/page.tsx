'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, CancelButton, SaveButton } from '../../../components/FormInput'
import DataTable, { Column } from '../../../components/DataTable'

interface ShippingZone {
  id: number
  region: string
  basePrice: number
  freeThreshold: number
  extraDays: number
  isActive: boolean
}

const sampleZones: ShippingZone[] = [
  { id: 1, region: '서울/경기', basePrice: 3000, freeThreshold: 50000, extraDays: 0, isActive: true },
  { id: 2, region: '충청권', basePrice: 3000, freeThreshold: 50000, extraDays: 0, isActive: true },
  { id: 3, region: '영남권', basePrice: 3500, freeThreshold: 70000, extraDays: 1, isActive: true },
  { id: 4, region: '호남권', basePrice: 3500, freeThreshold: 70000, extraDays: 1, isActive: true },
  { id: 5, region: '강원/제주', basePrice: 5000, freeThreshold: 100000, extraDays: 2, isActive: true },
]

export default function ShippingSettingsPage() {
  const [defaultFreeThreshold, setDefaultFreeThreshold] = useState(50000)
  const [defaultShippingFee, setDefaultShippingFee] = useState(3000)
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)

  const columns: Column<ShippingZone>[] = [
    { key: 'region', label: '지역', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'basePrice', label: '기본 배송비', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'freeThreshold', label: '무료배송 기준', align: 'right', render: (v) => (
      <span style={{ color: '#007aff' }}>{(v as number).toLocaleString()}원 이상</span>
    )},
    { key: 'extraDays', label: '추가 소요일', align: 'center', render: (v) => (
      v === 0 ? (
        <span style={{ color: '#86868b' }}>-</span>
      ) : (
        <span style={{ color: '#ff9500' }}>+{v}일</span>
      )
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
      <button
        onClick={() => { setEditingZone(row); setShowModal(true); }}
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
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        배송비 설정
      </h2>

      <FormSection title="기본 배송 설정">
        <FormGrid>
          <FormInput
            label="기본 배송비"
            name="defaultShippingFee"
            type="number"
            value={defaultShippingFee}
            onChange={(_, v) => setDefaultShippingFee(v as number)}
            suffix="원"
          />
          <FormInput
            label="무료배송 기준금액"
            name="defaultFreeThreshold"
            type="number"
            value={defaultFreeThreshold}
            onChange={(_, v) => setDefaultFreeThreshold(v as number)}
            suffix="원"
            hint="이 금액 이상 주문 시 무료배송"
          />
        </FormGrid>
        <FormActions>
          <SaveButton onClick={() => alert('저장되었습니다.')} />
        </FormActions>
      </FormSection>

      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>지역별 배송비</h3>
          <button
            onClick={() => { setEditingZone(null); setShowModal(true); }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 지역 추가
          </button>
        </div>
        <DataTable
          columns={columns}
          data={sampleZones}
          emptyMessage="등록된 지역이 없습니다"
        />
      </div>

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
            width: '400px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingZone ? '지역 배송비 수정' : '지역 추가'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>지역명 *</label>
              <input type="text" defaultValue={editingZone?.region} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>기본 배송비</label>
                <input type="number" defaultValue={editingZone?.basePrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>무료배송 기준</label>
                <input type="number" defaultValue={editingZone?.freeThreshold} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>추가 소요일</label>
                <input type="number" defaultValue={editingZone?.extraDays} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={editingZone?.isActive !== false} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px' }}>활성화</span>
                </label>
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
