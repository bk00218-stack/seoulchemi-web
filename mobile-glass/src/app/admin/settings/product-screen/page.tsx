'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'

interface FieldConfig {
  key: string
  label: string
  visible: boolean
  required: boolean
  order: number
}

interface SectionConfig {
  key: string
  label: string
  visible: boolean
  collapsed: boolean
  order: number
  fields: FieldConfig[]
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    key: 'basic',
    label: '기본 정보',
    visible: true,
    collapsed: false,
    order: 1,
    fields: [
      { key: 'name', label: '상품명', visible: true, required: true, order: 1 },
      { key: 'code', label: '상품코드', visible: true, required: false, order: 2 },
      { key: 'brand', label: '브랜드', visible: true, required: true, order: 3 },
      { key: 'category', label: '카테고리', visible: true, required: false, order: 4 },
      { key: 'description', label: '상품설명', visible: true, required: false, order: 5 },
    ]
  },
  {
    key: 'price',
    label: '가격 정보',
    visible: true,
    collapsed: false,
    order: 2,
    fields: [
      { key: 'retailPrice', label: '소비자가', visible: true, required: true, order: 1 },
      { key: 'supplyPrice', label: '공급가', visible: true, required: true, order: 2 },
      { key: 'costPrice', label: '원가', visible: true, required: false, order: 3 },
      { key: 'discountRate', label: '할인율', visible: true, required: false, order: 4 },
    ]
  },
  {
    key: 'lens',
    label: '렌즈 옵션',
    visible: true,
    collapsed: false,
    order: 3,
    fields: [
      { key: 'material', label: '재질', visible: true, required: false, order: 1 },
      { key: 'coating', label: '코팅', visible: true, required: false, order: 2 },
      { key: 'index', label: '굴절률', visible: true, required: false, order: 3 },
      { key: 'diameter', label: '직경', visible: true, required: false, order: 4 },
      { key: 'design', label: '설계', visible: true, required: false, order: 5 },
    ]
  },
  {
    key: 'diopter',
    label: '도수 정보',
    visible: true,
    collapsed: false,
    order: 4,
    fields: [
      { key: 'sphRange', label: 'SPH 범위', visible: true, required: false, order: 1 },
      { key: 'cylRange', label: 'CYL 범위', visible: true, required: false, order: 2 },
      { key: 'addRange', label: 'ADD 범위', visible: true, required: false, order: 3 },
      { key: 'step', label: '간격', visible: true, required: false, order: 4 },
    ]
  },
  {
    key: 'inventory',
    label: '재고 정보',
    visible: true,
    collapsed: true,
    order: 5,
    fields: [
      { key: 'stock', label: '현재고', visible: true, required: false, order: 1 },
      { key: 'minStock', label: '최소재고', visible: true, required: false, order: 2 },
      { key: 'maxStock', label: '최대재고', visible: false, required: false, order: 3 },
      { key: 'location', label: '보관위치', visible: false, required: false, order: 4 },
    ]
  },
  {
    key: 'additional',
    label: '추가 정보',
    visible: true,
    collapsed: true,
    order: 6,
    fields: [
      { key: 'barcode', label: '바코드', visible: true, required: false, order: 1 },
      { key: 'weight', label: '무게', visible: false, required: false, order: 2 },
      { key: 'manufacturer', label: '제조사', visible: true, required: false, order: 3 },
      { key: 'origin', label: '원산지', visible: true, required: false, order: 4 },
      { key: 'warranty', label: '보증기간', visible: false, required: false, order: 5 },
    ]
  },
]

export default function ProductScreenPage() {
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS)
  const [saving, setSaving] = useState(false)
  const [draggedField, setDraggedField] = useState<{sectionKey: string, fieldKey: string} | null>(null)

  const toggleSectionVisibility = (sectionKey: string) => {
    setSections(prev => prev.map(s => 
      s.key === sectionKey ? { ...s, visible: !s.visible } : s
    ))
  }

  const toggleSectionCollapsed = (sectionKey: string) => {
    setSections(prev => prev.map(s => 
      s.key === sectionKey ? { ...s, collapsed: !s.collapsed } : s
    ))
  }

  const toggleFieldVisibility = (sectionKey: string, fieldKey: string) => {
    setSections(prev => prev.map(s => 
      s.key === sectionKey 
        ? { ...s, fields: s.fields.map(f => 
            f.key === fieldKey ? { ...f, visible: !f.visible } : f
          )}
        : s
    ))
  }

  const toggleFieldRequired = (sectionKey: string, fieldKey: string) => {
    setSections(prev => prev.map(s => 
      s.key === sectionKey 
        ? { ...s, fields: s.fields.map(f => 
            f.key === fieldKey ? { ...f, required: !f.required } : f
          )}
        : s
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('설정이 저장되었습니다.')
    } catch (error) {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('기본 설정으로 초기화하시겠습니까?')) {
      setSections(DEFAULT_SECTIONS)
    }
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>상품 상세화면 설정</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          상품 등록/수정 화면에 표시될 필드와 레이아웃을 설정합니다
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* 설정 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.sort((a, b) => a.order - b.order).map(section => (
            <div 
              key={section.key}
              style={{ 
                background: '#fff', 
                borderRadius: '12px',
                overflow: 'hidden',
                border: section.visible ? '1px solid #e9ecef' : '1px solid #e9ecef',
                opacity: section.visible ? 1 : 0.6
              }}
            >
              {/* 섹션 헤더 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: section.visible ? '#f9fafb' : '#f5f5f7',
                borderBottom: '1px solid #e9ecef'
              }}>
                <span style={{ cursor: 'grab', color: '#c5c5c7' }}>⠿</span>
                
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={() => toggleSectionVisibility(section.key)}
                  style={{ width: '18px', height: '18px', accentColor: '#007aff' }}
                />
                
                <span style={{ fontWeight: 600, flex: 1 }}>{section.label}</span>
                
                <span style={{ 
                  fontSize: '12px', 
                  color: '#86868b',
                  background: '#e9ecef',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {section.fields.filter(f => f.visible).length} / {section.fields.length} 필드
                </span>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#86868b' }}>
                  <input
                    type="checkbox"
                    checked={section.collapsed}
                    onChange={() => toggleSectionCollapsed(section.key)}
                    style={{ width: '14px', height: '14px' }}
                  />
                  접힘
                </label>
              </div>

              {/* 필드 목록 */}
              {section.visible && (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '8px' 
                  }}>
                    {section.fields.sort((a, b) => a.order - b.order).map(field => (
                      <div
                        key={field.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: field.visible ? '#f0f7ff' : '#f9fafb',
                          border: field.visible ? '1px solid #007aff30' : '1px solid #e9ecef',
                          opacity: field.visible ? 1 : 0.6
                        }}
                      >
                        <span style={{ cursor: 'grab', color: '#c5c5c7', fontSize: '12px' }}>⠿</span>
                        
                        <input
                          type="checkbox"
                          checked={field.visible}
                          onChange={() => toggleFieldVisibility(section.key, field.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#007aff' }}
                        />
                        
                        <span style={{ flex: 1, fontSize: '13px' }}>
                          {field.label}
                          {field.required && (
                            <span style={{ color: '#ff3b30', marginLeft: '2px' }}>*</span>
                          )}
                        </span>
                        
                        {field.visible && (
                          <button
                            onClick={() => toggleFieldRequired(section.key, field.key)}
                            title={field.required ? '필수 해제' : '필수 설정'}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: 'none',
                              background: field.required ? '#ffebee' : '#f5f5f7',
                              color: field.required ? '#ff3b30' : '#86868b',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            {field.required ? '필수' : '선택'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 미리보기 */}
        <div>
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '20px',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>미리보기</h3>
            
            <div style={{ 
              background: '#f5f5f7', 
              borderRadius: '8px', 
              padding: '16px',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              {sections
                .filter(s => s.visible)
                .sort((a, b) => a.order - b.order)
                .map(section => (
                  <div key={section.key} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: '#007aff',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {section.collapsed && <span style={{ color: '#86868b' }}>▶</span>}
                      {section.label}
                    </div>
                    
                    {!section.collapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {section.fields
                          .filter(f => f.visible)
                          .sort((a, b) => a.order - b.order)
                          .map(field => (
                            <div 
                              key={field.key}
                              style={{ 
                                display: 'flex', 
                                gap: '8px',
                                fontSize: '11px',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ 
                                color: '#86868b',
                                minWidth: '60px'
                              }}>
                                {field.label}
                                {field.required && <span style={{ color: '#ff3b30' }}>*</span>}
                              </span>
                              <div style={{ 
                                flex: 1,
                                height: '20px',
                                background: '#e9ecef',
                                borderRadius: '4px'
                              }} />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#f0f7ff', 
              borderRadius: '8px',
              fontSize: '12px',
              color: '#007aff'
            }}>
              💡 드래그하여 순서를 변경할 수 있습니다
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            marginTop: '16px'
          }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: saving ? '#e5e5e5' : '#007aff',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                background: '#fff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              기본값으로 초기화
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
