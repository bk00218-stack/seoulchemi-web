'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface Brand { id: number; name: string; categoryId: number }
interface Category { id: number; name: string }
interface Product {
  id: number; name: string; brandName: string; productLineName: string
  purchasePrice: number; sellingPrice: number; retailPrice: number
  options?: ProductOption[]
}
interface ProductOption {
  id: number; optionName: string; sph: string; cyl: string
  priceAdjustment: number; stock: number
}

function formatAmount(n: number): string {
  return n.toLocaleString()
}

export default function PriceListPage() {
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || d || []))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('categoryId', categoryId)
    params.set('includeInactive', 'false')
    fetch(`/api/brands?${params}`).then(r => r.json()).then(d => setBrands(d.brands || d || []))
  }, [categoryId])

  const handleSearch = async () => {
    setLoading(true)
    try {
      // 브랜드별로 상품 가져오기
      const params = new URLSearchParams()
      if (brandId) params.set('brandId', brandId)
      if (categoryId) params.set('categoryId', categoryId)
      if (search) params.set('search', search)
      params.set('limit', '500')
      params.set('includeOptions', 'true')

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const prods: Product[] = (data.products || data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brandName: p.brand?.name || p.brandName || '',
        productLineName: p.productLine?.name || p.productLineName || '',
        purchasePrice: p.purchasePrice || 0,
        sellingPrice: p.sellingPrice || 0,
        retailPrice: p.retailPrice || 0,
        options: (p.options || []).map((o: any) => ({
          id: o.id,
          optionName: o.optionName || '',
          sph: o.sph || '',
          cyl: o.cyl || '',
          priceAdjustment: o.priceAdjustment || 0,
          stock: o.stock || 0,
        }))
      }))
      setProducts(prods)
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [])

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleExport = () => {
    if (products.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(
      products.map(p => ({
        brandName: p.brandName,
        productLineName: p.productLineName,
        name: p.name,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        retailPrice: p.retailPrice,
      })),
      [
        { key: 'brandName', label: '브랜드' },
        { key: 'productLineName', label: '품목' },
        { key: 'name', label: '상품명' },
        { key: 'purchasePrice', label: '매입가' },
        { key: 'sellingPrice', label: '도매가' },
        { key: 'retailPrice', label: '소매가' },
      ],
      '단가조회'
    )
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      {/* 필터 */}
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>대분류</label>
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setBrandId('') }} style={{ ...selectStyle, width: '160px' }}>
            <option value="">전체</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>브랜드</label>
          <select value={brandId} onChange={e => setBrandId(e.target.value)} style={{ ...selectStyle, width: '180px' }}>
            <option value="">전체</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>검색</label>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="상품명 검색..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...inputStyle, width: '200px' }}
          />
        </div>
        <button onClick={handleSearch} disabled={loading} style={{ ...btnStyle, background: '#2563eb', color: '#fff' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 결과 수 */}
      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
        총 {products.length}개 상품
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '30px' }}></th>
              <th style={thStyle}>브랜드</th>
              <th style={thStyle}>품목</th>
              <th style={thStyle}>상품명</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>매입가</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>도매가</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>소매가</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {loading ? '조회 중...' : '데이터가 없습니다.'}
                </td>
              </tr>
            ) : products.map((p, i) => (
              <>
                <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', cursor: p.options && p.options.length > 0 ? 'pointer' : 'default' }}
                  onClick={() => p.options && p.options.length > 0 && toggleExpand(p.id)}
                >
                  <td style={{ ...tdStyle, textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
                    {p.options && p.options.length > 0 ? (expandedIds.has(p.id) ? '▼' : '▶') : ''}
                  </td>
                  <td style={tdStyle}>{p.brandName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{p.productLineName}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(p.purchasePrice)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatAmount(p.sellingPrice)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(p.retailPrice)}</td>
                </tr>
                {expandedIds.has(p.id) && p.options?.map(o => (
                  <tr key={`opt-${o.id}`} style={{ background: '#f0f9ff' }}>
                    <td style={tdStyle}></td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: '12px', paddingLeft: '24px' }}>
                      {o.sph && `SPH ${o.sph}`} {o.cyl && `CYL ${o.cyl}`}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>{o.optionName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px' }}>
                      {o.priceAdjustment !== 0 ? `${o.priceAdjustment > 0 ? '+' : ''}${formatAmount(o.priceAdjustment)}` : '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                      재고: {o.stock}
                    </td>
                    <td style={tdStyle}></td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
