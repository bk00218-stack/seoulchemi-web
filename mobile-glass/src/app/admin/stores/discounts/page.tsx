'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface GroupDiscount {
  id: number
  name: string
  discountRate: number
  storeCount: number
}

export default function DiscountsPage() {
  const [groups, setGroups] = useState<GroupDiscount[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [groupsRes, brandsRes] = await Promise.all([
        fetch('/api/store-groups'),
        fetch('/api/brands')
      ])
      setGroups(await groupsRes.json())
      setBrands(await brandsRes.json())
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<GroupDiscount>[] = [
    { key: 'name', label: 'ê·¸ë£¹ëª?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'storeCount', label: 'ê°€ë§¹ì  ??, align: 'center', render: (v) => <span>{v as number}ê°?/span> },
    { key: 'discountRate', label: 'ê¸°ë³¸ ? ì¸??, align: 'center', render: (v) => (
      <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
        {v as number}%
      </span>
    )},
    ...brands.slice(0, 5).map(brand => ({
      key: `brand_${brand.id}` as keyof GroupDiscount,
      label: brand.name,
      align: 'center' as const,
      render: () => <input type="number" defaultValue={0} style={{ width: '50px', textAlign: 'center', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
    }))
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>ê·¸ë£¹ë³?? ì¸???¤ì •</h2>

      <div style={{ background: '#eef4ee', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px', color: '#4a6b4a' }}>
        ?’¡ ê°?ê·¸ë£¹ë³„ë¡œ ë¸Œëœ??? ì¸?¨ì„ ?¤ì •?????ˆìŠµ?ˆë‹¤. ë¹?ì¹¸ì? ê¸°ë³¸ ? ì¸?¨ì´ ?ìš©?©ë‹ˆ??
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ì´?ê·¸ë£¹</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{groups.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>ë¸Œëœ??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{brands.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?¤ì • ??ª©</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{groups.length * brands.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ê°?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="ê·¸ë£¹ëª?ê²€??
        actions={
          <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            ?’¾ ?€??
          </button>
        }
      />

      <DataTable columns={columns} data={groups} loading={loading} emptyMessage="ê·¸ë£¹???†ìŠµ?ˆë‹¤" />
    </AdminLayout>
  )
}
