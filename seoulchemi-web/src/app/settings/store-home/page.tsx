'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/contexts/ToastContext'
import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

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

interface CategoryItem {
  id: number
  name: string
  _count?: { brands: number }
}

const DEFAULT_HERO: HeroSettings = {
  topLabel: '안경렌즈 전문 주문 시스템',
  title: 'LensChoice',
  subtitle: '{count}개 상품을 간편하게 주문하세요',
  buttonText: '전체 상품 보기 →',
  buttonLink: '/store/products',
  gradientStart: '#007aff',
  gradientEnd: '#0056b3',
  isVisible: true,
}

const DEFAULT_CATEGORY_SETTINGS: CategorySettings = {
  showAll: true,
  selectedIds: [],
  customMeta: {},
  sectionTitle: '카테고리별 주문',
  isVisible: true,
}

const DEFAULT_QUICK_MENU: QuickMenuItem[] = [
  { id: 'products', icon: '🛒', label: '상품주문', sub: '전체 상품', href: '/store/products', color: '#007aff', bg: '#e3f2fd', isVisible: true, order: 1 },
  { id: 'orders', icon: '📋', label: '주문내역', sub: '주문 확인', href: '/store/orders', color: '#34c759', bg: '#e8f5e9', isVisible: true, order: 2 },
  { id: 'account', icon: '💰', label: '잔액조회', sub: '미수금 확인', href: '/store/account', color: '#ff9500', bg: '#fff3e0', isVisible: true, order: 3 },
]

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e9ecef',
  padding: 24,
  marginBottom: 16,
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#555',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: '0 0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

export default function StoreHomeSettingsPage() {
  const { toast } = useToast()

  // Data
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [bannerAutoPlay, setBannerAutoPlay] = useState(true)
  const [bannerInterval, setBannerInterval] = useState('5')
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO)
  const [categorySettings, setCategorySettings] = useState<CategorySettings>(DEFAULT_CATEGORY_SETTINGS)
  const [quickMenu, setQuickMenu] = useState<QuickMenuItem[]>(DEFAULT_QUICK_MENU)

  // Categories from DB
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, catRes] = await Promise.all([
        fetch('/api/admin/settings?group=storeHome'),
        fetch('/api/categories'),
      ])
      const settingsData = await settingsRes.json()
      const catData = await catRes.json()
      const s = settingsData.settings || {}

      try { if (s['storeHome.banners']) setBanners(JSON.parse(s['storeHome.banners'])) } catch { /* */ }
      if (s['storeHome.bannerAutoPlay'] !== undefined) setBannerAutoPlay(s['storeHome.bannerAutoPlay'] === 'true')
      if (s['storeHome.bannerInterval']) setBannerInterval(s['storeHome.bannerInterval'])
      try { if (s['storeHome.hero']) setHero({ ...DEFAULT_HERO, ...JSON.parse(s['storeHome.hero']) }) } catch { /* */ }
      try { if (s['storeHome.categories']) setCategorySettings({ ...DEFAULT_CATEGORY_SETTINGS, ...JSON.parse(s['storeHome.categories']) }) } catch { /* */ }
      try { if (s['storeHome.quickMenu']) setQuickMenu(JSON.parse(s['storeHome.quickMenu'])) } catch { /* */ }

      setAllCategories(catData.categories || [])
    } catch (e) {
      console.error('Failed to fetch store home settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            'storeHome.banners': JSON.stringify(banners),
            'storeHome.bannerAutoPlay': String(bannerAutoPlay),
            'storeHome.bannerInterval': bannerInterval,
            'storeHome.hero': JSON.stringify(hero),
            'storeHome.categories': JSON.stringify(categorySettings),
            'storeHome.quickMenu': JSON.stringify(quickMenu),
          }
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('저장되었습니다')
      } else {
        toast.error(data.error || '저장 실패')
      }
    } catch {
      toast.error('저장 중 오류 발생')
    } finally {
      setSaving(false)
    }
  }

  // === Banner handlers ===
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('파일 크기는 4MB 이하만 가능합니다')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/store-home/banners', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.imageUrl) {
        setBanners(prev => [...prev, {
          id: String(Date.now()),
          imageUrl: data.imageUrl,
          title: '',
          linkUrl: '',
          order: prev.length + 1,
          isActive: true,
        }])
        toast.success('이미지가 업로드되었습니다')
      } else {
        toast.error(data.error || '업로드 실패')
      }
    } catch {
      toast.error('업로드 중 오류 발생')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeBanner = async (idx: number) => {
    const banner = banners[idx]
    if (!confirm('이 배너를 삭제하시겠습니까?')) return

    // Blob에서 이미지 삭제
    if (banner.imageUrl) {
      try {
        await fetch('/api/store-home/banners', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: banner.imageUrl }),
        })
      } catch { /* ignore */ }
    }

    setBanners(prev => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i + 1 })))
  }

  const updateBanner = (idx: number, field: keyof BannerItem, value: any) => {
    setBanners(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b))
  }

  // === Category handlers ===
  const toggleCategoryId = (catId: number) => {
    setCategorySettings(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(catId)
        ? prev.selectedIds.filter(id => id !== catId)
        : [...prev.selectedIds, catId],
    }))
  }

  const updateCategoryMeta = (catId: number, field: string, value: string) => {
    setCategorySettings(prev => ({
      ...prev,
      customMeta: {
        ...prev.customMeta,
        [catId]: {
          icon: prev.customMeta[catId]?.icon || '',
          color: prev.customMeta[catId]?.color || '',
          bg: prev.customMeta[catId]?.bg || '',
          [field]: value,
        },
      },
    }))
  }

  // === Quick menu handlers ===
  const updateQuickMenu = (idx: number, field: keyof QuickMenuItem, value: any) => {
    setQuickMenu(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
        <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>스토어 홈 설정</h1>
          <p style={{ color: '#86868b', fontSize: 14, margin: 0 }}>
            안경원 주문 사이트의 홈 화면을 설정합니다.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: saving ? '#ccc' : '#2d5a2d', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 1. 배너 관리 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🖼️</span> 배너 이미지 관리
        </h3>
        <p style={{ fontSize: 13, color: '#86868b', marginBottom: 16 }}>
          홈 화면 상단에 표시되는 배너 이미지를 관리합니다. 이미지를 업로드하고 클릭 시 이동할 링크를 설정하세요.
        </p>

        {/* 배너 목록 */}
        {banners.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {banners.map((banner, idx) => (
              <div key={banner.id} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                padding: 12, background: '#f8f9fa', borderRadius: 8,
                border: banner.isActive ? '1px solid #c8e6c9' : '1px solid #e0e0e0',
                opacity: banner.isActive ? 1 : 0.6,
              }}>
                {/* 썸네일 */}
                <div style={{
                  width: 160, height: 80, flexShrink: 0, borderRadius: 6,
                  overflow: 'hidden', background: '#e9ecef',
                }}>
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || '배너'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* 정보 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="배너 제목 (선택)"
                      value={banner.title}
                      onChange={e => updateBanner(idx, 'title', e.target.value)}
                    />
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="클릭 시 이동 URL (예: /store/products)"
                      value={banner.linkUrl}
                      onChange={e => updateBanner(idx, 'linkUrl', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#999' }}>순서: {banner.order}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={e => updateBanner(idx, 'isActive', e.target.checked)}
                      />
                      활성
                    </label>
                    <button
                      onClick={() => removeBanner(idx)}
                      style={{
                        padding: '3px 10px', borderRadius: 4,
                        border: '1px solid #fee2e2', background: '#fff',
                        fontSize: 12, color: '#dc2626', cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 업로드 버튼 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleBannerUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '2px dashed #007aff',
              background: '#f0f7ff', color: '#007aff', fontSize: 13, fontWeight: 600,
              cursor: uploading ? 'default' : 'pointer',
            }}
          >
            {uploading ? '업로드 중...' : '+ 배너 이미지 업로드'}
          </button>
          <span style={{ fontSize: 12, color: '#999' }}>권장: 1200x400px, 최대 4MB</span>
        </div>

        {/* 배너 설정 */}
        {banners.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e9ecef', display: 'flex', gap: 24, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={bannerAutoPlay} onChange={e => setBannerAutoPlay(e.target.checked)} />
              자동 재생
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>전환 간격:</span>
              <select
                value={bannerInterval}
                onChange={e => setBannerInterval(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
              >
                <option value="3">3초</option>
                <option value="5">5초</option>
                <option value="7">7초</option>
                <option value="10">10초</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. 히어로 설정 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            <span>🎨</span> 히어로 섹션 설정
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hero.isVisible}
              onChange={e => setHero(prev => ({ ...prev, isVisible: e.target.checked }))}
            />
            표시
          </label>
        </div>

        {hero.isVisible && (
          <>
            {/* 미리보기 */}
            <div style={{
              background: `linear-gradient(135deg, ${hero.gradientStart} 0%, ${hero.gradientEnd} 100%)`,
              borderRadius: 12, padding: '24px 28px', marginBottom: 16, color: '#fff',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{hero.topLabel}</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{hero.title}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>{hero.subtitle.replace('{count}', '520')}</div>
                <div style={{ display: 'inline-block', padding: '8px 20px', background: '#fff', color: hero.gradientStart, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  {hero.buttonText}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>상단 라벨</label>
                <input style={inputStyle} value={hero.topLabel} onChange={e => setHero(prev => ({ ...prev, topLabel: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>제목</label>
                <input style={inputStyle} value={hero.title} onChange={e => setHero(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>부제 <span style={{ color: '#999', fontWeight: 400 }}>({'{count}'}는 상품수로 치환)</span></label>
                <input style={inputStyle} value={hero.subtitle} onChange={e => setHero(prev => ({ ...prev, subtitle: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>버튼 텍스트</label>
                <input style={inputStyle} value={hero.buttonText} onChange={e => setHero(prev => ({ ...prev, buttonText: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>버튼 링크</label>
                <input style={inputStyle} value={hero.buttonLink} onChange={e => setHero(prev => ({ ...prev, buttonLink: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>그라디언트 시작</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={hero.gradientStart}
                      onChange={e => setHero(prev => ({ ...prev, gradientStart: e.target.value }))}
                      style={{ width: 36, height: 36, border: 'none', padding: 0, cursor: 'pointer' }}
                    />
                    <input style={{ ...inputStyle, flex: 1 }} value={hero.gradientStart} onChange={e => setHero(prev => ({ ...prev, gradientStart: e.target.value }))} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>그라디언트 끝</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={hero.gradientEnd}
                      onChange={e => setHero(prev => ({ ...prev, gradientEnd: e.target.value }))}
                      style={{ width: 36, height: 36, border: 'none', padding: 0, cursor: 'pointer' }}
                    />
                    <input style={{ ...inputStyle, flex: 1 }} value={hero.gradientEnd} onChange={e => setHero(prev => ({ ...prev, gradientEnd: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. 카테고리 표시 설정 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            <span>📦</span> 카테고리 표시 설정
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categorySettings.isVisible}
              onChange={e => setCategorySettings(prev => ({ ...prev, isVisible: e.target.checked }))}
            />
            표시
          </label>
        </div>

        {categorySettings.isVisible && (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>섹션 제목</label>
                <input
                  style={{ ...inputStyle, width: 250 }}
                  value={categorySettings.sectionTitle}
                  onChange={e => setCategorySettings(prev => ({ ...prev, sectionTitle: e.target.value }))}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={categorySettings.showAll}
                    onChange={e => setCategorySettings(prev => ({ ...prev, showAll: e.target.checked }))}
                  />
                  전체 카테고리 표시
                </label>
              </div>
            </div>

            {!categorySettings.showAll && (
              <p style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>표시할 카테고리를 선택하세요:</p>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              {allCategories.map(cat => {
                const selected = categorySettings.selectedIds.includes(cat.id)
                const meta = categorySettings.customMeta[cat.id]
                return (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: !categorySettings.showAll && !selected ? '#f9f9f9' : '#f0f9ff',
                    border: !categorySettings.showAll && !selected ? '1px solid #e9ecef' : '1px solid #bae6fd',
                    opacity: categorySettings.showAll || selected ? 1 : 0.5,
                  }}>
                    {!categorySettings.showAll && (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCategoryId(cat.id)}
                        style={{ width: 16, height: 16 }}
                      />
                    )}
                    <span style={{ fontWeight: 500, fontSize: 14, minWidth: 120 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>({cat._count?.brands || 0}개 브랜드)</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        style={{ ...inputStyle, width: 60, textAlign: 'center' }}
                        placeholder="아이콘"
                        value={meta?.icon || ''}
                        onChange={e => updateCategoryMeta(cat.id, 'icon', e.target.value)}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="color"
                          value={meta?.color || '#007aff'}
                          onChange={e => updateCategoryMeta(cat.id, 'color', e.target.value)}
                          style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 11, color: '#999' }}>색상</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="color"
                          value={meta?.bg || '#e3f2fd'}
                          onChange={e => updateCategoryMeta(cat.id, 'bg', e.target.value)}
                          style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 11, color: '#999' }}>배경</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* 4. 바로가기 메뉴 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🚀</span> 바로가기 메뉴 설정
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quickMenu.sort((a, b) => a.order - b.order).map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: '10px 14px', borderRadius: 8,
              background: item.isVisible ? '#f0f9ff' : '#f9f9f9',
              border: item.isVisible ? '1px solid #bae6fd' : '1px solid #e9ecef',
              opacity: item.isVisible ? 1 : 0.5,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={item.isVisible}
                  onChange={e => updateQuickMenu(idx, 'isVisible', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
              </label>
              <input
                style={{ ...inputStyle, width: 50, textAlign: 'center' }}
                value={item.icon}
                onChange={e => updateQuickMenu(idx, 'icon', e.target.value)}
                title="아이콘"
              />
              <input
                style={{ ...inputStyle, width: 100 }}
                value={item.label}
                onChange={e => updateQuickMenu(idx, 'label', e.target.value)}
                placeholder="라벨"
              />
              <input
                style={{ ...inputStyle, width: 100 }}
                value={item.sub}
                onChange={e => updateQuickMenu(idx, 'sub', e.target.value)}
                placeholder="설명"
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={item.href}
                onChange={e => updateQuickMenu(idx, 'href', e.target.value)}
                placeholder="링크 URL"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="color"
                  value={item.color}
                  onChange={e => updateQuickMenu(idx, 'color', e.target.value)}
                  style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                />
                <input
                  type="color"
                  value={item.bg}
                  onChange={e => updateQuickMenu(idx, 'bg', e.target.value)}
                  style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
