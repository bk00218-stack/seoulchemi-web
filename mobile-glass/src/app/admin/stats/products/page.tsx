'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface ProductStat {
  id: number
  productName: string
  brandName: string
  optionType: string
  quantity: number
  amount: number
  orderCount: number
}

interface BrandStat {
  name: string
  count: number
  amount: number
}

interface Summary {
  totalAmount: number
  totalCount: number
  productCount: number
}

export default function ProductStatsPage() {
  const [products, setProducts] = useState<ProductStat[]>([])
  const [brands, setBrands] = useState<BrandStat[]>([])
  const [summary, setSummary] = useState<Summary>({ totalAmount: 0, totalCount: 0, productCount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/stats/products')
      const data = await res.json()
      setProducts(data.products || [])
      setBrands(data.brands || [])
      setSummary(data.summary || { totalAmount: 0, totalCount: 0, productCount: 0 })
    } catch (error) {
      console.error('Failed to load product stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<ProductStat>[] = [
    { key: 'id', label: '순위', width: '60px', align: 'center', render: (_, __, idx) => (
      <span style={{ 
        fontWeight: 600, 
        color: (idx || 0) < 3 ? '#007aff' : '#86868b' 
      }}>
        {(idx || 0) + 1}
      </span>
    )},
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ 
        background: '#f0f7ff', 
        color: '#007aff', 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as string}
      </span>
    )},
    { key: 'productName', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionType', label: '구분', render: (v) => (
      <span style={{ color: '#666', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'quantity', label: '판매수량', align: 'right', render: (v) => (
      <span>{(v as number).toLocaleString()}개</span>
    )},
    { key: 'amount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'orderCount', label: '주문건수', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}건</span>
    )},
  ]

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || 
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.brandName.toLowerCase().includes(search.toLowerCase())
    const matchBrand = !brandFilter || p.brandName === brandFilter
    return matchSearch && matchBrand
  })

  const brandNames = [...new Set(products.map(p => p.brandName))]

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 상품 통계
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 매출액</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {summary.totalAmount.toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>원</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 판매수량</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {summary.totalCount.toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>판매 상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {summary.productCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>종</span>
          </div>
        </div>
      </div>

      {/* 브랜드별 요약 */}
      {brands.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#1d1d1f' }}>
            브랜드별 매출
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {brands.slice(0, 8).map((brand, idx) => (
              <div 
                key={brand.name}
                style={{ 
                  padding: '12px 16px', 
                  background: idx === 0 ? '#007aff' : '#f5f5f7',
                  color: idx === 0 ? '#fff' : '#1d1d1f',
                  borderRadius: '8px',
                  minWidth: '120px'
                }}
              >
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>{brand.name}</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{brand.amount.toLocaleString()}원</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{brand.count}개</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SearchFilter
        placeholder="상품명, 브랜드 검색"
        value={search}
        onChange={setSearch}
        filters={[
          {
            key: 'brand',
            label: '브랜드',
            options: [
              { label: '전체 브랜드', value: '' },
              ...brandNames.map(b => ({ label: b, value: b }))
            ],
            value: brandFilter,
            onChange: setBrandFilter
          }
        ]}
        actions={
          <button
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff',
              color: '#1d1d1f',
              border: '1px solid #e9ecef',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📥 엑셀
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        emptyMessage="판매 데이터가 없습니다"
      />
    </AdminLayout>
  )
}
