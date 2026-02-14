'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Store {
  id: number
  name: string
  code: string
  ownerName: string | null
  distributorCode: string | null
  distributorStatus: string | null
}

export default function DistributorPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data.stores || data || [])
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorStatus: 'approved' })
      })
      loadData()
    } catch (error) {
      alert('승인 실패')
    }
  }

  const columns: Column<Store>[] = [
    { key: 'code', label: '코드', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span> },
    { key: 'name', label: '가맹점명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'ownerName', label: '대표자', render: (v) => <span>{(v as string) || '-'}</span> },
    { key: 'distributorCode', label: '유통사 코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', color: v ? '#007aff' : '#86868b' }}>{(v as string) || '미등록'}</span>
    )},
    { key: 'distributorStatus', label: '승인상태', align: 'center', render: (v) => {
      const statuses: Record<string, { bg: string; color: string; label: string }> = {
        pending: { bg: '#fff3e0', color: '#ef6c00', label: '대기' },
        approved: { bg: '#e8f5e9', color: '#2e7d32', label: '승인' },
        rejected: { bg: '#ffebee', color: '#c62828', label: '거절' }
      }
      const s = statuses[v as string] || { bg: '#f5f5f7', color: '#86868b', label: '미신청' }
      return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{s.label}</span>
    }},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => row.distributorStatus === 'pending' ? (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button onClick={() => handleApprove(row.id)} style={{ padding: '4px 10px', borderRadius: '4px', background: '#34c759', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>승인</button>
        <button style={{ padding: '4px 10px', borderRadius: '4px', background: '#ff3b30', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>거절</button>
      </div>
    ) : <span style={{ color: '#86868b', fontSize: '12px' }}>-</span> },
  ]

  const filtered = stores.filter(s => !filter || s.distributorStatus === filter)
  const pendingCount = stores.filter(s => s.distributorStatus === 'pending').length

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>유통사 코드 승인</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>전체</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stores.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: pendingCount > 0 ? '2px solid #ff9500' : 'none' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>승인대기</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{pendingCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>승인완료</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{stores.filter(s => s.distributorStatus === 'approved').length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>거절</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{stores.filter(s => s.distributorStatus === 'rejected').length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="가맹점명 검색"
        filters={[{
          key: 'status', label: '상태',
          options: [
            { label: '전체', value: '' },
            { label: '대기', value: 'pending' },
            { label: '승인', value: 'approved' },
            { label: '거절', value: 'rejected' }
          ],
          value: filter, onChange: setFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="가맹점이 없습니다" />
    </AdminLayout>
  )
}
