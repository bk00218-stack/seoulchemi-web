'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface Category {
  id: number
  name: string
  code: string
  parentId: number | null
  order: number
  isActive: boolean
  productCount: number
}

const mockCategories: Category[] = [
  { id: 1, name: '안경테', code: 'FRAME', parentId: null, order: 1, isActive: true, productCount: 245 },
  { id: 2, name: '메탈테', code: 'FRAME_METAL', parentId: 1, order: 1, isActive: true, productCount: 120 },
  { id: 3, name: '플라스틱테', code: 'FRAME_PLASTIC', parentId: 1, order: 2, isActive: true, productCount: 85 },
  { id: 4, name: '하금테', code: 'FRAME_HALF', parentId: 1, order: 3, isActive: true, productCount: 40 },
  { id: 5, name: '선글라스', code: 'SUNGLASS', parentId: null, order: 2, isActive: true, productCount: 180 },
  { id: 6, name: '렌즈', code: 'LENS', parentId: null, order: 3, isActive: true, productCount: 90 },
  { id: 7, name: '단초점', code: 'LENS_SINGLE', parentId: 6, order: 1, isActive: true, productCount: 45 },
  { id: 8, name: '다초점', code: 'LENS_MULTI', parentId: 6, order: 2, isActive: true, productCount: 45 },
  { id: 9, name: '악세서리', code: 'ACCESSORY', parentId: null, order: 4, isActive: false, productCount: 30 },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(mockCategories)
  const [editingId, setEditingId] = useState<number | null>(null)

  const toggleActive = (id: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
    ))
  }

  const rootCategories = categories.filter(c => c.parentId === null)
  const getChildren = (parentId: number) => categories.filter(c => c.parentId === parentId)

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>카테고리 설정</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          상품 카테고리를 관리합니다.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          background: '#fff',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          순서 저장
        </button>
        <button style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#007aff',
          color: '#fff',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          + 카테고리 추가
        </button>
      </div>

      {/* 카테고리 트리 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>📁 카테고리 구조</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>카테고리명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>코드</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>상품 수</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {rootCategories.map(category => (
              <>
                <tr key={category.id} style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                    📂 {category.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                    {category.code}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                    {category.productCount}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={category.isActive}
                        onChange={() => toggleActive(category.id)}
                        style={{ width: 18, height: 18, accentColor: '#007aff' }}
                      />
                      <span style={{ fontSize: '12px', color: category.isActive ? '#059669' : '#666' }}>
                        {category.isActive ? '활성' : '비활성'}
                      </span>
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
                {getChildren(category.id).map(child => (
                  <tr key={child.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px 12px 40px', fontSize: '14px' }}>
                      └ {child.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                      {child.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                      {child.productCount}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={child.isActive}
                          onChange={() => toggleActive(child.id)}
                          style={{ width: 18, height: 18, accentColor: '#007aff' }}
                        />
                        <span style={{ fontSize: '12px', color: child.isActive ? '#059669' : '#666' }}>
                          {child.isActive ? '활성' : '비활성'}
                        </span>
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
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 카테고리 설정 */}
      <div style={{ ...cardStyle, marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⚙️ 카테고리 표시 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>메인페이지에 카테고리 표시</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>상품 수 표시</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>비활성 카테고리 숨김</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
