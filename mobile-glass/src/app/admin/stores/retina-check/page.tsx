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
  phone: string | null
  retinaCode: string | null
  retinaJoined: boolean
  retinaJoinedAt: string | null
}

export default function RetinaCheckPage() {
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

  const columns: Column<Store>[] = [
    { key: 'code', label: '코드', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span> },
    { key: 'name', label: '가맹점명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'ownerName', label: '대표자', render: (v) => <span>{(v as string) || '-'}</span> },
    { key: 'phone', label: '연락처', render: (v) => <span style={{ fontSize: '13px' }}>{(v as string) || '-'}</span> },
    { key: 'retinaCode', label: '레티나 코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', color: v ? '#007aff' : '#86868b' }}>{(v as string) || '미등록'}</span>
    )},
    { key: 'retinaJoined', label: '가입여부', align: 'center', render: (v) => (
      <span style={{ 
        background: v ? '#e8f5e9' : '#ffebee',
        color: v ? '#2e7d32' : '#c62828',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v ? '가입' : '미가입'}
      </span>
    )},
    { key: 'retinaJoinedAt', label: '가입일', render: (v) => (
      <span style={{ fontSize: '12px', color: '#86868b' }}>
        {v ? new Date(v as string).toLocaleDateString('ko-KR') : '-'}
      </span>
    )},
  ]

  const filtered = stores.filter(s => {
    if (!filter) return true
    if (filter === 'joined') return s.retinaJoined
    if (filter === 'notJoined') return !s.retinaJoined
    return true
  })

  const joinedCount = stores.filter(s => s.retinaJoined).length
  const notJoinedCount = stores.filter(s => !s.retinaJoined).length

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>레티나 가입여부 확인</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>전체 가맹점</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stores.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>레티나 가입</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{joinedCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>미가입</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{notJoinedCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>가입률</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{stores.length ? Math.round(joinedCount / stores.length * 100) : 0}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>%</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="가맹점명, 코드 검색"
        filters={[{
          key: 'status', label: '가입상태',
          options: [
            { label: '전체', value: '' },
            { label: '가입', value: 'joined' },
            { label: '미가입', value: 'notJoined' }
          ],
          value: filter, onChange: setFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="가맹점이 없습니다" />
    </AdminLayout>
  )
}
