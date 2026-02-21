'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface Category {
  id: number
  type: string
  code: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  optionType: '상품 옵션 유형',
  productType: '상품 유형',
  orderStatus: '주문 상태',
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [grouped, setGrouped] = useState<Record<string, Category[]>>({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
      setGrouped(data.grouped || {})
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      })
      const data = await res.json()
      if (data.success) {
        fetchCategories()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      console.error('Failed to toggle category:', e)
    }
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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>카테고리 설정</h1>
            <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
              상품 카테고리를 관리합니다. (총 {categories.length}개)
            </p>
          </div>
          {saved && <span style={{ color: '#059669', fontSize: '13px' }}>✓ 저장되었습니다</span>}
        </div>
      </div>

      {/* 타입별 카테고리 */}
      {Object.entries(grouped).map(([type, cats]) => (
        <div key={type} style={{ ...cardStyle, marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
            📁 {TYPE_LABELS[type] || type}
            <span style={{ fontSize: 13, fontWeight: 400, color: '#86868b', marginLeft: 8 }}>
              ({cats.length}개)
            </span>
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>카테고리명</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>코드</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>설명</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', width: 80 }}>순서</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', width: 100 }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                    {cat.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                    {cat.code}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                    {cat.description || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>
                    {cat.displayOrder}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={cat.isActive}
                        onChange={() => toggleActive(cat.id, cat.isActive)}
                        style={{ width: 18, height: 18, accentColor: '#007aff' }}
                      />
                      <span style={{ fontSize: '12px', color: cat.isActive ? '#059669' : '#666' }}>
                        {cat.isActive ? '활성' : '비활성'}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {categories.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 60, color: '#86868b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          등록된 카테고리가 없습니다
        </div>
      )}
    </Layout>
  )
}
