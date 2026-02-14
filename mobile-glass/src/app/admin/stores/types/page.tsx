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
    normal: { label: '?¼ë°˜', color: 'var(--text-primary)', bg: '#f5f5f7' },
    vip: { label: 'VIP', color: '#ff9500', bg: '#fff3e0' },
    wholesale: { label: '?„ë§¤', color: '#007aff', bg: '#eef4ee' }
  }

  const columns: Column<StoreType>[] = [
    { key: 'name', label: 'ê·¸ë£¹ëª?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'storeType', label: '?€??, render: (v) => {
      const t = typeLabels[v as string] || typeLabels.normal
      return <span style={{ background: t.bg, color: t.color, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{t.label}</span>
    }},
    { key: 'storeCount', label: 'ê°€ë§¹ì  ??, align: 'center', render: (v) => <span>{v as number}ê°?/span> },
    { key: 'discountRate', label: '? ì¸??, align: 'center', render: (v) => <span>{v as number}%</span> },
    { key: 'id', label: '?€??ë³€ê²?, align: 'center', render: (_, row) => (
      <select defaultValue={row.storeType} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
        <option value="normal">?¼ë°˜</option>
        <option value="vip">VIP</option>
        <option value="wholesale">?„ë§¤</option>
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
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>ê·¸ë£¹ë³??€???¤ì •</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ì´?ê·¸ë£¹</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{groups.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?¼ë°˜</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{typeCounts.normal}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>VIP</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{typeCounts.vip}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?„ë§¤</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{typeCounts.wholesale}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
      </div>

      <SearchFilter placeholder="ê·¸ë£¹ëª?ê²€?? actions={
        <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>?’¾ ?€??/button>
      } />

      <DataTable columns={columns} data={groups} loading={loading} emptyMessage="ê·¸ë£¹???†ìŠµ?ˆë‹¤" />
    </AdminLayout>
  )
}
