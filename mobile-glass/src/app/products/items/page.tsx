'use client'

import { useEffect, useState } from 'react'
import Layout, { cardStyle, btnStyle } from '../../components/Layout'

const SIDEBAR = [
  { title: '상품관리', items: [
    { label: '브랜드 관리', href: '/products' },
    { label: '판매상품 관리', href: '/products/items' },
    { label: '묶음상품 설정', href: '/products/bundles' },
    { label: 'RX상품 관리', href: '/products/rx' },
    { label: '상품 단축코드 설정', href: '/products/shortcuts' },
  ]},
  { title: '재고관리', items: [
    { label: '일괄재고수정', href: '/products/stock/bulk' },
    { label: '적정재고 설정', href: '/products/stock/optimal' },
  ]}
]

interface Brand {
  id: number
  name: string
  _count?: { products: number }
}

interface Product {
  id: number
  name: string
  brandName: string
  optionType: string
  productType?: string
  bundleName?: string
  refractiveIndex: string | null
  optionName?: string
  sellingPrice: number
  hasSph: boolean
  hasCyl: boolean
  hasAxis: boolean
}

export default function ProductItemsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [optionFilter, setOptionFilter] = useState('전체')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/brands').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([brandsData, productsData]) => {
      setBrands(brandsData.brands || [])
      setProducts(productsData || [])
      setLoading(false)
    })
  }, [])

  const filteredProducts = products.filter(p => {
    if (selectedBrand && p.brandName !== selectedBrand) return false
    if (optionFilter !== '전체' && p.optionType !== optionFilter) return false
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const brandCounts = products.reduce((acc, p) => {
    acc[p.brandName] = (acc[p.brandName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="상품">
      {/* 2-Column Layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        
        {/* Left Panel - Brand List */}
        <div style={{ 
          width: 280, 
          ...cardStyle, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>브랜드 목록</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                value={optionFilter}
                onChange={e => setOptionFilter(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  borderRadius: 8, 
                  border: '1px solid var(--gray-200)',
                  fontSize: 13 
                }}
              >
                <option>전체</option>
                <option>콘택트렌즈</option>
                <option>안경렌즈 여벌</option>
                <option>안경렌즈 RX</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
                fontSize: 13
              }}
            />
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* All brands option */}
            <div
              onClick={() => setSelectedBrand(null)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: selectedBrand === null ? 'var(--primary-light)' : 'transparent',
                borderLeft: selectedBrand === null ? '3px solid var(--primary)' : '3px solid transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontWeight: selectedBrand === null ? 600 : 400 }}>전체</span>
              <span style={{ 
                fontSize: 12, 
                color: 'var(--gray-400)',
                background: 'var(--gray-100)',
                padding: '2px 8px',
                borderRadius: 10
              }}>{products.length}</span>
            </div>
            
            {brands.map(brand => (
              <div
                key={brand.id}
                onClick={() => setSelectedBrand(brand.name)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedBrand === brand.name ? 'var(--primary-light)' : 'transparent',
                  borderLeft: selectedBrand === brand.name ? '3px solid var(--primary)' : '3px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontWeight: selectedBrand === brand.name ? 600 : 400 }}>{brand.name}</span>
                <span style={{ 
                  fontSize: 12, 
                  color: 'var(--gray-400)',
                  background: 'var(--gray-100)',
                  padding: '2px 8px',
                  borderRadius: 10
                }}>{brandCounts[brand.name] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Products Table */}
        <div style={{ 
          flex: 1, 
          ...cardStyle, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: 16, 
            borderBottom: '1px solid var(--gray-100)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                {selectedBrand || '전체'}
              </span>
              <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                ({filteredProducts.length}개)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btnStyle, fontSize: 12 }}>순서저장</button>
              <button style={{ ...btnStyle, fontSize: 12 }}>일괄수정</button>
              <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 12 }}>
                + 상품추가
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1200 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 40 }}>
                    <input type="checkbox" />
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 60 }}>수정</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>옵션타입</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>상품명</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>묶음상품명</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>굴절률</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 50 }}>SPH</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 50 }}>CYL</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 50 }}>AXIS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>판매가</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', width: 60 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>로딩중...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>상품이 없습니다</td></tr>
                ) : filteredProducts.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                    <td style={{ padding: '10px 12px' }}><input type="checkbox" /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <button style={{ 
                        padding: '4px 10px', 
                        borderRadius: 6, 
                        background: 'var(--primary)', 
                        color: '#fff', 
                        border: 'none', 
                        fontSize: 11,
                        cursor: 'pointer'
                      }}>수정</button>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: p.optionType === '콘택트렌즈' ? '#e8f5e9' : p.optionType === '안경렌즈 RX' ? '#e3f2fd' : '#fff3e0',
                        color: p.optionType === '콘택트렌즈' ? '#2e7d32' : p.optionType === '안경렌즈 RX' ? '#1565c0' : '#ef6c00',
                        fontSize: 11
                      }}>{p.optionType}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--gray-500)' }}>{p.bundleName || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace' }}>{p.refractiveIndex || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: p.hasSph ? 'var(--success)' : 'var(--gray-300)' }}>{p.hasSph ? 'O' : '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: p.hasCyl ? 'var(--success)' : 'var(--gray-300)' }}>{p.hasCyl ? 'O' : '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: p.hasAxis ? 'var(--success)' : 'var(--gray-300)' }}>{p.hasAxis ? 'O' : '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 500 }}>{p.sellingPrice.toLocaleString()}원</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: 10, 
                        background: 'var(--success-light)', 
                        color: 'var(--success)',
                        fontSize: 11 
                      }}>사용</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
