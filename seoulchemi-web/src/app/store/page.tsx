'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

interface BannerItem {
  id: string
  imageUrl: string
  title: string
  linkUrl: string
  order: number
  isActive: boolean
}

interface HeroSettings {
  topLabel: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  gradientStart: string
  gradientEnd: string
  isVisible: boolean
}

interface CategorySettings {
  showAll: boolean
  selectedIds: number[]
  customMeta: Record<string, { icon: string; color: string; bg: string }>
  sectionTitle: string
  isVisible: boolean
}

interface QuickMenuItem {
  id: string
  icon: string
  label: string
  sub: string
  href: string
  color: string
  bg: string
  isVisible: boolean
  order: number
}

// 대분류별 기본 아이콘/색상 매핑 (fallback)
const categoryMetaDefaults: Record<string, { icon: string; color: string; bg: string }> = {
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

  // Settings from API
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [bannerAutoPlay, setBannerAutoPlay] = useState(true)
  const [bannerInterval, setBannerInterval] = useState(5)
  const [hero, setHero] = useState<HeroSettings | null>(null)
  const [catSettings, setCatSettings] = useState<CategorySettings | null>(null)
  const [quickMenu, setQuickMenu] = useState<QuickMenuItem[] | null>(null)

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0)
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products?includeInactive=false&limit=1').then(r => r.json()),
      fetch('/api/store-home/settings').then(r => r.json()).catch(() => null),
    ]).then(([catData, prodData, settings]) => {
      setCategories(catData.categories || [])
      setProductCount(prodData.stats?.active || prodData.products?.length || 0)

      if (settings) {
        setBanners((settings.banners || []).filter((b: BannerItem) => b.isActive).sort((a: BannerItem, b: BannerItem) => a.order - b.order))
        setBannerAutoPlay(settings.bannerAutoPlay ?? true)
        setBannerInterval(settings.bannerInterval ?? 5)
        setHero(settings.hero || null)
        setCatSettings(settings.categories || null)
        setQuickMenu(settings.quickMenu || null)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Banner auto-play
  const activeBanners = banners
  const startBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
    if (bannerAutoPlay && activeBanners.length > 1) {
      bannerTimerRef.current = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % activeBanners.length)
      }, bannerInterval * 1000)
    }
  }, [bannerAutoPlay, bannerInterval, activeBanners.length])

  useEffect(() => {
    startBannerTimer()
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current) }
  }, [startBannerTimer])

  // Get category meta (custom overrides > defaults)
  const getMeta = (cat: Category) => {
    const customMeta = catSettings?.customMeta?.[cat.id]
    if (customMeta && (customMeta.icon || customMeta.color)) {
      return {
        icon: customMeta.icon || categoryMetaDefaults[cat.name]?.icon || defaultMeta.icon,
        color: customMeta.color || categoryMetaDefaults[cat.name]?.color || defaultMeta.color,
        bg: customMeta.bg || categoryMetaDefaults[cat.name]?.bg || defaultMeta.bg,
      }
    }
    return categoryMetaDefaults[cat.name] || defaultMeta
  }

  // Filter categories based on settings
  const displayCategories = catSettings && !catSettings.showAll && catSettings.selectedIds.length > 0
    ? categories.filter(c => catSettings.selectedIds.includes(c.id))
    : categories

  // Hero values (settings or defaults)
  const heroData = hero || {
    topLabel: '안경렌즈 전문 주문 시스템',
    title: 'LensChoice',
    subtitle: '{count}개 상품을 간편하게 주문하세요',
    buttonText: '전체 상품 보기 →',
    buttonLink: '/store/products',
    gradientStart: '#007aff',
    gradientEnd: '#0056b3',
    isVisible: true,
  }

  // Quick menu values
  const defaultQuickMenu = [
    { id: 'products', icon: '🛒', label: '상품주문', sub: '전체 상품', href: '/store/products', color: '#007aff', bg: '#e3f2fd', isVisible: true, order: 1 },
    { id: 'orders', icon: '📋', label: '주문내역', sub: '주문 확인', href: '/store/orders', color: '#34c759', bg: '#e8f5e9', isVisible: true, order: 2 },
    { id: 'account', icon: '💰', label: '잔액조회', sub: '미수금 확인', href: '/store/account', color: '#ff9500', bg: '#fff3e0', isVisible: true, order: 3 },
  ]
  const menuItems = (quickMenu || defaultQuickMenu).filter(m => m.isVisible).sort((a, b) => a.order - b.order)

  // Section visibility
  const showBanners = activeBanners.length > 0
  const showHero = heroData.isVisible !== false
  const showCategories = catSettings?.isVisible !== false
  const catSectionTitle = catSettings?.sectionTitle || '카테고리별 주문'

  // Subtitle with product count
  const heroSubtitle = heroData.subtitle.includes('{count}')
    ? (productCount > 0
        ? heroData.subtitle.replace('{count}', productCount.toLocaleString())
        : heroData.subtitle.replace('{count}개 상품', '다양한 상품'))
    : heroData.subtitle

  return (
    <div style={{ minHeight: '70vh' }}>
      <NoticePopup />
      <NoticeBanner />

      {/* Banner Carousel */}
      {showBanners && (
        <div style={{
          position: 'relative', borderRadius: isMobile ? 12 : 16,
          overflow: 'hidden', marginBottom: 16,
          background: '#f0f0f0',
        }}>
          <div
            style={{
              display: 'flex',
              transition: 'transform 0.5s ease',
              transform: `translateX(-${currentBanner * 100}%)`,
            }}
          >
            {activeBanners.map((banner) => (
              <div
                key={banner.id}
                onClick={() => banner.linkUrl && router.push(banner.linkUrl)}
                style={{
                  minWidth: '100%', cursor: banner.linkUrl ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title || '배너'}
                  style={{
                    width: '100%', height: isMobile ? 160 : 280,
                    objectFit: 'cover', display: 'block',
                  }}
                />
                {banner.title && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: isMobile ? '12px 16px' : '16px 24px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                    color: '#fff', fontSize: isMobile ? 14 : 18, fontWeight: 600,
                  }}>
                    {banner.title}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dots */}
          {activeBanners.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 6,
            }}>
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentBanner(idx); startBannerTimer() }}
                  style={{
                    width: idx === currentBanner ? 20 : 8, height: 8,
                    borderRadius: 4, border: 'none',
                    background: idx === currentBanner ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.3s', padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      {showHero && (
        <div style={{
          background: `linear-gradient(135deg, ${heroData.gradientStart} 0%, ${heroData.gradientEnd} 100%)`,
          borderRadius: isMobile ? 16 : 20,
          padding: isMobile ? '32px 20px' : '48px 40px',
          marginBottom: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
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
              {heroData.topLabel}
            </div>
            <h1 style={{
              fontSize: isMobile ? 28 : 36, fontWeight: 700, margin: '0 0 8px',
              letterSpacing: -0.5,
            }}>
              {heroData.title}
            </h1>
            <p style={{
              fontSize: isMobile ? 14 : 16, opacity: 0.8, margin: '0 0 24px',
              maxWidth: 400, lineHeight: 1.5,
            }}>
              {heroSubtitle}
            </p>
            <button
              onClick={() => router.push(heroData.buttonLink)}
              style={{
                background: '#fff', color: heroData.gradientStart, border: 'none',
                padding: isMobile ? '12px 28px' : '14px 36px',
                borderRadius: 12, fontSize: isMobile ? 15 : 16, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {heroData.buttonText}
            </button>
          </div>
        </div>
      )}

      {/* Category Cards */}
      {showCategories && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#1d1d1f',
            margin: '0 0 16px', letterSpacing: -0.3,
          }}>
            {catSectionTitle}
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>로딩중...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(displayCategories.length, 4)}, 1fr)`,
              gap: isMobile ? 12 : 16,
            }}>
              {displayCategories.map(cat => {
                const meta = getMeta(cat)
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
      )}

      {/* Quick Menu */}
      {menuItems.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#1d1d1f',
            margin: '0 0 16px', letterSpacing: -0.3,
          }}>
            바로가기
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(menuItems.length, 3)}, 1fr)`,
            gap: isMobile ? 10 : 16,
          }}>
            {menuItems.map(item => (
              <div
                key={item.id}
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
      )}
    </div>
  )
}
