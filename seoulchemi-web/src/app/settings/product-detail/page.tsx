'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface DetailSection {
  id: string
  name: string
  isVisible: boolean
  order: number
}

interface DisplayOption {
  key: string
  label: string
  description: string
  value: boolean
}

const mockSections: DetailSection[] = [
  { id: 'gallery', name: '상품 이미지 갤러리', isVisible: true, order: 1 },
  { id: 'basic_info', name: '기본 정보 (상품명, 가격)', isVisible: true, order: 2 },
  { id: 'options', name: '옵션 선택', isVisible: true, order: 3 },
  { id: 'description', name: '상품 상세 설명', isVisible: true, order: 4 },
  { id: 'specs', name: '상품 스펙', isVisible: true, order: 5 },
  { id: 'shipping_info', name: '배송 정보', isVisible: true, order: 6 },
  { id: 'reviews', name: '상품 리뷰', isVisible: true, order: 7 },
  { id: 'qna', name: 'Q&A', isVisible: true, order: 8 },
  { id: 'related', name: '관련 상품', isVisible: false, order: 9 },
]

const mockDisplayOptions: DisplayOption[] = [
  { key: 'show_stock', label: '재고 수량 표시', description: '상품 상세에 재고 수량을 표시합니다', value: true },
  { key: 'show_sold', label: '판매량 표시', description: '상품 판매 수량을 표시합니다', value: false },
  { key: 'show_views', label: '조회수 표시', description: '상품 조회수를 표시합니다', value: true },
  { key: 'show_likes', label: '찜 수 표시', description: '찜하기 수를 표시합니다', value: true },
  { key: 'show_brand', label: '브랜드 정보 표시', description: '브랜드 로고와 정보를 표시합니다', value: true },
  { key: 'show_share', label: '공유 버튼 표시', description: 'SNS 공유 버튼을 표시합니다', value: true },
  { key: 'zoom_enabled', label: '이미지 확대 기능', description: '상품 이미지 클릭 시 확대 기능 사용', value: true },
]

export default function ProductDetailSettingsPage() {
  const [sections, setSections] = useState(mockSections)
  const [options, setOptions] = useState(mockDisplayOptions)
  const [saved, setSaved] = useState(false)

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    setSaved(false)
  }

  const toggleOption = (key: string) => {
    setOptions(prev => prev.map(o => o.key === key ? { ...o, value: !o.value } : o))
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
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>상품상세 설정</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            상품 상세 페이지 레이아웃과 표시 옵션을 설정합니다.
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

      {/* 섹션 배치 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>📐 섹션 배치</h3>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
          상품 상세 페이지에 표시할 섹션을 선택하고 순서를 조정합니다.
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

      {/* 표시 옵션 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>👁️ 표시 옵션</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>옵션</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>설명</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', width: '100px' }}>사용</th>
            </tr>
          </thead>
          <tbody>
            {options.map(option => (
              <tr key={option.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{option.label}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{option.description}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={option.value}
                      onChange={() => toggleOption(option.key)}
                      style={{ width: 18, height: 18, accentColor: '#007aff' }}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 이미지 설정 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>🖼️ 이미지 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              썸네일 갤러리 위치
            </label>
            <select style={{ ...inputStyle, width: '200px' }}>
              <option value="bottom">하단</option>
              <option value="left">좌측</option>
              <option value="right">우측</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              이미지 비율
            </label>
            <select style={{ ...inputStyle, width: '200px' }}>
              <option value="1:1">1:1 (정사각형)</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
              <option value="16:9">16:9</option>
            </select>
          </div>
        </div>
      </div>

      {/* 리뷰 설정 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⭐ 리뷰 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              리뷰 정렬 기본값
            </label>
            <select style={{ ...inputStyle, width: '200px' }}>
              <option value="recent">최신순</option>
              <option value="rating_high">평점 높은순</option>
              <option value="rating_low">평점 낮은순</option>
              <option value="helpful">도움순</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              페이지당 리뷰 수
            </label>
            <select style={{ ...inputStyle, width: '150px' }}>
              <option value="5">5개</option>
              <option value="10">10개</option>
              <option value="20">20개</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>포토 리뷰만 보기 옵션 제공</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
