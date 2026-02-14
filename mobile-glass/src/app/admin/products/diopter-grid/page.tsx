'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Brand {
  id: number
  name: string
  products: { id: number; name: string; refractiveIndex: string | null; optionName: string | null }[]
}

interface GridCell {
  stock: number
  optionId: number
  barcode?: string
  waiting?: number // ?ÄÍ∏??òÎüâ
}

interface GridData {
  sphRange: string[]
  cylRange: string[]
  grid: Record<string, Record<string, GridCell>>
  stats: { totalOptions: number; totalStock: number; outOfStock: number; lowStock: number }
  productName?: string
  brandName?: string
}

// ?´ÏûêÎ•??àÍ±∞???ïÏãù?ºÎ°ú Î≥Ä??(0.25 ??"025", -1.00 ??"-100")
const formatLegacy = (value: string): string => {
  const num = parseFloat(value)
  const abs = Math.abs(num)
  const formatted = String(Math.round(abs * 100)).padStart(3, '0')
  return num < 0 ? `-${formatted}` : formatted
}

// ?àÍ±∞???ïÏãù???´ÏûêÎ°?Î≥Ä??
const parseLegacy = (value: string): number => {
  const isNegative = value.startsWith('-')
  const abs = parseInt(value.replace('-', ''), 10)
  return (isNegative ? -abs : abs) / 100
}

export default function DiopterGridPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [gridData, setGridData] = useState<GridData | null>(null)
  const [loading, setLoading] = useState(true)
  const [gridLoading, setGridLoading] = useState(false)

  // ?†ÌÉù???Ä
  const [selectedCell, setSelectedCell] = useState<{ sph: string; cyl: string } | null>(null)
  
  // ?µÏÖò ?ùÏÑ± Î™®Îã¨
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    sphMin: -8,
    sphMax: 4,
    sphStep: 0.25,
    cylMin: -2,
    cylMax: 0,
    cylStep: 0.25,
    defaultStock: 0
  })
  const [creating, setCreating] = useState(false)

  // ?Ä ?∏Ïßë Î™®Îã¨
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    sph: string
    cyl: string
    optionId: number
    stock: number
    priceAdjustment?: number
    barcode?: string
    location?: string
  } | null>(null)
  const [editForm, setEditForm] = useState({
    stock: 0,
    priceAdjustment: 0,
    barcode: '',
    location: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchGrid()
    }
  }, [selectedProduct])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products/diopter-grid')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.brands)
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrid = async () => {
    if (!selectedProduct) return

    setGridLoading(true)
    try {
      const res = await fetch(`/api/products/diopter-grid?productId=${selectedProduct}`)
      if (res.ok) {
        const data = await res.json()
        setGridData(data)
      }
    } catch (error) {
      console.error('Failed to fetch grid:', error)
    } finally {
      setGridLoading(false)
    }
  }

  const openEditModal = (sph: string, cyl: string, cell: GridCell) => {
    setEditingCell({ sph, cyl, ...cell })
    setEditForm({
      stock: cell.stock,
      priceAdjustment: 0,
      barcode: cell.barcode || '',
      location: ''
    })
    setShowEditModal(true)
  }

  const handleCellClick = (sph: string, cyl: string) => {
    setSelectedCell({ sph, cyl })
    const cell = gridData?.grid[sph]?.[cyl]
    if (cell) {
      openEditModal(sph, cyl, cell)
    }
  }

  const handleSaveCell = async () => {
    if (!editingCell) return

    setSaving(true)
    try {
      const res = await fetch('/api/products/diopter-grid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: editingCell.optionId,
          stock: editForm.stock,
          priceAdjustment: editForm.priceAdjustment,
          barcode: editForm.barcode || null,
          location: editForm.location || null
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        fetchGrid()
      } else {
        const error = await res.json()
        alert(error.error || '?Ä?•Ïóê ?§Ìå®?àÏäµ?àÎã§')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('?Ä?•Ïóê ?§Ìå®?àÏäµ?àÎã§')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateOptions = async () => {
    if (!selectedProduct) return

    setCreating(true)
    try {
      const res = await fetch('/api/products/diopter-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          sphRange: { min: createForm.sphMin, max: createForm.sphMax, step: createForm.sphStep },
          cylRange: { min: createForm.cylMin, max: createForm.cylMax, step: createForm.cylStep },
          defaultStock: createForm.defaultStock
        })
      })

      if (res.ok) {
        const result = await res.json()
        alert(result.message)
        setShowCreateModal(false)
        fetchGrid()
      } else {
        const error = await res.json()
        alert(error.error || '?ùÏÑ±???§Ìå®?àÏäµ?àÎã§')
      }
    } catch (error) {
      console.error('Failed to create options:', error)
      alert('?ùÏÑ±???§Ìå®?àÏäµ?àÎã§')
    } finally {
      setCreating(false)
    }
  }

  // SPH Î≤îÏúÑÎ•?ÎßàÏù¥?àÏä§/?åÎü¨?§Î°ú Î∂ÑÎ¶¨
  const splitSphRange = useCallback(() => {
    if (!gridData) return { minus: [], plus: [] }
    
    const minus: string[] = []
    const plus: string[] = []
    
    gridData.sphRange.forEach(sph => {
      const num = parseFloat(sph)
      if (num < 0) {
        minus.push(sph)
      } else {
        plus.push(sph)
      }
    })
    
    // ÎßàÏù¥?àÏä§???àÎ?Í∞????úÏÑúÎ°?(?ºÏ™Ω?êÏÑú ?§Î•∏Ï™ΩÏúºÎ°?0??Í∞ÄÍπåÏõåÏß?
    minus.sort((a, b) => parseFloat(a) - parseFloat(b))
    // ?åÎü¨?§Îäî ?ëÏ? ?úÏÑúÎ°?
    plus.sort((a, b) => parseFloat(a) - parseFloat(b))
    
    return { minus, plus }
  }, [gridData])

  const { minus: minusSph, plus: plusSph } = splitSphRange()

  const selectedBrandData = brands.find(b => b.id === selectedBrand)
  
  // ?ÑÏû¨ ?†ÌÉù???Ä ?ïÎ≥¥
  const currentCell = selectedCell && gridData?.grid[selectedCell.sph]?.[selectedCell.cyl]

  // Í∑∏Î¶¨???åÎçîÎß??®Ïàò
  const renderGrid = (sphRange: string[], side: 'minus' | 'plus') => {
    if (!gridData || sphRange.length === 0) return null
    
    return (
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          fontSize: '13px',
          fontFamily: 'monospace'
        }}>
          <thead>
            <tr>
              <th style={{ 
                position: 'sticky',
                left: 0,
                top: 0,
                background: '#e8e8e0',
                padding: '6px 4px',
                border: '1px solid #999',
                fontWeight: 'bold',
                zIndex: 10,
                minWidth: '44px',
                fontSize: '12px'
              }}>
                {side === 'minus' ? '-SPH' : 'SPH+'}
              </th>
              {sphRange.map(sph => (
                <th 
                  key={sph}
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: '#e8e8e0',
                    padding: '6px 4px',
                    border: '1px solid #999',
                    fontWeight: 'normal',
                    minWidth: '38px',
                    zIndex: 5,
                    fontSize: '12px'
                  }}
                >
                  {formatLegacy(sph).replace('-', '')}
                </th>
              ))}
              <th style={{
                position: 'sticky',
                right: 0,
                top: 0,
                background: '#e8e8e0',
                padding: '6px 4px',
                border: '1px solid #999',
                fontWeight: 'bold',
                zIndex: 10,
                minWidth: '44px',
                fontSize: '12px'
              }}>
                {side === 'minus' ? '-SPH' : 'SPH+'}
              </th>
            </tr>
          </thead>
          <tbody>
            {gridData.cylRange.map((cyl, rowIdx) => {
              const cylNum = parseFloat(cyl)
              // Í≥†ÎèÑ???ÅÏó≠ ?úÏãú (CYL -1.00 ?¥Ìïò)
              const isHighPower = cylNum <= -1
              const rowBg = isHighPower ? '#ffe4e4' : (rowIdx % 2 === 0 ? '#fffef0' : '#fff')
              
              return (
                <tr key={cyl}>
                  <td style={{
                    position: 'sticky',
                    left: 0,
                    background: '#e8e8e0',
                    padding: '5px 6px',
                    border: '1px solid #999',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '12px'
                  }}>
                    {formatLegacy(cyl).replace('-', '')}
                  </td>
                  {sphRange.map(sph => {
                    const cell = gridData.grid[sph]?.[cyl]
                    const isSelected = selectedCell?.sph === sph && selectedCell?.cyl === cyl
                    
                    return (
                      <td
                        key={sph}
                        onClick={() => cell && handleCellClick(sph, cyl)}
                        style={{
                          padding: '5px 4px',
                          border: '1px solid #ccc',
                          background: isSelected ? '#4a90d9' : rowBg,
                          color: isSelected ? '#fff' : (cell ? (cell.stock === 0 ? '#c00' : '#000') : '#ccc'),
                          textAlign: 'center',
                          cursor: cell ? 'pointer' : 'default',
                          fontWeight: cell && cell.stock > 0 ? 'bold' : 'normal',
                          fontSize: '12px',
                          minWidth: '38px'
                        }}
                      >
                        {cell ? (cell.stock > 0 ? cell.stock : '') : ''}
                      </td>
                    )
                  })}
                  <td style={{
                    position: 'sticky',
                    right: 0,
                    background: '#e8e8e0',
                    padding: '5px 6px',
                    border: '1px solid #999',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '12px'
                  }}>
                    {formatLegacy(cyl).replace('-', '')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <AdminLayout activeMenu="products">
      {/* ?ÅÎã® ?¥Î∞î - ?àÍ±∞???§Ì???*/}
      <div style={{ 
        background: '#f0f0f0', 
        border: '1px solid #999',
        padding: '8px',
        marginBottom: '8px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500 }}>?àÎ™©[F5]</label>
          <select
            value={selectedBrand || ''}
            onChange={(e) => {
              setSelectedBrand(parseInt(e.target.value) || null)
              setSelectedProduct(null)
              setGridData(null)
              setSelectedCell(null)
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid #999',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">?†ÌÉù</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500 }}>?àÎ™Ö[F6]</label>
          <select
            value={selectedProduct || ''}
            onChange={(e) => {
              setSelectedProduct(parseInt(e.target.value) || null)
              setSelectedCell(null)
            }}
            disabled={!selectedBrand}
            style={{
              padding: '4px 8px',
              border: '1px solid #999',
              fontSize: '13px',
              minWidth: '150px',
              background: !selectedBrand ? '#eee' : '#fff'
            }}
          >
            <option value="">?†ÌÉù</option>
            {selectedBrandData?.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} {product.refractiveIndex && `(${product.refractiveIndex})`}
              </option>
            ))}
          </select>
        </div>

        <div style={{ borderLeft: '1px solid #999', height: '24px' }} />

        {selectedProduct && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '4px 12px',
              border: '1px solid #999',
              background: 'linear-gradient(to bottom, #fff, #ddd)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ?µÏÖò ?ºÍ¥Ñ?ùÏÑ±
          </button>
        )}

        <button
          onClick={() => gridData && fetchGrid()}
          disabled={!selectedProduct}
          style={{
            padding: '4px 12px',
            border: '1px solid #999',
            background: 'linear-gradient(to bottom, #fff, #ddd)',
            fontSize: '13px',
            cursor: selectedProduct ? 'pointer' : 'not-allowed'
          }}
        >
          ?àÎ°úÍ≥†Ïπ®
        </button>
      </div>

      {/* Í∑∏Î¶¨???ÅÏó≠ */}
      {gridLoading ? (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          color: '#666',
          background: 'var(--bg-primary)',
          border: '1px solid #999'
        }}>
          Î°úÎî© Ï§?..
        </div>
      ) : gridData && gridData.sphRange.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          background: 'var(--bg-primary)',
          border: '1px solid #999',
          height: 'calc(100vh - 280px)',
          overflow: 'hidden'
        }}>
          {/* ÎßàÏù¥?àÏä§ SPH Í∑∏Î¶¨??*/}
          {minusSph.length > 0 && renderGrid(minusSph, 'minus')}
          
          {/* Íµ¨Î∂Ñ??*/}
          {minusSph.length > 0 && plusSph.length > 0 && (
            <div style={{ 
              width: '2px', 
              background: '#666',
              flexShrink: 0
            }} />
          )}
          
          {/* ?åÎü¨??SPH Í∑∏Î¶¨??*/}
          {plusSph.length > 0 && renderGrid(plusSph, 'plus')}
        </div>
      ) : selectedProduct ? (
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #999',
          padding: '60px', 
          textAlign: 'center' 
        }}>
          <div style={{ marginBottom: '16px', color: '#666' }}>?±Î°ù???ÑÏàò ?µÏÖò???ÜÏäµ?àÎã§</div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 20px',
              border: '1px solid #999',
              background: 'linear-gradient(to bottom, #fff, #ddd)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ?µÏÖò ?ºÍ¥Ñ ?ùÏÑ±
          </button>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #999',
          padding: '60px', 
          textAlign: 'center',
          color: '#666'
        }}>
          ?àÎ™©Í≥??àÎ™Ö???†ÌÉù?òÏÑ∏??
        </div>
      )}

      {/* ?ÅÌÉúÎ∞?- ?àÍ±∞???§Ì???*/}
      <div style={{
        background: '#f0f0f0',
        border: '1px solid #999',
        borderTop: 'none',
        padding: '6px 12px',
        display: 'flex',
        gap: '24px',
        fontSize: '13px'
      }}>
        {selectedCell && currentCell ? (
          <>
            <span>SPH: {formatLegacy(selectedCell.sph)}</span>
            <span>CYL: {formatLegacy(selectedCell.cyl)}</span>
            <span>[?ÑÏû¨Í≥? {currentCell.stock}]</span>
            {currentCell.waiting !== undefined && <span>[?ÄÍ∏? {currentCell.waiting}]</span>}
          </>
        ) : (
          <span>?Ä???†ÌÉù?òÏÑ∏??/span>
        )}
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
          {gridData && (
            <>
              <span>Ï¥??µÏÖò: {gridData.stats.totalOptions}</span>
              <span>Ï¥??¨Í≥†: {gridData.stats.totalStock.toLocaleString()}</span>
              <span style={{ color: '#c00' }}>?àÏ†à: {gridData.stats.outOfStock}</span>
            </>
          )}
        </div>
      </div>

      {/* ?µÏÖò ?ùÏÑ± Î™®Îã¨ */}
      {showCreateModal && (
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
            background: '#f0f0f0',
            border: '2px solid #999',
            padding: '16px',
            width: '450px'
          }}>
            <div style={{ 
              background: '#000080', 
              color: '#fff', 
              padding: '4px 8px', 
              marginBottom: '16px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              ?ÑÏàò ?µÏÖò ?ºÍ¥Ñ ?ùÏÑ±
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* SPH Î≤îÏúÑ */}
              <fieldset style={{ border: '1px solid #999', padding: '12px' }}>
                <legend style={{ fontSize: '13px', fontWeight: 500 }}>SPH Î≤îÏúÑ</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>ÏµúÏÜå</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.sphMin}
                      onChange={(e) => setCreateForm({ ...createForm, sphMin: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>ÏµúÎ?</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.sphMax}
                      onChange={(e) => setCreateForm({ ...createForm, sphMax: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>Í∞ÑÍ≤©</label>
                    <select
                      value={createForm.sphStep}
                      onChange={(e) => setCreateForm({ ...createForm, sphStep: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    >
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.50</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* CYL Î≤îÏúÑ */}
              <fieldset style={{ border: '1px solid #999', padding: '12px' }}>
                <legend style={{ fontSize: '13px', fontWeight: 500 }}>CYL Î≤îÏúÑ</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>ÏµúÏÜå</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.cylMin}
                      onChange={(e) => setCreateForm({ ...createForm, cylMin: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>ÏµúÎ?</label>
                    <input
                      type="number"
                      step="0.25"
                      value={createForm.cylMax}
                      onChange={(e) => setCreateForm({ ...createForm, cylMax: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>Í∞ÑÍ≤©</label>
                    <select
                      value={createForm.cylStep}
                      onChange={(e) => setCreateForm({ ...createForm, cylStep: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                    >
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.50</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Í∏∞Î≥∏ ?¨Í≥† */}
              <div>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Í∏∞Î≥∏ ?¨Í≥†</label>
                <input
                  type="number"
                  value={createForm.defaultStock}
                  onChange={(e) => setCreateForm({ ...createForm, defaultStock: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                />
              </div>

              {/* ÎØ∏Î¶¨Î≥¥Í∏∞ */}
              <div style={{ 
                padding: '8px', 
                background: 'var(--bg-primary)', 
                border: '1px solid #999',
                fontSize: '13px'
              }}>
                ?àÏÉÅ ?ùÏÑ±: {' '}
                <strong>
                  {Math.floor((createForm.sphMax - createForm.sphMin) / createForm.sphStep + 1) *
                   Math.floor((createForm.cylMax - createForm.cylMin) / createForm.cylStep + 1)}Í∞?
                </strong>
                <span style={{ marginLeft: '8px', color: '#666' }}>(Í∏∞Ï°¥ ?µÏÖò Í±¥ÎÑà?Ä)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #999',
                  background: 'linear-gradient(to bottom, #fff, #ddd)',
                  cursor: 'pointer'
                }}
              >
                Ï∑®ÏÜå
              </button>
              <button
                onClick={handleCreateOptions}
                disabled={creating}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #999',
                  background: creating ? '#ccc' : 'linear-gradient(to bottom, #fff, #ddd)',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? '?ùÏÑ± Ï§?..' : '?ùÏÑ±'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ?Ä ?∏Ïßë Î™®Îã¨ */}
      {showEditModal && editingCell && (
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
            background: '#f0f0f0',
            border: '2px solid #999',
            padding: '16px',
            width: '380px'
          }}>
            <div style={{ 
              background: '#000080', 
              color: '#fff', 
              padding: '4px 8px', 
              marginBottom: '16px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              ?¨Í≥† ?òÏ†ï - SPH: {formatLegacy(editingCell.sph)} / CYL: {formatLegacy(editingCell.cyl)}
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>?¨Í≥†</label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: Math.max(0, editForm.stock - 10) })}
                    style={{ padding: '4px 8px', border: '1px solid #999', background: 'var(--bg-primary)', cursor: 'pointer' }}
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: Math.max(0, editForm.stock - 1) })}
                    style={{ padding: '4px 8px', border: '1px solid #999', background: 'var(--bg-primary)', cursor: 'pointer' }}
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: '1px solid #999',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  />
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: editForm.stock + 1 })}
                    style={{ padding: '4px 8px', border: '1px solid #999', background: 'var(--bg-primary)', cursor: 'pointer' }}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, stock: editForm.stock + 10 })}
                    style={{ padding: '4px 8px', border: '1px solid #999', background: 'var(--bg-primary)', cursor: 'pointer' }}
                  >
                    +10
                  </button>
                </div>
                {editForm.stock !== editingCell.stock && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '12px', 
                    color: editForm.stock > editingCell.stock ? '#080' : '#c00' 
                  }}>
                    Î≥ÄÍ≤? {editingCell.stock} ??{editForm.stock} 
                    ({editForm.stock > editingCell.stock ? '+' : ''}{editForm.stock - editingCell.stock})
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Î∞îÏΩî??/label>
                  <input
                    type="text"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>?ÑÏπò</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="?? A-1-3"
                    style={{ width: '100%', padding: '4px', border: '1px solid #999' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Í∞ÄÍ≤?Ï°∞Ï†ï</label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={editForm.priceAdjustment}
                    onChange={(e) => setEditForm({ ...editForm, priceAdjustment: parseInt(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '4px', border: '1px solid #999' }}
                  />
                  <span style={{ fontSize: '13px' }}>??/span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #999',
                  background: 'linear-gradient(to bottom, #fff, #ddd)',
                  cursor: 'pointer'
                }}
              >
                Ï∑®ÏÜå
              </button>
              <button
                onClick={handleSaveCell}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #999',
                  background: saving ? '#ccc' : 'linear-gradient(to bottom, #fff, #ddd)',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '?Ä??Ï§?..' : '?Ä??}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
