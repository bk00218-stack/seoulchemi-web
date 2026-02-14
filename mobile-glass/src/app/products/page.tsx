'use client'

import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'

const SIDEBAR = [
  {
    title: '?ÅÌíàÍ¥ÄÎ¶?,
    items: [
      { label: '?ÅÌíà Í¥ÄÎ¶?, href: '/products' },
      { label: '?¨Î≤å ?ºÍ¥Ñ?±Î°ù', href: '/products/bulk-spare' },
      { label: 'RX?ÅÌíà Í¥ÄÎ¶?, href: '/products/rx' },
      { label: 'Î¨∂Ïùå?ÅÌíà ?§Ï†ï', href: '/products/bundles' },
      { label: '?ÅÌíà ?®Ï∂ïÏΩîÎìú ?§Ï†ï', href: '/products/shortcuts' },
    ]
  },
  {
    title: '?¨Í≥†Í¥ÄÎ¶?,
    items: [
      { label: '?ºÍ¥Ñ?¨Í≥†?òÏ†ï', href: '/products/stock/bulk' },
      { label: '?ÅÏ†ï?¨Í≥† ?§Ï†ï', href: '/products/stock/optimal' },
    ]
  }
]

// ?ÄÎ∂ÑÎ•ò
interface MainCategory {
  id: number
  code: string
  name: string
  isActive: boolean
  _count?: { brands: number }
}

// Î∏åÎûú??
interface Brand {
  id: number
  categoryId: number | null
  name: string
  stockManage: string | null
  isActive: boolean
  _count?: { products: number; productLines: number }
  productLines?: ProductLine[]
}

// ?àÎ™©
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

// Î™®Îã¨ ?§Ì???
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
  background: 'var(--bg-primary)',
  borderRadius: 16,
  padding: 24,
  width: 500,
  maxHeight: '85vh',
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
  color: 'var(--text-primary)',
}

// Îß§Ìä∏Î¶?ä§ ?ÑÏàò ?ùÏÑ±/?òÏ†ï Î™®Îã¨ Ïª¥Ìè¨?åÌä∏
function GenerateOptionsModal({
  productName,
  existingOptions,
  onClose,
  onGenerate,
  onUpdate,
  mode = 'create',
}: {
  productName: string
  existingOptions: ProductOption[]
  onClose: () => void
  onGenerate: (options: { sph: string; cyl: string; priceAdjustment: number }[]) => void
  onUpdate?: (updates: { id: number; priceAdjustment: number }[]) => void
  mode?: 'create' | 'edit'
}) {
  // ?? Í∑ºÎÇú??-/-), ?êÎÇú??+/-)
  const [activeTab, setActiveTab] = useState<'minus' | 'plus'>('minus')
  
  // ?†ÌÉù???Ä?§Í≥º Í∞ÄÍ≤?Ï°∞Ï†ï (Map?ºÎ°ú Í¥ÄÎ¶? "sph,cyl" -> priceAdjustment)
  // ?òÏ†ï Î™®Îìú?êÏÑú??Í∏∞Ï°¥ ?µÏÖò???¨Ìï®
  const [selectedCells, setSelectedCells] = useState<Map<string, number>>(() => {
    if (mode === 'edit') {
      // ?òÏ†ï Î™®Îìú: Í∏∞Ï°¥ ?µÏÖò?§ÏùÑ ?†ÌÉù???ÅÌÉúÎ°?Ï¥àÍ∏∞??
      return new Map(existingOptions.map(o => [`${o.sph},${o.cyl}`, o.priceAdjustment || 0]))
    }
    return new Map()
  })
  
  // ?úÎûòÍ∑??†ÌÉù
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  
  // Í∞ÄÍ≤?Ï°∞Ï†ï Í∑úÏπô (CYL Í∏∞Ï?)
  const [priceRules, setPriceRules] = useState([
    { cylFrom: -2.00, cylTo: -4.00, adjustment: 5000 },
  ])
  const [showRulePanel, setShowRulePanel] = useState(false)
  const [bulkPrice, setBulkPrice] = useState(0)

  // Í∏∞Ï°¥ ?µÏÖò?§ÏùÑ Map?ºÎ°ú (id?Ä Í∞ÄÍ≤©Ï°∞???¨Ìï®)
  const existingMap = new Map(existingOptions.map(o => [`${o.sph},${o.cyl}`, { id: o.id, priceAdjustment: o.priceAdjustment || 0 }]))

  // SPH/CYL Í∞??ùÏÑ±
  const formatValue = (v: number) => {
    const rounded = Math.round(v * 100) / 100
    if (rounded === 0) return '0.00'
    return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
  }
  
  const parseValue = (s: string): number => {
    return parseFloat(s.replace('+', ''))
  }

  // CYL?Ä ??ÉÅ ÎßàÏù¥?àÏä§ (0.00 ~ -4.00)
  const cylValues: number[] = []
  for (let c = 0; c >= -4; c -= 0.25) {
    cylValues.push(c)
  }

  // SPH????óê ?∞Îùº ?§Î¶Ñ
  const sphValues: number[] = []
  if (activeTab === 'minus') {
    // Í∑ºÎÇú?? 0.00 ~ -8.00
    for (let s = 0; s >= -8; s -= 0.25) {
      sphValues.push(s)
    }
  } else {
    // ?êÎÇú?? +0.25 ~ +6.00
    for (let s = 0.25; s <= 6; s += 0.25) {
      sphValues.push(s)
    }
  }
  
  // Í∞ÄÍ≤?Í∑úÏπô???∞Î•∏ Ï°∞Ï†ïÍ∞?Í≥ÑÏÇ∞ (CYL Í∏∞Ï?)
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
    
    // ?ùÏÑ± Î™®Îìú?êÏÑú??Í∏∞Ï°¥ ?µÏÖò ?†ÌÉù Î∂àÍ?
    if (mode === 'create' && isExisting) return
    
    setSelectedCells(prev => {
      const newMap = new Map(prev)
      if (newMap.has(key)) {
        // ?òÏ†ï Î™®Îìú?êÏÑú Í∏∞Ï°¥ ?µÏÖò?Ä ?†ÌÉù ?¥Ï†ú Î∂àÍ? (??†ú Î∞©Ï?)
        if (mode === 'edit' && isExisting) return prev
        newMap.delete(key)
      } else {
        newMap.set(key, getPriceByRules(cyl))
      }
      return newMap
    })
  }

  const handleMouseDown = (sph: number, cyl: number) => {
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    
    // ?ùÏÑ± Î™®Îìú?êÏÑú??Í∏∞Ï°¥ ?µÏÖò ?úÎûòÍ∑?Î∂àÍ?
    if (mode === 'create' && isExisting) return
    
    setIsDragging(true)
    setDragMode(selectedCells.has(key) ? 'deselect' : 'select')
    toggleCell(sph, cyl)
  }

  const handleMouseEnter = (sph: number, cyl: number) => {
    if (!isDragging) return
    const key = `${formatValue(sph)},${formatValue(cyl)}`
    const isExisting = existingMap.has(key)
    
    // ?ùÏÑ± Î™®Îìú?êÏÑú??Í∏∞Ï°¥ ?µÏÖò ?úÎûòÍ∑?Î∂àÍ?
    if (mode === 'create' && isExisting) return
    
    setSelectedCells(prev => {
      const newMap = new Map(prev)
      if (dragMode === 'select') {
        newMap.set(key, getPriceByRules(cyl))
      } else {
        // ?òÏ†ï Î™®Îìú?êÏÑú Í∏∞Ï°¥ ?µÏÖò?Ä ?úÎûòÍ∑??¥Ï†ú Î∂àÍ?
        if (mode === 'edit' && isExisting) return prev
        newMap.delete(key)
      }
      return newMap
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSelectAll = () => {
    const newMap = new Map(selectedCells)
    sphValues.forEach(sph => {
      cylValues.forEach(cyl => {
        const key = `${formatValue(sph)},${formatValue(cyl)}`
        if (!existingMap.has(key)) {
          newMap.set(key, getPriceByRules(cyl))
        }
      })
    })
    setSelectedCells(newMap)
  }

  const handleClearAll = () => {
    // ?ÑÏû¨ ??ùò ?†ÌÉùÎß??¥Ï†ú
    const newMap = new Map(selectedCells)
    sphValues.forEach(sph => {
      cylValues.forEach(cyl => {
        const key = `${formatValue(sph)},${formatValue(cyl)}`
        newMap.delete(key)
      })
    })
    setSelectedCells(newMap)
  }
  
  // ?†ÌÉù???Ä?§Ïóê ?ºÍ¥Ñ Í∞ÄÍ≤??ÅÏö©
  const handleApplyBulkPrice = () => {
    const newMap = new Map(selectedCells)
    for (const key of newMap.keys()) {
      newMap.set(key, bulkPrice)
    }
    setSelectedCells(newMap)
  }
  
  // Í∑úÏπô ?¨Ï†Å??(?†ÌÉù???Ä?êÎßå ?ÅÏö©)
  const handleApplyRules = () => {
    const newMap = new Map(selectedCells)
    for (const key of newMap.keys()) {
      const [, cylStr] = key.split(',')
      const cyl = parseValue(cylStr)
      newMap.set(key, getPriceByRules(cyl))
    }
    setSelectedCells(newMap)
  }

  const handleGenerate = () => {
    if (mode === 'edit' && onUpdate) {
      // ?òÏ†ï Î™®Îìú: Í∏∞Ï°¥ ?µÏÖò??Í∞ÄÍ≤?Î≥ÄÍ≤??¨Ìï≠Îß??ÑÏÜ°
      const updates: { id: number; priceAdjustment: number }[] = []
      selectedCells.forEach((newPrice, key) => {
        const existing = existingMap.get(key)
        if (existing && existing.priceAdjustment !== newPrice) {
          updates.push({ id: existing.id, priceAdjustment: newPrice })
        }
      })
      
      // ?àÎ°ú Ï∂îÍ????µÏÖò??
      const newOptions: { sph: string; cyl: string; priceAdjustment: number }[] = []
      selectedCells.forEach((priceAdjustment, key) => {
        if (!existingMap.has(key)) {
          const [sph, cyl] = key.split(',')
          newOptions.push({ sph, cyl, priceAdjustment })
        }
      })
      
      if (updates.length > 0) {
        onUpdate(updates)
      }
      if (newOptions.length > 0) {
        onGenerate(newOptions)
      }
      if (updates.length === 0 && newOptions.length === 0) {
        alert('Î≥ÄÍ≤ΩÎêú ?¥Ïö©???ÜÏäµ?àÎã§.')
      }
    } else {
      // ?ùÏÑ± Î™®Îìú: ?àÎ°ú???µÏÖòÎß??ùÏÑ±
      const options = Array.from(selectedCells.entries()).map(([key, priceAdjustment]) => {
        const [sph, cyl] = key.split(',')
        return { sph, cyl, priceAdjustment }
      })
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
    const priceAdj = selectedCells.get(key) || 0
    const originalPrice = existingMap.get(key)?.priceAdjustment || 0
    const isModified = isExisting && priceAdj !== originalPrice
    
    let background = '#fff'
    let cursor = 'pointer'
    
    if (mode === 'create') {
      // ?ùÏÑ± Î™®Îìú: Í∏∞Ï°¥ ?µÏÖò?Ä ?åÏÉâ, ?†ÌÉùÎ∂àÍ?
      if (isExisting) {
        background = 'var(--gray-300)'
        cursor = 'not-allowed'
      } else if (isSelected) {
        background = priceAdj > 0 ? '#ff6b6b' : 'var(--primary)'
      }
    } else {
      // ?òÏ†ï Î™®Îìú: Í∏∞Ï°¥ ?µÏÖò???†ÌÉù Í∞Ä??
      if (isSelected) {
        if (isModified) {
          background = '#ffeb3b'  // ?òÏ†ï?? ?∏Î???
        } else if (priceAdj > 0) {
          background = '#ff6b6b'  // Ï∂îÍ?Í∏??àÏùå
        } else if (isExisting) {
          background = '#81c784'  // Í∏∞Ï°¥ ?µÏÖò (Í∏∞Î≥∏Í∞Ä)
        } else {
          background = 'var(--primary)'  // ?àÎ°ú Ï∂îÍ?
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
  
  // ?†ÌÉù???Ä?§Ïùò Í∞ÄÍ≤?Ï°∞Ï†ï ?îÏïΩ
  const priceSummary = () => {
    const summary = new Map<number, number>()
    for (const price of selectedCells.values()) {
      summary.set(price, (summary.get(price) || 0) + 1)
    }
    return Array.from(summary.entries()).sort((a, b) => a[0] - b[0])
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
      onMouseUp={handleMouseUp}
    >
      <div 
        style={{
          background: 'var(--bg-primary)',
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
        {/* ?§Îçî */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {mode === 'edit' ? '?ÑÏàò???òÏ†ï' : '?ÑÏàò ?ùÏÑ± Î∞?Í∞ÄÍ≤??§Ï†ï'}
            </h3>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}
            >
              √ó
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
            {productName} {mode === 'edit' && `(${existingOptions.length}Í∞??ÑÏàò)`}
          </div>
        </div>

        {/* ??+ Í∞ÄÍ≤©ÏÑ§??*/}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            <button style={tabStyle(activeTab === 'minus')} onClick={() => setActiveTab('minus')}>
              Í∑ºÎÇú??(-/-)
            </button>
            <button style={tabStyle(activeTab === 'plus')} onClick={() => setActiveTab('plus')}>
              ?êÎÇú??(+/-)
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
              ?ôÔ∏è Í∞ÄÍ≤?Í∑úÏπô
            </button>
          </div>
        </div>
        
        {/* Í∞ÄÍ≤?Í∑úÏπô ?®ÎÑê */}
        {showRulePanel && (
          <div style={{ padding: 16, background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>
              ?ìå Í∞ÄÍ≤?Ï°∞Ï†ï Í∑úÏπô (CYL ?úÏãú Í≥†ÎèÑ??Ï∂îÍ?Í∏?
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
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>??+</span>
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
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>??/span>
                  <button
                    onClick={() => setPriceRules(priceRules.filter((_, i) => i !== idx))}
                    style={{ padding: '2px 6px', border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer' }}
                  >
                    √ó
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
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                + Í∑úÏπô Ï∂îÍ?
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
                ?†ÌÉù??{selectedCells.size}Í∞úÏóê Í∑úÏπô ?ÅÏö©
              </button>
              <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                (CYL Î≤îÏúÑ???¥Îãπ?òÎäî ?ÄÎß?Ï∂îÍ?Í∏??ÅÏö©)
              </span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>
                ?í∞ ?ºÍ¥Ñ Í∞ÄÍ≤??§Ï†ï
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  step="1000"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(parseInt(e.target.value) || 0)}
                  placeholder="Í∞ÄÍ≤?Ï°∞Ï†ï??
                  style={{ width: 100, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                />
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>??/span>
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
                  ?†ÌÉù??{selectedCells.size}Í∞úÏóê ?ÅÏö©
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Îß§Ìä∏Î¶?ä§ */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ marginBottom: 8, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {mode === 'edit' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#81c784', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>Í∏∞Ï°¥ (Í∏∞Î≥∏Í∞Ä)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ff6b6b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>Í∏∞Ï°¥ (Ï∂îÍ?Í∏?</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ffeb3b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>?òÏ†ï??/span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--primary)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>?àÎ°ú Ï∂îÍ?</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--primary)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>Í∏∞Î≥∏Í∞Ä</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: '#ff6b6b', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>Ï∂îÍ?Í∏??àÏùå</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, background: 'var(--gray-300)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>Í∏∞Ï°¥ ?µÏÖò</span>
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
                  background: 'var(--bg-primary)',
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
                    background: 'var(--bg-primary)',
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
                    background: 'var(--bg-primary)',
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
                        ? `+${selectedCells.get(`${formatValue(sph)},${formatValue(cyl)}`)?.toLocaleString()}?? 
                        : ''}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ?∏ÌÑ∞ */}
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
                background: 'var(--bg-primary)',
                cursor: 'pointer',
              }}
            >
              ?ÑÏ≤¥?†ÌÉù
            </button>
            <button 
              onClick={handleClearAll}
              style={{ 
                padding: '6px 12px', 
                fontSize: 12, 
                border: '1px solid var(--gray-300)', 
                borderRadius: 6, 
                background: 'var(--bg-primary)',
                cursor: 'pointer',
              }}
            >
              ?†ÌÉù?¥Ï†ú
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
              {priceSummary().map(([price, count], idx) => (
                <span key={price} style={{ marginRight: 8 }}>
                  {price > 0 ? `+${price.toLocaleString()}?? : 'Í∏∞Î≥∏Í∞Ä'}: {count}Í∞?
                  {idx < priceSummary().length - 1 && ' | '}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>
              {mode === 'edit' ? (
                <>Í∏∞Ï°¥ <strong style={{ color: '#81c784' }}>{existingOptions.length}</strong>Í∞?/>
              ) : (
                <>Ï¥?<strong style={{ color: 'var(--primary)' }}>{selectedCells.size}</strong>Í∞??†ÌÉù</>
              )}
            </span>
            <button
              onClick={handleGenerate}
              disabled={mode === 'create' && selectedCells.size === 0}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: (mode === 'edit' || selectedCells.size > 0) ? 'var(--primary)' : 'var(--gray-300)',
                color: '#fff',
                cursor: (mode === 'edit' || selectedCells.size > 0) ? 'pointer' : 'not-allowed',
              }}
            >
              {mode === 'edit' ? '?Ä?•ÌïòÍ∏? : '?ùÏÑ±?òÍ∏∞'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ?ÑÏàò Í∞ÄÍ≤??òÏ†ï Î™®Îã¨ Ïª¥Ìè¨?åÌä∏
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
  // ?µÏÖòÎ≥?Í∞ÄÍ≤?Ï°∞Ï†ï ?ÅÌÉú
  const [priceMap, setPriceMap] = useState<Map<number, number>>(
    new Map(options.map(o => [o.id, o.priceAdjustment || 0]))
  )
  const [bulkPrice, setBulkPrice] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // ?ÑÏàò???∞Ïù¥??Íµ¨ÏÑ± - ?êÎ≥∏ Î¨∏Ïûê??Í∏∞Î∞ò
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
  
  // ?´ÏûêÎ°??ïÎ†¨
  const parseNum = (s: string) => parseFloat(s.replace('+', ''))
  const sphValues = Array.from(sphSet).sort((a, b) => parseNum(b) - parseNum(a))
  const cylValues = Array.from(cylSet).sort((a, b) => parseNum(b) - parseNum(a))

  // ?¥Î? ?¨Îß∑??Î¨∏Ïûê???¨Ïö©

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
      alert('Î≥ÄÍ≤ΩÎêú ?¥Ïö©???ÜÏäµ?àÎã§.')
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
          : '#eef4ee',  // ?åÎ???Î∞∞Í≤Ω?ºÎ°ú ?ÑÏàò ?àÏùå ?úÏãú
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
          background: 'var(--bg-primary)',
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
        {/* ?§Îçî */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>?ÑÏàòÎ≥?Í∞ÄÍ≤??òÏ†ï</h3>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}
            >
              √ó
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{productName} ({options.length}Í∞??ÑÏàò)</div>
        </div>

        {/* Í∞ÄÍ≤??ºÍ¥Ñ ?§Ï†ï */}
        <div style={{ padding: 16, background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={selectAll} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--bg-primary)', cursor: 'pointer' }}>
              ?ÑÏ≤¥?†ÌÉù
            </button>
            <button onClick={clearSelection} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--bg-primary)', cursor: 'pointer' }}>
              ?†ÌÉù?¥Ï†ú
            </button>
            <span style={{ color: 'var(--gray-400)' }}>|</span>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>?†ÌÉù??{selectedIds.size}Í∞úÏóê</span>
            <input
              type="number"
              step="1000"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(parseInt(e.target.value) || 0)}
              style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
            />
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>??/span>
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
              ?ÅÏö©
            </button>
          </div>
        </div>

        {/* ?ÑÏàò??*/}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {/* Î≤îÎ? */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#eef4ee', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#5d7a5d' }}>??/div>
              <span style={{ color: 'var(--gray-600)' }}>?ÑÏàò ?àÏùå (Í∏∞Î≥∏Í∞Ä)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#ffebee', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#c62828', fontWeight: 600 }}>+5k</div>
              <span style={{ color: 'var(--gray-600)' }}>Ï∂îÍ?Í∏??àÏùå</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 2 }}></div>
              <span style={{ color: 'var(--gray-600)' }}>?†ÌÉù??/span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 2 }}></div>
              <span style={{ color: 'var(--gray-600)' }}>?ÑÏàò ?ÜÏùå</span>
            </div>
          </div>
          <table style={{ borderCollapse: 'collapse', userSelect: 'none' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', position: 'sticky', top: 0, left: 0, background: 'var(--bg-primary)', zIndex: 2 }}>
                  SPH\CYL
                </th>
                {cylValues.map(cyl => (
                  <th key={cyl} style={{ padding: '4px', fontSize: 10, fontWeight: 500, color: 'var(--gray-600)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                    {cyl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sphValues.map(sph => (
                <tr key={sph}>
                  <td style={{ padding: '2px 8px', fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                    {sph}
                  </td>
                  {cylValues.map(cyl => {
                    const option = optionMap.get(`${sph},${cyl}`)
                    return (
                      <td 
                        key={cyl}
                        style={cellStyle(sph, cyl)}
                        onClick={() => option && toggleSelect(option.id)}
                        title={option ? `SPH: ${option.sph}, CYL: ${option.cyl}\nÍ∞ÄÍ≤©Ï°∞?? ${priceMap.get(option.id)?.toLocaleString() || 0}?? : '?µÏÖò ?ÜÏùå'}
                      >
                        {option 
                          ? (priceMap.get(option.id) || 0) > 0 
                            ? `+${((priceMap.get(option.id) || 0) / 1000).toFixed(0)}k` 
                            : '??  // ?ÑÏàò ?àÏúºÎ©?Ï≤¥ÌÅ¨ÎßàÌÅ¨
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

        {/* ?∏ÌÑ∞ */}
        <div style={{ 
          padding: '12px 24px', 
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--gray-50)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            ?Ä ?¥Î¶≠?ºÎ°ú ?†ÌÉù, ?ºÍ¥Ñ Í∞ÄÍ≤??ÅÏö© Í∞Ä??
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 14, border: '1px solid var(--gray-300)', borderRadius: 8, background: 'var(--bg-primary)', cursor: 'pointer' }}>
              Ï∑®ÏÜå
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
              ?Ä??
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
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
  
  // ?ÑÌÑ∞
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandSearch, setBrandSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)

  // Î™®Îã¨ ?ÅÌÉú
  const [showProductModal, setShowProductModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  
  // ?ÑÏàò ?µÏÖò ?®Íªò ?ùÏÑ± (?†Í∑ú ?±Î°ù??
  const [generateWithProduct, setGenerateWithProduct] = useState(false)
  const [diopterRange, setDiopterRange] = useState({
    sphMin: -6, sphMax: 4, sphStep: 0.25,
    cylMin: -2, cylMax: 0, cylStep: 0.25
  })

  // ?úÏÑú Î≥ÄÍ≤?Ï∂îÏ†Å
  const [orderChanged, setOrderChanged] = useState(false)
  const [productOrders, setProductOrders] = useState<{[key: number]: number}>({})

  // ?ºÍ¥Ñ ?†ÌÉù
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  // ?ÄÎ∂ÑÎ•ò Ï°∞Ìöå
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

  // ?ÄÎ∂ÑÎ•ò ?†ÌÉù ??Î∏åÎûú??Î°úÎìú
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

  // Î∏åÎûú???†ÌÉù ???àÎ™© Î°úÎìú
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

  // ?àÎ™© ?†ÌÉù ???ÅÌíà Î°úÎìú
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
      if (data.products?.length > 0) {
        handleSelectProduct(data.products[0])
      }
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
      setOptions(data.options || [])
    } catch (e) {
      console.error(e)
      setOptions([])
    } finally {
      setOptionLoading(false)
    }
  }, [])

  // Î∞îÏΩî??Í≤Ä??
  async function handleBarcodeSearch() {
    if (!barcodeSearch.trim()) return
    try {
      const res = await fetch(`/api/products/search?barcode=${encodeURIComponent(barcodeSearch)}`)
      const data = await res.json()
      if (data.product && data.option) {
        // Î∏åÎûú??Ï∞æÍ∏∞
        const brand = brands.find(b => b.id === data.product.brandId)
        if (brand) {
          await handleSelectBrand(brand)
          setSelectedProduct(data.product)
          // ?µÏÖò Î™©Î°ù Î°úÎìú ???¥Îãπ ?µÏÖò ?òÏù¥?ºÏù¥??
          const optRes = await fetch(`/api/products/${data.product.id}/options`)
          const optData = await optRes.json()
          setOptions(optData.options || [])
        }
        setShowBarcodeModal(false)
        setBarcodeSearch('')
        alert(`Ï∞æÏïò?µÎãà?? ${data.product.name} - SPH: ${data.option.sph}, CYL: ${data.option.cyl}`)
      } else {
        alert('?¥Îãπ Î∞îÏΩî?úÎ? Ï∞æÏùÑ ???ÜÏäµ?àÎã§.')
      }
    } catch (e) {
      console.error(e)
      alert('Í≤Ä??Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.')
    }
  }

  // ?ÅÌíà ?Ä??
  // Î∏åÎûú???Ä??
  async function handleSaveBrand(formData: FormData) {
    const data = {
      name: formData.get('name'),
      stockManage: formData.get('stockManage') || null,
      isActive: formData.get('isActive') === 'true',
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
        if (selectedCategory) handleSelectCategory(selectedCategory)
        alert(editingBrand ? 'Î∏åÎûú?úÍ? ?òÏ†ï?òÏóà?µÎãà??' : 'Î∏åÎûú?úÍ? Ï∂îÍ??òÏóà?µÎãà??')
      } else {
        const err = await res.json()
        alert(err.error || '?Ä???§Ìå®')
      }
    } catch (e) {
      console.error(e)
      alert('?Ä??Ï§??§Î•ò Î∞úÏÉù')
    }
  }

  async function handleSaveProduct(formData: FormData) {
    const data = {
      brandId: selectedBrand?.id,
      productLineId: selectedProductLine?.id,
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
        
        // ?†Í∑ú ?±Î°ù + ?ÑÏàò ?µÏÖò ?®Íªò ?ùÏÑ±
        if (!editingProduct && generateWithProduct) {
          const formatValue = (v: number) => {
            const rounded = Math.round(v * 100) / 100
            if (rounded === 0) return '0.00'
            return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2)
          }
          
          // ?ÑÏàò ?µÏÖò ?ùÏÑ±
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
              alert(`?ÅÌíà???±Î°ù?òÏóà?µÎãà??\n?ÑÏàò ?µÏÖò ${optData.created || optionsToCreate.length}Í∞úÍ? ?®Íªò ?ùÏÑ±?òÏóà?µÎãà??`)
            } else {
              alert('?ÅÌíà?Ä ?±Î°ù?òÏóà?ºÎÇò, ?ÑÏàò ?µÏÖò ?ùÏÑ±???§Ìå®?àÏäµ?àÎã§.')
            }
          }
          
          setGenerateWithProduct(false)
        } else {
          // ?ºÎ∞ò ?Ä??
          if (!editingProduct) {
            alert('?ÅÌíà???±Î°ù?òÏóà?µÎãà??')
          }
        }
        
        setShowProductModal(false)
        setEditingProduct(null)
        if (selectedProductLine) handleSelectProductLine(selectedProductLine)
      } else {
        alert('?Ä???§Ìå®')
      }
    } catch (e) {
      console.error(e)
      alert('?Ä??Ï§??§Î•ò Î∞úÏÉù')
    }
  }

  // ?µÏÖò ?Ä??
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
        alert('?Ä???§Ìå®')
      }
    } catch (e) {
      console.error(e)
      alert('?Ä??Ï§??§Î•ò Î∞úÏÉù')
    }
  }

  // ?úÏÑú ?Ä??
  async function handleSaveOrder() {
    try {
      const res = await fetch('/api/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: productOrders }),
      })
      if (res.ok) {
        setOrderChanged(false)
        alert('?úÏÑúÍ∞Ä ?Ä?•Îêò?àÏäµ?àÎã§.')
      }
    } catch (e) {
      console.error(e)
      alert('?úÏÑú ?Ä???§Ìå®')
    }
  }

  // ?ºÍ¥Ñ ?òÏ†ï
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
        alert('?ºÍ¥Ñ ?òÏ†ï ?ÑÎ£å')
      }
    } catch (e) {
      console.error(e)
      alert('?ºÍ¥Ñ ?òÏ†ï ?§Ìå®')
    }
  }

  // ?úÏÑú Î≥ÄÍ≤?
  function handleOrderChange(productId: number, newOrder: number) {
    setProductOrders(prev => ({ ...prev, [productId]: newOrder }))
    setOrderChanged(true)
  }

  // ?ÑÌÑ∞Îß?
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

  // ?§Ì???
  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
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
    padding: '8px 12px',
    borderBottom: '1px solid var(--gray-100)',
    fontSize: 13,
    whiteSpace: 'nowrap',
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
    background: 'var(--bg-primary)',
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
    <Layout sidebarMenus={SIDEBAR} activeNav="?ÅÌíà">
      {/* Page Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>?ÅÌíà Í¥ÄÎ¶?/h1>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
            ?ÄÎ∂ÑÎ•ò ??Î∏åÎûú?????àÎ™© ???ÅÌíà ???ÑÏàò?µÏÖò
          </p>
        </div>
        <button 
          onClick={() => setShowBarcodeModal(true)}
          style={{ ...actionBtnStyle, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          ?îç Î∞îÏΩî??Í≤Ä??
        </button>
      </div>

      {/* 4-Panel Layout: ?ÄÎ∂ÑÎ•ò+Î∏åÎûú??| ?àÎ™© | ?ÅÌíà | ?ÑÏàò?µÏÖò */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 200px 1fr 300px', gap: 12, height: 'calc(100vh - 180px)' }}>
        
        {/* Panel 1: ?ÄÎ∂ÑÎ•ò + Î∏åÎûú??*/}
        <div style={panelStyle}>
          {/* ?ÄÎ∂ÑÎ•ò ??*/}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 4, 
            padding: '8px 12px', 
            borderBottom: '1px solid var(--gray-200)',
            background: 'var(--gray-50)'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: selectedCategory?.id === cat.id ? 600 : 400,
                  background: selectedCategory?.id === cat.id ? 'var(--primary)' : '#fff',
                  color: selectedCategory?.id === cat.id ? '#fff' : 'var(--gray-600)',
                  border: '1px solid',
                  borderColor: selectedCategory?.id === cat.id ? 'var(--primary)' : 'var(--gray-200)',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div style={panelHeaderStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-800)' }}>
              Î∏åÎûú??{brands.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({brands.length})</span>}
            </div>
            <input
              type="text"
              placeholder="Î∏åÎûú??Í≤Ä??.."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={{ ...searchInputStyle, fontSize: 12, padding: '6px 10px' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading || brandLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Î°úÎî© Ï§?..</div>
            ) : filteredBrands.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Î∏åÎûú???ÜÏùå</div>
            ) : (
              filteredBrands.map(brand => (
                <div
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand)}
                  style={{
                    ...listItemStyle(selectedBrand?.id === brand.id),
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: selectedBrand?.id === brand.id ? 600 : 400, fontSize: 13 }}>
                      {brand.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                      {brand._count?.productLines || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid var(--gray-200)' }}>
            <button 
              onClick={() => { setEditingBrand(null); setShowBrandModal(true) }}
              style={{ ...primaryBtnStyle, width: '100%', fontSize: 12, padding: '6px 12px' }}
            >
              + Î∏åÎûú??
            </button>
          </div>
        </div>

        {/* Panel 2: ?àÎ™© Î™©Î°ù */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-800)' }}>
              ?àÎ™© {productLines.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({productLines.length})</span>}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {productLineLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Î°úÎî© Ï§?..</div>
            ) : !selectedBrand ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Î∏åÎûú?úÎ? ?†ÌÉù?òÏÑ∏??/div>
            ) : productLines.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>?àÎ™© ?ÜÏùå</div>
            ) : (
              productLines.map(line => (
                <div
                  key={line.id}
                  onClick={() => handleSelectProductLine(line)}
                  style={{
                    ...listItemStyle(selectedProductLine?.id === line.id),
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: selectedProductLine?.id === line.id ? 600 : 400, fontSize: 13 }}>
                      {line.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                      {line._count?.products || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid var(--gray-200)' }}>
            <button 
              onClick={() => {
                if (!selectedBrand) { alert('Î∏åÎûú?úÎ? Î®ºÏ? ?†ÌÉù?òÏÑ∏??); return }
                const name = prompt('?àÎ™©Î™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??)
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
              + ?àÎ™©
            </button>
          </div>
        </div>

        {/* Panel 3: ?ÅÌíà Î™©Î°ù */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
                ?ÅÌíà {filteredProducts.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({filteredProducts.length})</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button 
                  onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
                  disabled={!selectedProductLine}
                  style={{ ...primaryBtnStyle, fontSize: 11, padding: '4px 10px', opacity: selectedProductLine ? 1 : 0.5 }}
                >
                  + ?ÅÌíà
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="?ÅÌíàÎ™?Í≤Ä??.."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ ...searchInputStyle, fontSize: 12, padding: '6px 10px' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            {productLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Î°úÎî© Ï§?..</div>
            ) : !selectedProductLine ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>?àÎ™©???†ÌÉù?òÏÑ∏??/div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>?ÅÌíà ?ÜÏùå</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ ...gridHeaderStyle, width: 30 }}>
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
                    <th style={gridHeaderStyle}>?òÏ†ï</th>
                    <th style={gridHeaderStyle}>?µÏÖò?Ä??/th>
                    <th style={gridHeaderStyle}>?ÅÌíàÎ™?/th>
                    <th style={gridHeaderStyle}>Î¨∂Ïùå?ÅÌíà</th>
                    <th style={gridHeaderStyle}>Íµ¥Ï†àÎ•?/th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'right' }}>?êÎß§Í∞Ä</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', width: 50 }}>?ÑÏàò</th>
                    <th style={gridHeaderStyle}>?ÅÌÉú</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center', width: 60 }}>?úÏÑú</th>
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
                      <td style={gridCellStyle} onClick={(e) => e.stopPropagation()}>
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
                      <td style={gridCellStyle} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                          style={{ ...actionBtnStyle, padding: '2px 8px' }}
                        >
                          ?òÏ†ï
                        </button>
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{ 
                          fontSize: 11, 
                          padding: '2px 6px', 
                          borderRadius: 4,
                          background: 'var(--gray-100)',
                          color: 'var(--gray-600)',
                        }}>
                          {product.optionType}
                        </span>
                      </td>
                      <td style={{ ...gridCellStyle, fontWeight: 500 }}>{product.name}</td>
                      <td style={{ ...gridCellStyle, color: 'var(--gray-500)' }}>{product.bundleName || '-'}</td>
                      <td style={gridCellStyle}>
                        {product.refractiveIndex ? (
                          <span style={{ fontFamily: 'monospace' }}>{product.refractiveIndex}</span>
                        ) : '-'}
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'right', fontWeight: 500 }}>
                        {product.sellingPrice.toLocaleString()}??
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center' }}>
                        {product._count?.options ? (
                          <span style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: '#eef4ee',
                            color: '#4a6b4a',
                            fontWeight: 500,
                          }}>
                            {product._count.options}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>-</span>
                        )}
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: product.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                          color: product.isActive ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {product.isActive ? '?¨Ïö©' : 'ÎØ∏ÏÇ¨??}
                        </span>
                      </td>
                      <td style={{ ...gridCellStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={productOrders[product.id] ?? product.displayOrder}
                          onChange={(e) => handleOrderChange(product.id, parseInt(e.target.value) || 0)}
                          style={{ width: 50, padding: '2px 4px', textAlign: 'center', border: '1px solid var(--gray-200)', borderRadius: 4 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel 4: ?µÏÖò Î™©Î°ù (?ÑÏàò/?¨Í≥†) */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
                ?ÑÏàò?µÏÖò {options.length > 0 && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({options.length})</span>}
                {selectedProduct && <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 8 }}>({filteredOptions.length}Í∞?</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  disabled={!selectedProduct}
                  style={{ ...actionBtnStyle, opacity: selectedProduct ? 1 : 0.5 }}
                >
                  ?ùÏÑ±
                </button>
                <button 
                  onClick={() => setShowEditPriceModal(true)}
                  disabled={!selectedProduct || options.length === 0}
                  style={{ ...actionBtnStyle, opacity: selectedProduct && options.length > 0 ? 1 : 0.5 }}
                >
                  ?òÏ†ï
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
              placeholder="SPH, CYL, Î∞îÏΩî??Í≤Ä??.."
              value={optionSearch}
              onChange={(e) => setOptionSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {optionLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Î°úÎî© Ï§?..</div>
            ) : !selectedProduct ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>?ÅÌíà???†ÌÉù?òÏÑ∏??/div>
            ) : filteredOptions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                ?µÏÖò ?ÜÏùå
                <br />
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  style={{ ...primaryBtnStyle, marginTop: 12 }}
                >
                  ?ÑÏàò ?êÎèô?ùÏÑ±
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={gridHeaderStyle}>SPH</th>
                    <th style={gridHeaderStyle}>CYL</th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'right' }}>Í∞ÄÍ≤©Ï°∞??/th>
                    <th style={{ ...gridHeaderStyle, textAlign: 'center' }}>?¨Í≥†</th>
                    <th style={gridHeaderStyle}>?ÅÌÉú</th>
                    <th style={gridHeaderStyle}>?òÏ†ï</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.map(option => (
                    <tr key={option.id}>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace', fontWeight: 500 }}>{option.sph}</td>
                      <td style={{ ...gridCellStyle, fontFamily: 'monospace' }}>{option.cyl}</td>
                      <td style={{ 
                        ...gridCellStyle, 
                        textAlign: 'right',
                        fontWeight: option.priceAdjustment > 0 ? 600 : 400,
                        color: option.priceAdjustment > 0 ? '#ff6b6b' : 'var(--gray-500)',
                      }}>
                        {option.priceAdjustment > 0 ? `+${option.priceAdjustment.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ 
                        ...gridCellStyle, 
                        textAlign: 'center',
                        color: option.stock === 0 ? 'var(--error)' : 'var(--gray-700)',
                        fontWeight: option.stock === 0 ? 600 : 400,
                      }}>
                        {option.stock}
                      </td>
                      <td style={gridCellStyle}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: option.status === 'Ï£ºÎ¨∏Í∞Ä?? ? 'var(--success-light)' : 'var(--gray-100)',
                          color: option.status === 'Ï£ºÎ¨∏Í∞Ä?? ? 'var(--success)' : 'var(--gray-500)',
                        }}>
                          {option.status}
                        </span>
                      </td>
                      <td style={gridCellStyle}>
                        <button 
                          onClick={() => { setEditingOption(option); setShowOptionModal(true) }}
                          style={{ ...actionBtnStyle, padding: '2px 8px' }}
                        >
                          ?òÏ†ï
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

      {/* Î∞îÏΩî??Í≤Ä??Î™®Îã¨ */}
      {showBarcodeModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBarcodeModal(false)}>
          <div style={{ ...modalStyle, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Î∞îÏΩî??Í≤Ä??/h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Î∞îÏΩî?úÎ? ?ÖÎ†•?òÏÑ∏??
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                style={inputStyle}
                autoFocus
              />
              <button onClick={handleBarcodeSearch} style={primaryBtnStyle}>Í≤Ä??/button>
            </div>
          </div>
        </div>
      )}

      {/* ?ÅÌíà Ï∂îÍ?/?òÏ†ï Î™®Îã¨ */}
      {showProductModal && (
        <div style={modalOverlayStyle} onClick={() => setShowProductModal(false)}>
          <div style={{ ...modalStyle, width: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {editingProduct ? '?ÅÌíà ?òÏ†ï' : '?ÅÌíà Ï∂îÍ?'}
              </h3>
              {editingProduct && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('???ÅÌíà??Î≥µÏÇ¨?òÏãúÍ≤†Ïäµ?àÍπå?')) {
                        setEditingProduct({ ...editingProduct, id: 0, name: editingProduct.name + ' (Î≥µÏÇ¨)' } as Product)
                      }
                    }}
                    style={{ ...actionBtnStyle, fontSize: 12 }}
                  >
                    ?ìã Î≥µÏÇ¨
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('?ïÎßê ???ÅÌíà????†ú?òÏãúÍ≤†Ïäµ?àÍπå?\n?∞Í≤∞???µÏÖò(?ÑÏàò)???®Íªò ??†ú?©Îãà??')) {
                        try {
                          const res = await fetch(`/api/products/${editingProduct.id}`, { method: 'DELETE' })
                          if (res.ok) {
                            setShowProductModal(false)
                            setEditingProduct(null)
                            if (selectedBrand) handleSelectBrand(selectedBrand)
                            alert('??†ú?òÏóà?µÎãà??')
                          } else {
                            alert('??†ú ?§Ìå®')
                          }
                        } catch (e) {
                          console.error(e)
                          alert('??†ú Ï§??§Î•ò Î∞úÏÉù')
                        }
                      }
                    }}
                    style={{ ...actionBtnStyle, fontSize: 12, color: 'var(--error)', borderColor: 'var(--error)' }}
                  >
                    ?óëÔ∏???†ú
                  </button>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {/* ?ÅÌíà ÏΩîÎìú (?òÏ†ï?úÏóêÎß??úÏãú) */}
                {editingProduct && (
                  <div style={{ 
                    padding: '10px 14px', 
                    background: 'var(--gray-50)', 
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>?ÅÌíàÏΩîÎìú</span>
                    <code style={{ 
                      fontSize: 13, 
                      fontFamily: 'monospace', 
                      color: 'var(--gray-700)',
                      background: 'var(--bg-primary)',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {editingProduct.code || `P${String(editingProduct.id).padStart(5, '0')}`}
                    </code>
                  </div>
                )}
                
                <div>
                  <label style={labelStyle}>?ÅÌíàÎ™?*</label>
                  <input 
                    name="name" 
                    defaultValue={editingProduct?.name} 
                    required 
                    style={inputStyle}
                    placeholder="?? Î∏îÎ£®?ºÏù¥??Ï∞®Îã® ?åÏ¶à 1.60"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>?µÏÖò?Ä??*</label>
                    <select name="optionType" defaultValue={editingProduct?.optionType || '?àÍ≤Ω?åÏ¶à RX'} required style={inputStyle}>
                      <option value="?àÍ≤Ω?åÏ¶à RX">?àÍ≤Ω?åÏ¶à RX</option>
                      <option value="?àÍ≤Ω?åÏ¶à ?¨Î≤å">?àÍ≤Ω?åÏ¶à ?¨Î≤å</option>
                      <option value="ÏΩòÌÉù?∏Î†åÏ¶?>ÏΩòÌÉù?∏Î†åÏ¶?/option>
                      <option value="?àÍ≤Ω??>?àÍ≤Ω??/option>
                      <option value="?†Í??ºÏä§">?†Í??ºÏä§</option>
                      <option value="?åÎ™®??>?åÎ™®??/option>
                      <option value="?°ÏÑ∏?úÎ¶¨">?°ÏÑ∏?úÎ¶¨</option>
                      <option value="Í∏∞Ì?">Í∏∞Ì?</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>?ÅÌíàÎ∂ÑÎ•ò</label>
                    <select name="productType" defaultValue={editingProduct?.productType || ''} style={inputStyle}>
                      <option value="">?†ÌÉù ?àÌï®</option>
                      <option value="?®Ï¥à??>?®Ï¥à??/option>
                      <option value="?§Ï¥à??>?§Ï¥à??/option>
                      <option value="?ÑÏßÑ?§Ï¥à??>?ÑÏßÑ?§Ï¥à??/option>
                      <option value="?§ÎÇ¥??>?§ÎÇ¥??/option>
                      <option value="?§Ìè¨Ï∏?>?§Ìè¨Ï∏?/option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Íµ¥Ï†àÎ•?/label>
                    <select name="refractiveIndex" defaultValue={editingProduct?.refractiveIndex || ''} style={inputStyle}>
                      <option value="">?†ÌÉù</option>
                      <option value="1.50">1.50 (?úÏ?)</option>
                      <option value="1.56">1.56</option>
                      <option value="1.60">1.60 (Ï§ëÎèÑ??</option>
                      <option value="1.67">1.67 (Í≥†ÎèÑ??</option>
                      <option value="1.74">1.74 (Ï¥àÍ≥†?ÑÏàò)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Î¨∂Ïùå?ÅÌíàÎ™?/label>
                    <input 
                      name="bundleName" 
                      defaultValue={editingProduct?.bundleName || ''} 
                      style={inputStyle}
                      placeholder="Î¨∂Ïùå ?úÏãúÎ™?
                    />
                  </div>
                </div>

                {/* Í∞ÄÍ≤??πÏÖò */}
                <div style={{ 
                  padding: 14, 
                  background: 'var(--gray-50)', 
                  borderRadius: 10,
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>
                    ?í∞ Í∞ÄÍ≤??§Ï†ï
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>?êÎß§Í∞Ä</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          name="sellingPrice" 
                          type="number" 
                          defaultValue={editingProduct?.sellingPrice || 0} 
                          style={{ ...inputStyle, paddingRight: 30 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--gray-400)' }}>??/span>
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Îß§ÏûÖÍ∞Ä</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          name="purchasePrice" 
                          type="number" 
                          defaultValue={editingProduct?.purchasePrice || 0} 
                          style={{ ...inputStyle, paddingRight: 30 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--gray-400)' }}>??/span>
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>ÎßàÏßÑ??/label>
                      <div style={{ 
                        padding: '10px 12px', 
                        background: 'var(--bg-primary)', 
                        borderRadius: 8, 
                        border: '1px solid var(--gray-200)',
                        fontSize: 14,
                        color: 'var(--success)',
                        fontWeight: 600
                      }}>
                        {editingProduct?.sellingPrice && editingProduct?.purchasePrice 
                          ? `${Math.round((1 - editingProduct.purchasePrice / editingProduct.sellingPrice) * 100)}%`
                          : '-'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>?ÅÌÉú</label>
                    <select name="isActive" defaultValue={editingProduct?.isActive !== false ? 'true' : 'false'} style={inputStyle}>
                      <option value="true">???¨Ïö©</option>
                      <option value="false">??ÎØ∏ÏÇ¨??/option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>?úÏãú ?úÏÑú</label>
                    <input 
                      name="displayOrder" 
                      type="number" 
                      defaultValue={editingProduct?.displayOrder || 0} 
                      style={inputStyle}
                      placeholder="?´ÏûêÍ∞Ä ?ëÏùÑ?òÎ°ù Î®ºÏ? ?úÏãú"
                    />
                  </div>
                </div>

                {/* ?ÑÏàò ?µÏÖò ?®Íªò ?ùÏÑ± (?†Í∑ú ?±Î°ù?úÏóêÎß? */}
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
                        ?ìã ?ÑÏàò ?µÏÖò ?®Íªò ?ùÏÑ± (?¨Î≤å??
                      </span>
                    </label>
                    
                    {generateWithProduct && (
                      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH ÏµúÏÜå</label>
                            <input 
                              type="number" step="0.25" value={diopterRange.sphMin}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, sphMin: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH ÏµúÎ?</label>
                            <input 
                              type="number" step="0.25" value={diopterRange.sphMax}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, sphMax: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>SPH ?®ÏúÑ</label>
                            <select 
                              value={diopterRange.sphStep}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, sphStep: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            >
                              <option value={0.25}>0.25</option>
                              <option value={0.5}>0.50</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL ÏµúÏÜå</label>
                            <input 
                              type="number" step="0.25" value={diopterRange.cylMin}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, cylMin: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL ÏµúÎ?</label>
                            <input 
                              type="number" step="0.25" value={diopterRange.cylMax}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, cylMax: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>CYL ?®ÏúÑ</label>
                            <select 
                              value={diopterRange.cylStep}
                              onChange={(e) => setDiopterRange(prev => ({ ...prev, cylStep: parseFloat(e.target.value) }))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                            >
                              <option value={0.25}>0.25</option>
                              <option value={0.5}>0.50</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-600)', background: 'var(--bg-primary)', padding: 8, borderRadius: 6 }}>
                          ?ìä ?ùÏÑ±???µÏÖò: ??{Math.ceil((diopterRange.sphMax - diopterRange.sphMin) / diopterRange.sphStep + 1) * Math.ceil((diopterRange.cylMax - diopterRange.cylMin) / diopterRange.cylStep + 1)}Í∞?
                          <br />
                          SPH: {diopterRange.sphMin} ~ {diopterRange.sphMax > 0 ? '+' : ''}{diopterRange.sphMax} | CYL: {diopterRange.cylMin} ~ {diopterRange.cylMax}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ?ÑÏàò ?µÏÖò ?îÏïΩ (?òÏ†ï?úÏóêÎß? */}
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
                          ?ìã ?±Î°ù???ÑÏàò: {options.length}Í∞?
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                          SPH: {options.length > 0 ? `${Math.min(...options.map(o => parseFloat(o.sph.replace('+', ''))))} ~ ${Math.max(...options.map(o => parseFloat(o.sph.replace('+', ''))))}` : '-'}
                          {' | '}
                          CYL: {options.length > 0 ? `${Math.min(...options.map(o => parseFloat(o.cyl.replace('+', ''))))} ~ ${Math.max(...options.map(o => parseFloat(o.cyl.replace('+', ''))))}` : '-'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowProductModal(false); setShowGenerateModal(true) }}
                        style={{ ...actionBtnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}
                      >
                        ?ÑÏàò Í¥ÄÎ¶???
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={actionBtnStyle}>Ï∑®ÏÜå</button>
                <button type="submit" style={{ ...primaryBtnStyle, padding: '10px 24px' }}>
                  {editingProduct ? '?Ä?? : '?±Î°ù'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ?µÏÖò Ï∂îÍ?/?òÏ†ï Î™®Îã¨ */}
      {showOptionModal && (
        <div style={modalOverlayStyle} onClick={() => setShowOptionModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editingOption ? '?µÏÖò ?òÏ†ï' : '?µÏÖò Ï∂îÍ?'}
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
                  <label style={labelStyle}>Î∞îÏΩî??/label>
                  <input name="barcode" defaultValue={editingOption?.barcode || ''} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>?¨Í≥†</label>
                    <input name="stock" type="number" defaultValue={editingOption?.stock || 0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>?¨Í≥† ?ÑÏπò</label>
                    <input name="location" defaultValue={editingOption?.stockLocation || ''} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Í∞ÄÍ≤?Ï°∞Ï†ï (Ï∂îÍ?Í∏?</label>
                  <input name="priceAdjustment" type="number" defaultValue={editingOption?.priceAdjustment || 0} style={inputStyle} placeholder="?? Í≥†ÎèÑ??+5000" />
                </div>
                <div>
                  <label style={labelStyle}>Î©îÎ™®</label>
                  <input name="memo" defaultValue={editingOption?.memo || ''} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>?ÅÌÉú</label>
                  <select name="isActive" defaultValue={editingOption?.status === 'Ï£ºÎ¨∏Í∞Ä?? ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">Ï£ºÎ¨∏Í∞Ä??/option>
                    <option value="false">?àÏ†à</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowOptionModal(false)} style={actionBtnStyle}>Ï∑®ÏÜå</button>
                <button type="submit" style={primaryBtnStyle}>?Ä??/button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ?ºÍ¥Ñ ?òÏ†ï Î™®Îã¨ */}
      {showBulkEditModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBulkEditModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              ?ºÍ¥Ñ ?òÏ†ï ({selectedProductIds.size}Í∞??†ÌÉù)
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleBulkEdit(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>?ÅÌÉú Î≥ÄÍ≤?/label>
                  <select name="isActive" defaultValue="" style={inputStyle}>
                    <option value="">Î≥ÄÍ≤??àÌï®</option>
                    <option value="true">?¨Ïö©</option>
                    <option value="false">ÎØ∏ÏÇ¨??/option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>?µÏÖò?Ä??Î≥ÄÍ≤?/label>
                  <select name="optionType" defaultValue="" style={inputStyle}>
                    <option value="">Î≥ÄÍ≤??àÌï®</option>
                    <option value="?àÍ≤Ω?åÏ¶à RX">?àÍ≤Ω?åÏ¶à RX</option>
                    <option value="?àÍ≤Ω?åÏ¶à ?¨Î≤å">?àÍ≤Ω?åÏ¶à ?¨Î≤å</option>
                    <option value="ÏΩòÌÉù?∏Î†åÏ¶?>ÏΩòÌÉù?∏Î†åÏ¶?/option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setShowBulkEditModal(false)} style={actionBtnStyle}>Ï∑®ÏÜå</button>
                <button type="submit" style={primaryBtnStyle}>?ÅÏö©</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ?ÑÏàò ?ùÏÑ± Î™®Îã¨ (Îß§Ìä∏Î¶?ä§ ?§Ì??? */}
      {showGenerateModal && (
        <GenerateOptionsModal
          productName={selectedProduct?.name || ''}
          existingOptions={options}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={async (selectedCells) => {
            try {
              const res = await fetch(`/api/products/${selectedProduct?.id}/options/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: selectedCells }),
              })
              if (res.ok) {
                const data = await res.json()
                setShowGenerateModal(false)
                if (selectedProduct) handleSelectProduct(selectedProduct)
                alert(`${data.created}Í∞úÏùò ?µÏÖò???ùÏÑ±?òÏóà?µÎãà??`)
              }
            } catch (e) {
              console.error(e)
              alert('?ÑÏàò ?ùÏÑ± ?§Ìå®')
            }
          }}
        />
      )}

      {/* ?ÑÏàò ?òÏ†ï Î™®Îã¨ (Îß§Ìä∏Î¶?ä§ ?§Ì??? */}
      {showEditPriceModal && (
        <GenerateOptionsModal
          productName={selectedProduct?.name || ''}
          existingOptions={options}
          mode="edit"
          onClose={() => setShowEditPriceModal(false)}
          onGenerate={async (newOptions) => {
            // ?àÎ°ú Ï∂îÍ????µÏÖò???ùÏÑ±
            if (newOptions.length > 0) {
              try {
                const res = await fetch(`/api/products/${selectedProduct?.id}/options/bulk`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ options: newOptions }),
                })
                if (res.ok) {
                  const data = await res.json()
                  if (selectedProduct) handleSelectProduct(selectedProduct)
                  alert(`${data.created}Í∞úÏùò ?µÏÖò??Ï∂îÍ??òÏóà?µÎãà??`)
                }
              } catch (e) {
                console.error(e)
                alert('?µÏÖò Ï∂îÍ? ?§Ìå®')
              }
            }
            setShowEditPriceModal(false)
          }}
          onUpdate={async (updates) => {
            // Í∏∞Ï°¥ ?µÏÖò Í∞ÄÍ≤??òÏ†ï
            try {
              const res = await fetch(`/api/products/${selectedProduct?.id}/options/bulk-update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
              })
              if (res.ok) {
                const data = await res.json()
                if (selectedProduct) handleSelectProduct(selectedProduct)
                alert(`${data.updated}Í∞úÏùò ?µÏÖò???òÏ†ï?òÏóà?µÎãà??`)
              }
            } catch (e) {
              console.error(e)
              alert('Í∞ÄÍ≤??òÏ†ï ?§Ìå®')
            }
          }}
        />
      )}

      {/* Î∏åÎûú??Ï∂îÍ?/?òÏ†ï Î™®Îã¨ */}
      {showBrandModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBrandModal(false)}>
          <div style={{ ...modalStyle, width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {editingBrand ? 'Î∏åÎûú???òÏ†ï' : 'Î∏åÎûú??Ï∂îÍ?'}
              </h3>
              {editingBrand && (
                <button
                  type="button"
                  onClick={async () => {
                    if (editingBrand._count?.products && editingBrand._count.products > 0) {
                      alert(`??Î∏åÎûú?úÏóê ${editingBrand._count.products}Í∞úÏùò ?ÅÌíà???àÏñ¥ ??†ú?????ÜÏäµ?àÎã§.\nÎ®ºÏ? ?ÅÌíà???¥Îèô?òÍ±∞????†ú?¥Ï£º?∏Ïöî.`)
                      return
                    }
                    if (confirm('?ïÎßê ??Î∏åÎûú?úÎ? ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
                      try {
                        const res = await fetch(`/api/brands/${editingBrand.id}`, { method: 'DELETE' })
                        if (res.ok) {
                          setShowBrandModal(false)
                          setEditingBrand(null)
                          setSelectedBrand(null)
                          if (selectedCategory) handleSelectCategory(selectedCategory)
                          alert('Î∏åÎûú?úÍ? ??†ú?òÏóà?µÎãà??')
                        } else {
                          const err = await res.json()
                          alert(err.error || '??†ú ?§Ìå®')
                        }
                      } catch (e) {
                        console.error(e)
                        alert('??†ú Ï§??§Î•ò Î∞úÏÉù')
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
                  ?óëÔ∏???†ú
                </button>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveBrand(new FormData(e.currentTarget)) }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Î∏åÎûú?úÎ™Ö *</label>
                  <input 
                    name="name" 
                    defaultValue={editingBrand?.name} 
                    required 
                    style={inputStyle}
                    placeholder="?? HOYA, ZEISS, ?àÏΩò"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>?¨Í≥†Í¥ÄÎ¶?Î∞©Ïãù</label>
                  <select name="stockManage" defaultValue={editingBrand?.stockManage || ''} style={inputStyle}>
                    <option value="">Í∏∞Î≥∏ (Í∞úÎ≥Ñ Í¥ÄÎ¶?</option>
                    <option value="shared">Í≥µÏú† ?¨Í≥†</option>
                    <option value="none">?¨Í≥† Í¥ÄÎ¶??àÌï®</option>
                  </select>
                  <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                    Í≥µÏú† ?¨Í≥†: Í∞ôÏ? ?ÑÏàò???ÅÌíà?§Ïù¥ ?¨Í≥†Î•?Í≥µÏú†?©Îãà??
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>?ÅÌÉú</label>
                  <select name="isActive" defaultValue={editingBrand?.isActive !== false ? 'true' : 'false'} style={inputStyle}>
                    <option value="true">???úÏÑ±</option>
                    <option value="false">??ÎπÑÌôú??(Î™©Î°ù?êÏÑú ?®Í?)</option>
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
                    <div>?ì¶ ?±Î°ù???ÅÌíà: <strong>{editingBrand._count?.products || 0}</strong>Í∞?/div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <button type="button" onClick={() => setShowBrandModal(false)} style={actionBtnStyle}>Ï∑®ÏÜå</button>
                <button type="submit" style={{ ...primaryBtnStyle, padding: '10px 24px' }}>
                  {editingBrand ? '?Ä?? : 'Ï∂îÍ?'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
