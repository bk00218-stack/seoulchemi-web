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
      params.append('optionType', '안경렌즈 RX')
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
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'refractiveIndex', label: '굴절률', align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{(v as string) || '-'}</span>
    )},
    { key: 'hasSph', label: 'SPH', align: 'center', render: (v, row) => {
      const options = [row.hasSph && 'S', row.hasCyl && 'C', row.hasAxis && 'A'].filter(Boolean).join(' ')
      return <span style={{ color: '#86868b', fontSize: '12px' }}>{options || '-'}</span>
    }},
    { key: 'purchasePrice', label: '매입가', align: 'right', render: (v) => (
      <span style={{ color: '#86868b' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'sellingPrice', label: '판매가', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'isActive', label: '상태', align: 'center', render: (v) => (
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
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        RX상품 관리
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 RX상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{activeCount}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>브랜드</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{brands.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="상품명, 브랜드 검색"
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        filters={[{
          key: 'brand', label: '브랜드',
          options: [
            { label: '전체 브랜드', value: '' },
            ...brands.map(b => ({ label: b, value: b }))
          ],
          value: brandFilter, onChange: setBrandFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="RX상품이 없습니다" />
    </AdminLayout>
  )
}
