'use client'

import { useState, useCallback, useEffect } from 'react'

interface DiopterGridProps {
  mode: 'create' | 'edit'
  existingOptions: { sph: string; cyl: string; priceAdjustment?: number; id?: number }[]
  selectedCells: Map<string, number>
  setSelectedCells: (cells: Map<string, number>) => void
  activeTab: 'minus' | 'plus'
  getPriceByRules: (cyl: number) => number
}

// SPH/CYL 값 포맷
const formatValue = (v: number) => {
  const rounded = Math.round(v * 100) / 100
  if (rounded === 0) return '0.00'
  return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
}

// 프리셋 범위
const PRESETS = [
  { label: '전체 (-8~0, 0~-2)', sphMin: -8, sphMax: 0, cylMin: -2, cylMax: 0 },
  { label: '저도수 (-4~0, 0~-1)', sphMin: -4, sphMax: 0, cylMin: -1, cylMax: 0 },
  { label: '고도수 (-8~-4, 0~-4)', sphMin: -8, sphMax: -4, cylMin: -4, cylMax: 0 },
  { label: '난시만 (0~0, 0~-4)', sphMin: 0, sphMax: 0, cylMin: -4, cylMax: 0 },
]

const PRESETS_PLUS = [
  { label: '전체 (+0.25~+6, 0~-2)', sphMin: 0.25, sphMax: 6, cylMin: -2, cylMax: 0 },
  { label: '저도수 (+0.25~+2, 0~-1)', sphMin: 0.25, sphMax: 2, cylMin: -1, cylMax: 0 },
  { label: '고도수 (+3~+6, 0~-4)', sphMin: 3, sphMax: 6, cylMin: -4, cylMax: 0 },
]

export default function DiopterGrid({
  mode,
  existingOptions,
  selectedCells,
  setSelectedCells,
  activeTab,
  getPriceByRules,
}: DiopterGridProps) {
  // 드래그 범위 선택
  const [dragStart, setDragStart] = useState<{ sph: number; cyl: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ sph: number; cyl: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 기존 옵션 Map
  const existingMap = new Map(
    existingOptions.map(o => [`${o.sph},${o.cyl}`, { id: o.id, priceAdjustment: o.priceAdjustment || 0 }])
  )

  // CYL 값 (0 ~ -4)
  const cylValues: number[] = []
  for (let c = 0; c >= -4; c -= 0.25) {
    cylValues.push(c)
  }

  // SPH 값
  const sphValues: number[] = []
  if (activeTab === 'minus') {
    for (let s = 0; s >= -8; s -= 0.25) {
      sphValues.push(s)
    }
  } else {
    for (let s = 0.25; s <= 6; s += 0.25) {
      sphValues.push(s)
    }
  }

  // 드래그 범위 내 셀인지 확인
  const isInDragRange = useCallback((sph: number, cyl: number) => {
    if (!dragStart || !dragEnd) return false
    const minSph = Math.min(dragStart.sph, dragEnd.sph)
    const maxSph = Math.max(dragStart.sph, dragEnd.sph)
    const minCyl = Math.min(dragStart.cyl, dragEnd.cyl)
    const maxCyl = Math.max(dragStart.cyl, dragEnd.cyl)
    return sph >= minSph && sph <= maxSph && cyl >= minCyl && cyl <= maxCyl
  }, [dragStart, dragEnd])

  // 범위 선택 적용
  const applyRangeSelection = useCallback((sphMin: number, sphMax: number, cylMin: number, cylMax: number, action: 'select' | 'deselect') => {
    setSelectedCells(prev => {
      const newMap = new Map(prev)
      sphValues.forEach(sph => {
        if (sph < sphMin || sph > sphMax) return
        cylValues.forEach(cyl => {
          if (cyl < cylMin || cyl > cylMax) return
          const key = `${formatValue(sph)},${formatValue(cyl)}`
          const isExisting = existingMap.has(key)
          
          if (mode === 'create' && isExisting) return // 생성 모드에서 기존 옵션 스킵
          
          if (action === 'select') {
            newMap.set(key, getPriceByRules(cyl))
          } else {
            if (mode === 'edit' && isExisting) return // 수정 모드에서 기존 옵션 삭제 불가
            newMap.delete(key)
          }
        })
      })
      return newMap
    })
  }, [sphValues, cylValues, existingMap, mode, getPriceByRules, setSelectedCells])

  // 마우스 이벤트
  const handleMouseDown = (sph: number, cyl: number) => {
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    if (mode === 'create' && isExisting) return

    setDragStart({ sph, cyl })
    setDragEnd({ sph, cyl })
    setIsDragging(true)
  }

  const handleMouseEnter = (sph: number, cyl: number) => {
    if (!isDragging) return
    setDragEnd({ sph, cyl })
  }

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      const minSph = Math.min(dragStart.sph, dragEnd.sph)
      const maxSph = Math.max(dragStart.sph, dragEnd.sph)
      const minCyl = Math.min(dragStart.cyl, dragEnd.cyl)
      const maxCyl = Math.max(dragStart.cyl, dragEnd.cyl)
      
      // 시작점이 선택되어 있으면 해제, 아니면 선택
      const startKey = `${formatValue(dragStart.sph)},${formatValue(dragStart.cyl)}`
      const action = selectedCells.has(startKey) ? 'deselect' : 'select'
      
      applyRangeSelection(minSph, maxSph, minCyl, maxCyl, action)
    }
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, selectedCells, applyRangeSelection])

  // 전역 마우스업 이벤트
  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp()
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [handleMouseUp])

  // 프리셋 적용
  const applyPreset = (preset: typeof PRESETS[0]) => {
    applyRangeSelection(preset.sphMin, preset.sphMax, preset.cylMin, preset.cylMax, 'select')
  }

  // 셀 스타일
  const getCellStyle = (sph: number, cyl: number): React.CSSProperties => {
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    const isSelected = selectedCells.has(key)
    const priceAdj = selectedCells.get(key) || 0
    const inDragRange = isInDragRange(sph, cyl)
    
    let background = '#fff'
    let cursor = 'pointer'
    
    if (mode === 'create') {
      if (isExisting) {
        background = '#e0e0e0'
        cursor = 'not-allowed'
      } else if (inDragRange) {
        background = 'rgba(0, 122, 255, 0.3)'
      } else if (isSelected) {
        background = priceAdj > 0 ? '#ff6b6b' : '#007aff'
      }
    } else {
      if (inDragRange) {
        background = 'rgba(0, 122, 255, 0.3)'
      } else if (isSelected) {
        if (priceAdj > 0) {
          background = isExisting ? '#ff6b6b' : '#ffab91'
        } else {
          background = isExisting ? '#81c784' : '#007aff'
        }
      }
    }
    
    return {
      width: 28,
      height: 24,
      border: '1px solid #e0e0e0',
      cursor,
      background,
      transition: 'background 0.05s',
    }
  }

  const presets = activeTab === 'minus' ? PRESETS : PRESETS_PLUS

  return (
    <div>
      {/* 프리셋 버튼 */}
      <div style={{ 
        marginBottom: 12, 
        display: 'flex', 
        gap: 8, 
        flexWrap: 'wrap',
        padding: '8px 12px',
        background: '#f5f5f7',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          📐 빠른 선택:
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(preset)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              border: '1px solid #007aff',
              borderRadius: 4,
              background: 'white',
              color: '#007aff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 안내 */}
      <div style={{ marginBottom: 8, fontSize: 11, color: '#666' }}>
        💡 <strong>드래그</strong>로 범위 선택 | <strong>Shift+클릭</strong>으로 확장 선택
      </div>

      {/* 그리드 */}
      <div style={{ overflow: 'auto', maxHeight: 400 }}>
        <table style={{ borderCollapse: 'collapse', userSelect: 'none' }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '4px 8px', 
                fontSize: 11, 
                fontWeight: 600, 
                color: '#666',
                position: 'sticky',
                top: 0,
                left: 0,
                background: '#fff',
                zIndex: 2,
              }}>
                SPH\CYL
              </th>
              {cylValues.map(cyl => (
                <th key={cyl} style={{ 
                  padding: '4px 2px', 
                  fontSize: 10, 
                  fontWeight: 500, 
                  color: '#666',
                  position: 'sticky',
                  top: 0,
                  background: '#fff',
                  zIndex: 1,
                }}>
                  {formatValue(cyl)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sphValues.map(sph => (
              <tr key={sph}>
                <td style={{ 
                  padding: '2px 8px', 
                  fontSize: 11, 
                  fontWeight: 500, 
                  color: '#666',
                  position: 'sticky',
                  left: 0,
                  background: '#fff',
                  zIndex: 1,
                }}>
                  {formatValue(sph)}
                </td>
                {cylValues.map(cyl => (
                  <td 
                    key={cyl}
                    style={getCellStyle(sph, cyl)}
                    onMouseDown={() => handleMouseDown(sph, cyl)}
                    onMouseEnter={() => handleMouseEnter(sph, cyl)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 드래그 범위 표시 */}
      {isDragging && dragStart && dragEnd && (
        <div style={{ 
          marginTop: 8, 
          padding: '6px 12px', 
          background: '#e3f2fd', 
          borderRadius: 4,
          fontSize: 12,
          color: '#1976d2',
        }}>
          선택 범위: SPH {formatValue(Math.min(dragStart.sph, dragEnd.sph))} ~ {formatValue(Math.max(dragStart.sph, dragEnd.sph))}
          {' / '}
          CYL {formatValue(Math.min(dragStart.cyl, dragEnd.cyl))} ~ {formatValue(Math.max(dragStart.cyl, dragEnd.cyl))}
        </div>
      )}
    </div>
  )
}
