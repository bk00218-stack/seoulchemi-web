'use client'

import { useState, useEffect, useRef } from 'react'
import Layout from '@/app/components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface Brand {
  id: number
  name: string
  categoryId: number
}

interface ProductLine {
  id: number
  name: string
  brandId: number
}

// 도수 포맷팅
const formatDiopter = (value: number): string => {
  const rounded = Math.round(value * 100) / 100
  if (rounded === 0) return '0.00'
  return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
}

// SPH/CYL 생성
const generateSphRows = (): number[] => {
  const values: number[] = []
  for (let i = 0; i <= 15; i += 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

const generateCylCols = (): number[] => {
  const values: number[] = []
  for (let i = 0; i >= -4; i -= 0.25) values.push(Math.round(i * 100) / 100)
  return values
}

export default function BulkSpareRegistrationPage() {
  // 브랜드/품목 선택
  const [brands, setBrands] = useState<Brand[]>([])
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | null>(null)

  // 상품 정보
  const [productName, setProductName] = useState('')
  const [refractiveIndex, setRefractiveIndex] = useState('')
  const [sellingPrice, setSellingPrice] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)

  // 도수표 선택
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  
  // 선택 모드 (근시/원시)
  const [sphMode, setSphMode] = useState<'minus' | 'plus'>('minus')
  
  // 저장 중
  const [saving, setSaving] = useState(false)

  const sphRows = generateSphRows()
  const cylCols = generateCylCols()

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (selectedBrandId) {
      fetchProductLines(selectedBrandId)
    }
  }, [selectedBrandId])

  const fetchBrands = async () => {
    try {
      // 여벌 대분류의 브랜드만 가져오기 (categoryId = 1 = SPARE)
      const res = await fetch('/api/brands?categoryId=1')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.brands || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchProductLines = async (brandId: number) => {
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        setProductLines(data.productLines || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCell = (sph: number, cyl: number) => {
    const key = `${formatDiopter(sphMode === 'minus' ? -sph : sph)},${formatDiopter(cyl)}`
    setSelectedCells(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleMouseDown = (sph: number, cyl: number) => {
    const key = `${formatDiopter(sphMode === 'minus' ? -sph : sph)},${formatDiopter(cyl)}`
    setIsDragging(true)
    setDragMode(selectedCells.has(key) ? 'deselect' : 'select')
    toggleCell(sph, cyl)
  }

  const handleMouseEnter = (sph: number, cyl: number) => {
    if (!isDragging) return
    const key = `${formatDiopter(sphMode === 'minus' ? -sph : sph)},${formatDiopter(cyl)}`
    setSelectedCells(prev => {
      const newSet = new Set(prev)
      if (dragMode === 'select') {
        newSet.add(key)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 범위 선택 (빠른 선택)
  const selectRange = (sphMin: number, sphMax: number, cylMin: number, cylMax: number) => {
    const newSet = new Set(selectedCells)
    for (let s = sphMin; s <= sphMax; s += 0.25) {
      for (let c = cylMax; c >= cylMin; c -= 0.25) {
        const sphVal = sphMode === 'minus' ? -s : s
        const key = `${formatDiopter(Math.round(sphVal * 100) / 100)},${formatDiopter(Math.round(c * 100) / 100)}`
        newSet.add(key)
      }
    }
    setSelectedCells(newSet)
  }

  const clearSelection = () => {
    setSelectedCells(new Set())
  }

  const handleSave = async () => {
    if (!selectedBrandId) {
      alert('브랜드를 선택하세요.')
      return
    }
    if (!productName.trim()) {
      alert('상품명을 입력하세요.')
      return
    }
    if (selectedCells.size === 0) {
      alert('도수를 선택하세요.')
      return
    }

    setSaving(true)
    try {
      // 1. 상품 생성
      const productRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrandId,
          productLineId: selectedProductLineId,
          name: productName,
          optionType: '안경렌즈 여벌',
          productType: '안경렌즈 여벌',
          refractiveIndex: refractiveIndex || null,
          sellingPrice,
          purchasePrice,
          isActive: true
        })
      })

      if (!productRes.ok) {
        throw new Error('상품 생성 실패')
      }

      const product = await productRes.json()

      // 2. 도수 옵션 일괄 생성
      const options = Array.from(selectedCells).map(key => {
        const [sph, cyl] = key.split(',')
        return { sph, cyl, priceAdjustment: 0 }
      })

      const optionsRes = await fetch(`/api/products/${product.id}/options/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options })
      })

      if (optionsRes.ok) {
        const result = await optionsRes.json()
        alert(`✅ 상품이 등록되었습니다!\n- 상품명: ${productName}\n- 도수 옵션: ${result.created || options.length}개`)
        
        // 폼 초기화
        setProductName('')
        setRefractiveIndex('')
        setSellingPrice(0)
        setPurchasePrice(0)
        setSelectedCells(new Set())
      } else {
        alert('상품은 생성되었으나, 도수 옵션 생성에 실패했습니다.')
      }
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const cellSize = 28
  const headerStyle = { 
    padding: '4px 0', 
    fontSize: 10, 
    fontWeight: 600, 
    textAlign: 'center' as const,
    minWidth: cellSize,
    color: 'var(--gray-600)'
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>여벌 상품 일괄등록</h1>
      <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>
        도수표에서 범위를 선택하여 상품과 도수 옵션을 한번에 등록합니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* 왼쪽: 상품 정보 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 20,
            border: '1px solid var(--gray-200)',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--gray-800)' }}>
              📦 상품 정보
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                  브랜드 *
                </label>
                <select
                  value={selectedBrandId || ''}
                  onChange={(e) => {
                    setSelectedBrandId(e.target.value ? parseInt(e.target.value) : null)
                    setSelectedProductLineId(null)
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                >
                  <option value="">브랜드 선택</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                  품목 (선택)
                </label>
                <select
                  value={selectedProductLineId || ''}
                  onChange={(e) => setSelectedProductLineId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedBrandId}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                >
                  <option value="">품목 선택</option>
                  {productLines.map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                  상품명 *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예: 블루라이트 차단 1.60"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                  굴절률
                </label>
                <select
                  value={refractiveIndex}
                  onChange={(e) => setRefractiveIndex(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                >
                  <option value="">선택</option>
                  <option value="1.50">1.50 (표준)</option>
                  <option value="1.56">1.56</option>
                  <option value="1.60">1.60 (중도수)</option>
                  <option value="1.67">1.67 (고도수)</option>
                  <option value="1.74">1.74 (초고도수)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                    판매가
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                    매입가
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* 선택 요약 */}
              <div style={{ 
                padding: 14, 
                background: selectedCells.size > 0 ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'var(--gray-50)',
                borderRadius: 10,
                marginTop: 8
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                  📋 선택된 도수: {selectedCells.size}개
                </div>
                {selectedCells.size > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                    클릭하여 저장
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !selectedBrandId || !productName.trim() || selectedCells.size === 0}
                style={{
                  padding: '14px 20px',
                  background: saving ? 'var(--gray-300)' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginTop: 8
                }}
              >
                {saving ? '저장 중...' : `상품 + 도수 ${selectedCells.size}개 등록`}
              </button>
            </div>
          </div>

          {/* 오른쪽: 도수표 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 20,
            border: '1px solid var(--gray-200)',
            overflow: 'hidden'
          }}>
            {/* 탭 & 빠른 선택 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSphMode('minus')}
                  style={{
                    padding: '8px 16px',
                    background: sphMode === 'minus' ? 'var(--primary)' : '#fff',
                    color: sphMode === 'minus' ? '#fff' : 'var(--gray-600)',
                    border: '1px solid',
                    borderColor: sphMode === 'minus' ? 'var(--primary)' : 'var(--gray-200)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  근시 (−SPH)
                </button>
                <button
                  onClick={() => setSphMode('plus')}
                  style={{
                    padding: '8px 16px',
                    background: sphMode === 'plus' ? 'var(--primary)' : '#fff',
                    color: sphMode === 'plus' ? '#fff' : 'var(--gray-600)',
                    border: '1px solid',
                    borderColor: sphMode === 'plus' ? 'var(--primary)' : 'var(--gray-200)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  원시 (+SPH)
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => selectRange(0, 6, -2, 0)}
                  style={{ padding: '6px 12px', fontSize: 11, background: '#eef4ee', border: '1px solid #a8c8a8', borderRadius: 6, cursor: 'pointer' }}
                >
                  저도수 (0~6)
                </button>
                <button
                  onClick={() => selectRange(0, 4, -2, 0)}
                  style={{ padding: '6px 12px', fontSize: 11, background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 6, cursor: 'pointer' }}
                >
                  일반 (0~4)
                </button>
                <button
                  onClick={clearSelection}
                  style={{ padding: '6px 12px', fontSize: 11, background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 6, cursor: 'pointer' }}
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 도수표 그리드 */}
            <div 
              style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <table style={{ borderCollapse: 'collapse', fontSize: 10, userSelect: 'none' }}>
                <thead>
                  <tr>
                    <th style={{ ...headerStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 2 }}>
                      SPH\CYL
                    </th>
                    {cylCols.map(cyl => (
                      <th key={cyl} style={headerStyle}>
                        {formatDiopter(cyl)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sphRows.slice(0, 33).map(sph => (  // 0.00 ~ 8.00
                    <tr key={sph}>
                      <td style={{ 
                        ...headerStyle, 
                        position: 'sticky', 
                        left: 0, 
                        background: '#fff',
                        zIndex: 1,
                        fontWeight: 600
                      }}>
                        {formatDiopter(sphMode === 'minus' ? -sph : sph)}
                      </td>
                      {cylCols.map(cyl => {
                        const sphVal = sphMode === 'minus' ? -sph : sph
                        const key = `${formatDiopter(sphVal)},${formatDiopter(cyl)}`
                        const isSelected = selectedCells.has(key)
                        
                        return (
                          <td
                            key={cyl}
                            onMouseDown={() => handleMouseDown(sph, cyl)}
                            onMouseEnter={() => handleMouseEnter(sph, cyl)}
                            style={{
                              width: cellSize,
                              height: cellSize,
                              textAlign: 'center',
                              border: '1px solid var(--gray-100)',
                              background: isSelected ? '#4caf50' : '#fff',
                              color: isSelected ? '#fff' : 'var(--gray-400)',
                              cursor: 'pointer',
                              fontSize: 9,
                              transition: 'background 0.1s'
                            }}
                          >
                            {isSelected ? '✓' : ''}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--gray-500)' }}>
              💡 드래그하여 범위 선택 | 클릭하여 개별 선택/해제
            </div>
          </div>
        </div>
    </Layout>
  )
}
