'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface BannerItem {
  id: number
  title: string
  imageUrl: string
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

const mockBanners: BannerItem[] = [
  { id: 1, title: '신상품 할인전', imageUrl: '/banners/banner1.jpg', linkUrl: '/events/new', order: 1, isActive: true },
  { id: 2, title: '베스트셀러 기획전', imageUrl: '/banners/banner2.jpg', linkUrl: '/events/best', order: 2, isActive: true },
  { id: 3, title: '시즌오프 세일', imageUrl: '/banners/banner3.jpg', linkUrl: '/events/sale', order: 3, isActive: false },
]

const mockSections: SectionItem[] = [
  { id: 'banner', name: '메인 배너', isVisible: true, order: 1 },
  { id: 'categories', name: '카테고리 바로가기', isVisible: true, order: 2 },
  { id: 'new_products', name: '신상품', isVisible: true, order: 3 },
  { id: 'best_products', name: '베스트 상품', isVisible: true, order: 4 },
  { id: 'sale_products', name: '할인 상품', isVisible: false, order: 5 },
  { id: 'brands', name: '브랜드 소개', isVisible: true, order: 6 },
  { id: 'reviews', name: '고객 리뷰', isVisible: false, order: 7 },
]

export default function MainSettingsPage() {
  const [banners, setBanners] = useState(mockBanners)
  const [sections, setSections] = useState(mockSections)
  const [saved, setSaved] = useState(false)

  const toggleBanner = (id: number) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
    setSaved(false)
  }

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ color: '#059669', fontSize: '13px' }}>✓ 저장되었습니다</span>}
          <button 
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 배너 관리 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>🖼️ 메인 배너</h3>
          <button style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer'
          }}>
            + 배너 추가
          </button>
        </div>
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
            {banners.map(banner => (
              <tr key={banner.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={banner.isActive}
                      onChange={() => toggleBanner(banner.id)}
                      style={{ width: 18, height: 18, accentColor: '#007aff' }}
                    />
                  </label>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      background: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>수정</button>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fee2e2',
                      background: '#fff',
                      fontSize: '12px',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <select style={{ ...inputStyle, width: '150px' }}>
              <option value="3">3초</option>
              <option value="5">5초</option>
              <option value="7">7초</option>
              <option value="10">10초</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>배너 자동 재생</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>인디케이터 표시</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
