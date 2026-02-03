'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Store {
  id: number
  name: string
  code: string
  retinaCode: string | null
  retinaJoined: boolean
}

export default function IntegrationPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores((data.stores || data || []).filter((s: Store) => s.retinaJoined))
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Store>[] = [
    { key: 'code', label: '가맹점 코드', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{v as string}</span> },
    { key: 'name', label: '가맹점명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'retinaCode', label: '레티나 코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', color: '#007aff' }}>{(v as string) || '-'}</span>
    )},
    { key: 'id', label: '정산통합', align: 'center', render: (_, row) => (
      <span style={{ 
        background: row.retinaCode ? '#e8f5e9' : '#fff3e0',
        color: row.retinaCode ? '#2e7d32' : '#ef6c00',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {row.retinaCode ? '통합완료' : '미통합'}
      </span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => !row.retinaCode ? (
      <button style={{ padding: '4px 10px', borderRadius: '4px', background: '#007aff', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>통합</button>
    ) : <span style={{ color: '#86868b', fontSize: '12px' }}>-</span> },
  ]

  const integratedCount = stores.filter(s => s.retinaCode).length

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>레티나 가맹점 정산통합</h2>

      <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px', color: '#1565c0' }}>
        ℹ️ 레티나 가입 가맹점의 정산을 통합 관리합니다. 코드를 연결하면 주문/정산 데이터가 자동 동기화됩니다.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>레티나 가맹점</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stores.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>통합완료</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{integratedCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>미통합</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{stores.length - integratedCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="가맹점명 검색"
        filters={[{
          key: 'status', label: '상태',
          options: [
            { label: '전체', value: '' },
            { label: '통합완료', value: 'integrated' },
            { label: '미통합', value: 'notIntegrated' }
          ],
          value: filter, onChange: setFilter
        }]}
      />

      <DataTable columns={columns} data={stores} loading={loading} emptyMessage="레티나 가맹점이 없습니다" />
    </AdminLayout>
  )
}
