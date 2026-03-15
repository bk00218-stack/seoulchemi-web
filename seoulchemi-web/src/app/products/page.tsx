'use client'

import { useToast } from '@/contexts/ToastContext'
import { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import { PRODUCTS_SIDEBAR } from '../constants/sidebar'
import BulkManageModal from './BulkManageModal'

// 대분류
interface MainCategory {
  id: number
  code: string
  name: string
  isActive: boolean
  _count?: { brands: number }
}

// 브랜드
interface Brand {
  id: number
  categoryId: number | null
  name: string
  stockManage: string | null
  isActive: boolean
  _count?: { products: number; productLines: number }
  productLines?: ProductLine[]
}

// 품목
interface ProductLine {
  id: number
  brandId: number
  name: string
  isActive: boolean
  _count?: { products: number }
}

interface Product {
  id: number
  code: string
  name: string
  brandId: number
  productLineId: number | null
  productLine?: { id: number; name: string } | null
  optionType: string
  productType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  displayOrder: number
  imageUrl?: string | null
  _count?: { options: number }
}

interface ProductOption {
  id: number
  sph: string
  cyl: string
  memo: string | null
  barcode: string | null
  stock: number
  status: string
  stockLocation: string | null
  priceAdjustment: number
}

// 모달 스타일
const modalOverlayStyle: React.CSSProperties = {
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
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  width: 800,
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  color: '#1d1d1f',
}

// 매트릭스 도수 생성/수정 모달 컴포넌트
function GenerateOptionsModal({
  productName,
  productId,
  existingOptions,
  onClose,
  onGenerate,
  onSaveComplete,
  mode = 'create',
}: {
  productName: string
  productId?: number
  existingOptions: ProductOption[]
  onClose: () => void
  onGenerate: (options: { sph: string; cyl: string; priceAdjustment: number; stockType: string }[]) => Promise<void> | void
  onSaveComplete?: () => void
  mode?: 'create' | 'edit'
}) {
  const { toast } = useToast()
  // 탭: 근난시(-/-), 원난시(+/-)
  const [activeTab, setActiveTab] = useState<'minus' | 'plus'>('minus')
  
  // 선택된 셀들 (Map: "sph,cyl" -> { priceAdjustment, stockType })
  // 수정 모드에서는 기존 옵션도 포함
  const [selectedCells, setSelectedCells] = useState<Map<string, { priceAdjustment: number; stockType: string }>>(() => {
    if (mode === 'edit') {
      return new Map(existingOptions.map(o => [
        `${o.sph},${o.cyl}`, 
        { priceAdjustment: o.priceAdjustment || 0, stockType: (o as any).stockType || 'local' }
      ]))
    }
    return new Map()
  })
  
  // 드래그 범위 선택 (사각형)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ sph: number; cyl: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ sph: number; cyl: number } | null>(null)
  
  // 기본 재고타입 (새 셀 추가 시 사용)
  const [defaultStockType, setDefaultStockType] = useState<'local' | 'factory'>('local')
  
  // 가격 조정 규칙 (CYL 기준)
  const [priceRules, setPriceRules] = useState([
    { cylFrom: -2.00, cylTo: -4.00, adjustment: 5000 },
  ])
  const [showRulePanel, setShowRulePanel] = useState(false)
  const [bulkPrice, setBulkPrice] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // 자동 스크롤 관련
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const scrollStateRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const rafRef = useRef<number | null>(null)

  // 기존 옵션들을 Map으로 (id와 가격조정 포함)
  const existingMap = new Map(existingOptions.map(o => [`${o.sph},${o.cyl}`, { id: o.id, priceAdjustment: o.priceAdjustment || 0 }]))

  // SPH/CYL 값 생성
  const formatValue = (v: number) => {
    const rounded = Math.round(v * 100) / 100
    if (rounded === 0) return '0.00'
    return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
  }
  
  const parseValue = (s: string): number => {
    return parseFloat(s.replace('+', ''))
  }

  // CYL은 항상 마이너스 (0.00 ~ -4.00)
  const cylValues: number[] = []
  for (let c = 0; c >= -4; c -= 0.25) {
    cylValues.push(c)
  }

  // SPH는 탭에 따라 다름
  const sphValues: number[] = []
  if (activeTab === 'minus') {
    // 근난시: 0.00 ~ -20.00
    for (let s = 0; s >= -20; s -= 0.25) {
      sphValues.push(s)
    }
  } else {
    // 원난시: +0.25 ~ +6.00
    for (let s = 0.25; s <= 6; s += 0.25) {
      sphValues.push(s)
    }
  }
  
  // 가격 규칙에 따른 조정값 계산 (CYL 기준)
  const getPriceByRules = (cyl: number): number => {
    for (const rule of priceRules) {
      if (cyl <= rule.cylFrom && cyl >= rule.cylTo) {
        return rule.adjustment
      }
    }
    return 0
  }

  const toggleCell = (sph: number, cyl: number) => {
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    
    // 생성 모드에서는 기존 옵션 선택 불가
    if (mode === 'create' && isExisting) return
    
    setSelectedCells(prev => {
      const newMap = new Map(prev)
      if (newMap.has(key)) {
        newMap.delete(key)
      } else {
        newMap.set(key, { priceAdjustment: getPriceByRules(cyl), stockType: defaultStockType })
      }
      return newMap
    })
  }

  // 드래그 범위 내 셀인지 확인
  const isInDragRange = (sph: number, cyl: number) => {
    if (!dragStart || !dragEnd) return false
    const minSph = Math.min(dragStart.sph, dragEnd.sph)
    const maxSph = Math.max(dragStart.sph, dragEnd.sph)
    const minCyl = Math.min(dragStart.cyl, dragEnd.cyl)
    const maxCyl = Math.max(dragStart.cyl, dragEnd.cyl)
    return sph >= minSph && sph <= maxSph && cyl >= minCyl && cyl <= maxCyl
  }

  // 범위 선택 적용
  const applyRangeSelection = (sphMin: number, sphMax: number, cylMin: number, cylMax: number, action: 'select' | 'deselect') => {
    setSelectedCells(prev => {
      const newMap = new Map(prev)
      sphValues.forEach(sph => {
        if (sph < sphMin || sph > sphMax) return
        cylValues.forEach(cyl => {
          if (cyl < cylMin || cyl > cylMax) return
          const key = `${formatValue(sph)},${formatValue(cyl)}`
          const isExisting = existingMap.has(key)
          
          if (mode === 'create' && isExisting) return
          
          if (action === 'select') {
            newMap.set(key, { priceAdjustment: getPriceByRules(cyl), stockType: defaultStockType })
          } else {
            newMap.delete(key)
          }
        })
      })
      return newMap
    })
  }

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

  const handleMouseUp = () => {
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
  }
  
  // 프리셋 범위 선택
  const presets = activeTab === 'minus' 
    ? [
        { label: '일반 (-8~0)', sphMin: -8, sphMax: 0, cylMin: -2, cylMax: 0 },
        { label: '저도수 (-4~0)', sphMin: -4, sphMax: 0, cylMin: -1, cylMax: 0 },
        { label: '고도수 (-12~-4)', sphMin: -12, sphMax: -4, cylMin: -4, cylMax: 0 },
        { label: '초고도수 (-20~-8)', sphMin: -20, sphMax: -8, cylMin: -4, cylMax: 0 },
      ]
    : [
        { label: '전체 (+0.25~+6)', sphMin: 0.25, sphMax: 6, cylMin: -2, cylMax: 0 },
        { label: '저도수 (+0.25~+2)', sphMin: 0.25, sphMax: 2, cylMin: -1, cylMax: 0 },
        { label: '고도수 (+3~+6)', sphMin: 3, sphMax: 6, cylMin: -4, cylMax: 0 },
      ]
  
  const applyPreset = (preset: typeof presets[0]) => {
    applyRangeSelection(preset.sphMin, preset.sphMax, preset.cylMin, preset.cylMax, 'select')
  }

  // 전역 마우스업 이벤트 (드래그 종료 처리)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging, dragStart, dragEnd, selectedCells])

  // 드래그 중 자동 스크롤
  useEffect(() => {
    if (!isDragging) {
      scrollStateRef.current = { dx: 0, dy: 0 }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = () => {
      const container = gridContainerRef.current
      const { dx, dy } = scrollStateRef.current
      if (container && (dx !== 0 || dy !== 0)) {
        container.scrollLeft += dx
        container.scrollTop += dy
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const handleDragMouseMove = (e: MouseEvent) => {
      const container = gridContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const edgeSize = 50
      const maxSpeed = 12
      let dy = 0, dx = 0
      if (e.clientY > rect.bottom - edgeSize) {
        dy = maxSpeed * Math.min(1, (e.clientY - (rect.bottom - edgeSize)) / edgeSize)
      } else if (e.clientY < rect.top + edgeSize) {
        dy = -maxSpeed * Math.min(1, ((rect.top + edgeSize) - e.clientY) / edgeSize)
      }
      if (e.clientX > rect.right - edgeSize) {
        dx = maxSpeed * Math.min(1, (e.clientX - (rect.right - edgeSize)) / edgeSize)
      } else if (e.clientX < rect.left + edgeSize) {
        dx = -maxSpeed * Math.min(1, ((rect.left + edgeSize) - e.clientX) / edgeSize)
      }
      scrollStateRef.current = { dx, dy }
    }

    rafRef.current = requestAnimationFrame(tick)
    document.addEventListener('mousemove', handleDragMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleDragMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isDragging])

  const handleSelectAll = () => {
    const newMap = new Map(selectedCells)
    sphValues.forEach(sph => {
      cylValues.forEach(cyl => {
        const key = `${formatValue(sph)},${formatValue(cyl)}`
        if (!existingMap.has(key)) {
          newMap.set(key, { priceAdjustment: getPriceByRules(cyl), stockType: defaultStockType })
        }
      })
    })
    setSelectedCells(newMap)
  }

  const handleClearAll = () => {
    // 현재 탭의 선택만 해제
    const newMap = new Map(selectedCells)
    sphValues.forEach(sph => {
      cylValues.forEach(cyl => {
        const key = `${formatValue(sph)},${formatValue(cyl)}`
        newMap.delete(key)
      })
    })
    setSelectedCells(newMap)
  }
  
  // 선택된 셀들에 일괄 가격 적용
  const handleApplyBulkPrice = () => {
    const newMap = new Map(selectedCells)
    for (const [key, value] of newMap.entries()) {
      newMap.set(key, { ...value, priceAdjustment: bulkPrice })
    }
    setSelectedCells(newMap)
  }
  
  // 규칙 재적용 (선택된 셀에만 적용)
  const handleApplyRules = () => {
    const newMap = new Map(selectedCells)
    for (const [key, value] of newMap.entries()) {
      const [, cylStr] = key.split(',')
      const cyl = parseValue(cylStr)
      newMap.set(key, { ...value, priceAdjustment: getPriceByRules(cyl) })
    }
    setSelectedCells(newMap)
  }

  const handleGenerate = async () => {
    if (mode === 'edit' && productId) {
      // 수정 모드: 단일 API로 생성+수정+삭제 통합 처리
      const updates: { id: number; priceAdjustment: number }[] = []
      selectedCells.forEach((cellData, key) => {
        const existing = existingMap.get(key)
        if (existing && existing.priceAdjustment !== cellData.priceAdjustment) {
          updates.push({ id: existing.id, priceAdjustment: cellData.priceAdjustment })
        }
      })

      const creates: { sph: string; cyl: string; priceAdjustment: number; stockType: string }[] = []
      selectedCells.forEach((cellData, key) => {
        if (!existingMap.has(key)) {
          const [sph, cyl] = key.split(',')
          creates.push({ sph, cyl, priceAdjustment: cellData.priceAdjustment, stockType: cellData.stockType })
        }
      })

      const deleteIds: number[] = []
      existingMap.forEach((existing, key) => {
        if (!selectedCells.has(key)) {
          deleteIds.push(existing.id)
        }
      })

      const hasChanges = updates.length > 0 || creates.length > 0 || deleteIds.length > 0
      if (!hasChanges) {
        toast.error('변경된 내용이 없습니다.')
        return
      }

      setIsSaving(true)
      try {
        const res = await fetch(`/api/products/${productId}/options/bulk-edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creates, updates, deleteIds }),
        })
        const data = await res.json()
        if (res.ok && data.success !== false) {
          toast.success(data.message || '저장 완료')
          onSaveComplete?.()
        } else {
          toast.error(data.error || '저장 실패')
        }
      } catch (e) {
        console.error(e)
        toast.error('저장 실패')
      } finally {
        setIsSaving(false)
        onClose()
      }
    } else {
      // 생성 모드: 새로운 옵션만 생성
      console.log('handleGenerate: selectedCells size =', selectedCells.size)
      console.log('handleGenerate: selectedCells entries =', Array.from(selectedCells.entries()))
      const options = Array.from(selectedCells.entries()).map(([key, cellData]) => {
        const [sph, cyl] = key.split(',')
        console.log('option:', { sph, cyl, priceAdjustment: cellData.priceAdjustment, stockType: cellData.stockType })
        return { sph, cyl, priceAdjustment: cellData.priceAdjustment, stockType: cellData.stockType }
      })
      console.log('handleGenerate: calling onGenerate with', options.length, 'options')
      onGenerate(options)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    background: active ? '#fff' : 'var(--gray-100)',
    border: 'none',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    cursor: 'pointer',
    color: active ? 'var(--primary)' : 'var(--gray-600)',
  })

  const cellStyle = (sph: number, cyl: number): React.CSSProperties => {
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    const isSelected = selectedCells.has(key)
    const cellData = selectedCells.get(key)
    const priceAdj = cellData?.priceAdjustment || 0
    const cellStockType = cellData?.stockType || 'local'
    const originalPrice = existingMap.get(key)?.priceAdjustment || 0
    const isModified = isExisting && priceAdj !== originalPrice
    const inDragRange = isInDragRange(sph, cyl)
    const isFactory = cellStockType === 'factory'
    
    let background = '#fff'
    let cursor = 'pointer'
    
    // 드래그 범위 미리보기
    if (inDragRange && !isExisting) {
      background = 'rgba(0, 122, 255, 0.3)'
    } else if (mode === 'create') {
      // 생성 모드: 기존 옵션은 회색, 선택불가
      if (isExisting) {
        background = 'var(--gray-300)'
        cursor = 'not-allowed'
      } else if (isSelected) {
        // 공장여벌은 주황색 계열, 여벌은 파랑/빨강 계열
        if (isFactory) {
          background = priceAdj > 0 ? '#ff9800' : '#ffb74d' // 공장여벌: 주황
        } else {
          background = priceAdj > 0 ? '#ff6b6b' : 'var(--primary)' // 여벌: 파랑/빨강
        }
      }
    } else {
      // 수정 모드: 기존 옵션도 선택/해제 가능
      if (inDragRange) {
        background = 'rgba(0, 122, 255, 0.3)'
      } else if (isExisting && !isSelected) {
        // 기존 옵션이 해제됨 → 삭제 예정 (빨간 줄무늬)
        background = 'repeating-linear-gradient(45deg, #ffcdd2, #ffcdd2 3px, #ef5350 3px, #ef5350 6px)'
      } else if (isSelected) {
        if (isModified) {
          background = '#ffeb3b'  // 수정됨: 노란색
        } else if (isFactory) {
          background = '#ff9800'  // 공장여벌: 주황
        } else if (priceAdj > 0) {
          background = '#ff6b6b'  // 추가금 있음
        } else if (isExisting) {
          background = '#81c784'  // 기존 옵션 (기본가)
        } else {
          background = 'var(--primary)'  // 새로 추가
        }
      }
    }
    
    return {
      width: 28,
      height: 24,
      border: '1px solid var(--gray-200)',
      cursor,
      background,
      transition: 'background 0.1s',
      position: 'relative',
    }
  }
  
  // 선택된 셀들의 가격 조정 요약
  const priceSummary = () => {
    const summary = new Map<number, number>()
    for (const cellData of selectedCells.values()) {
      const price = cellData.priceAdjustment
      summary.set(price, (summary.get(price) || 0) + 1)
    }
    return Array.from(summary.entries()).sort((a, b) => a[0] - b[0])
  }
  
  // 선택된 셀들의 재고타입 요약
  const stockTypeSummary = () => {
    let local = 0, factory = 0
    for (const cellData of selectedCells.values()) {
      if (cellData.stockType === 'factory') factory++
      else local++
    }
    return { local, factory }
  }

  return (
    <div 
      style={{
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
      }}
      onClick={isSaving ? undefined : onClose}
      onMouseUp={handleMouseUp}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '85vw',
          maxWidth: 1100,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {mode === 'edit' ? '도수표 수정' : '도수 생성 및 가격 설정'}
            </h3>
            <button
              onClick={isSaving ? undefined : onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: isSaving ? 'not-allowed' : 'pointer', color: 'var(--gray-400)' }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
            {productName} {mode === 'edit' && `(${existingOptions.length}개 도수)`}
          </div>
        </div>

        {/* 탭 + 가격설정 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            <button style={tabStyle(activeTab === 'minus')} onClick={() => setActiveTab('minus')}>
              근난시 (-/-)
            </button>
            <button style={tabStyle(activeTab === 'plus')} onClick={() => setActiveTab('plus')}>
              원난시 (+/-)
            </button>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setShowRulePanel(!showRulePanel)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                border: '1px solid var(--gray-300)',
                borderRadius: 6,
                background: showRulePanel ? 'var(--primary)' : '#fff',
                color: showRulePanel ? '#fff' : 'var(--gray-700)',
                cursor: 'pointer',
              }}
            >
              ⚙️ 가격 규칙
            </button>
          </div>
        </div>
        
        {/* 재고타입 설정 (새 셀 추가 시 기본값 + 선택된 셀 일괄 변경) */}
        <div style={{ padding: '8px 16px', background: '#f0f7ff', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#666' }}>💡 드래그로 범위 선택</span>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>📦 새 셀 기본타입:</span>
            <button
              onClick={() => setDefaultStockType('local')}
              style={{
                padding: '4px 12px',
                fontSize: 11,
                border: defaultStockType === 'local' ? '2px solid #34c759' : '1px solid #ccc',
                borderRadius: 4,
                background: defaultStockType === 'local' ? '#e8f5e9' : 'white',
                color: defaultStockType === 'local' ? '#2e7d32' : '#666',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              📦 여벌
            </button>
            <button
              onClick={() => setDefaultStockType('factory')}
              style={{
                padding: '4px 12px',
                fontSize: 11,
                border: defaultStockType === 'factory' ? '2px solid #ff9800' : '1px solid #ccc',
                borderRadius: 4,
                background: defaultStockType === 'factory' ? '#fff3e0' : 'white',
                color: defaultStockType === 'factory' ? '#e65100' : '#666',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🏭 공장여벌
            </button>
            
            {/* 선택된 셀 일괄 변경 */}
            {selectedCells.size > 0 && (
              <>
                <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>선택 {selectedCells.size}개 →</span>
                <button
                  onClick={() => {
                    const newMap = new Map(selectedCells)
                    for (const [key, value] of newMap.entries()) {
                      newMap.set(key, { ...value, stockType: 'local' })
                    }
                    setSelectedCells(newMap)
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    border: '1px solid #34c759',
                    borderRadius: 4,
                    background: 'white',
                    color: '#2e7d32',
                    cursor: 'pointer',
                  }}
                >
                  여벌로
                </button>
                <button
                  onClick={() => {
                    const newMap = new Map(selectedCells)
                    for (const [key, value] of newMap.entries()) {
                      newMap.set(key, { ...value, stockType: 'factory' })
                    }
                    setSelectedCells(newMap)
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    border: '1px solid #ff9800',
                    borderRadius: 4,
                    background: 'white',
                    color: '#e65100',
                    cursor: 'pointer',
                  }}
                >
                  공장으로
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* 가격 규칙 패널 */}
        {showRulePanel && (
          <div style={{ padding: 16, background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>
              📌 가격 조정 규칙 (CYL 난시 고도수 추가금)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {priceRules.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 600 }}>CYL</span>
                  <input
                    type="number"
                    step="0.25"
                    value={rule.cylFrom}
                    onChange={(e) => {
                      const newRules = [...priceRules]
                      newRules[idx].cylFrom = parseFloat(e.target.value)
                      setPriceRules(newRules)
                    }}
                    style={{ width: 70, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>~</span>
                  <input
                    type="number"
                    step="0.25"
                    value={rule.cylTo}
                    onChange={(e) => {
                      const newRules = [...priceRules]
                      newRules[idx].cylTo = parseFloat(e.target.value)
                      setPriceRules(newRules)
                    }}
                    style={{ width: 70, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>→ +</span>
                  <input
                    type="number"
                    step="1000"
                    value={rule.adjustment}
                    onChange={(e) => {
                      const newRules = [...priceRules]
                      newRules[idx].adjustment = parseInt(e.target.value) || 0
                      setPriceRules(newRules)
                    }}
                    style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>원</span>
                  <button
                    onClick={() => setPriceRules(priceRules.filter((_, i) => i !== idx))}
                    style={{ padding: '2px 6px', border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setPriceRules([...priceRules, { cylFrom: -2.00, cylTo: -3.00, adjustment: 3000 }])}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: 11, 
                  border: '1px dashed var(--gray-300)', 
                  borderRadius: 4, 
                  background: '#fff',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                + 규칙 추가
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={handleApplyRules}
                disabled={selectedCells.size === 0}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: 'none',
                  borderRadius: 6,
                  background: selectedCells.size > 0 ? 'var(--primary)' : 'var(--gray-300)',
                  color: '#fff',
                  cursor: selectedCells.size > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                선택된 {selectedCells.size}개에 규칙 적용
              </button>
              <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                (CYL 범위에 해당하는 셀만 추가금 적용)
              </span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>
                💰 일괄 가격 설정
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  step="1000"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(parseInt(e.target.value) || 0)}
                  placeholder="가격 조정액"
                  style={{ width: 100, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                />
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>원</span>
                <button
                  onClick={handleApplyBulkPrice}
                  disabled={selectedCells.size === 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    border: 'none',
                    borderRadius: 6,
                    background: selectedCells.size > 0 ? 'var(--success)' : 'var(--gray-300)',
                    color: '#fff',
                    cursor: selectedCells.size > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  선택된 {selectedCells.size}개에 적용
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 매트릭스 */}
        <div ref={gridContainerRef} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ marginBottom: 8, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {mode === 'edit' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#81c784', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>기존 (기본가)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ff6b6b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>기존 (추가금)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ffeb3b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>수정됨</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--primary)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>새로 추가</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--primary)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>기본가</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ff6b6b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>추가금 있음</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--gray-300)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>기존 옵션</span>
                </div>
              </>
            )}
          </div>
          <table style={{ borderCollapse: 'collapse', userSelect: 'none' }}>
            <thead>
              <tr>
                <th style={{ 
                  padding: '4px 8px', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: 'var(--gray-500)',
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
                    color: 'var(--gray-600)',
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
                    color: 'var(--gray-600)',
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
                      style={cellStyle(sph, cyl)}
                      onMouseDown={() => handleMouseDown(sph, cyl)}
                      onMouseEnter={() => handleMouseEnter(sph, cyl)}
                      title={selectedCells.has(`${formatValue(sph)},${formatValue(cyl)}`) 
                        ? `${selectedCells.get(`${formatValue(sph)},${formatValue(cyl)}`)?.stockType === 'factory' ? '🏭공장' : '📦여벌'} +${selectedCells.get(`${formatValue(sph)},${formatValue(cyl)}`)?.priceAdjustment?.toLocaleString() || 0}원` 
                        : ''}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div style={{ 
          padding: '12px 24px', 
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--gray-50)',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={handleSelectAll}
              style={{ 
                padding: '6px 12px', 
                fontSize: 12, 
                border: '1px solid var(--gray-300)', 
                borderRadius: 6, 
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              전체선택
            </button>
            <button 
              onClick={handleClearAll}
              style={{ 
                padding: '6px 12px', 
                fontSize: 12, 
                border: '1px solid var(--gray-300)', 
                borderRadius: 6, 
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              선택해제
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
              {priceSummary().map(([price, count], idx) => (
                <span key={price} style={{ marginRight: 8 }}>
                  {price > 0 ? `+${price.toLocaleString()}원` : '기본가'}: {count}개
                  {idx < priceSummary().length - 1 && ' | '}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>
              {mode === 'edit' ? (
                <>
                  기존 <strong style={{ color: '#81c784' }}>{existingOptions.length}</strong>개
                  {(() => {
                    const deleteCount = existingOptions.filter(o => !selectedCells.has(`${o.sph},${o.cyl}`)).length
                    return deleteCount > 0 ? (
                      <span style={{ color: '#ef5350', marginLeft: 8 }}>
                        삭제 <strong>{deleteCount}</strong>개
                      </span>
                    ) : null
                  })()}
                </>
              ) : (
                <>총 <strong style={{ color: 'var(--primary)' }}>{selectedCells.size}</strong>개 선택</>
              )}
            </span>
            <button
              onClick={handleGenerate}
              disabled={isSaving || (mode === 'create' && selectedCells.size === 0)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: isSaving ? 'var(--gray-400)' : (mode === 'edit' || selectedCells.size > 0) ? 'var(--primary)' : 'var(--gray-300)',
                color: '#fff',
                cursor: isSaving ? 'wait' : (mode === 'edit' || selectedCells.size > 0) ? 'pointer' : 'not-allowed',
              }}
            >
              {isSaving ? '저장 중...' : mode === 'edit' ? '저장하기' : '생성하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 도수 가격 수정 모달 컴포넌트
function EditPriceModal({
  productName,
  options,
  onClose,
  onSave,
}: {
  productName: string
  options: ProductOption[]
  onClose: () => void
  onSave: (updates: { id: number; priceAdjustment: number }[]) => void
}) {
  const { toast } = useToast()
  // 옵션별 가격 조정 상태
  const [priceMap, setPriceMap] = useState<Map<number, number>>(
    new Map(options.map(o => [o.id, o.priceAdjustment || 0]))
  )
  const [bulkPrice, setBulkPrice] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // 도수표 데이터 구성 - 원본 문자열 기반
  const sphSet = new Set<string>()
  const cylSet = new Set<string>()
  const optionMap = new Map<string, ProductOption>()
  
  options.forEach(o => {
    const sph = o.sph || '0.00'
    const cyl = o.cyl || '0.00'
    sphSet.add(sph)
    cylSet.add(cyl)
    optionMap.set(`${sph},${cyl}`, o)
  })
  
  // 숫자로 정렬
  const parseNum = (s: string) => parseFloat(s.replace('+', ''))
  const sphValues = Array.from(sphSet).sort((a, b) => parseNum(b) - parseNum(a))
  const cylValues = Array.from(cylSet).sort((a, b) => parseNum(b) - parseNum(a))

  // 이미 포맷된 문자열 사용

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(options.map(o => o.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const applyBulkPrice = () => {
    const newMap = new Map(priceMap)
    selectedIds.forEach(id => {
      newMap.set(id, bulkPrice)
    })
    setPriceMap(newMap)
  }

  const handleSave = () => {
    const updates = Array.from(priceMap.entries())
      .filter(([id, price]) => {
        const original = options.find(o => o.id === id)
        return original && (original.priceAdjustment || 0) !== price
      })
      .map(([id, priceAdjustment]) => ({ id, priceAdjustment }))
    
    if (updates.length === 0) {
      toast.error('변경된 내용이 없습니다.')
      return
    }
    onSave(updates)
  }

  const cellStyle = (sph: string, cyl: string): React.CSSProperties => {
    const option = optionMap.get(`${sph},${cyl}`)
    if (!option) return { width: 50, height: 36, background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }
    const isSelected = selectedIds.has(option.id)
    const price = priceMap.get(option.id) || 0
    return {
      width: 50,
      height: 36,
      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
      cursor: 'pointer',
      background: isSelected 
        ? 'var(--primary-light)' 
        : price > 0 
          ? '#ffebee' 
          : '#eef4ee',  // 파란색 배경으로 도수 있음 표시
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      color: price > 0 ? '#c62828' : '#5d7a5d',
      fontWeight: price > 0 ? 600 : 500,
    }
  }

  return (
    <div 
      style={{
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
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 'auto',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>도수별 가격 수정</h3>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{productName} ({options.length}개 도수)</div>
        </div>

        {/* 가격 일괄 설정 */}
        <div style={{ padding: 16, background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={selectAll} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
              전체선택
            </button>
            <button onClick={clearSelection} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
              선택해제
            </button>
            <span style={{ color: 'var(--gray-400)' }}>|</span>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>선택된 {selectedIds.size}개에</span>
            <input
              type="number"
              step="1000"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(parseInt(e.target.value) || 0)}
              style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
            />
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>원</span>
            <button
              onClick={applyBulkPrice}
              disabled={selectedIds.size === 0}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                border: 'none',
                borderRadius: 6,
                background: selectedIds.size > 0 ? 'var(--primary)' : 'var(--gray-300)',
                color: '#fff',
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              적용
            </button>
          </div>
        </div>

        {/* 도수표 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {/* 범례 */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#eef4ee', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#5d7a5d' }}>✓</div>
              <span style={{ color: 'var(--gray-600)' }}>도수 있음 (기본가)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#ffebee', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#c62828', fontWeight: 600 }}>+5k</div>
              <span style={{ color: 'var(--gray-600)' }}>추가금 있음</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 2 }}></div>
              <span style={{ color: 'var(--gray-600)' }}>선택됨</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 2 }}></div>
              <span style={{ color: 'var(--gray-600)' }}>도수 없음</span>
            </div>
          </div>
          <table style={{ borderCollapse: 'collapse', userSelect: 'none' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', position: 'sticky', top: 0, left: 0, background: '#fff', zIndex: 2 }}>
                  SPH\CYL
                </th>
                {cylValues.map(cyl => (
                  <th key={cyl} style={{ padding: '4px', fontSize: 10, fontWeight: 500, color: 'var(--gray-600)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                    {cyl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sphValues.map(sph => (
                <tr key={sph}>
                  <td style={{ padding: '2px 8px', fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                    {sph}
                  </td>
                  {cylValues.map(cyl => {
                    const option = optionMap.get(`${sph},${cyl}`)
                    return (
                      <td 
                        key={cyl}
                        style={cellStyle(sph, cyl)}
                        onClick={() => option && toggleSelect(option.id)}
                        title={option ? `SPH: ${option.sph}, CYL: ${option.cyl}\n가격조정: ${priceMap.get(option.id)?.toLocaleString() || 0}원` : '옵션 없음'}
                      >
                        {option 
                          ? (priceMap.get(option.id) || 0) > 0 
                            ? `+${((priceMap.get(option.id) || 0) / 1000).toFixed(0)}k` 
                            : '✓'  // 도수 있으면 체크마크
                          : ''
                        }
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div style={{ 
          padding: '12px 24px', 
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--gray-50)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            셀 클릭으로 선택, 일괄 가격 적용 가능
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 14, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              취소
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: 'var(--primary)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<MainCategory[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedProductLine, setSelectedProductLine] = useState<ProductLine | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [brandLoading, setBrandLoading] = useState(false)
  const [productLineLoading, setProductLineLoading] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const [optionLoading, setOptionLoading] = useState(false)
  
  // 필터
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandSearch, setBrandSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)

  // 모달 상태
  const [showProductModal, setShowProductModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showBulkManageModal, setShowBulkManageModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  
  // 도수 옵션 함께 생성 (신규 등록시)
  const [generateWithProduct, setGenerateWithProduct] = useState(false)
  const [diopterRange, setDiopterRange] = useState({
    sphMin: -6, sphMax: 4, sphStep: 0.25,
    cylMin: -2, cylMax: 0, cylStep: 0.25
  })

  // 순서 변경 추적
  const [orderChanged, setOrderChanged] = useState(false)
  const [productOrders, setProductOrders] = useState<{[key: number]: number}>({})

  // 상품 수정 모달 - 브랜드/품목 선택
  const [editModalBrandId, setEditModalBrandId] = useState<number | null>(null)
  const [editModalProductLineId, setEditModalProductLineId] = useState<number | null>(null)
  const [editModalBrands, setEditModalBrands] = useState<Brand[]>([])
  const [editModalProductLines, setEditModalProductLines] = useState<ProductLine[]>([])

  // 일괄 선택
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  // 대분류 조회
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
      if (data.categories?.length > 0) {
        handleSelectCategory(data.categories[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // 대분류 선택 → 브랜드 로드
  const handleSelectCategory = useCallback(async (category: MainCategory) => {
    setSelectedCategory(category)
    setSelectedBrand(null)
    setSelectedProductLine(null)
    setSelectedProduct(null)
    setProducts([])
    setOptions([])
    setBrandLoading(true)
    try {
      const res = await fetch(`/api/brands?categoryId=${category.id}`)
      const data = await res.json()
      setBrands(data.brands || [])
      if (data.brands?.length > 0) {
        handleSelectBrand(data.brands[0])
      } else {
        setBrands([])
        setProductLines([])
      }
    } catch (e) {
      console.error(e)
      setBrands([])
    } finally {
      setBrandLoading(false)
    }
  }, [])

  // 브랜드 선택 → 품목 로드
  const handleSelectBrand = useCallback(async (brand: Brand) => {
    console.log('Selecting brand:', brand.id, brand.name)
    setSelectedBrand(brand)
    setSelectedProductLine(null)
    setSelectedProduct(null)
    setProducts([])
    setOptions([])
    setProductLineLoading(true)
    setSelectedProductIds(new Set())
    try {
      const res = await fetch(`/api/product-lines?brandId=${brand.id}`)
      const data = await res.json()
      setProductLines(data.productLines || [])
      if (data.productLines?.length > 0) {
        handleSelectProductLine(data.productLines[0])
      } else {
        setProductLines([])
        setProducts([])
      }
    } catch (e) {
      console.error(e)
      setProductLines([])
    } finally {
      setProductLineLoading(false)
    }
  }, [])

  // 품목 선택 → 상품 로드
  const handleSelectProductLine = useCallback(async (productLine: ProductLine) => {
    console.log('Selecting product line:', productLine.id, productLine.name)
    setSelectedProductLine(productLine)
    setSelectedProduct(null)
    setOptions([])
    setProductLoading(true)
    setSelectedProductIds(new Set())
    try {
      const res = await fetch(`/api/products?productLineId=${productLine.id}`)
      const data = await res.json()
      setProducts(data.products || [])
      const orders: {[key: number]: number} = {}
      data.products?.forEach((p: Product) => { orders[p.id] = p.displayOrder })
      setProductOrders(orders)
      setOrderChanged(false)
    } catch (e) {
      console.error(e)
      setProducts([])
    } finally {
      setProductLoading(false)
    }
  }, [])

  const handleSelectProduct = useCallback(async (product: Product) => {
    setSelectedProduct(product)
    setOptionLoading(true)
    setSelectedOptionIds(new Set())
    try {
      const res = await fetch(`/api/products/${product.id}/options`)
      const data = await res.json()
      setOptions(data.data || data.options || [])
    } catch (e) {
      console.error(e)
      setOptions([])
    } finally {
      setOptionLoading(false)
    }
  }, [])

  // 바코드 검색
  async function handleBarcodeSearch() {
    if (!barcodeSearch.trim()) return
    try {
      const res = await fetch(`/api/products/search?barcode=${encodeURIComponent(barcodeSearch)}`)
      const data = await res.json()
      if (data.product && data.option) {
        // 브랜드 찾기
        const brand = brands.find(b => b.id === data.product.brandId)
        if (brand) {
          await handleSelectBrand(brand)
          setSelectedProduct(data.product)
          // 옵션 목록 로드 후 해당 옵션 하이라이트
          const optRes = await fetch(`/api/products/${data.product.id}/options`)
          const optData = await optRes.json()
          setOptions(optData.data || optData.options || [])
        }
        setShowBarcodeModal(false)
        setBarcodeSearch('')
        toast.info(`찾았습니다: ${data.product.name} - SPH: ${data.option.sph}, CYL: ${data.option.cyl}`)
      } else {
        toast.error('해당 바코드를 찾을 수 없습니다.')
      }
    } catch (e) {
      console.error(e)
      toast.error('검색 중 오류가 발생했습니다.')
    }
  }

  // 상품 저장
  // 브랜드 저장
  async function handleSaveBrand(formData: FormData) {
    const data = {
      name: formData.get('name'),
      stockManage: formData.get('stockManage') || null,
      isActive: formData.get('isActive') === 'true',
      ...((!editingBrand && selectedCategory) ? { categoryId: selectedCategory.id } : {}),
    }

    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowBrandModal(false)
        setEditingBrand(null)
        if (selectedCategory) {
          // 브랜드 목록만 갱신 (선택 상태 유지)
          try {
            const brandRes = await fetch(`/api/brands?categoryId=${selectedCategory.id}`)
            const brandData = await brandRes.json()
            setBrands(brandData.brands || [])
          } catch (e) {
            console.error(e)
          }
        }
        toast.success(editingBrand ? '브랜드가 수정되었습니다.' : '브랜드가 추가되었습니다.')
      } else {
        const err = await res.json()
        toast.error(err.error || '저장 실패')
      }
    } catch (e) {
      console.error(e)
      toast.error('저장 중 오류 발생')
    }
  }

  // 상품 수정 모달 열기 (브랜드/품목 정보 포함)
  function openEditProductModal(product: Product) {
    setEditingProduct(product)
    setEditModalBrandId(product.brandId)
    setEditModalProductLineId(product.productLineId)
    setShowProductModal(true)
    // 모달 먼저 열고 데이터 병렬 로드
    Promise.all([
      fetch('/api/brands').then(r => r.json()),
      fetch(`/api/product-lines?brandId=${product.brandId}`).then(r => r.json()),
    ]).then(([brandsData, plData]) => {
      setEditModalBrands(brandsData.brands || [])
      setEditModalProductLines(plData.productLines || [])
    }).catch(e => console.error('모달 데이터 로드 실패:', e))
  }

  async function handleSaveProduct(formData: FormData) {
    const data = {
      brandId: editingProduct ? editModalBrandId : selectedBrand?.id,
      productLineId: editingProduct ? editModalProductLineId : selectedProductLine?.id,
      name: formData.get('name'),
      optionType: formData.get('optionType'),
      productType: formData.get('productType') || formData.get('optionType'),
      bundleName: formData.get('bundleName') || null,
      refractiveIndex: formData.get('refractiveIndex') || null,
      sellingPrice: parseInt(formData.get('sellingPrice') as string) || 0,
      purchasePrice: parseInt(formData.get('purchasePrice') as string) || 0,
      isActive: formData.get('isActive') === 'true',
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (res.ok) {
        const savedProduct = await res.json()
        
        // 신규 등록 + 도수 옵션 함께 생성
        if (!editingProduct && generateWithProduct) {
          const formatValue = (v: number) => {
            const rounded = Math.round(v * 100) / 100
            if (rounded === 0) return '0.00'
            return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
          }
          
          // 도수 옵션 생성
          const optionsToCreate: { sph: string; cyl: string; priceAdjustment: number }[] = []
          for (let sph = diopterRange.sphMin; sph <= diopterRange.sphMax; sph += diopterRange.sphStep) {
            for (let cyl = diopterRange.cylMin; cyl <= diopterRange.cylMax; cyl += diopterRange.cylStep) {
              optionsToCreate.push({
                sph: formatValue(Math.round(sph * 100) / 100),
                cyl: formatValue(Math.round(cyl * 100) / 100),
                priceAdjustment: 0
              })
            }
          }
          
          if (optionsToCreate.length > 0) {
            const optRes = await fetch(`/api/products/${savedProduct.id}/options/bulk`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ options: optionsToCreate })
            })
            
            if (optRes.ok) {
              const optData = await optRes.json()
              toast.success(`상품이 등록되었습니다.\n도수 옵션 ${optData.created || optionsToCreate.length}개가 함께 생성되었습니다.`)
            } else {
              toast.success('상품은 등록되었으나, 도수 옵션 생성에 실패했습니다.')
            }
          }
          
          setGenerateWithProduct(false)
        } else {
          // 일반 저장
          if (!editingProduct) {
            toast.success('상품이 등록되었습니다.')
          }
        }
        
        setShowProductModal(false)
        setEditingProduct(null)
        if (selectedProductLine) handleSelectProductLine(selectedProductLine)
      } else {
        toast.error('저장 실패')
      }
    } catch (e) {
      console.error(e)
      toast.error('저장 중 오류 발생')
    }
  }

  // 옵션 저장
  async function handleSaveOption(formData: FormData) {
    const data = {
      sph: formData.get('sph'),
      cyl: formData.get('cyl'),
      memo: formData.get('memo') || null,
      barcode: formData.get('barcode') || null,
      stock: parseInt(formData.get('stock') as string) || 0,
      isActive: formData.get('isActive') === 'true',
      location: formData.get('location') || null,
      priceAdjustment: parseInt(formData.get('priceAdjustment') as string) || 0,
    }

    try {
      const url = editingOption 
        ? `/api/products/${selectedProduct?.id}/options/${editingOption.id}` 
        : `/api/products/${selectedProduct?.id}/options`
      const method = editingOption ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowOptionModal(false)
        setEditingOption(null)
        if (selectedProduct) handleSelectProduct(selectedProduct)
      } else {
        toast.error('저장 실패')
      }
    } catch (e) {
      console.error(e)
      toast.error('저장 중 오류 발생')
    }
  }

  // 순서 저장
  async function handleSaveOrder() {
    try {
      const res = await fetch('/api/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: productOrders }),
      })
      if (res.ok) {
        setOrderChanged(false)
        toast.success('순서가 저장되었습니다.')
      }
    } catch (e) {
      console.error(e)
      toast.error('순서 저장 실패')
    }
  }

  // 일괄 수정
  async function handleBulkEdit(formData: FormData) {
    const data = {
      ids: Array.from(selectedProductIds),
      isActive: formData.get('isActive') === '' ? undefined : formData.get('isActive') === 'true',
      optionType: formData.get('optionType') || undefined,
    }

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowBulkEditModal(false)
        setSelectedProductIds(new Set())
        if (selectedBrand) handleSelectBrand(selectedBrand)
        toast.success('일괄 수정 완료')
      }
    } catch (e) {
      console.error(e)
      toast.error('일괄 수정 실패')
    }
  }

  // 순서 변경
  function handleOrderChange(productId: number, newOrder: number) {
    setProductOrders(prev => ({ ...prev, [productId]: newOrder }))
    setOrderChanged(true)
  }

  // 필터링
  const filteredBrands = brands.filter(b => {
    if (brandSearch && !b.name.toLowerCase().includes(brandSearch.toLowerCase())) return false
    return true
  })

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.optionType !== categoryFilter) return false
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  const filteredOptions = options.filter(o => {
    if (optionSearch) {
      const q = optionSearch.toLowerCase()
      return o.sph.includes(q) || o.cyl.includes(q) || (o.barcode?.includes(q) ?? false)
    }
    return true
  })

  const optionTypes = [...new Set(products.map(p => p.optionType))]

  // 스타일
  const panelStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid var(--gray-200)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const panelHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--gray-50)',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--gray-200)',
    fontSize: 13,
    outline: 'none',
  }

  const listItemStyle = (selected: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: selected ? 'var(--primary-light)' : 'transparent',
    borderBottom: '1px solid var(--gray-100)',
    transition: 'background 0.15s',
  })

  const gridCellStyle: React.CSSProperties = {
    padding: '8px 8px',
    borderBottom: '1px solid var(--gray-100)',
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const gridHeaderStyle: React.CSSProperties = {
    ...gridCellStyle,
    background: 'var(--gray-50)',
    fontWeight: 600,
    color: 'var(--gray-600)',
    fontSize: 12,
    position: 'sticky',
    top: 0,
  }

  const actionBtnStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--gray-200)',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    color: 'var(--gray-700)',
  }

  const primaryBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      {/* Page Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>상품 관리</h1>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
            대분류 → 브랜드 → 품목 → 상품 → 도수옵션
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowBulkManageModal(true)}
            style={{ ...actionBtnStyle, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#f0f4f0', color: '#2d5a2d', border: '1px solid #c8d8c8' }}
          >
            ⚙️ 일괄 관리
          </button>
          <button
            onClick={() => setShowBarcodeModal(true)}
            style={{ ...actionBtnStyle, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            🔍 바코드 검색
          </button>
        </div>
      </div>

      {/* 4-Panel Layout: 대분류+브랜드 | 품목 | 상품 | 도수옵션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 200px 1fr 300px', gap: 12, height: 'calc(100vh - 180px)' }}>
        
        {/* Panel 1: 대분류 + 브랜드 */}
        <div style={panelStyle}>
          {/* 대분류 탭 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '8px 8px',
            borderBottom: '1px solid var(--gray-200)',
            background: 'var(--gray-50)'
          }}>
            {categories.map(cat => {
              const isActive = selectedCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  className="hover-actions"
                  onClick={() => handleSelectCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--primary)' : '#fff',
                    color: isActive ? '#fff' : 'var(--gray-700)',
                    border: isActive ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  {cat.name}
                  <span
                    className="hover-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newName = prompt('대분류명 수정', cat.name)
                      if (newName && newName !== cat.name) {
                        fetch(`/api/categories/${cat.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: newName })
                        }).then(async r => {
                          if (r.ok) {
                            toast.success('대분류명이 수정되었습니다.')
                            const res = await fetch('/api/categories')
                            const data = await res.json()
                            setCategories(data.categories || [])
                          } else {
                            const d = await r.json()
                            toast.error(d.error || '수정 실패')
                          }
                        })
                      }
                    }}
                    style={{ fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}
                    title="대분류 수정"
                  >✏️</span>
                </button>
              )
            })}
            <button
              onClick={() => {
                const name = prompt('새 대분류명을 입력하세요')
                if (name) {
                  const code = name.toUpperCase().replace(/\s+/g, '_').slice(0, 20)
                  fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, code, displayOrder: categories.length + 1 })
                  }).then(async r => {
                    if (r.ok) {
                      toast.success('대분류가 추가되었습니다.')
                      const res = await fetch('/api/categories')
                      const data = await res.json()
                      setCategories(data.categories || [])
                    } else {
                      const d = await r.json()
                      toast.error(d.error || '추가 실패')
                    }
                  })
                }
              }}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 500,
                background: 'transparent', color: 'var(--primary)',
                border: '1px dashed var(--gray-300)', borderRadius: 8,
                cursor: 'pointer', width: '100%',
              }}
            >+ 대분류</button>
          </div>
          <div style={panelHeaderStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-800)' }}>
              브랜드 {brands.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({brands.length})</span>}
            </div>
            <input
              type="text"
              placeholder="브랜드 검색..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={{ ...searchInputStyle, fontSize: 12, padding: '6px 10px' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading || brandLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>로딩 중...</div>
            ) : filteredBrands.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>브랜드 없음</div>
            ) : (
              filteredBrands.map(brand => (
                <div
                  key={brand.id}
                  className="hover-actions"
                  onClick={() => handleSelectBrand(brand)}
                  style={{
                    ...listItemStyle(selectedBrand?.id === brand.id),
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: selectedBrand?.id === brand.id ? 600 : 400, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {brand.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span
                        className="hover-btn"
                        onClick={(e) => { e.stopPropagation(); setEditingBrand(brand); setShowBrandModal(true) }}
                        style={{ fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}
                        title="브랜드 수정"
                      >✏️</span>
                      <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                        {brand._count?.productLines || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid var(--gray-200)' }}>
            <button 
              onClick={() => {
                if (!selectedCategory) { toast.error('먼저 대분류를 선택해주세요.'); return }
                setEditingBrand(null); setShowBrandModal(true)
              }}
              style={{ ...primaryBtnStyle, width: '100%', fontSize: 12, padding: '6px 12px' }}
            >
              + 브랜드
            </button>
          </div>
        </div>

        {/* Panel 2: 품목 목록 */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-800)' }}>
              품목 {productLines.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({productLines.length})</span>}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {productLineLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>로딩 중...</div>
            ) : !selectedBrand ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>브랜드를 선택하세요</div>
            ) : productLines.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>품목 없음</div>
            ) : (
              productLines.map(line => (
                <div
                  key={line.id}
                  className="hover-actions"
                  onClick={() => handleSelectProductLine(line)}
                  style={{
                    ...listItemStyle(selectedProductLine?.id === line.id),
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: selectedProductLine?.id === line.id ? 600 : 400, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {line.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span
                        className="hover-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          const newName = prompt('품목명 수정', line.name)
                          if (newName && newName !== line.name) {
                            fetch(`/api/product-lines/${line.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName })
                            }).then(r => {
                              if (r.ok) {
                                toast.success('품목명이 수정되었습니다.')
                                if (selectedBrand) handleSelectBrand(selectedBrand)
                              } else {
                                r.json().then(d => toast.error(d.error || '수정 실패'))
                              }
                            })
                          }
                        }}
                        style={{ fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}
                        title="품목 수정"
                      >✏️</span>
                      <span
                        className="hover-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          if ((line._count?.products || 0) > 0) {
                            toast.error(`이 품목에 ${line._count?.products}개의 상품이 있어 삭제할 수 없습니다.`)
                            return
                          }
                          if (confirm(`'${line.name}' 품목을 삭제하시겠습니까?`)) {
                            fetch(`/api/product-lines/${line.id}`, { method: 'DELETE' }).then(r => {
                              if (r.ok) {
                                toast.success('품목이 삭제되었습니다.')
                                if (selectedBrand) handleSelectBrand(selectedBrand)
                              } else {
                                r.json().then(d => toast.error(d.error || '삭제 실패'))
                              }
                            })
                          }
                        }}
                        style={{ fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}
                        title="품목 삭제"
                      >🗑️</span>
                      <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                        {line._count?.products || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid var(--gray-200)' }}>
            <button 
              onClick={() => {
                if (!selectedBrand) { toast.warning('브랜드를 먼저 선택하세요'); return }
                const name = prompt('품목명을 입력하세요')
                if (name) {
                  fetch('/api/product-lines', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ brandId: selectedBrand.id, name })
                  }).then(() => handleSelectBrand(selectedBrand))
                }
              }}
              disabled={!selectedBrand}
              style={{ ...primaryBtnStyle, width: '100%', fontSize: 12, padding: '6px 12px', opacity: selectedBrand ? 1 : 0.5 }}
            >
              + 품목
            </button>
          </div>
        </div>

        {/* Panel 3: 상품 목록 */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
                상품 {filteredProducts.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({filteredProducts.length})</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button 
                  onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
                  disabled={!selectedProductLine}
                  style={{ ...primaryBtnStyle, fontSize: 11, padding: '4px 10px', opacity: selectedProductLine ? 1 : 0.5 }}
                >
                  + 상품
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="상품명 검색..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ ...searchInputStyle, fontSize: 12, padding: '6px 10px' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            {productLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>로딩 중...</div>
            ) : !selectedProductLine ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>품목을 선택하세요</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>상품 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 32 }} />
                  <col style={{ width: 48 }} />
                  <col />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 56 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
                          } else {
                            setSelectedProductIds(new Set())
                          }
                        }}
                      />
                    </th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>수정</th>
                    <th style={{ ...gridHeaderStyle, padding: '8px 6px' }}>상품명</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>굴절률</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'right', padding: '8px 6px' }}>판매가</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      onClick={() => handleSelectProduct(product)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedProduct?.id === product.id ? 'var(--primary-light)' : undefined,
                      }}
                    >
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '8px 4px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedProductIds)
                            if (e.target.checked) {
                              newSet.add(product.id)
                            } else {
                              newSet.delete(product.id)
                            }
                            setSelectedProductIds(newSet)
                          }}
                        />
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '8px 4px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditProductModal(product)}
                          style={{ ...actionBtnStyle, padding: '2px 6px', fontSize: 11 }}
                        >
                          수정
                        </button>
                      </td>
                      <td style={{ ...gridCellStyle, fontWeight: 500, padding: '8px 6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</td>
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '8px 4px', fontFamily: 'monospace', fontSize: 12 }}>
                        {product.refractiveIndex || '-'}
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'right', fontWeight: 500, padding: '8px 6px', fontSize: 12 }}>
                        {product.sellingPrice.toLocaleString()}
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '8px 4px' }}>
                        <span style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 10,
                          background: product.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                          color: product.isActive ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {product.isActive ? '사용' : '미사용'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel 4: 옵션 목록 (도수/재고) */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
                도수옵션
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  disabled={!selectedProduct}
                  style={{ ...actionBtnStyle, opacity: selectedProduct ? 1 : 0.5 }}
                >
                  생성
                </button>
                <button 
                  onClick={() => setShowEditPriceModal(true)}
                  disabled={!selectedProduct || options.length === 0}
                  style={{ ...actionBtnStyle, opacity: selectedProduct && options.length > 0 ? 1 : 0.5 }}
                >
                  수정
                </button>
                <button 
                  onClick={() => { setEditingOption(null); setShowOptionModal(true) }}
                  disabled={!selectedProduct}
                  style={{ ...primaryBtnStyle, opacity: selectedProduct ? 1 : 0.5 }}
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="SPH, CYL, 바코드 검색..."
              value={optionSearch}
              onChange={(e) => setOptionSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {optionLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : !selectedProduct ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>상품을 선택하세요</div>
            ) : filteredOptions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                옵션 없음
                <br />
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  style={{ ...primaryBtnStyle, marginTop: 12 }}
                >
                  도수 자동생성
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 64 }} />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 40 }} />
                  <col style={{ width: 52 }} />
                  <col style={{ width: 40 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>SPH</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>CYL</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>재고</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>상태</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', padding: '8px 4px' }}>수정</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.map(option => (
                    <tr key={option.id}>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace', fontWeight: 500, textAlign: 'center', padding: '6px 4px', fontSize: 12 }}>{option.sph}</td>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace', textAlign: 'center', padding: '6px 4px', fontSize: 12 }}>{option.cyl}</td>
                      <td style={{
                        ...gridCellStyle,
                        textAlign: 'center',
                        padding: '6px 4px',
                        fontSize: 12,
                        color: option.stock === 0 ? 'var(--error)' : 'var(--gray-700)',
                        fontWeight: option.stock === 0 ? 600 : 400,
                      }}>
                        {option.stock}
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '6px 4px' }}>
                        <span style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 10,
                          background: option.status === '주문가능' ? 'var(--success-light)' : 'var(--gray-100)',
                          color: option.status === '주문가능' ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {option.status}
                        </span>
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center', padding: '6px 4px' }}>
                        <button
                          onClick={() => { setEditingOption(option); setShowOptionModal(true) }}
                          style={{ ...actionBtnStyle, padding: '2px 6px', fontSize: 11 }}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 바코드 검색 모달 */}
      {showBarcodeModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBarcodeModal(false)}>
          <div style={{ ...modalStyle, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>바코드 검색</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="바코드를 입력하세요"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                style={inputStyle}
                autoFocus
              />
              <button onClick={handleBarcodeSearch} style={primaryBtnStyle}>검색</button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 추가/수정 모달 */}
      {showProductModal && (
        <div style={modalOverlayStyle} onClick={() => setShowProductModal(false)}>
          <div style={{ ...modalStyle, width: 900, maxHeight: '95vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {editingProduct ? '상품 수정' : '상품 추가'}
              </h3>
              {editingProduct && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('이 상품을 복사하시겠습니까?')) {
                        setEditingProduct({ ...editingProduct, id: 0, name: editingProduct.name + ' (복사)' } as Product)
                      }
                    }}
                    style={{ ...actionBtnStyle, fontSize: 12 }}
                  >
                    📋 복사
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('정말 이 상품을 삭제하시겠습니까?\n연결된 옵션(도수)도 함께 삭제됩니다.')) {
                        try {
                          const res = await fetch(`/api/products/${editingProduct.id}`, { method: 'DELETE' })
                          if (res.ok) {
                            setShowProductModal(false)
                            setEditingProduct(null)
                            if (selectedBrand) handleSelectBrand(selectedBrand)
                            toast.success('삭제되었습니다.')
                          } else {
                            toast.error('삭제 실패')
                          }
                        } catch (e) {
                          console.error(e)
                          toast.error('삭제 중 오류 발생')
                        }
                      }
                    }}
                    style={{ ...actionBtnStyle, fontSize: 12, color: 'var(--error)', borderColor: 'var(--error)' }}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* 왼쪽 컬럼: 기본 정보 */}
                <div style={{ display: 'grid', gap: 14 }}>
                  {/* 상품 코드 (수정시에만 표시) */}
                  {editingProduct && (
                    <div style={{
                      padding: '8px 14px',
                      background: 'var(--gray-50)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>상품코드</span>
                      <code style={{
                        fontSize: 13,
                        fontFamily: 'monospace',
                        color: 'var(--gray-700)',
                        background: '#fff',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {editingProduct.code || `P${String(editingProduct.id).padStart(5, '0')}`}
                      </code>
                    </div>
                  )}

                  {/* 📂 소속 변경 (수정 모드에서만 표시) */}
                  {editingProduct && (
                    <div style={{
                      padding: '10px 14px',
                      background: '#fff8f0',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#c2410c', marginBottom: 8 }}>
                        📂 소속 변경
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ ...labelStyle, fontSize: 11 }}>브랜드</label>
                          <select
                            value={editModalBrandId ?? ''}
                            onChange={async (e) => {
                              const newBrandId = parseInt(e.target.value)
                              setEditModalBrandId(newBrandId)
                              setEditModalProductLineId(null)
                              try {
                                const plRes = await fetch(`/api/product-lines?brandId=${newBrandId}`)
                                const plData = await plRes.json()
                                setEditModalProductLines(plData.productLines || [])
                              } catch (err) {
                                console.error('품목 로드 실패:', err)
                                setEditModalProductLines([])
                              }
                            }}
                            style={{ ...inputStyle, fontSize: 12, padding: '6px 10px' }}
                          >
                            <option value="">브랜드 선택</option>
                            {editModalBrands.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: 11 }}>품목</label>
                          <select
                            value={editModalProductLineId ?? ''}
                            onChange={(e) => setEditModalProductLineId(parseInt(e.target.value))}
                            style={{ ...inputStyle, fontSize: 12, padding: '6px 10px' }}
                          >
                            <option value="">품목 선택</option>
                            {editModalProductLines.map(pl => (
                              <option key={pl.id} value={pl.id}>{pl.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>상품명 *</label>
                    <input
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      style={inputStyle}
                      placeholder="예: 블루라이트 차단 렌즈 1.60"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>옵션타입 *</label>
                      <select name="optionType" defaultValue={editingProduct?.optionType || '안경렌즈 RX'} required style={inputStyle}>
                        <option value="안경렌즈 RX">안경렌즈 RX</option>
                        <option value="안경렌즈 여벌">안경렌즈 여벌</option>
                        <option value="콘택트렌즈">콘택트렌즈</option>
                        <option value="안경테">안경테</option>
                        <option value="선글라스">선글라스</option>
                        <option value="소모품">소모품</option>
                        <option value="액세서리">액세서리</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>상품분류</label>
                      <select name="productType" defaultValue={editingProduct?.productType || ''} style={inputStyle}>
                        <option value="">선택 안함</option>
                        <option value="단초점">단초점</option>
                        <option value="다초점">다초점</option>
                        <option value="누진다초점">누진다초점</option>
                        <option value="실내용">실내용</option>
                        <option value="스포츠">스포츠</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>굴절률</label>
                      <select name="refractiveIndex" defaultValue={editingProduct?.refractiveIndex || ''} style={inputStyle}>
                        <option value="">선택</option>
                        <option value="1.50">1.50 (표준)</option>
                        <option value="1.56">1.56</option>
                        <option value="1.60">1.60 (중도수)</option>
                        <option value="1.67">1.67 (고도수)</option>
                        <option value="1.74">1.74 (초고도수)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>묶음상품명</label>
                      <input
                        name="bundleName"
                        defaultValue={editingProduct?.bundleName || ''}
                        style={inputStyle}
                        placeholder="묶음 표시명"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>상태</label>
                      <select name="isActive" defaultValue={editingProduct?.isActive !== false ? 'true' : 'false'} style={inputStyle}>
                        <option value="true">사용</option>
                        <option value="false">미사용</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>표시 순서</label>
                      <input
                        name="displayOrder"
                        type="number"
                        defaultValue={editingProduct?.displayOrder || 0}
                        style={inputStyle}
                        placeholder="숫자가 작을수록 먼저 표시"
                      />
                    </div>
                  </div>
                </div>

                {/* 오른쪽 컬럼: 가격 + 이미지 + 도수 */}
                <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
                  {/* 가격 섹션 */}
                  <div style={{
                    padding: 14,
                    background: 'var(--gray-50)',
                    borderRadius: 10,
                    border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--gray-700)' }}>
                      💰 가격 설정
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>판매가</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            name="sellingPrice"
                            type="number"
                            defaultValue={editingProduct?.sellingPrice || 0}
                            style={{ ...inputStyle, paddingRight: 30 }}
                          />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--gray-400)' }}>원</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>매입가</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            name="purchasePrice"
                            type="number"
                            defaultValue={editingProduct?.purchasePrice || 0}
                            style={{ ...inputStyle, paddingRight: 30 }}
                          />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--gray-400)' }}>원</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid var(--gray-200)', fontSize: 13, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                      마진율: {editingProduct?.sellingPrice && editingProduct?.purchasePrice
                        ? `${Math.round((1 - editingProduct.purchasePrice / editingProduct.sellingPrice) * 100)}%`
                        : '-'
                      }
                    </div>
                  </div>

                  {/* 상품 이미지 (수정 모드에서만) */}
                  {editingProduct && (
                    <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 8 }}>상품 이미지</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {editingProduct.imageUrl ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={editingProduct.imageUrl}
                              alt={editingProduct.name}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--gray-200)' }}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('이미지를 삭제하시겠습니까?')) return
                                try {
                                  const res = await fetch(`/api/products/${editingProduct.id}/image`, { method: 'DELETE' })
                                  if (res.ok) {
                                    setEditingProduct({ ...editingProduct, imageUrl: null })
                                    toast.success('이미지 삭제됨')
                                  }
                                } catch (e) {
                                  console.error(e)
                                  toast.error('이미지 삭제 실패')
                                }
                              }}
                              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ff3b30', color: 'white', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >×</button>
                          </div>
                        ) : (
                          <div style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 11 }}>
                            No Image
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            id="product-image-upload"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const formData = new FormData()
                              formData.append('image', file)
                              try {
                                const res = await fetch(`/api/products/${editingProduct.id}/image`, { method: 'POST', body: formData })
                                const data = await res.json()
                                if (res.ok && data.imageUrl) {
                                  setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl })
                                  toast.success('이미지 업로드 완료')
                                } else {
                                  toast.error(data.error || '업로드 실패')
                                }
                              } catch (err) {
                                console.error(err)
                                toast.error('이미지 업로드 실패')
                              }
                              e.target.value = ''
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('product-image-upload')?.click()}
                            style={{ ...actionBtnStyle, fontSize: 12 }}
                          >
                            {editingProduct.imageUrl ? '변경' : '업로드'}
                          </button>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>JPG, PNG</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 도수 옵션 함께 생성 (신규 등록시에만) */}
                  {!editingProduct && (
                    <div style={{
                      padding: 14,
                      background: generateWithProduct ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'var(--gray-50)',
                      borderRadius: 10,
                      border: generateWithProduct ? '1px solid #81c784' : '1px solid var(--gray-200)'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={generateWithProduct}
                          onChange={(e) => setGenerateWithProduct(e.target.checked)}
                          style={{ width: 18, height: 18 }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                          📋 도수 옵션 함께 생성 (여벌용)
                        </span>
                      </label>

                      {generateWithProduct && (
                        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH 최소</label>
                              <input
                                type="number" step="0.25" value={diopterRange.sphMin}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, sphMin: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH 최대</label>
                              <input
                                type="number" step="0.25" value={diopterRange.sphMax}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, sphMax: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH 단위</label>
                              <select
                                value={diopterRange.sphStep}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, sphStep: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              >
                                <option value={0.25}>0.25</option>
                                <option value={0.5}>0.50</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL 최소</label>
                              <input
                                type="number" step="0.25" value={diopterRange.cylMin}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, cylMin: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL 최대</label>
                              <input
                                type="number" step="0.25" value={diopterRange.cylMax}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, cylMax: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL 단위</label>
                              <select
                                value={diopterRange.cylStep}
                                onChange={(e) => setDiopterRange(prev => ({ ...prev, cylStep: parseFloat(e.target.value) }))}
                                style={{ ...inputStyle, padding: '5px 6px', fontSize: 12 }}
                              >
                                <option value={0.25}>0.25</option>
                                <option value={0.5}>0.50</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-600)', background: '#fff', padding: 6, borderRadius: 6 }}>
                            📊 생성될 옵션: 약 {Math.ceil((diopterRange.sphMax - diopterRange.sphMin) / diopterRange.sphStep + 1) * Math.ceil((diopterRange.cylMax - diopterRange.cylMin) / diopterRange.cylStep + 1)}개
                            <br />
                            SPH: {diopterRange.sphMin} ~ {diopterRange.sphMax > 0 ? '+' : ''}{diopterRange.sphMax} | CYL: {diopterRange.cylMin} ~ {diopterRange.cylMax}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 도수 옵션 요약 (수정시에만) */}
                  {editingProduct && options.length > 0 && (
                    <div style={{
                      padding: 14,
                      background: 'linear-gradient(135deg, #eef4ee 0%, #f3e5f5 100%)',
                      borderRadius: 10,
                      border: '1px solid #e1bee7'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                            📋 등록된 도수: {options.length}개
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                            SPH: {options.length > 0 ? `${Math.min(...options.map(o => parseFloat(o.sph.replace('+', ''))))} ~ ${Math.max(...options.map(o => parseFloat(o.sph.replace('+', ''))))}` : '-'}
                            {' | '}
                            CYL: {options.length > 0 ? `${Math.min(...options.map(o => parseFloat(o.cyl.replace('+', ''))))} ~ ${Math.max(...options.map(o => parseFloat(o.cyl.replace('+', ''))))}` : '-'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingProduct) {
                              handleSelectProduct(editingProduct)
                            }
                            setShowProductModal(false)
                            if (options.length > 0) {
                              setShowEditPriceModal(true)
                            } else {
                              setShowGenerateModal(true)
                            }
                          }}
                          style={{ ...actionBtnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}
                        >
                          도수 관리 →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--gray-200)' }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={{ ...primaryBtnStyle, padding: '10px 24px' }}>
                  {editingProduct ? '저장' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 옵션 추가/수정 모달 */}
      {showOptionModal && (
        <div style={modalOverlayStyle} onClick={() => setShowOptionModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editingOption ? '옵션 수정' : '옵션 추가'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveOption(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>SPH *</label>
                    <input name="sph" defaultValue={editingOption?.sph || '0.00'} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>CYL *</label>
                    <input name="cyl" defaultValue={editingOption?.cyl || '0.00'} required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>바코드</label>
                  <input name="barcode" defaultValue={editingOption?.barcode || ''} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>재고</label>
                    <input name="stock" type="number" defaultValue={editingOption?.stock || 0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>재고 위치</label>
                    <input name="location" defaultValue={editingOption?.stockLocation || ''} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>가격 조정 (추가금)</label>
                  <input name="priceAdjustment" type="number" defaultValue={editingOption?.priceAdjustment || 0} style={inputStyle} placeholder="예: 고도수 +5000" />
                </div>
                <div>
                  <label style={labelStyle}>메모</label>
                  <input name="memo" defaultValue={editingOption?.memo || ''} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>상태</label>
                  <select name="isActive" defaultValue={editingOption?.status === '주문가능' ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">주문가능</option>
                    <option value="false">품절</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowOptionModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 일괄 수정 모달 */}
      {showBulkEditModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBulkEditModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              일괄 수정 ({selectedProductIds.size}개 선택)
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleBulkEdit(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>상태 변경</label>
                  <select name="isActive" defaultValue="" style={inputStyle}>
                    <option value="">변경 안함</option>
                    <option value="true">사용</option>
                    <option value="false">미사용</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>옵션타입 변경</label>
                  <select name="optionType" defaultValue="" style={inputStyle}>
                    <option value="">변경 안함</option>
                    <option value="안경렌즈 RX">안경렌즈 RX</option>
                    <option value="안경렌즈 여벌">안경렌즈 여벌</option>
                    <option value="콘택트렌즈">콘택트렌즈</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowBulkEditModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={primaryBtnStyle}>적용</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 도수 생성 모달 (매트릭스 스타일) */}
      {showGenerateModal && (
        <GenerateOptionsModal
          productName={selectedProduct?.name || ''}
          existingOptions={options}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={async (optionsToCreate) => {
            try {
              console.log('=== onGenerate 호출됨 ===')
              console.log('selectedProduct:', selectedProduct)
              console.log('selectedProduct.id:', selectedProduct?.id)
              console.log('옵션 개수:', optionsToCreate.length)
              console.log('옵션 데이터:', optionsToCreate)
              
              if (!selectedProduct?.id) {
                console.error('selectedProduct.id가 없음!')
                toast.error('상품이 선택되지 않았습니다.')
                return
              }
              
              const url = `/api/products/${selectedProduct.id}/options/bulk`
              console.log('API URL:', url)
              
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: optionsToCreate }),
              })
              const data = await res.json()
              console.log('응답:', data)
              if (res.ok && data.success !== false) {
                setShowGenerateModal(false)
                if (selectedProduct) handleSelectProduct(selectedProduct)
                const result = data.data || data
                toast.success(`${result.created || 0}개 생성, ${result.updated || 0}개 수정`)
              } else {
                toast.error(data.error || '도수 생성 실패')
              }
            } catch (e) {
              console.error('도수 생성 에러:', e)
              toast.error('도수 생성 실패')
            }
          }}
        />
      )}

      {/* 도수 수정 모달 (매트릭스 스타일) */}
      {showEditPriceModal && (
        <GenerateOptionsModal
          productName={selectedProduct?.name || ''}
          productId={selectedProduct?.id}
          existingOptions={options}
          mode="edit"
          onClose={() => setShowEditPriceModal(false)}
          onGenerate={() => {}}
          onSaveComplete={() => {
            if (selectedProduct) handleSelectProduct(selectedProduct)
          }}
        />
      )}

      {/* 브랜드 추가/수정 모달 */}
      {showBrandModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBrandModal(false)}>
          <div style={{ ...modalStyle, width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {editingBrand ? '브랜드 수정' : '브랜드 추가'}
                </h3>
                {!editingBrand && selectedCategory && (
                  <div style={{ fontSize: 12, color: '#007aff', marginTop: 4 }}>
                    대분류: {selectedCategory.name}
                  </div>
                )}
              </div>
              {editingBrand && (
                <button
                  type="button"
                  onClick={async () => {
                    if (editingBrand._count?.products && editingBrand._count.products > 0) {
                      toast.error(`이 브랜드에 ${editingBrand._count.products}개의 상품이 있어 삭제할 수 없습니다.\n먼저 상품을 이동하거나 삭제해주세요.`)
                      return
                    }
                    if (confirm('정말 이 브랜드를 삭제하시겠습니까?')) {
                      try {
                        const res = await fetch(`/api/brands/${editingBrand.id}`, { method: 'DELETE' })
                        if (res.ok) {
                          setShowBrandModal(false)
                          setEditingBrand(null)
                          setSelectedBrand(null)
                          if (selectedCategory) handleSelectCategory(selectedCategory)
                          toast.success('브랜드가 삭제되었습니다.')
                        } else {
                          const err = await res.json()
                          toast.error(err.error || '삭제 실패')
                        }
                      } catch (e) {
                        console.error(e)
                        toast.error('삭제 중 오류 발생')
                      }
                    }
                  }}
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid var(--error)', 
                    background: 'transparent', 
                    color: 'var(--error)', 
                    borderRadius: 6, 
                    fontSize: 12, 
                    cursor: 'pointer' 
                  }}
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveBrand(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>브랜드명 *</label>
                  <input 
                    name="name" 
                    defaultValue={editingBrand?.name} 
                    required 
                    style={inputStyle}
                    placeholder="예: HOYA, ZEISS, 니콘"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>재고관리 방식</label>
                  <select name="stockManage" defaultValue={editingBrand?.stockManage || ''} style={inputStyle}>
                    <option value="">기본 (개별 관리)</option>
                    <option value="shared">공유 재고</option>
                    <option value="none">재고 관리 안함</option>
                  </select>
                  <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                    공유 재고: 같은 도수의 상품들이 재고를 공유합니다
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>상태</label>
                  <select name="isActive" defaultValue={editingBrand?.isActive !== false ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">✅ 활성</option>
                    <option value="false">⛔ 비활성 (목록에서 숨김)</option>
                  </select>
                </div>
                {editingBrand && (
                  <div style={{ 
                    padding: 12, 
                    background: 'var(--gray-50)', 
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--gray-600)'
                  }}>
                    <div>📦 등록된 상품: <strong>{editingBrand._count?.products || 0}</strong>개</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <button type="button" onClick={() => setShowBrandModal(false)} style={actionBtnStyle}>취소</button>
                <button type="submit" style={{ ...primaryBtnStyle, padding: '10px 24px' }}>
                  {editingBrand ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 일괄 관리 모달 */}
      <BulkManageModal
        isOpen={showBulkManageModal}
        onClose={() => setShowBulkManageModal(false)}
        onComplete={() => { if (selectedCategory) handleSelectCategory(selectedCategory) }}
        toast={toast}
        categoryId={selectedCategory?.id || null}
      />
    </Layout>
  )
}
