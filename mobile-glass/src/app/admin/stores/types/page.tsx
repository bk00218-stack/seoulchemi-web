'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface StoreType {
  id: number
  name: string
  storeType: string
  storeCount: number
  discountRate: number
}

export default function StoreTypesPage() {
  const [groups, setGroups] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/store-groups')
      setGroups(await res.json())
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    normal: { label: '일반', color: '#1d1d1f', bg: '#f5f5f7' },
    vip: { label: 'VIP', color: '#ff9500', bg: '#fff3e0' },
    wholesale: { label: '도매', color: '#007aff', bg: '#eef4ee' }
  }

  const columns: Column<StoreType>[] = [
    { key: 'name', label: '그룹명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'storeType', label: '타입', render: (v) => {
      const t = typeLabels[v as string] || typeLabels.normal
      return <span style={{ background: t.bg, color: t.color, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{t.label}</span>
    }},
    { key: 'storeCount', label: '가맹점 수', align: 'center', render: (v) => <span>{v as number}개</span> },
    { key: 'discountRate', label: '할인율', align: 'center', render: (v) => <span>{v as number}%</span> },
    { key: 'id', label: '타입 변경', align: 'center', render: (_, row) => (
      <select defaultValue={row.storeType} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e9ecef', fontSize: '12px' }}>
        <option value="normal">일반</option>
        <option value="vip">VIP</option>
        <option value="wholesale">도매</option>
      </select>
    )},
  ]

  const typeCounts = {
    normal: groups.filter(g => g.storeType === 'normal').length,
    vip: groups.filter(g => g.storeType === 'vip').length,
    wholesale: groups.filter(g => g.storeType === 'wholesale').length
  }

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>그룹별 타입 설정</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 그룹</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{groups.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>일반</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{typeCounts.normal}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>VIP</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{typeCounts.vip}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>도매</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{typeCounts.wholesale}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter placeholder="그룹명 검색" actions={
        <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>💾 저장</button>
      } />

      <DataTable columns={columns} data={groups} loading={loading} emptyMessage="그룹이 없습니다" />
    </AdminLayout>
  )
}
