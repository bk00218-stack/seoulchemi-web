'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface StockLevel {
  id: number
  productName: string
  brandName: string
  optionName: string
  currentStock: number
  minStock: number
  maxStock: number
  status: string
}

export default function StockLevelsPage() {
  const [data, setData] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // ProductOption에서 재고 정보 가져오기
      const res = await fetch('/api/inventory')
      const items = await res.json()
      
      // 적정재고 수준 계산 (임의 기준: minStock=10, maxStock=100)
      const processed = items.map((item: {
        id: number
        productName: string
        brandName: string
        optionName: string
        stock: number
      }) => {
        const minStock = 10
        const maxStock = 100
        let status = 'normal'
        if (item.stock === 0) status = 'outofstock'
        else if (item.stock < minStock) status = 'low'
        else if (item.stock > maxStock) status = 'over'
        
        return {
          ...item,
          currentStock: item.stock,
          minStock,
          maxStock,
          status
        }
      })
      
      setData(processed)
    } catch (error) {
      console.error('Failed to load stock levels:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<StockLevel>[] = [
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {v as string}
      </span>
    )},
    { key: 'productName', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionName', label: '옵션' },
    { key: 'currentStock', label: '현재고', align: 'center', render: (v, row) => {
      const color = row.status === 'outofstock' ? '#ff3b30' : 
                    row.status === 'low' ? '#ff9500' : 
                    row.status === 'over' ? '#007aff' : '#1d1d1f'
      return <span style={{ fontWeight: 600, color }}>{v as number}</span>
    }},
    { key: 'minStock', label: '최소', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}</span>
    )},
    { key: 'maxStock', label: '최대', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}</span>
    )},
    { key: 'status', label: '상태', align: 'center', render: (v) => {
      const styles: Record<string, { bg: string; color: string; label: string }> = {
        normal: { bg: '#e8f5e9', color: '#2e7d32', label: '정상' },
        low: { bg: '#fff3e0', color: '#ef6c00', label: '부족' },
        outofstock: { bg: '#ffebee', color: '#c62828', label: '품절' },
        over: { bg: '#e3f2fd', color: '#1565c0', label: '과잉' }
      }
      const s = styles[v as string] || styles.normal
      return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
          {s.label}
        </span>
      )
    }},
  ]

  const filtered = data.filter(d => {
    const matchSearch = !search || d.productName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const lowStock = data.filter(d => d.status === 'low').length
  const outOfStock = data.filter(d => d.status === 'outofstock').length
  const overStock = data.filter(d => d.status === 'over').length

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        적정재고 설정
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>전체</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>재고부족</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{lowStock}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>{outOfStock}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>과잉재고</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{overStock}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="상품명 검색"
        value={search}
        onChange={setSearch}
        filters={[{
          key: 'status', label: '상태',
          options: [
            { label: '전체', value: '' },
            { label: '정상', value: 'normal' },
            { label: '부족', value: 'low' },
            { label: '품절', value: 'outofstock' },
            { label: '과잉', value: 'over' }
          ],
          value: statusFilter, onChange: setStatusFilter
        }]}
      />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="재고 데이터가 없습니다" />
    </AdminLayout>
  )
}
