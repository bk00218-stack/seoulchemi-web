'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '상품관리',
    items: [
      { label: '브랜드 관리', href: '/products' },
      { label: '판매상품 관리', href: '/products/items' },
      { label: '묶음상품 설정', href: '/products/bundles' },
      { label: 'RX상품 관리', href: '/products/rx' },
      { label: '상품 단축코드 설정', href: '/products/shortcuts' },
    ]
  },
  {
    title: '재고관리',
    items: [
      { label: '일괄재고수정', href: '/products/stock/bulk' },
      { label: '적정재고 설정', href: '/products/stock/optimal' },
    ]
  }
]

interface Brand {
  id: number
  name: string
  stockManage: string | null
  canExchange: boolean
  canReturn: boolean
  isActive: boolean
  displayOrder: number
  _count?: { products: number }
}

export default function ProductsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data.brands || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="상품">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>브랜드 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>브랜드를 추가하고 관리합니다</p>
        </div>
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>
          + 브랜드 추가
        </button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>수정</th>
              <th style={thStyle}>브랜드명</th>
              <th style={thStyle}>출고관리</th>
              <th style={thStyle}>교환</th>
              <th style={thStyle}>반품</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>노출순서</th>
              <th style={thStyle}>상품수</th>
              <th style={thStyle}>할인율</th>
              <th style={thStyle}>매입처</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                  로딩 중...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                  등록된 브랜드가 없습니다
                </td>
              </tr>
            ) : (
              brands.map(brand => (
                <tr key={brand.id}>
                  <td style={tdStyle}>
                    <button style={{ ...btnStyle, padding: '4px 12px', fontSize: 12, background: 'var(--primary)', color: '#fff', border: 'none' }}>
                      수정
                    </button>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{brand.name}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: brand.stockManage ? 'var(--primary-light)' : 'var(--gray-100)',
                      color: brand.stockManage ? 'var(--primary)' : 'var(--gray-500)'
                    }}>
                      {brand.stockManage || '미사용'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: brand.canExchange ? 'var(--success)' : 'var(--gray-400)' }}>
                      {brand.canExchange ? '가능' : '불가'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: brand.canReturn ? 'var(--success)' : 'var(--gray-400)' }}>
                      {brand.canReturn ? '가능' : '불가'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      background: brand.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                      color: brand.isActive ? 'var(--success)' : 'var(--gray-500)'
                    }}>
                      {brand.isActive ? '사용' : '미사용'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{brand.displayOrder}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{brand._count?.products || 0}</td>
                  <td style={tdStyle}>
                    <button style={{ ...btnStyle, padding: '4px 12px', fontSize: 12, background: 'var(--success)', color: '#fff', border: 'none' }}>
                      설정
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button style={{ ...btnStyle, padding: '4px 12px', fontSize: 12 }}>
                      설정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
