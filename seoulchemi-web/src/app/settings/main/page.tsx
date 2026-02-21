'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface BannerItem {
  title: string
  linkUrl: string
  order: number
  isActive: boolean
}

interface SectionItem {
  id: string
  name: string
  isVisible: boolean
  order: number
}

const DEFAULT_SECTIONS: SectionItem[] = [
  { id: 'banner', name: '메인 배너', isVisible: true, order: 1 },
  { id: 'categories', name: '카테고리 바로가기', isVisible: true, order: 2 },
  { id: 'new_products', name: '신상품', isVisible: true, order: 3 },
  { id: 'best_products', name: '베스트 상품', isVisible: true, order: 4 },
  { id: 'sale_products', name: '할인 상품', isVisible: false, order: 5 },
  { id: 'brands', name: '브랜드 소개', isVisible: true, order: 6 },
  { id: 'reviews', name: '고객 리뷰', isVisible: false, order: 7 },
]

export default function MainSettingsPage() {
  const { toast } = useToast()
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>(DEFAULT_SECTIONS)
  const [bannerAutoPlay, setBannerAutoPlay] = useState(true)
  const [bannerInterval, setBannerInterval] = useState('5')
  const [bannerIndicator, setBannerIndicator] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/settings?group=main')
      const data = await res.json()
      const s = data.settings || {}

      try {
        if (s['main.banners']) setBanners(JSON.parse(s['main.banners']))
      } catch { /* ignore */ }

      try {
        if (s['main.sections']) setSections(JSON.parse(s['main.sections']))
      } catch { /* ignore */ }

      if (s['main.bannerAutoPlay'] !== undefined) setBannerAutoPlay(s['main.bannerAutoPlay'] === 'true')
      if (s['main.bannerInterval']) setBannerInterval(s['main.bannerInterval'])
      if (s['main.bannerIndicator'] !== undefined) setBannerIndicator(s['main.bannerIndicator'] === 'true')
    } catch (e) {
      console.error('Failed to fetch main settings:', e)
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
            'main.banners': JSON.stringify(banners),
            'main.sections': JSON.stringify(sections),
            'main.bannerAutoPlay': String(bannerAutoPlay),
            'main.bannerInterval': bannerInterval,
            'main.bannerIndicator': String(bannerIndicator),
          }
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('저장되었습니다.')
      } else {
        toast.error(data.error || '저장 실패')
      }
    } catch {
      toast.error('저장 중 오류 발생')
    } finally {
      setSaving(false)
    }
  }

  const toggleBanner = (idx: number) => {
    setBanners(prev => prev.map((b, i) => i === idx ? { ...b, isActive: !b.isActive } : b))
  }

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s))
  }

  const addBanner = () => {
    const title = prompt('배너 제목을 입력하세요')
    if (!title) return
    const linkUrl = prompt('연결 URL을 입력하세요') || '/'
    setBanners(prev => [...prev, { title, linkUrl, order: prev.length + 1, isActive: true }])
  }

  const removeBanner = (idx: number) => {
    setBanners(prev => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i + 1 })))
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>메인화면 설정</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            메인화면 레이아웃과 배너를 설정합니다.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: saving ? 'var(--gray-300)' : '#dc2626',
            color: '#fff',
            fontWeight: 500,
            cursor: saving ? 'default' : 'pointer'
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 배너 관리 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>🖼️ 메인 배너</h3>
          <button
            onClick={addBanner}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + 배너 추가
          </button>
        </div>
        {banners.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
            등록된 배너가 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', width: '60px' }}>순서</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>배너 제목</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>연결 URL</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>노출</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '24px',
                      height: '24px',
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      lineHeight: '24px',
                      fontWeight: 500
                    }}>
                      {banner.order}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{banner.title}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                    {banner.linkUrl}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={() => toggleBanner(idx)}
                        style={{ width: 18, height: 18, accentColor: '#007aff' }}
                      />
                    </label>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => removeBanner(idx)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fee2e2',
                        background: '#fff',
                        fontSize: '12px',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 섹션 배치 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>📐 섹션 배치</h3>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
          메인화면에 표시할 섹션을 선택하고 순서를 조정합니다.
        </p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {sections.sort((a, b) => a.order - b.order).map(section => (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: section.isVisible ? '#f0f9ff' : '#f9fafb',
                borderRadius: '8px',
                border: section.isVisible ? '1px solid #bae6fd' : '1px solid #e9ecef'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#999', cursor: 'move' }}>☰</span>
                <span style={{
                  fontSize: '13px',
                  background: '#e5e7eb',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  {section.order}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{section.name}</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={section.isVisible}
                  onChange={() => toggleSection(section.id)}
                  style={{ width: 18, height: 18, accentColor: '#007aff' }}
                />
                <span style={{ fontSize: '12px', color: section.isVisible ? '#059669' : '#666' }}>
                  {section.isVisible ? '표시' : '숨김'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 배너 설정 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⚙️ 배너 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              배너 자동 전환 (초)
            </label>
            <select
              value={bannerInterval}
              onChange={e => setBannerInterval(e.target.value)}
              style={{ ...inputStyle, width: '150px' }}
            >
              <option value="3">3초</option>
              <option value="5">5초</option>
              <option value="7">7초</option>
              <option value="10">10초</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bannerAutoPlay}
                onChange={e => setBannerAutoPlay(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#007aff' }}
              />
              <span style={{ fontSize: '14px' }}>배너 자동 재생</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bannerIndicator}
                onChange={e => setBannerIndicator(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#007aff' }}
              />
              <span style={{ fontSize: '14px' }}>인디케이터 표시</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
