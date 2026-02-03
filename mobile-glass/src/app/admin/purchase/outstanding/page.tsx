'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Supplier {
  id: number
  name: string
  code: string
  contactName: string | null
  phone: string | null
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  lastPaymentAt: string | null
}

export default function OutstandingPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      setSuppliers(data.filter((s: Supplier) => s.outstandingAmount > 0 || true)) // 모든 매입처 표시
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Supplier>[] = [
    { key: 'name', label: '매입처명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'code', label: '코드', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span> },
    { key: 'contactName', label: '담당자', render: (v) => <span>{(v as string) || '-'}</span> },
    { key: 'phone', label: '연락처', render: (v) => <span style={{ fontSize: '13px' }}>{(v as string) || '-'}</span> },
    { key: 'outstandingAmount', label: '미납금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: (v as number) > 0 ? '#ff3b30' : '#1d1d1f' }}>
        {(v as number).toLocaleString()}원
      </span>
    )},
    { key: 'creditLimit', label: '신용한도', align: 'right', render: (v) => (
      <span style={{ color: '#86868b' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'paymentTermDays', label: '결제기한', align: 'center', render: (v) => <span>{v as number}일</span> },
    { key: 'lastPaymentAt', label: '최근결제', render: (v) => (
      <span style={{ fontSize: '12px', color: '#86868b' }}>
        {v ? new Date(v as string).toLocaleDateString('ko-KR') : '-'}
      </span>
    )},
  ]

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstandingAmount, 0)
  const overdueCount = suppliers.filter(s => s.outstandingAmount > s.creditLimit).length

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>매입처 미납금 관리</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 미납금</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{totalOutstanding.toLocaleString()}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>원</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>미납 매입처</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{suppliers.filter(s => s.outstandingAmount > 0).length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>곳</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>한도초과</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{overdueCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>곳</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>전체 매입처</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{suppliers.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>곳</span></div>
        </div>
      </div>

      <SearchFilter placeholder="매입처명 검색" />

      <DataTable columns={columns} data={suppliers} loading={loading} emptyMessage="매입처가 없습니다" />
    </AdminLayout>
  )
}
