'use client'

import { useState, useEffect } from 'react'

interface ProductOption {
  id: number
  sph: string
  cyl: string
  stock: number
  stockType?: string
  priceAdjustment: number
}

interface SelectedDiopter {
  sph: string
  cyl: string
  qty: number
  price: number
  priceAdjustment: number
  stockType: string
}

interface DiopterSelectModalProps {
  product: {
    id: number
    name: string
    brand: string
    optionType?: string
    retailPrice: number
  }
  onClose: () => void
  onAdd: (sph: string, cyl: string, qty: number, price: number) => void
}

// SPH/CYL 값을 숫자로 파싱
function parseValue(str: string): number {
  return parseFloat(str.replace('+', ''))
}

export default function DiopterSelectModal({ product, onClose, onAdd }: DiopterSelectModalProps) {
  const [options, setOptions] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'grid' | 'dropdown'>('dropdown')

  // 드롭다운 모드용 (단일 선택)
  const [selectedSph, setSelectedSph] = useState<string | null>(null)
  const [selectedCyl, setSelectedCyl] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  // 그리드 모드용 (다중 선택)
  const [selectedItems, setSelectedItems] = useState<SelectedDiopter[]>([])

  useEffect(() => {
    fetchOptions()
  }, [product.id])

  const fetchOptions = async () => {
    try {
      const res = await fetch(`/api/products/${product.id}/options`)
      if (res.ok) {
        const json = await res.json()
        const opts = json.data || json.options || []
        setOptions(opts)
        if (opts.length > 100) {
          setMode('dropdown')
        } else {
          setMode('grid')
        }
      }
    } catch (e) {
      console.error('Failed to fetch options:', e)
    } finally {
      setLoading(false)
    }
  }

  // 공장여벌 포함 여부 확인
  const hasFactory = options.some(o => o.stockType === 'factory')
  const hasLocal = options.some(o => !o.stockType || o.stockType === 'local')

  // SPH: 0.00이 맨 위, 절대값 오름차순
  const sphValues = [...new Set(options.map(o => o.sph))].sort((a, b) => {
    const av = parseValue(a)
    const bv = parseValue(b)
    if (Math.abs(av) !== Math.abs(bv)) return Math.abs(av) - Math.abs(bv)
    return bv - av
  })

  const cylValues = [...new Set(options.map(o => o.cyl))].sort((a, b) => parseValue(b) - parseValue(a))

  // 드롭다운: 선택된 옵션 찾기
  const selectedOption = selectedSph && selectedCyl
    ? options.find(o => o.sph === selectedSph && o.cyl === selectedCyl)
    : null
  const finalPrice = product.retailPrice + (selectedOption?.priceAdjustment || 0)

  // 드롭다운: 장바구니 담기
  const handleAddSingle = () => {
    if (selectedSph && selectedCyl) {
      onAdd(selectedSph, selectedCyl, qty, finalPrice)
      onClose()
    }
  }

  // 그리드: 셀 클릭 토글
  const toggleGridCell = (sph: string, cyl: string, opt: ProductOption) => {
    setSelectedItems(prev => {
      const idx = prev.findIndex(i => i.sph === sph && i.cyl === cyl)
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx)
      } else {
        return [...prev, {
          sph,
          cyl,
          qty: 1,
          price: product.retailPrice + (opt.priceAdjustment || 0),
          priceAdjustment: opt.priceAdjustment || 0,
          stockType: opt.stockType || 'local',
        }]
      }
    })
  }

  // 그리드: 선택 항목 수량 변경
  const updateItemQty = (sph: string, cyl: string, newQty: number) => {
    setSelectedItems(prev => prev.map(i =>
      i.sph === sph && i.cyl === cyl ? { ...i, qty: Math.max(1, newQty) } : i
    ))
  }

  // 그리드: 선택 항목 제거
  const removeItem = (sph: string, cyl: string) => {
    setSelectedItems(prev => prev.filter(i => !(i.sph === sph && i.cyl === cyl)))
  }

  // 그리드: 전체 장바구니 담기
  const handleAddMultiple = () => {
    for (const item of selectedItems) {
      onAdd(item.sph, item.cyl, item.qty, item.price)
    }
    onClose()
  }

  // 그리드 셀이 선택되어 있는지
  const isGridSelected = (sph: string, cyl: string) => {
    return selectedItems.some(i => i.sph === sph && i.cyl === cyl)
  }

  // 총 금액/수량 계산
  const totalQty = selectedItems.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16,
        width: '100%', maxWidth: 640, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e9ecef',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#007aff', fontWeight: 600 }}>{product.brand}</span>
              {hasFactory && hasLocal && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#fff3cd', color: '#856404', fontWeight: 600 }}>여벌+공장</span>
              )}
              {hasFactory && !hasLocal && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#ff9500', color: 'white', fontWeight: 600 }}>공장여벌</span>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>{product.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#86868b', padding: 8, margin: -8 }}
          >
            ×
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>도수 정보 로딩 중...</div>
          ) : options.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <div style={{ color: '#86868b', marginBottom: 16 }}>등록된 도수 옵션이 없습니다.</div>
              <div style={{ fontSize: 14, color: '#86868b' }}>관리자에게 문의해주세요.</div>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f5f5f7', padding: 4, borderRadius: 8 }}>
                <button
                  onClick={() => setMode('dropdown')}
                  style={{
                    flex: 1, padding: '8px 16px', border: 'none', borderRadius: 6,
                    background: mode === 'dropdown' ? 'white' : 'transparent',
                    color: mode === 'dropdown' ? '#007aff' : '#86868b',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    boxShadow: mode === 'dropdown' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  드롭다운
                </button>
                <button
                  onClick={() => setMode('grid')}
                  style={{
                    flex: 1, padding: '8px 16px', border: 'none', borderRadius: 6,
                    background: mode === 'grid' ? 'white' : 'transparent',
                    color: mode === 'grid' ? '#007aff' : '#86868b',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    boxShadow: mode === 'grid' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  그리드 (다중선택)
                </button>
              </div>

              {mode === 'dropdown' ? (
                <>
                  {/* Dropdown Mode */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>SPH (구면)</label>
                      <select
                        value={selectedSph || ''}
                        onChange={(e) => setSelectedSph(e.target.value || null)}
                        style={{ width: '100%', padding: '12px 16px', fontSize: 16, border: '1px solid #e9ecef', borderRadius: 10, background: 'white', cursor: 'pointer' }}
                      >
                        <option value="">선택</option>
                        {sphValues.map(sph => (
                          <option key={sph} value={sph}>{sph}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>CYL (난시)</label>
                      <select
                        value={selectedCyl || ''}
                        onChange={(e) => setSelectedCyl(e.target.value || null)}
                        style={{ width: '100%', padding: '12px 16px', fontSize: 16, border: '1px solid #e9ecef', borderRadius: 10, background: 'white', cursor: 'pointer' }}
                      >
                        <option value="">선택</option>
                        {cylValues.map(cyl => (
                          <option key={cyl} value={cyl}>{cyl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>수량</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40, border: '1px solid #e9ecef', borderRadius: 8, background: 'white', fontSize: 20, cursor: 'pointer' }}>−</button>
                      <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 60, textAlign: 'center', padding: '8px', fontSize: 18, fontWeight: 700, border: '1px solid #e9ecef', borderRadius: 8 }} />
                      <button onClick={() => setQty(qty + 1)} style={{ width: 40, height: 40, border: '1px solid #e9ecef', borderRadius: 8, background: 'white', fontSize: 20, cursor: 'pointer' }}>+</button>
                    </div>
                  </div>

                  {/* Selected Info */}
                  {selectedSph && selectedCyl && (
                    <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                      <div style={{ fontSize: 14, color: '#007aff', marginBottom: 8 }}>선택한 도수</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f' }}>
                        SPH {selectedSph} / CYL {selectedCyl}
                        {selectedOption?.stockType === 'factory' && (
                          <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: '#ff9500', color: 'white', fontWeight: 600, marginLeft: 8, verticalAlign: 'middle' }}>공장</span>
                        )}
                      </div>
                      {selectedOption?.priceAdjustment ? (
                        <div style={{ fontSize: 12, color: '#ff9500', marginTop: 4 }}>고도수 추가금: +{selectedOption.priceAdjustment.toLocaleString()}원</div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Grid Mode - Selected Items (상단 고정) */}
                  {selectedItems.length > 0 && (
                    <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: '#007aff', fontWeight: 600, marginBottom: 10 }}>
                        선택한 도수 ({selectedItems.length}개, {totalQty}짝)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                        {selectedItems.map((item) => (
                          <div key={`${item.sph}-${item.cyl}`} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'white', padding: '8px 12px', borderRadius: 8,
                            fontSize: 13,
                          }}>
                            <div style={{ flex: 1, fontWeight: 600, color: '#1d1d1f' }}>
                              {item.sph} / {item.cyl}
                              {item.stockType === 'factory' && (
                                <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: '#ff9500', color: 'white', fontWeight: 600, marginLeft: 4 }}>공장</span>
                              )}
                              {item.priceAdjustment > 0 && (
                                <span style={{ fontSize: 11, color: '#ff9500', marginLeft: 4 }}>+{item.priceAdjustment.toLocaleString()}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => updateItemQty(item.sph, item.cyl, item.qty - 1)} style={{ width: 24, height: 24, border: '1px solid #e9ecef', borderRadius: 4, background: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                              <span style={{ width: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                              <button onClick={() => updateItemQty(item.sph, item.cyl, item.qty + 1)} style={{ width: 24, height: 24, border: '1px solid #e9ecef', borderRadius: 4, background: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                            <div style={{ fontSize: 12, color: '#86868b', minWidth: 65, textAlign: 'right' }}>
                              {(item.price * item.qty).toLocaleString()}원
                            </div>
                            <button
                              onClick={() => removeItem(item.sph, item.cyl)}
                              style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grid */}
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>
                      SPH/CYL 선택 (가로: CYL, 세로: SPH)
                      {hasFactory && <span style={{ marginLeft: 8, color: '#ff9500' }}>■ 공장여벌</span>}
                    </div>
                    <div style={{ minWidth: cylValues.length * 50 + 60 }}>
                      {/* CYL Header */}
                      <div style={{ display: 'flex' }}>
                        <div style={{ width: 60, flexShrink: 0 }} />
                        {cylValues.map(cyl => (
                          <div key={cyl} style={{ width: 50, textAlign: 'center', fontSize: 10, color: '#86868b', padding: '4px 0' }}>{cyl}</div>
                        ))}
                      </div>

                      {/* SPH Rows */}
                      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {sphValues.map(sph => (
                          <div key={sph} style={{ display: 'flex' }}>
                            <div style={{ width: 60, flexShrink: 0, fontSize: 11, color: '#86868b', display: 'flex', alignItems: 'center', paddingRight: 8 }}>{sph}</div>
                            {cylValues.map(cyl => {
                              const opt = options.find(o => o.sph === sph && o.cyl === cyl)
                              const selected = isGridSelected(sph, cyl)
                              const isFactory = opt?.stockType === 'factory'
                              return (
                                <div
                                  key={`${sph}-${cyl}`}
                                  onClick={() => { if (opt) toggleGridCell(sph, cyl, opt) }}
                                  style={{
                                    width: 50, height: 28,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11,
                                    cursor: opt ? 'pointer' : 'not-allowed',
                                    background: selected
                                      ? '#007aff'
                                      : opt
                                        ? (isFactory ? '#fff3e0' : '#e8f5e9')
                                        : '#f5f5f7',
                                    color: selected ? 'white' : opt ? '#1d1d1f' : '#ccc',
                                    border: selected ? '2px solid #0056b3' : '1px solid #e9ecef',
                                    margin: 1, borderRadius: 4,
                                    transition: 'all 0.1s',
                                  }}
                                >
                                  {opt ? (selected ? '✓' : '○') : ''}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e9ecef',
          display: 'flex', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '14px', fontSize: 16, fontWeight: 600, border: '1px solid #e9ecef', borderRadius: 12, background: 'white', color: '#1d1d1f', cursor: 'pointer' }}
          >
            취소
          </button>
          {mode === 'dropdown' ? (
            <button
              onClick={handleAddSingle}
              disabled={!selectedSph || !selectedCyl || options.length === 0}
              style={{
                flex: 2, padding: '14px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12,
                background: selectedSph && selectedCyl ? '#007aff' : '#e9ecef',
                color: selectedSph && selectedCyl ? 'white' : '#86868b',
                cursor: selectedSph && selectedCyl ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedSph && selectedCyl
                ? `장바구니 담기 (${(finalPrice * qty).toLocaleString()}원)`
                : '도수를 선택하세요'
              }
            </button>
          ) : (
            <button
              onClick={handleAddMultiple}
              disabled={selectedItems.length === 0}
              style={{
                flex: 2, padding: '14px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12,
                background: selectedItems.length > 0 ? '#007aff' : '#e9ecef',
                color: selectedItems.length > 0 ? 'white' : '#86868b',
                cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedItems.length > 0
                ? `${totalQty}개 담기 (${totalPrice.toLocaleString()}원)`
                : '도수를 선택하세요'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
