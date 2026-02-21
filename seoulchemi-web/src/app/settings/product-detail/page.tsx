'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle, inputStyle } from '../../components/Layout'
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

const DEFAULT_SECTIONS: DetailSection[] = [
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

const DEFAULT_DISPLAY_OPTIONS: DisplayOption[] = [
  { key: 'show_stock', label: '재고 수량 표시', description: '상품 상세에 재고 수량을 표시합니다', value: true },
  { key: 'show_sold', label: '판매량 표시', description: '상품 판매 수량을 표시합니다', value: false },
  { key: 'show_views', label: '조회수 표시', description: '상품 조회수를 표시합니다', value: true },
  { key: 'show_likes', label: '찜 수 표시', description: '찜하기 수를 표시합니다', value: true },
  { key: 'show_brand', label: '브랜드 정보 표시', description: '브랜드 로고와 정보를 표시합니다', value: true },
  { key: 'show_share', label: '공유 버튼 표시', description: 'SNS 공유 버튼을 표시합니다', value: true },
  { key: 'zoom_enabled', label: '이미지 확대 기능', description: '상품 이미지 클릭 시 확대 기능 사용', value: true },
]

export default function ProductDetailSettingsPage() {
  const { toast } = useToast()
  const [sections, setSections] = useState<DetailSection[]>(DEFAULT_SECTIONS)
  const [options, setOptions] = useState<DisplayOption[]>(DEFAULT_DISPLAY_OPTIONS)
  const [thumbnailPosition, setThumbnailPosition] = useState('bottom')
  const [imageRatio, setImageRatio] = useState('1:1')
  const [reviewSort, setReviewSort] = useState('recent')
  const [reviewPerPage, setReviewPerPage] = useState('10')
  const [photoReviewOnly, setPhotoReviewOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/settings?group=product-detail')
      const data = await res.json()
      const s = data.settings || {}

      try {
        if (s['product-detail.sections']) setSections(JSON.parse(s['product-detail.sections']))
      } catch { /* ignore */ }

      try {
        if (s['product-detail.displayOptions']) setOptions(JSON.parse(s['product-detail.displayOptions']))
      } catch { /* ignore */ }

      if (s['product-detail.thumbnailPosition']) setThumbnailPosition(s['product-detail.thumbnailPosition'])
      if (s['product-detail.imageRatio']) setImageRatio(s['product-detail.imageRatio'])
      if (s['product-detail.reviewSort']) setReviewSort(s['product-detail.reviewSort'])
      if (s['product-detail.reviewPerPage']) setReviewPerPage(s['product-detail.reviewPerPage'])
      if (s['product-detail.photoReviewOnly'] !== undefined) setPhotoReviewOnly(s['product-detail.photoReviewOnly'] === 'true')
    } catch (e) {
      console.error('Failed to fetch product-detail settings:', e)
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
            'product-detail.sections': JSON.stringify(sections),
            'product-detail.displayOptions': JSON.stringify(options),
            'product-detail.thumbnailPosition': thumbnailPosition,
            'product-detail.imageRatio': imageRatio,
            'product-detail.reviewSort': reviewSort,
            'product-detail.reviewPerPage': reviewPerPage,
            'product-detail.photoReviewOnly': String(photoReviewOnly),
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

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s))
  }

  const toggleOption = (key: string) => {
    setOptions(prev => prev.map(o => o.key === key ? { ...o, value: !o.value } : o))
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
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>상품상세 설정</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            상품 상세 페이지 레이아웃과 표시 옵션을 설정합니다.
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
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
            <select
              value={thumbnailPosition}
              onChange={e => setThumbnailPosition(e.target.value)}
              style={{ ...inputStyle, width: '200px' }}
            >
              <option value="bottom">하단</option>
              <option value="left">좌측</option>
              <option value="right">우측</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              이미지 비율
            </label>
            <select
              value={imageRatio}
              onChange={e => setImageRatio(e.target.value)}
              style={{ ...inputStyle, width: '200px' }}
            >
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
            <select
              value={reviewSort}
              onChange={e => setReviewSort(e.target.value)}
              style={{ ...inputStyle, width: '200px' }}
            >
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
            <select
              value={reviewPerPage}
              onChange={e => setReviewPerPage(e.target.value)}
              style={{ ...inputStyle, width: '150px' }}
            >
              <option value="5">5개</option>
              <option value="10">10개</option>
              <option value="20">20개</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={photoReviewOnly}
                onChange={e => setPhotoReviewOnly(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#007aff' }}
              />
              <span style={{ fontSize: '14px' }}>포토 리뷰만 보기 옵션 제공</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
