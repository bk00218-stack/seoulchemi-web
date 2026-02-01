'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, SaveButton } from '../../../components/FormInput'

interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  sortOrder: number
}

const sampleBanners: BannerItem[] = [
  { id: 1, title: '신상품 출시', imageUrl: '/banner1.jpg', linkUrl: '/products/new', isActive: true, sortOrder: 1 },
  { id: 2, title: '1월 특가 이벤트', imageUrl: '/banner2.jpg', linkUrl: '/event/january', isActive: true, sortOrder: 2 },
  { id: 3, title: '프리미엄 렌즈', imageUrl: '/banner3.jpg', linkUrl: '/products/premium', isActive: false, sortOrder: 3 },
]

export default function MainScreenPage() {
  const [banners, setBanners] = useState(sampleBanners)
  const [showSections, setShowSections] = useState({
    banner: true,
    newProducts: true,
    bestSeller: true,
    notice: true
  })

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        메인화면 설정
      </h2>

      {/* 섹션 표시 설정 */}
      <FormSection title="섹션 표시 설정">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[
            { key: 'banner', label: '배너 슬라이더', desc: '메인 상단 이미지 배너' },
            { key: 'newProducts', label: '신상품', desc: '최근 등록된 상품 목록' },
            { key: 'bestSeller', label: '베스트셀러', desc: '판매량 상위 상품' },
            { key: 'notice', label: '공지사항', desc: '최신 공지사항 미리보기' },
          ].map(section => (
            <label key={section.key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px',
              background: '#f5f5f7',
              borderRadius: '12px',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={showSections[section.key as keyof typeof showSections]}
                onChange={(e) => setShowSections(prev => ({ ...prev, [section.key]: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{section.label}</div>
                <div style={{ fontSize: '12px', color: '#86868b' }}>{section.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <FormActions>
          <SaveButton onClick={() => alert('저장되었습니다.')} />
        </FormActions>
      </FormSection>

      {/* 배너 관리 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>배너 관리</h3>
          <button
            onClick={() => alert('배너 추가')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 배너 추가
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {banners.map((banner, idx) => (
            <div key={banner.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              background: banner.isActive ? '#f0f7ff' : '#f5f5f7',
              borderRadius: '12px',
              border: banner.isActive ? '1px solid #007aff20' : '1px solid transparent'
            }}>
              <div style={{ 
                width: '120px', 
                height: '60px', 
                background: '#e5e5e5', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#86868b',
                fontSize: '12px'
              }}>
                이미지
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{banner.title}</div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>{banner.linkUrl}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  background: banner.isActive ? '#e8f5e9' : '#f5f5f5',
                  color: banner.isActive ? '#34c759' : '#86868b',
                  fontSize: '11px',
                  fontWeight: 500
                }}>
                  {banner.isActive ? '활성' : '비활성'}
                </span>
                <button
                  onClick={() => alert('수정')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#007aff',
                    border: '1px solid #e5e5e5',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => alert('삭제')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#ffebee',
                    color: '#ff3b30',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>미리보기</h3>
        <div style={{ 
          border: '1px solid #e5e5e5', 
          borderRadius: '12px', 
          padding: '20px',
          background: '#f5f5f7'
        }}>
          <div style={{ textAlign: 'center', color: '#86868b' }}>
            📱 모바일 미리보기가 여기에 표시됩니다
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
