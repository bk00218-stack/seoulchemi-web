'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface BundleItem {
  id: number
  quantity: number
  product: {
    id: number
    name: string
    sellingPrice: number
    optionType: string | null
    brand: { name: string } | null
  }
}

interface Bundle {
  id: number
  name: string
  description: string | null
  discountRate: number
  discountAmount: number
  isActive: boolean
  createdAt: string
  items: BundleItem[]
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
}

export default function BundlesPage() {
  const { toast } = useToast()
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedBundle, setExpandedBundle] = useState<number | null>(null)

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      const res = await fetch('/api/admin/bundles')
      const data = await res.json()
      setBundles(data.bundles || [])
    } catch (e) {
      console.error('Failed to fetch bundles:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredBundles = bundles.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: bundles.length,
    active: bundles.filter(b => b.isActive).length,
    inactive: bundles.filter(b => !b.isActive).length,
    avgDiscount: bundles.length > 0 ? Math.round(bundles.reduce((sum, b) => sum + b.discountRate, 0) / bundles.length) : 0,
  }

  const getBundlePrice = (bundle: Bundle) => {
    const originalPrice = bundle.items.reduce((sum, item) => sum + (item.product?.sellingPrice || 0) * item.quantity, 0)
    const discounted = bundle.discountAmount > 0
      ? originalPrice - bundle.discountAmount
      : originalPrice * (1 - bundle.discountRate / 100)
    return { originalPrice, discountedPrice: Math.round(discounted) }
  }

  if (loading) {
    return (
      <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>묶음상품 관리</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          여러 상품을 묶어 할인된 가격으로 판매하는 패키지 상품을 관리합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>전체 묶음상품</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>판매중</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{stats.active}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>판매중지</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>{stats.inactive}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>평균 할인율</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff3b30' }}>{stats.avgDiscount}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>%</span></div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 묶음상품명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 300 }}
        />
        <button
          onClick={() => toast.info('묶음상품 등록은 준비중입니다')}
          style={{ ...btnStyle, background: '#007aff', color: '#fff' }}
        >+ 묶음상품 등록</button>
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredBundles.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p>등록된 묶음상품이 없습니다.</p>
          </div>
        ) : (
          filteredBundles.map(bundle => {
            const { originalPrice, discountedPrice } = getBundlePrice(bundle)
            const discount = originalPrice > 0 ? Math.round((1 - discountedPrice / originalPrice) * 100) : 0
            return (
              <div key={bundle.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <div
                  onClick={() => setExpandedBundle(expandedBundle === bundle.id ? null : bundle.id)}
                  style={{
                    padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', background: expandedBundle === bundle.id ? 'var(--gray-50)' : '#fff',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, background: 'var(--gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎁</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{bundle.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{bundle.description || `${bundle.items.length}개 상품`}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#007aff' }}>{discountedPrice.toLocaleString()}원</div>
                      {originalPrice > discountedPrice && (
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'line-through' }}>{originalPrice.toLocaleString()}원</div>
                      )}
                    </div>
                    {discount > 0 && (
                      <span style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#ffebee', color: '#ff3b30' }}>
                        -{discount}%
                      </span>
                    )}
                    <span style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: bundle.isActive ? '#e8f5e9' : '#fef3e7',
                      color: bundle.isActive ? '#34c759' : '#ff9500',
                    }}>
                      {bundle.isActive ? '판매중' : '중지'}
                    </span>
                    <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{expandedBundle === bundle.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedBundle === bundle.id && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--gray-50)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 12 }}>구성 상품</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {bundle.items.map(item => (
                        <div key={item.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid var(--gray-200)',
                        }}>
                          <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                            {item.product?.brand?.name || '-'}
                          </span>
                          <span style={{ flex: 1, fontSize: 14 }}>{item.product?.name || '(삭제된 상품)'}</span>
                          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>x{item.quantity}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{(item.product?.sellingPrice || 0).toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
