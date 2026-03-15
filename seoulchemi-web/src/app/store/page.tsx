'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useCart } from '@/contexts/StoreCartContext'
import NoticePopup from './components/NoticePopup'
import NoticeBanner from './components/NoticeBanner'

interface Category {
  id: number
  name: string
  code: string
  _count?: { brands: number }
}

// 대분류별 아이콘/색상 매핑
const categoryMeta: Record<string, { icon: string; color: string; bg: string }> = {
  '안경렌즈 여벌': { icon: '👓', color: '#007aff', bg: '#e3f2fd' },
  '안경렌즈 RX': { icon: '🔬', color: '#34c759', bg: '#e8f5e9' },
  '콘택트렌즈': { icon: '👁️', color: '#af52de', bg: '#f3e5f5' },
  '착색': { icon: '🎨', color: '#ff9500', bg: '#fff3e0' },
}

const defaultMeta = { icon: '📦', color: '#86868b', bg: '#f5f5f7' }

export default function StoreLanding() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { totalCount } = useCart()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products?includeInactive=false&limit=1').then(r => r.json()),
    ]).then(([catData, prodData]) => {
      setCategories(catData.categories || [])
      setProductCount(prodData.stats?.active || prodData.products?.length || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const getMeta = (name: string) => categoryMeta[name] || defaultMeta

  return (
    <div style={{ minHeight: '70vh' }}>
      <NoticePopup />
      <NoticeBanner />

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '32px 20px' : '48px 40px',
        marginBottom: 24,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: 80,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: isMobile ? 14 : 16, opacity: 0.85, marginBottom: 8 }}>
            안경렌즈 전문 주문 시스템
          </div>
          <h1 style={{
            fontSize: isMobile ? 28 : 36, fontWeight: 700, margin: '0 0 8px',
            letterSpacing: -0.5,
          }}>
            LensChoice
          </h1>
          <p style={{
            fontSize: isMobile ? 14 : 16, opacity: 0.8, margin: '0 0 24px',
            maxWidth: 400, lineHeight: 1.5,
          }}>
            {productCount > 0 ? `${productCount.toLocaleString()}개 상품` : '다양한 상품'}을 간편하게 주문하세요
          </p>
          <button
            onClick={() => router.push('/store/products')}
            style={{
              background: '#fff', color: '#007aff', border: 'none',
              padding: isMobile ? '12px 28px' : '14px 36px',
              borderRadius: 12, fontSize: isMobile ? 15 : 16, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            전체 상품 보기 →
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#1d1d1f',
          margin: '0 0 16px', letterSpacing: -0.3,
        }}>
          카테고리별 주문
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>로딩중...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(categories.length, 4)}, 1fr)`,
            gap: isMobile ? 12 : 16,
          }}>
            {categories.map(cat => {
              const meta = getMeta(cat.name)
              return (
                <div
                  key={cat.id}
                  onClick={() => router.push(`/store/products?categoryId=${cat.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: isMobile ? '20px 16px' : '28px 24px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    width: isMobile ? 52 : 64, height: isMobile ? 52 : 64,
                    borderRadius: 16, background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 24 : 30, margin: '0 auto 12px',
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{
                    fontSize: isMobile ? 14 : 16, fontWeight: 600, color: '#1d1d1f',
                    marginBottom: 4,
                  }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#86868b' }}>
                    {cat._count?.brands || 0}개 브랜드
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Menu */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#1d1d1f',
          margin: '0 0 16px', letterSpacing: -0.3,
        }}>
          바로가기
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? 10 : 16,
        }}>
          {[
            { icon: '🛒', label: '상품주문', sub: '전체 상품', href: '/store/products', color: '#007aff', bg: '#e3f2fd' },
            { icon: '📋', label: '주문내역', sub: '주문 확인', href: '/store/orders', color: '#34c759', bg: '#e8f5e9' },
            { icon: '💰', label: '잔액조회', sub: '미수금 확인', href: '/store/account', color: '#ff9500', bg: '#fff3e0' },
          ].map(item => (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                background: '#fff', borderRadius: 16,
                padding: isMobile ? '16px 12px' : '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{
                width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                borderRadius: 12, background: item.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 18 : 22, margin: '0 auto 8px',
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#1d1d1f' }}>
                {item.label}
              </div>
              {!isMobile && (
                <div style={{ fontSize: 12, color: '#86868b', marginTop: 2 }}>{item.sub}</div>
              )}
              {item.href === '/store/products' && totalCount > 0 && (
                <div style={{
                  fontSize: 11, color: '#fff', background: '#ff3b30',
                  borderRadius: 10, padding: '2px 8px', display: 'inline-block', marginTop: 6,
                }}>
                  장바구니 {totalCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
