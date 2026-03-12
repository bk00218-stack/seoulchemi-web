'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/app/components/Layout'
import { PRODUCTS_SIDEBAR } from '@/app/constants/sidebar'
import { useToast } from '@/contexts/ToastContext'

interface Product {
  id: number
  name: string
  brand: string
  brandId: number
  optionType: string
  retailPrice: number
  sellingPrice: number
  isActive: boolean
}

interface PriceRule {
  id: number
  cylMin: number  // |CYL| >= 이 값이면 적용
  adjustment: number  // 추가금액
}

// 도수 포맷 헬퍼
function formatDiopter(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}`
}

// 범위 생성 헬퍼
function generateRange(min: number, max: number, step: number): number[] {
  const result: number[] = []
  for (let v = min; v <= max + 0.001; v += step) {
    result.push(Math.round(v * 100) / 100)
  }
  return result
}

// CYL/SPH 추가금 규칙 지원
export default function OptionsBulkPage() {
  const { toast } = useToast()

  // 상품 목록
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [brandFilter, setBrandFilter] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // SPH 설정
  const [sphMin, setSphMin] = useState(-8)
  const [sphMax, setSphMax] = useState(4)
  const [sphStep, setSphStep] = useState(0.25)

  // CYL 설정
  const [cylMin, setCylMin] = useState(-4)
  const [cylMax, setCylMax] = useState(0)
  const [cylStep, setCylStep] = useState(0.25)

  // 고도수 추가금 규칙 (CYL 기준)
  const [priceRules, setPriceRules] = useState<PriceRule[]>([
    { id: 1, cylMin: 2.25, adjustment: 5000 },
    { id: 2, cylMin: 3.0, adjustment: 10000 },
  ])
  const [nextRuleId, setNextRuleId] = useState(3)

  // 생성 진행
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, productName: '' })
  const [results, setResults] = useState<{ productName: string; created: number; updated: number; error?: string }[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?includeInactive=false')
      const data = await res.json()
      // 여벌렌즈만 필터
      const spareProducts = (data.products || []).filter(
        (p: Product) => p.optionType === '안경렌즈 여벌' && p.isActive
      )
      setProducts(spareProducts)
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }

  // 브랜드 목록
  const brands = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number }>()
    products.forEach(p => {
      const existing = map.get(p.brandId)
      if (existing) {
        existing.count++
      } else {
        map.set(p.brandId, { id: p.brandId, name: p.brand, count: 1 })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  // 필터된 상품 목록
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (brandFilter && p.brandId !== brandFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)
      }
      return true
    })
  }, [products, brandFilter, searchTerm])

  // 미리보기: 생성될 옵션 수
  const sphValues = useMemo(() => generateRange(sphMin, sphMax, sphStep), [sphMin, sphMax, sphStep])
  const cylValues = useMemo(() => generateRange(cylMin, cylMax, cylStep), [cylMin, cylMax, cylStep])
  const totalOptionsPerProduct = sphValues.length * cylValues.length
  const totalOptionsAll = totalOptionsPerProduct * selectedProducts.length

  // 추가금 계산 (CYL 기준)
  const getPriceAdjustment = (_sph: number, cyl: number): number => {
    const absCyl = Math.abs(cyl)
    const sorted = [...priceRules].sort((a, b) => b.cylMin - a.cylMin)
    for (const rule of sorted) {
      if (absCyl >= rule.cylMin) {
        return rule.adjustment
      }
    }
    return 0
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  // 개별 선택/해제
  const toggleProduct = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // 추가금 규칙 추가
  const addPriceRule = () => {
    setPriceRules(prev => [...prev, { id: nextRuleId, cylMin: 4.0, adjustment: 15000 }])
    setNextRuleId(prev => prev + 1)
  }

  // 추가금 규칙 삭제
  const removePriceRule = (id: number) => {
    setPriceRules(prev => prev.filter(r => r.id !== id))
  }

  // 일괄 생성 실행
  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      toast.error('상품을 선택해주세요.')
      return
    }
    if (totalOptionsPerProduct === 0) {
      toast.error('도수 범위를 설정해주세요.')
      return
    }

    setGenerating(true)
    setResults([])
    setProgress({ current: 0, total: selectedProducts.length, productName: '' })

    const newResults: typeof results = []

    for (let i = 0; i < selectedProducts.length; i++) {
      const productId = selectedProducts[i]
      const product = products.find(p => p.id === productId)
      if (!product) continue

      setProgress({ current: i + 1, total: selectedProducts.length, productName: product.name })

      // 옵션 배열 생성
      const options = []
      for (const sph of sphValues) {
        for (const cyl of cylValues) {
          options.push({
            sph: formatDiopter(sph),
            cyl: formatDiopter(cyl),
            stock: 0,
            stockType: 'local',
            priceAdjustment: getPriceAdjustment(sph, cyl),
          })
        }
      }

      try {
        const res = await fetch(`/api/products/${productId}/options/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ options }),
        })
        const data = await res.json()
        if (data.success) {
          newResults.push({
            productName: `${product.brand} ${product.name}`,
            created: data.data.created,
            updated: data.data.updated,
          })
        } else {
          newResults.push({
            productName: `${product.brand} ${product.name}`,
            created: 0,
            updated: 0,
            error: data.error || '알 수 없는 오류',
          })
        }
      } catch (e: any) {
        newResults.push({
          productName: `${product.brand} ${product.name}`,
          created: 0,
          updated: 0,
          error: e.message,
        })
      }
    }

    setResults(newResults)
    setGenerating(false)

    const totalCreated = newResults.reduce((s, r) => s + r.created, 0)
    const totalUpdated = newResults.reduce((s, r) => s + r.updated, 0)
    const errors = newResults.filter(r => r.error).length
    if (errors > 0) {
      toast.error(`완료: ${totalCreated}개 생성, ${totalUpdated}개 수정 (${errors}개 오류)`)
    } else {
      toast.success(`완료: ${totalCreated}개 생성, ${totalUpdated}개 수정`)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: 16,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #e9ecef',
    borderRadius: 8,
    outline: 'none',
    width: 100,
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    width: 'auto',
    cursor: 'pointer',
    background: 'white',
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="products">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          도수 옵션 일괄 생성
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          여벌렌즈 상품에 SPH/CYL 도수 옵션을 일괄 생성합니다
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* 왼쪽: 상품 선택 */}
        <div style={{ flex: 1 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                상품 선택
                {selectedProducts.length > 0 && (
                  <span style={{ color: '#007aff', fontWeight: 400, fontSize: 14, marginLeft: 8 }}>
                    ({selectedProducts.length}개 선택)
                  </span>
                )}
              </h2>
              <button
                onClick={toggleSelectAll}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500,
                  border: '1px solid #007aff', borderRadius: 6,
                  background: selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? '#007aff' : 'white',
                  color: selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? 'white' : '#007aff',
                  cursor: 'pointer',
                }}
              >
                {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            {/* 필터 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={brandFilter || ''}
                onChange={(e) => setBrandFilter(e.target.value ? parseInt(e.target.value) : null)}
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">전체 브랜드 ({products.length})</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.count})</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="상품 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            {/* 상품 목록 */}
            <div style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: 8 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#86868b' }}>
                  여벌렌즈 상품이 없습니다
                </div>
              ) : (
                filteredProducts.map((product, idx) => {
                  const isSelected = selectedProducts.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#f0f7ff' : idx % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        border: isSelected ? '2px solid #007aff' : '2px solid #d1d1d6',
                        background: isSelected ? '#007aff' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isSelected && (
                          <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600 }}>{product.brand}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#86868b', flexShrink: 0 }}>
                        {(product.retailPrice || product.sellingPrice || 0).toLocaleString()}원
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 설정 */}
        <div style={{ width: 380, flexShrink: 0 }}>
          {/* SPH 범위 */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', color: '#1d1d1f' }}>
              SPH (구면도수) 범위
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>최소</label>
                <input
                  type="number"
                  value={sphMin}
                  onChange={(e) => setSphMin(parseFloat(e.target.value) || 0)}
                  step={0.25}
                  style={inputStyle}
                />
              </div>
              <span style={{ marginTop: 16, color: '#86868b' }}>~</span>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>최대</label>
                <input
                  type="number"
                  value={sphMax}
                  onChange={(e) => setSphMax(parseFloat(e.target.value) || 0)}
                  step={0.25}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>간격</label>
                <select
                  value={sphStep}
                  onChange={(e) => setSphStep(parseFloat(e.target.value))}
                  style={selectStyle}
                >
                  <option value={0.25}>0.25</option>
                  <option value={0.50}>0.50</option>
                  <option value={1.00}>1.00</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#007aff', marginTop: 8 }}>
              {sphValues.length}개 ({formatDiopter(sphMin)} ~ {formatDiopter(sphMax)})
            </div>
          </div>

          {/* CYL 범위 */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', color: '#1d1d1f' }}>
              CYL (난시도수) 범위
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>최소</label>
                <input
                  type="number"
                  value={cylMin}
                  onChange={(e) => setCylMin(parseFloat(e.target.value) || 0)}
                  step={0.25}
                  style={inputStyle}
                />
              </div>
              <span style={{ marginTop: 16, color: '#86868b' }}>~</span>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>최대</label>
                <input
                  type="number"
                  value={cylMax}
                  onChange={(e) => setCylMax(parseFloat(e.target.value) || 0)}
                  step={0.25}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#86868b' }}>간격</label>
                <select
                  value={cylStep}
                  onChange={(e) => setCylStep(parseFloat(e.target.value))}
                  style={selectStyle}
                >
                  <option value={0.25}>0.25</option>
                  <option value={0.50}>0.50</option>
                  <option value={1.00}>1.00</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#007aff', marginTop: 8 }}>
              {cylValues.length}개 ({formatDiopter(cylMin)} ~ {formatDiopter(cylMax)})
            </div>
          </div>

          {/* 고도수 추가금 */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#1d1d1f' }}>
                고도수 추가금
              </h3>
              <button
                onClick={addPriceRule}
                style={{
                  padding: '4px 10px', fontSize: 12, fontWeight: 600,
                  border: '1px solid #34c759', borderRadius: 6,
                  background: 'white', color: '#34c759', cursor: 'pointer',
                }}
              >
                + 규칙 추가
              </button>
            </div>
            {priceRules.length === 0 ? (
              <div style={{ fontSize: 13, color: '#86868b', textAlign: 'center', padding: 16 }}>
                추가금 규칙이 없습니다 (모두 0원)
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {priceRules
                  .sort((a, b) => a.cylMin - b.cylMin)
                  .map(rule => (
                  <div key={rule.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#1d1d1f', whiteSpace: 'nowrap' }}>|CYL| ≥</span>
                    <input
                      type="number"
                      value={rule.cylMin}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setPriceRules(prev => prev.map(r => r.id === rule.id ? { ...r, cylMin: val } : r))
                      }}
                      step={0.25}
                      style={{ ...inputStyle, width: 70 }}
                    />
                    <span style={{ fontSize: 13, color: '#1d1d1f' }}>→</span>
                    <input
                      type="number"
                      value={rule.adjustment}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setPriceRules(prev => prev.map(r => r.id === rule.id ? { ...r, adjustment: val } : r))
                      }}
                      step={1000}
                      style={{ ...inputStyle, width: 90 }}
                    />
                    <span style={{ fontSize: 12, color: '#86868b' }}>원</span>
                    <button
                      onClick={() => removePriceRule(rule.id)}
                      style={{
                        padding: '2px 6px', fontSize: 14, color: '#ff3b30',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 미리보기 & 실행 */}
          <div style={{
            ...cardStyle,
            background: selectedProducts.length > 0 ? '#f0f7ff' : 'white',
            border: selectedProducts.length > 0 ? '2px solid #007aff' : '1px solid #e9ecef',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', color: '#1d1d1f' }}>
              생성 미리보기
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div style={{ background: 'white', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#86868b' }}>선택 상품</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#007aff' }}>{selectedProducts.length}개</div>
              </div>
              <div style={{ background: 'white', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#86868b' }}>상품당 옵션</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#34c759' }}>{totalOptionsPerProduct}개</div>
              </div>
              <div style={{ background: 'white', padding: 12, borderRadius: 8, textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: '#86868b' }}>총 생성 옵션</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ff9500' }}>{totalOptionsAll.toLocaleString()}개</div>
              </div>
            </div>

            {/* 추가금 적용 미리보기 */}
            {priceRules.length > 0 && (
              <div style={{ fontSize: 12, color: '#86868b', marginBottom: 12, background: 'white', padding: 10, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#1d1d1f' }}>추가금 적용 현황:</div>
                {priceRules.sort((a, b) => a.cylMin - b.cylMin).map(rule => {
                  const count = sphValues.length * cylValues.filter(c => Math.abs(c) >= rule.cylMin).length
                  return (
                    <div key={rule.id}>
                      |CYL| ≥ {rule.cylMin}: {count}개 옵션에 +{rule.adjustment.toLocaleString()}원
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || selectedProducts.length === 0 || totalOptionsPerProduct === 0}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: generating || selectedProducts.length === 0
                  ? '#e9ecef'
                  : 'linear-gradient(135deg, #007aff, #0056b3)',
                color: generating || selectedProducts.length === 0 ? '#86868b' : 'white',
                cursor: generating || selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedProducts.length > 0 && !generating ? '0 4px 12px rgba(0,122,255,0.3)' : 'none',
              }}
            >
              {generating
                ? `생성 중... (${progress.current}/${progress.total})`
                : `${totalOptionsAll.toLocaleString()}개 옵션 일괄 생성`
              }
            </button>

            {/* 진행률 */}
            {generating && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#007aff', marginBottom: 4 }}>
                  {progress.productName} 처리 중...
                </div>
                <div style={{ background: '#e9ecef', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                    height: '100%',
                    background: '#007aff',
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* 결과 */}
          {results.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', color: '#1d1d1f' }}>
                생성 결과
              </h3>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {results.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      background: r.error ? '#fff5f5' : i % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>{r.productName}</div>
                    {r.error ? (
                      <div style={{ fontSize: 12, color: '#ff3b30' }}>오류: {r.error}</div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#86868b' }}>
                        생성: {r.created}개 / 수정: {r.updated}개
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 12, padding: 10, background: '#f0f7ff', borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: '#007aff', textAlign: 'center',
              }}>
                총 {results.reduce((s, r) => s + r.created, 0)}개 생성 / {results.reduce((s, r) => s + r.updated, 0)}개 수정
                {results.filter(r => r.error).length > 0 && (
                  <span style={{ color: '#ff3b30', marginLeft: 8 }}>
                    ({results.filter(r => r.error).length}개 오류)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
