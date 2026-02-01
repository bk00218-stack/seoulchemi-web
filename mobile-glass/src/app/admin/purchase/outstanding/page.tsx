'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface OutstandingItem {
  id: number
  supplier: string
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  lastPurchaseDate: string
  lastPaymentDate: string
  dueDays: number
}

const sampleData: OutstandingItem[] = [
  { id: 1, supplier: '에실로코리아', totalAmount: 45000000, paidAmount: 38000000, outstandingAmount: 7000000, lastPurchaseDate: '2024-01-15', lastPaymentDate: '2024-01-10', dueDays: 30 },
  { id: 2, supplier: '호야광학', totalAmount: 28000000, paidAmount: 28000000, outstandingAmount: 0, lastPurchaseDate: '2024-01-12', lastPaymentDate: '2024-01-12', dueDays: 0 },
  { id: 3, supplier: '칼자이스코리아', totalAmount: 52000000, paidAmount: 40000000, outstandingAmount: 12000000, lastPurchaseDate: '2024-01-14', lastPaymentDate: '2024-01-05', dueDays: 45 },
  { id: 4, supplier: '니콘광학', totalAmount: 18500000, paidAmount: 15000000, outstandingAmount: 3500000, lastPurchaseDate: '2024-01-10', lastPaymentDate: '2024-01-08', dueDays: 15 },
  { id: 5, supplier: '로덴스톡', totalAmount: 12000000, paidAmount: 10000000, outstandingAmount: 2000000, lastPurchaseDate: '2024-01-08', lastPaymentDate: '2024-01-01', dueDays: 20 },
]

export default function OutstandingPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<OutstandingItem | null>(null)

  const totalOutstanding = sampleData.reduce((sum, d) => sum + d.outstandingAmount, 0)
  const overdueCount = sampleData.filter(d => d.dueDays > 30).length

  const columns: Column<OutstandingItem>[] = [
    { key: 'supplier', label: '매입처', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'totalAmount', label: '총 매입액', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number / 10000).toLocaleString()}만원</span>
    )},
    { key: 'paidAmount', label: '결제완료', align: 'right', render: (v) => (
      <span style={{ color: '#34c759' }}>{(v as number / 10000).toLocaleString()}만원</span>
    )},
    { key: 'outstandingAmount', label: '미납금', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: v as number > 0 ? '#ff3b30' : '#34c759' }}>
        {(v as number / 10000).toLocaleString()}만원
      </span>
    )},
    { key: 'lastPaymentDate', label: '최근결제일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'dueDays', label: '미납기간', align: 'center', render: (v) => {
      const days = v as number
      const color = days > 30 ? '#ff3b30' : days > 15 ? '#ff9500' : '#34c759'
      return days > 0 ? (
        <span style={{ 
          background: days > 30 ? '#ffebee' : days > 15 ? '#fff3e0' : '#e8f5e9',
          color,
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {days}일
        </span>
      ) : (
        <span style={{ color: '#34c759', fontSize: '12px' }}>완납</span>
      )
    }},
    { key: 'id', label: '결제', align: 'center', render: (_, row) => (
      row.outstandingAmount > 0 ? (
        <button
          onClick={() => { setSelectedSupplier(row); setShowPaymentModal(true); }}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            background: '#007aff',
            color: '#fff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          결제등록
        </button>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>-</span>
      )
    )},
  ]

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입처 미납금 관리
      </h2>

      <StatCardGrid>
        <StatCard label="총 미납금" value={(totalOutstanding / 10000).toLocaleString()} unit="만원" highlight icon="💰" />
        <StatCard label="미납 매입처" value={sampleData.filter(d => d.outstandingAmount > 0).length} unit="곳" />
        <StatCard label="30일 초과" value={overdueCount} unit="곳" icon="⚠️" />
        <StatCard label="이번 달 결제" value="8,500" unit="만원" />
      </StatCardGrid>

      {overdueCount > 0 && (
        <div style={{ 
          background: '#ffebee', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '24px',
          border: '1px solid #ff3b3020'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#ff3b30' }}>결제 기한 초과 알림</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {overdueCount}개 매입처의 미납금이 30일을 초과했습니다. 빠른 결제를 권장합니다.
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchFilter
        placeholder="매입처명 검색"
        filters={[
          { label: '미납상태', key: 'status', options: [
            { label: '미납있음', value: 'outstanding' },
            { label: '완납', value: 'paid' },
          ]},
          { label: '기간', key: 'period', options: [
            { label: '15일 이내', value: '15' },
            { label: '30일 이내', value: '30' },
            { label: '30일 초과', value: 'over30' },
          ]}
        ]}
        actions={
          <OutlineButton onClick={() => alert('미납금 현황 엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="미납금 내역이 없습니다"
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
          총 {sampleData.length}개 매입처
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff3b30' }}>
          총 미납금: {(totalOutstanding / 10000).toLocaleString()}만원
        </span>
      </div>

      {/* 결제 등록 모달 */}
      {showPaymentModal && selectedSupplier && (
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>결제 등록</h3>
            
            <div style={{ background: '#f5f5f7', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{selectedSupplier.supplier}</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff3b30' }}>
                {(selectedSupplier.outstandingAmount / 10000).toLocaleString()}만원
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b', marginLeft: '8px' }}>미납</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>결제 금액</label>
              <input 
                type="number" 
                defaultValue={selectedSupplier.outstandingAmount}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} 
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>결제일</label>
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} 
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>결제 방법</label>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="transfer">계좌이체</option>
                <option value="card">카드결제</option>
                <option value="cash">현금</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>메모</label>
              <textarea rows={2} placeholder="결제 관련 메모" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', resize: 'vertical' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { alert('결제가 등록되었습니다.'); setShowPaymentModal(false); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#34c759', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>결제 등록</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
