'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Shortcut {
  id: number
  shortcode: string
  productId: number
  productName: string
  brandName: string
  description: string | null
  useCount: number
  isActive: boolean
}

export default function ShortcutsPage() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/shortcuts')
      setShortcuts(await res.json())
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Shortcut>[] = [
    { key: 'shortcode', label: '단축코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f5f5f7', padding: '4px 8px', borderRadius: '4px' }}>{v as string}</span>
    )},
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'productName', label: '상품명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'description', label: '설명', render: (v) => <span style={{ color: '#666', fontSize: '13px' }}>{(v as string) || '-'}</span> },
    { key: 'useCount', label: '사용횟수', align: 'center', render: (v) => <span style={{ color: '#86868b' }}>{v as number}회</span> },
    { key: 'isActive', label: '상태', align: 'center', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ]

  const filtered = search ? shortcuts.filter(s => 
    s.shortcode.toLowerCase().includes(search.toLowerCase()) ||
    s.productName.toLowerCase().includes(search.toLowerCase())
  ) : shortcuts

  const totalUse = shortcuts.reduce((sum, s) => sum + s.useCount, 0)

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>상품 단축코드 설정</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 단축코드</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{shortcuts.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{shortcuts.filter(s => s.isActive).length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 사용횟수</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalUse.toLocaleString()}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>회</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="단축코드, 상품명 검색"
        value={search}
        onChange={setSearch}
        actions={
          <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            + 단축코드 등록
          </button>
        }
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="등록된 단축코드가 없습니다" />
    </AdminLayout>
  )
}
