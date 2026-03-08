'use client'

import { useState, useEffect } from 'react'

interface ProductOption {
  id: number
  sph: string
  cyl: string
  stock: number
  priceAdjustment: number
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

// 숫자를 도수 문자열로 포맷
function formatValue(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}`
}

export default function DiopterSelectModal({ product, onClose, onAdd }: DiopterSelectModalProps) {
  const [options, setOptions] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSph, setSelectedSph] = useState<string | null>(null)
  const [selectedCyl, setSelectedCyl] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [mode, setMode] = useState<'grid' | 'dropdown'>('dropdown')

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
        
        // 옵션이 많으면 드롭다운, 적으면 그리드
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

  // 고유 SPH/CYL 값 추출
  const sphValues = [...new Set(options.map(o => o.sph))].sort((a, b) => parseValue(a) - parseValue(b))
  const cylValues = [...new Set(options.map(o => o.cyl))].sort((a, b) => parseValue(b) - parseValue(a))

  // 선택된 옵션 찾기
  const selectedOption = selectedSph && selectedCyl 
    ? options.find(o => o.sph === selectedSph && o.cyl === selectedCyl)
    : null

  // 최종 가격 계산
  const finalPrice = product.retailPrice + (selectedOption?.priceAdjustment || 0)

  const handleAdd = () => {
    if (selectedSph && selectedCyl) {
      onAdd(selectedSph, selectedCyl, qty, finalPrice)
      onClose()
    }
  }

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  }

  const contentStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflow: 'auto',
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#007aff', fontWeight: 600 }}>{product.brand}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>{product.name}</div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', fontSize: 24, 
              cursor: 'pointer', color: '#86868b',
              padding: 8, margin: -8,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>
              도수 정보 로딩 중...
            </div>
          ) : options.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <div style={{ color: '#86868b', marginBottom: 16 }}>
                등록된 도수 옵션이 없습니다.
              </div>
              <div style={{ fontSize: 14, color: '#86868b' }}>
                관리자에게 문의해주세요.
              </div>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginBottom: 20,
                background: '#f5f5f7',
                padding: 4,
                borderRadius: 8,
              }}>
                <button
                  onClick={() => setMode('dropdown')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 6,
                    background: mode === 'dropdown' ? 'white' : 'transparent',
                    color: mode === 'dropdown' ? '#007aff' : '#86868b',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: mode === 'dropdown' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  드롭다운
                </button>
                <button
                  onClick={() => setMode('grid')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 6,
                    background: mode === 'grid' ? 'white' : 'transparent',
                    color: mode === 'grid' ? '#007aff' : '#86868b',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: mode === 'grid' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  그리드
                </button>
              </div>

              {mode === 'dropdown' ? (
                /* Dropdown Mode */
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>
                      SPH (구면)
                    </label>
                    <select
                      value={selectedSph || ''}
                      onChange={(e) => setSelectedSph(e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: 16,
                        border: '1px solid #e9ecef',
                        borderRadius: 10,
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">선택</option>
                      {sphValues.map(sph => (
                        <option key={sph} value={sph}>{sph}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>
                      CYL (난시)
                    </label>
                    <select
                      value={selectedCyl || ''}
                      onChange={(e) => setSelectedCyl(e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: 16,
                        border: '1px solid #e9ecef',
                        borderRadius: 10,
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">선택</option>
                      {cylValues.map(cyl => (
                        <option key={cyl} value={cyl}>{cyl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Grid Mode */
                <div style={{ marginBottom: 20, overflowX: 'auto' }}>
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>
                    SPH/CYL 선택 (가로: CYL, 세로: SPH)
                  </div>
                  <div style={{ minWidth: cylValues.length * 50 + 60 }}>
                    {/* CYL Header */}
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: 60, flexShrink: 0 }} />
                      {cylValues.map(cyl => (
                        <div 
                          key={cyl} 
                          style={{ 
                            width: 50, 
                            textAlign: 'center', 
                            fontSize: 10, 
                            color: '#86868b',
                            padding: '4px 0',
                          }}
                        >
                          {cyl}
                        </div>
                      ))}
                    </div>
                    
                    {/* SPH Rows */}
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {sphValues.map(sph => (
                        <div key={sph} style={{ display: 'flex' }}>
                          <div style={{ 
                            width: 60, 
                            flexShrink: 0, 
                            fontSize: 11, 
                            color: '#86868b',
                            display: 'flex',
                            alignItems: 'center',
                            paddingRight: 8,
                          }}>
                            {sph}
                          </div>
                          {cylValues.map(cyl => {
                            const opt = options.find(o => o.sph === sph && o.cyl === cyl)
                            const isSelected = selectedSph === sph && selectedCyl === cyl
                            return (
                              <div
                                key={`${sph}-${cyl}`}
                                onClick={() => {
                                  if (opt) {
                                    setSelectedSph(sph)
                                    setSelectedCyl(cyl)
                                  }
                                }}
                                style={{
                                  width: 50,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  cursor: opt ? 'pointer' : 'not-allowed',
                                  background: isSelected 
                                    ? '#007aff' 
                                    : opt 
                                      ? (opt.priceAdjustment > 0 ? '#fff3cd' : '#e8f5e9')
                                      : '#f5f5f7',
                                  color: isSelected ? 'white' : opt ? '#1d1d1f' : '#ccc',
                                  border: '1px solid #e9ecef',
                                  margin: 1,
                                  borderRadius: 4,
                                }}
                              >
                                {opt ? (opt.priceAdjustment > 0 ? `+${(opt.priceAdjustment/1000).toFixed(0)}k` : '○') : ''}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 6 }}>
                  수량
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{
                      width: 40, height: 40,
                      border: '1px solid #e9ecef',
                      borderRadius: 8,
                      background: 'white',
                      fontSize: 20,
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: 60,
                      textAlign: 'center',
                      padding: '8px',
                      fontSize: 18,
                      fontWeight: 700,
                      border: '1px solid #e9ecef',
                      borderRadius: 8,
                    }}
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{
                      width: 40, height: 40,
                      border: '1px solid #e9ecef',
                      borderRadius: 8,
                      background: 'white',
                      fontSize: 20,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selected Info */}
              {selectedSph && selectedCyl && (
                <div style={{ 
                  background: '#f0f7ff', 
                  padding: 16, 
                  borderRadius: 12,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 14, color: '#007aff', marginBottom: 8 }}>
                    선택한 도수
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f' }}>
                    SPH {selectedSph} / CYL {selectedCyl}
                  </div>
                  {selectedOption?.priceAdjustment ? (
                    <div style={{ fontSize: 12, color: '#ff9500', marginTop: 4 }}>
                      고도수 추가금: +{selectedOption.priceAdjustment.toLocaleString()}원
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              border: '1px solid #e9ecef',
              borderRadius: 12,
              background: 'white',
              color: '#1d1d1f',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedSph || !selectedCyl || options.length === 0}
            style={{
              flex: 2,
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 12,
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
        </div>
      </div>
    </div>
  )
}
