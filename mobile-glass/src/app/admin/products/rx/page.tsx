'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface RxProduct {
  id: number
  brandName: string
  name: string
  refractiveIndex: string | null
  purchasePrice: number
  sellingPrice: number
  hasSph: boolean
  hasCyl: boolean
  hasAxis: boolean
  isActive: boolean
}

export default function RxProductsPage() {
  const [data, setData] = useState<RxProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [brandFilter])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      params.append('optionType', '?àÍ≤Ω?åÏ¶à RX')
      if (brandFilter) params.append('brandId', brandFilter)
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/products?${params}`)
      const result = await res.json()
      setData(result.products || [])
    } catch (error) {
      console.error('Failed to load RX products:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<RxProduct>[] = [
    { key: 'brandName', label: 'Î∏åÎûú??, render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '?ÅÌíàÎ™?, render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'refractiveIndex', label: 'Íµ¥Ï†àÎ•?, align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{(v as string) || '-'}</span>
    )},
    { key: 'hasSph', label: 'SPH', align: 'center', render: (v, row) => {
      const options = [row.hasSph && 'S', row.hasCyl && 'C', row.hasAxis && 'A'].filter(Boolean).join(' ')
      return <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{options || '-'}</span>
    }},
    { key: 'purchasePrice', label: 'Îß§ÏûÖÍ∞Ä', align: 'right', render: (v) => (
      <span style={{ color: 'var(--text-tertiary)' }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'sellingPrice', label: '?êÎß§Í∞Ä', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'isActive', label: '?ÅÌÉú', align: 'center', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
  ]

  const filtered = search ? data.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.brandName.toLowerCase().includes(search.toLowerCase())
  ) : data

  const brands = [...new Set(data.map(d => d.brandName))]
  const activeCount = data.filter(d => d.isActive).length

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        RX?ÅÌíà Í¥ÄÎ¶?
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï¥?RX?ÅÌíà</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?úÏÑ±</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{activeCount}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Î∏åÎûú??/div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{brands.length}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Í∞?/span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="?ÅÌíàÎ™? Î∏åÎûú??Í≤Ä??
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        filters={[{
          key: 'brand', label: 'Î∏åÎûú??,
          options: [
            { label: '?ÑÏ≤¥ Î∏åÎûú??, value: '' },
            ...brands.map(b => ({ label: b, value: b }))
          ],
          value: brandFilter, onChange: setBrandFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="RX?ÅÌíà???ÜÏäµ?àÎã§" />
    </AdminLayout>
  )
}
