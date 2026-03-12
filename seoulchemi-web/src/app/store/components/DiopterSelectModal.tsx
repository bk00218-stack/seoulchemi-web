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

function parseValue(str: string): number {
  return parseFloat(str.replace('+', ''))
}

export default function DiopterSelectModal({ product, onClose, onAdd }: DiopterSelectModalProps) {
  const [options, setOptions] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)

  // 다중 선택 (드롭다운/그리드 공용)
  const [selectedItems, setSelectedItems] = useState<SelectedDiopter[]>([])

  // 드롭다운 입력용
  const [selectedSph, setSelectedSph] = useState<string | null>(null)
  const [selectedCyl, setSelectedCyl] = useState<string | null>(null)

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
      }
    } catch (e) {
      console.error('Failed to fetch options:', e)
    } finally {
      setLoading(false)
    }
  }

  const hasFactory = options.some(o => o.stockType === 'factory')
  const hasLocal = options.some(o => !o.stockType || o.stockType === 'local')

  const sphValues = [...new Set(options.map(o => o.sph))].sort((a, b) => {
    const av = parseValue(a)
    const bv = parseValue(b)
    if (Math.abs(av) !== Math.abs(bv)) return Math.abs(av) - Math.abs(bv)
    return bv - av
  })

  const cylValues = [...new Set(options.map(o => o.cyl))].sort((a, b) => parseValue(b) - parseValue(a))

  // 항목 추가/토글
  const addOrToggleItem = (sph: string, cyl: string, opt: ProductOption) => {
    setSelectedItems(prev => {
      const idx = prev.findIndex(i => i.sph === sph && i.cyl === cyl)
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx)
      }
      return [...prev, {
        sph, cyl, qty: 1,
        price: product.retailPrice + (opt.priceAdjustment || 0),
        priceAdjustment: opt.priceAdjustment || 0,
        stockType: opt.stockType || 'local',
      }]
    })
  }

  // 드롭다운: SPH/CYL 선택 후 추가
  const handleDropdownAdd = () => {
    if (!selectedSph || !selectedCyl) return
    const opt = options.find(o => o.sph === selectedSph && o.cyl === selectedCyl)
    if (!opt) return
    if (selectedItems.some(i => i.sph === selectedSph && i.cyl === selectedCyl)) return
    setSelectedItems(prev => [...prev, {
      sph: selectedSph, cyl: selectedCyl, qty: 1,
      price: product.retailPrice + (opt.priceAdjustment || 0),
      priceAdjustment: opt.priceAdjustment || 0,
      stockType: opt.stockType || 'local',
    }])
    setSelectedSph(null)
    setSelectedCyl(null)
  }

  // 수량 변경 (0.5 단위)
  const updateItemQty = (sph: string, cyl: string, newQty: number) => {
    setSelectedItems(prev => prev.map(i =>
      i.sph === sph && i.cyl === cyl ? { ...i, qty: Math.max(0.5, newQty) } : i
    ))
  }

  const removeItem = (sph: string, cyl: string) => {
    setSelectedItems(prev => prev.filter(i => !(i.sph === sph && i.cyl === cyl)))
  }

  // 장바구니 담기
  const handleAddAll = () => {
    for (const item of selectedItems) {
      onAdd(item.sph, item.cyl, item.qty, item.price)
    }
    onClose()
  }

  const isGridSelected = (sph: string, cyl: string) => {
    return selectedItems.some(i => i.sph === sph && i.cyl === cyl)
  }

  const totalQty = selectedItems.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  // 드롭다운에서 현재 선택한 SPH/CYL의 옵션 정보
  const currentOption = selectedSph && selectedCyl
    ? options.find(o => o.sph === selectedSph && o.cyl === selectedCyl)
    : null
  const alreadyAdded = selectedSph && selectedCyl
    ? selectedItems.some(i => i.sph === selectedSph && i.cyl === selectedCyl)
    : false

  // 수량 표시 포맷
  const formatQty = (qty: number) => qty % 1 === 0 ? qty.toString() : qty.toFixed(1)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16,
        width: '100%', maxWidth: 960, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #e9ecef',
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#86868b', padding: 8, margin: -8 }}>×</button>
        </div>

        {/* Body - 2 Column */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>도수 정보 로딩 중...</div>
          ) : options.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <div style={{ color: '#86868b', marginBottom: 16 }}>등록된 도수 옵션이 없습니다.</div>
              <div style={{ fontSize: 14, color: '#86868b' }}>관리자에게 문의해주세요.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* 왼쪽: 드롭다운 선택 */}
              <div style={{
                width: 280, flexShrink: 0, padding: 20,
                borderRight: '1px solid #e9ecef',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>드롭다운 선택</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#86868b', display: 'block', marginBottom: 4 }}>SPH (구면)</label>
                    <select
                      value={selectedSph || ''}
                      onChange={(e) => setSelectedSph(e.target.value || null)}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e9ecef', borderRadius: 8, background: 'white', cursor: 'pointer' }}
                    >
                      <option value="">선택</option>
                      {sphValues.map(sph => (
                        <option key={sph} value={sph}>{sph}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#86868b', display: 'block', marginBottom: 4 }}>CYL (난시)</label>
                    <select
                      value={selectedCyl || ''}
                      onChange={(e) => setSelectedCyl(e.target.value || null)}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e9ecef', borderRadius: 8, background: 'white', cursor: 'pointer' }}
                    >
                      <option value="">선택</option>
                      {cylValues.map(cyl => (
                        <option key={cyl} value={cyl}>{cyl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 추가 버튼 */}
                {selectedSph && selectedCyl && (
                  <div style={{ marginBottom: 12 }}>
                    {currentOption ? (
                      <div>
                        <div style={{ fontSize: 12, color: '#1d1d1f', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>{selectedSph} / {selectedCyl}</span>
                          {currentOption.stockType === 'factory' && (
                            <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: '#ff9500', color: 'white', fontWeight: 600, marginLeft: 6 }}>공장</span>
                          )}
                          {currentOption.priceAdjustment > 0 && (
                            <span style={{ fontSize: 11, color: '#ff9500', marginLeft: 4 }}>+{currentOption.priceAdjustment.toLocaleString()}원</span>
                          )}
                        </div>
                        <button
                          onClick={handleDropdownAdd}
                          disabled={alreadyAdded}
                          style={{
                            width: '100%', padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8,
                            background: alreadyAdded ? '#e9ecef' : '#34c759',
                            color: alreadyAdded ? '#86868b' : 'white',
                            cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {alreadyAdded ? '추가됨' : '추가'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#ff3b30' }}>해당 도수 옵션이 없습니다.</div>
                    )}
                  </div>
                )}

                {/* 선택 목록 */}
                {selectedItems.length > 0 && (
                  <div style={{ flex: 1, overflow: 'auto', marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#007aff', fontWeight: 600, marginBottom: 8 }}>
                      선택 목록 ({selectedItems.length}개, {formatQty(totalQty)}짝)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedItems.map((item) => (
                        <div key={`${item.sph}-${item.cyl}`} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: '#f0f7ff', padding: '6px 8px', borderRadius: 6, fontSize: 12,
                        }}>
                          <div style={{ flex: 1, fontWeight: 600, color: '#1d1d1f', fontSize: 11 }}>
                            {item.sph}/{item.cyl}
                            {item.stockType === 'factory' && (
                              <span style={{ fontSize: 9, padding: '0 3px', borderRadius: 2, background: '#ff9500', color: 'white', marginLeft: 2 }}>공장</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <button onClick={() => updateItemQty(item.sph, item.cyl, item.qty - 0.5)} style={{ width: 20, height: 20, border: '1px solid #e9ecef', borderRadius: 3, background: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 11 }}>{formatQty(item.qty)}</span>
                            <button onClick={() => updateItemQty(item.sph, item.cyl, item.qty + 0.5)} style={{ width: 20, height: 20, border: '1px solid #e9ecef', borderRadius: 3, background: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <div style={{ fontSize: 11, color: '#86868b', minWidth: 52, textAlign: 'right' }}>
                            {(item.price * item.qty).toLocaleString()}원
                          </div>
                          <button onClick={() => removeItem(item.sph, item.cyl)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: 14, cursor: 'pointer', padding: '0 2px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽: 그리드 */}
              <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  그리드 선택
                  {hasFactory && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8, color: '#ff9500' }}>■ 공장여벌</span>}
                </div>
                <div style={{ fontSize: 11, color: '#86868b', marginBottom: 8 }}>가로: CYL / 세로: SPH — 클릭하여 선택</div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: cylValues.length * 46 + 56 }}>
                    <div style={{ display: 'flex', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                      <div style={{ width: 56, flexShrink: 0 }} />
                      {cylValues.map(cyl => (
                        <div key={cyl} style={{ width: 46, textAlign: 'center', fontSize: 10, color: '#86868b', padding: '4px 0', fontWeight: 600 }}>{cyl}</div>
                      ))}
                    </div>
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {sphValues.map(sph => (
                        <div key={sph} style={{ display: 'flex' }}>
                          <div style={{ width: 56, flexShrink: 0, fontSize: 10, color: '#86868b', display: 'flex', alignItems: 'center', paddingRight: 6, fontWeight: 600 }}>{sph}</div>
                          {cylValues.map(cyl => {
                            const opt = options.find(o => o.sph === sph && o.cyl === cyl)
                            const selected = isGridSelected(sph, cyl)
                            const isFactory = opt?.stockType === 'factory'
                            return (
                              <div
                                key={`${sph}-${cyl}`}
                                onClick={() => { if (opt) addOrToggleItem(sph, cyl, opt) }}
                                style={{
                                  width: 46, height: 26,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11,
                                  cursor: opt ? 'pointer' : 'not-allowed',
                                  background: selected ? '#007aff' : opt ? (isFactory ? '#fff3e0' : '#e8f5e9') : '#f5f5f7',
                                  color: selected ? 'white' : opt ? '#1d1d1f' : '#ccc',
                                  border: selected ? '2px solid #0056b3' : '1px solid #e9ecef',
                                  margin: 1, borderRadius: 4, transition: 'all 0.1s',
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
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #e9ecef',
          display: 'flex', gap: 12, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', fontSize: 15, fontWeight: 600, border: '1px solid #e9ecef', borderRadius: 12, background: 'white', color: '#1d1d1f', cursor: 'pointer' }}>
            취소
          </button>
          <button
            onClick={handleAddAll}
            disabled={selectedItems.length === 0}
            style={{
              flex: 2, padding: '12px', fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12,
              background: selectedItems.length > 0 ? '#007aff' : '#e9ecef',
              color: selectedItems.length > 0 ? 'white' : '#86868b',
              cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {selectedItems.length > 0
              ? `${formatQty(totalQty)}개 담기 (${totalPrice.toLocaleString()}원)`
              : '도수를 선택하세요'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
