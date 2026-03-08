'use client'

import { useToast } from '@/contexts/ToastContext'
import React, { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface Category {
  id: number
  name: string
  code: string
  _count?: { brands: number }
}

interface ProductLine {
  id: number
  name: string
  _count?: { products: number }
}

interface Brand {
  id: number
  name: string
  categoryId: number | null
  stockManage: string | null
  canExchange: boolean
  canReturn: boolean
  isActive: boolean
  displayOrder: number
  productCount: number
  productLineCount: number
  activeCount: number
  inactiveCount: number
  category?: { id: number; name: string; code: string } | null
  productLines?: ProductLine[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--gray-50)',
  transition: 'border-color 0.2s, background 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: 'var(--gray-700)',
}

export default function BrandsPage() {
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [expandedBrand, setExpandedBrand] = useState<number | null>(null)
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'wide'>('normal')

  // 테이블 밀도 설정
  const densityConfig = {
    compact: {
      cellPy: 6, cellPx: 6, fontSize: 12, badgeFontSize: 10, badgePad: '2px 6px',
      minWidth: 780,
      cols: { order: 35, category: 90, stock: 70, check: 35, line: 35, product: 80, status: 45, action: 85 },
    },
    normal: {
      cellPy: 10, cellPx: 10, fontSize: 13, badgeFontSize: 11, badgePad: '3px 8px',
      minWidth: 880,
      cols: { order: 40, category: 105, stock: 80, check: 40, line: 40, product: 90, status: 50, action: 95 },
    },
    wide: {
      cellPy: 14, cellPx: 14, fontSize: 14, badgeFontSize: 12, badgePad: '4px 12px',
      minWidth: 1020,
      cols: { order: 50, category: 130, stock: 100, check: 50, line: 55, product: 110, status: 65, action: 120 },
    },
  }
  const d = densityConfig[tableDensity]
  const thStyle = (width?: number, align: string = 'center'): React.CSSProperties => ({
    padding: `${d.cellPy}px ${d.cellPx}px`,
    textAlign: align as 'center' | 'left',
    fontWeight: 600,
    color: 'var(--gray-600)',
    fontSize: d.fontSize,
    whiteSpace: 'nowrap',
    ...(width ? { width } : {}),
  })
  const tdStyle = (align: string = 'center'): React.CSSProperties => ({
    padding: `${d.cellPy}px ${d.cellPx}px`,
    textAlign: align as 'center' | 'left',
    whiteSpace: 'nowrap',
    fontSize: d.fontSize,
  })

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '' as string,
    stockManage: '',
    canExchange: false,
    canReturn: false,
    isActive: true,
    displayOrder: 0
  })

  useEffect(() => {
    loadCategories()
    loadBrands()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data.brands || data)
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning('브랜드명을 입력해주세요.')
      return
    }

    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        })
      })

      if (res.ok) {
        setShowModal(false)
        loadBrands()
      } else {
        const error = await res.json()
        toast.error(error.error || '저장에 실패했습니다.')
      }
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 브랜드를 삭제하시겠습니까?\n연결된 상품이 있으면 삭제할 수 없습니다.')) return

    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadBrands()
      } else {
        const error = await res.json()
        toast.error(error.error || '삭제에 실패했습니다.')
      }
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const openEditModal = (brand: Brand | null) => {
    if (brand) {
      setFormData({
        name: brand.name,
        categoryId: brand.categoryId ? String(brand.categoryId) : '',
        stockManage: brand.stockManage || '',
        canExchange: brand.canExchange,
        canReturn: brand.canReturn,
        isActive: brand.isActive,
        displayOrder: brand.displayOrder
      })
      setEditingBrand(brand)
    } else {
      setFormData({
        name: '',
        categoryId: selectedCategory !== 'all' ? String(selectedCategory) : '',
        stockManage: '',
        canExchange: false,
        canReturn: false,
        isActive: true,
        displayOrder: brands.length
      })
      setEditingBrand(null)
    }
    setShowModal(true)
  }

  // 필터링
  const filteredBrands = brands.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || b.categoryId === selectedCategory
    return matchSearch && matchCategory
  })

  const totalProducts = brands.reduce((sum, b) => sum + (b.productCount || 0), 0)
  const activeBrands = brands.filter(b => b.isActive).length
  const totalProductLines = brands.reduce((sum, b) => sum + (b.productLineCount || 0), 0)

  // 카테고리별 통계
  const getCategoryStats = (catId: number) => {
    const catBrands = brands.filter(b => b.categoryId === catId)
    return {
      brands: catBrands.length,
      products: catBrands.reduce((sum, b) => sum + (b.productCount || 0), 0)
    }
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>브랜드 관리</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
          브랜드를 등록하고 관리합니다. 대분류별로 브랜드를 분류하고 품목·상품 현황을 확인할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 브랜드</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)' }}>
                {brands.length}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏷️</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>활성 / 비활성</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#34c759' }}>
                {activeBrands}
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--gray-400)', marginLeft: 4 }}>/</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#ff9500', marginLeft: 2 }}>{brands.length - activeBrands}</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 품목</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#5856d6' }}>
                {totalProductLines}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede7f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>총 상품</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#007aff' }}>
                {totalProducts.toLocaleString()}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
          </div>
        </div>
      </div>

      {/* 대분류 탭 필터 */}
      <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginRight: 4 }}>대분류:</span>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: selectedCategory === 'all' ? 600 : 400,
            background: selectedCategory === 'all' ? 'var(--primary)' : '#fff',
            color: selectedCategory === 'all' ? '#fff' : 'var(--gray-600)',
            border: selectedCategory === 'all' ? 'none' : '1px solid var(--gray-200)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          전체 ({brands.length})
        </button>
        {categories.map(cat => {
          const stats = getCategoryStats(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: selectedCategory === cat.id ? 600 : 400,
                background: selectedCategory === cat.id ? 'var(--primary)' : '#fff',
                color: selectedCategory === cat.id ? '#fff' : 'var(--gray-600)',
                border: selectedCategory === cat.id ? 'none' : '1px solid var(--gray-200)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.name} ({stats.brands})
            </button>
          )
        })}
      </div>

      {/* 검색 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="브랜드명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '10px 14px 10px 36px',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
                fontSize: 14,
                width: 250,
                outline: 'none',
                background: 'var(--gray-50)',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--gray-400)' }}>🔍</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {filteredBrands.length}개 표시
          </span>
          {/* 테이블 간격 조절 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4, background: 'var(--gray-100)', borderRadius: 6, padding: 2 }}>
            {([['compact', '좁게'], ['normal', '보통'], ['wide', '넓게']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTableDensity(key)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: tableDensity === key ? 600 : 400,
                  background: tableDensity === key ? '#fff' : 'transparent',
                  color: tableDensity === key ? 'var(--primary)' : 'var(--gray-500)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: tableDensity === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => openEditModal(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'opacity 0.2s',
          }}
        >
          + 브랜드 등록
        </button>
      </div>

      {/* 브랜드 목록 */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            로딩 중...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              {search ? '검색 결과가 없습니다' : '등록된 브랜드가 없습니다'}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? '다른 검색어를 시도해보세요' : '상단의 "브랜드 등록" 버튼으로 새 브랜드를 추가하세요'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: d.minWidth, borderCollapse: 'collapse', fontSize: d.fontSize, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' }}>
                <th style={thStyle(d.cols.order)}>순서</th>
                <th style={thStyle(undefined, 'left')}>브랜드명</th>
                <th style={thStyle(d.cols.category)}>대분류</th>
                <th style={thStyle(d.cols.stock)}>출고관리</th>
                <th style={thStyle(d.cols.check)}>교환</th>
                <th style={thStyle(d.cols.check)}>반품</th>
                <th style={thStyle(d.cols.line)}>품목</th>
                <th style={thStyle(d.cols.product)}>상품</th>
                <th style={thStyle(d.cols.status)}>상태</th>
                <th style={thStyle(d.cols.action)}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map(brand => (
                <React.Fragment key={brand.id}>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer',
                      background: expandedBrand === brand.id ? 'var(--primary-light)' : undefined,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                    onMouseEnter={e => { if (expandedBrand !== brand.id) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)' }}
                    onMouseLeave={e => { if (expandedBrand !== brand.id) (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <td style={{ ...tdStyle(), color: 'var(--gray-400)' }}>
                      {brand.displayOrder}
                    </td>
                    <td style={{ ...tdStyle('left'), overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{brand.name}</span>
                        {(brand.productLines?.length || 0) > 0 && (
                          <span style={{
                            fontSize: d.fontSize - 2,
                            color: 'var(--gray-400)',
                            transform: expandedBrand === brand.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}>▼</span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle()}>
                      {brand.category ? (
                        <span style={{
                          display: 'inline-block',
                          padding: d.badgePad,
                          borderRadius: 12,
                          fontSize: d.badgeFontSize,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          background: brand.category.code === 'SPARE' ? '#e3f2fd' :
                                     brand.category.code === 'RX' ? '#fce4ec' :
                                     brand.category.code === 'CONTACT' ? '#e8f5e9' : 'var(--gray-100)',
                          color: brand.category.code === 'SPARE' ? '#1565c0' :
                                brand.category.code === 'RX' ? '#c62828' :
                                brand.category.code === 'CONTACT' ? '#2e7d32' : 'var(--gray-600)',
                        }}>
                          {brand.category.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)', fontSize: d.badgeFontSize }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle()}>
                      {brand.stockManage === 'barcode' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: d.badgePad, borderRadius: 6, background: '#f3e5f5', color: '#7b1fa2', fontSize: d.badgeFontSize, whiteSpace: 'nowrap' }}>
                          📊 바코드
                        </span>
                      ) : brand.stockManage === 'manual' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: d.badgePad, borderRadius: 6, background: '#fff3e0', color: '#e65100', fontSize: d.badgeFontSize, whiteSpace: 'nowrap' }}>
                          ✋ 수동
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)', fontSize: d.badgeFontSize }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle()}>
                      <span style={{
                        display: 'inline-block',
                        width: tableDensity === 'compact' ? 18 : 22,
                        height: tableDensity === 'compact' ? 18 : 22,
                        borderRadius: '50%',
                        lineHeight: tableDensity === 'compact' ? '18px' : '22px',
                        fontSize: d.badgeFontSize,
                        background: brand.canExchange ? '#e8f5e9' : 'var(--gray-100)',
                        color: brand.canExchange ? '#2e7d32' : 'var(--gray-300)',
                      }}>
                        {brand.canExchange ? '✓' : '−'}
                      </span>
                    </td>
                    <td style={tdStyle()}>
                      <span style={{
                        display: 'inline-block',
                        width: tableDensity === 'compact' ? 18 : 22,
                        height: tableDensity === 'compact' ? 18 : 22,
                        borderRadius: '50%',
                        lineHeight: tableDensity === 'compact' ? '18px' : '22px',
                        fontSize: d.badgeFontSize,
                        background: brand.canReturn ? '#e8f5e9' : 'var(--gray-100)',
                        color: brand.canReturn ? '#2e7d32' : 'var(--gray-300)',
                      }}>
                        {brand.canReturn ? '✓' : '−'}
                      </span>
                    </td>
                    <td style={tdStyle()}>
                      <span style={{
                        display: 'inline-block',
                        padding: d.badgePad,
                        borderRadius: 12,
                        fontSize: d.badgeFontSize,
                        fontWeight: 500,
                        background: '#ede7f6',
                        color: '#5856d6',
                      }}>
                        {brand.productLineCount || 0}
                      </span>
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: d.fontSize, fontWeight: 600, color: '#007aff' }}>
                          {brand.productCount || 0}
                        </span>
                        {brand.activeCount > 0 && (
                          <span style={{ fontSize: d.badgeFontSize - 1, color: 'var(--gray-400)' }}>
                            ({brand.activeCount}/{brand.inactiveCount || 0})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle()}>
                      <span style={{
                        display: 'inline-block',
                        padding: d.badgePad,
                        borderRadius: 6,
                        fontSize: d.badgeFontSize,
                        fontWeight: 500,
                        background: brand.isActive ? '#e8f5e9' : '#fef3e7',
                        color: brand.isActive ? '#2e7d32' : '#e65100'
                      }}>
                        {brand.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={tdStyle()} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(brand)}
                          style={{
                            padding: tableDensity === 'compact' ? '3px 8px' : '5px 10px',
                            borderRadius: 6,
                            background: 'var(--gray-100)',
                            color: '#007aff',
                            border: 'none',
                            fontSize: d.badgeFontSize,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          style={{
                            padding: tableDensity === 'compact' ? '3px 8px' : '5px 10px',
                            borderRadius: 6,
                            background: '#fff0f0',
                            color: '#ff3b30',
                            border: 'none',
                            fontSize: d.badgeFontSize,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* 확장 영역: 품목 목록 */}
                  {expandedBrand === brand.id && brand.productLines && brand.productLines.length > 0 && (
                    <tr key={`${brand.id}-expanded`}>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <div style={{
                          background: 'var(--gray-50)',
                          padding: '12px 16px 12px 60px',
                          borderBottom: '1px solid var(--gray-200)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
                            품목 목록 ({brand.productLines.length}개)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {brand.productLines.map(line => (
                              <div
                                key={line.id}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: '#fff',
                                  border: '1px solid var(--gray-200)',
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <span style={{ color: 'var(--gray-800)' }}>{line.name}</span>
                                <span style={{
                                  fontSize: 11,
                                  color: '#007aff',
                                  background: '#e3f2fd',
                                  padding: '1px 6px',
                                  borderRadius: 8,
                                  fontWeight: 500,
                                }}>
                                  {line._count?.products || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            width: 520,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingBrand ? '브랜드 수정' : '브랜드 등록'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>브랜드명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 케미그라스, 호야, 에실로..."
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>대분류</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">미분류</option>
                {categories.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>출고관리</label>
                <select
                  value={formData.stockManage}
                  onChange={(e) => setFormData({ ...formData, stockManage: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">미사용</option>
                  <option value="barcode">바코드</option>
                  <option value="manual">수동</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>표시 순서</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 24,
              marginBottom: 24,
              padding: 16,
              background: 'var(--gray-50)',
              borderRadius: 10,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.canExchange}
                  onChange={(e) => setFormData({ ...formData, canExchange: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                교환 가능
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.canReturn}
                  onChange={(e) => setFormData({ ...formData, canReturn: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                반품 가능
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                활성
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'var(--gray-100)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {editingBrand ? '수정 저장' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
