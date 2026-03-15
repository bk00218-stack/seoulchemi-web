'use client'

import { useState, useEffect, useCallback } from 'react'

interface Brand {
  id: number
  name: string
  categoryId: number | null
  _count?: { products: number; productLines: number }
  productLines?: { id: number; name: string; _count?: { products: number } }[]
}

interface Product {
  id: number
  name: string
  brandId: number
  productLineId: number | null
  sellingPrice: number
  purchasePrice: number
  retailPrice?: number
  isActive: boolean
}

interface BulkManageModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  toast: { success: (msg: string) => void; error: (msg: string) => void }
  categoryId: number | null
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 0, width: 900, maxWidth: '95vw', maxHeight: '90vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
  color: active ? '#2d5a2d' : '#666', background: active ? '#fff' : '#f5f5f5',
  borderBottom: active ? '2px solid #2d5a2d' : '2px solid transparent',
})

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minWidth: 200,
}

const btnStyle = (variant: 'primary' | 'danger' | 'default' = 'default'): React.CSSProperties => ({
  padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  background: variant === 'primary' ? '#2d5a2d' : variant === 'danger' ? '#dc3545' : '#e9ecef',
  color: variant === 'default' ? '#333' : '#fff',
})

type Tab = 'merge' | 'lines' | 'move' | 'price' | 'action'

interface ProductLineItem {
  id: number
  name: string
  brandId: number
  isActive: boolean
  _count?: { products: number }
}

export default function BulkManageModal({ isOpen, onClose, onComplete, toast, categoryId }: BulkManageModalProps) {
  const [tab, setTab] = useState<Tab>('merge')
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)

  // Merge state
  const [sourceBrandIds, setSourceBrandIds] = useState<Set<number>>(new Set())
  const [targetBrandId, setTargetBrandId] = useState<number | null>(null)

  // Move state
  const [moveBrandId, setMoveBrandId] = useState<number | null>(null)
  const [moveProducts, setMoveProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [moveTargetBrandId, setMoveTargetBrandId] = useState<number | null>(null)
  const [moveTargetLineId, setMoveTargetLineId] = useState<number | null>(null)
  const [targetLines, setTargetLines] = useState<{ id: number; name: string }[]>([])

  // Price state
  const [priceBrandId, setPriceBrandId] = useState<number | null>(null)
  const [priceProducts, setPriceProducts] = useState<Product[]>([])
  const [selectedPriceIds, setSelectedPriceIds] = useState<Set<number>>(new Set())
  const [priceType, setPriceType] = useState<string>('sellingPrice')
  const [priceMethod, setPriceMethod] = useState<string>('percent')
  const [priceValue, setPriceValue] = useState<string>('')

  // Lines state
  const [linesBrandId, setLinesBrandId] = useState<number | null>(null)
  const [linesData, setLinesData] = useState<ProductLineItem[]>([])
  const [sourceLineIds, setSourceLineIds] = useState<Set<number>>(new Set())
  const [targetLineId, setTargetLineId] = useState<number | null>(null)
  const [linesAction, setLinesAction] = useState<string>('merge') // merge | delete

  // Action state
  const [actionBrandIds, setActionBrandIds] = useState<Set<number>>(new Set())
  const [actionType, setActionType] = useState<string>('deactivate')

  const fetchBrands = useCallback(async () => {
    if (!categoryId) return
    try {
      const res = await fetch(`/api/brands?categoryId=${categoryId}`)
      const data = await res.json()
      setBrands(data.brands || [])
    } catch { /* ignore */ }
  }, [categoryId])

  useEffect(() => {
    if (isOpen) fetchBrands()
  }, [isOpen, fetchBrands])

  // 브랜드 선택 시 상품 로드
  const loadProducts = async (brandId: number, setter: (p: Product[]) => void) => {
    try {
      const res = await fetch(`/api/products?brandId=${brandId}`)
      const data = await res.json()
      setter((data.products || []).filter((p: Product) => p.isActive))
    } catch { setter([]) }
  }

  // Lines: 브랜드 선택 시 품목 로드
  const loadLines = async (brandId: number) => {
    try {
      const res = await fetch(`/api/product-lines?brandId=${brandId}`)
      const data = await res.json()
      setLinesData(data.productLines || data || [])
    } catch { setLinesData([]) }
  }

  // Move: 대상 브랜드 선택 시 품목 로드
  useEffect(() => {
    if (!moveTargetBrandId) { setTargetLines([]); return }
    const brand = brands.find(b => b.id === moveTargetBrandId)
    setTargetLines(brand?.productLines || [])
    setMoveTargetLineId(null)
  }, [moveTargetBrandId, brands])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (tab === 'merge') {
        if (sourceBrandIds.size === 0 || !targetBrandId) { toast.error('원본/대상 브랜드를 선택해주세요'); return }
        const res = await fetch('/api/brands/merge', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceBrandIds: [...sourceBrandIds], targetBrandId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (tab === 'lines') {
        if (sourceLineIds.size === 0) { toast.error('품목을 선택해주세요'); return }
        if (linesAction === 'merge') {
          if (!targetLineId) { toast.error('대상 품목을 선택해주세요'); return }
          const res = await fetch('/api/product-lines/merge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceLineIds: [...sourceLineIds], targetLineId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)
        } else {
          // delete: bulk-action with productLineIds
          const res = await fetch('/api/brands/bulk-action', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', productLineIds: [...sourceLineIds] }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          toast.success(data.message)
        }
      }

      if (tab === 'move') {
        if (selectedProductIds.size === 0) { toast.error('상품을 선택해주세요'); return }
        if (!moveTargetBrandId) { toast.error('대상 브랜드를 선택해주세요'); return }
        const res = await fetch('/api/products/bulk-move', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [...selectedProductIds],
            targetBrandId: moveTargetBrandId,
            targetProductLineId: moveTargetLineId,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (tab === 'price') {
        const ids = selectedPriceIds.size > 0 ? [...selectedPriceIds] : priceProducts.map(p => p.id)
        if (ids.length === 0) { toast.error('상품을 선택해주세요'); return }
        if (!priceValue) { toast.error('값을 입력해주세요'); return }
        const res = await fetch('/api/products/bulk-price', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: ids, priceType, method: priceMethod, value: Number(priceValue) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      if (tab === 'action') {
        if (actionBrandIds.size === 0) { toast.error('브랜드를 선택해주세요'); return }
        const res = await fetch('/api/brands/bulk-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: actionType, brandIds: [...actionBrandIds] }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(data.message)
      }

      onComplete()
      onClose()
    } catch (err: any) {
      toast.error(err.message || '작업에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedSourceBrands = brands.filter(b => sourceBrandIds.has(b.id))
  const targetBrand = brands.find(b => b.id === targetBrandId)

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>일괄 관리</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', background: '#f5f5f5' }}>
          <button style={tabBtnStyle(tab === 'merge')} onClick={() => setTab('merge')}>브랜드 통합</button>
          <button style={tabBtnStyle(tab === 'lines')} onClick={() => setTab('lines')}>품목 관리</button>
          <button style={tabBtnStyle(tab === 'move')} onClick={() => setTab('move')}>상품 이동</button>
          <button style={tabBtnStyle(tab === 'price')} onClick={() => setTab('price')}>가격 일괄수정</button>
          <button style={tabBtnStyle(tab === 'action')} onClick={() => setTab('action')}>일괄 삭제/상태</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto', minHeight: 400 }}>

          {/* ===== 브랜드 통합 ===== */}
          {tab === 'merge' && (
            <div>
              <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>원본 브랜드(여러 개 선택 가능)의 모든 품목·상품을 대상 브랜드로 이동하고, 원본을 비활성화합니다.</p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>대상 (합쳐질 브랜드)</label>
                  <select style={selectStyle} value={targetBrandId || ''} onChange={e => setTargetBrandId(Number(e.target.value) || null)}>
                    <option value="">선택</option>
                    {brands.filter(b => !sourceBrandIds.has(b.id)).map(b => <option key={b.id} value={b.id}>{b.name} ({b._count?.products || 0}개)</option>)}
                  </select>
                </div>
              </div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>원본 (합칠 브랜드 선택)</label>
              <div style={{ border: '1px solid #eee', borderRadius: 8, maxHeight: 250, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                        <input type="checkbox"
                          checked={sourceBrandIds.size === brands.filter(b => b.id !== targetBrandId).length && brands.filter(b => b.id !== targetBrandId).length > 0}
                          onChange={e => setSourceBrandIds(e.target.checked ? new Set(brands.filter(b => b.id !== targetBrandId).map(b => b.id)) : new Set())}
                        />
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>브랜드명</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>품목 수</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>상품 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.filter(b => b.id !== targetBrandId).map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid #f0f0f0', background: sourceBrandIds.has(b.id) ? '#f0f7f0' : 'transparent' }}>
                        <td style={{ padding: '6px 12px' }}>
                          <input type="checkbox" checked={sourceBrandIds.has(b.id)}
                            onChange={e => { const s = new Set(sourceBrandIds); e.target.checked ? s.add(b.id) : s.delete(b.id); setSourceBrandIds(s) }} />
                        </td>
                        <td style={{ padding: '6px 12px' }}>{b.name}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{b._count?.productLines || 0}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{b._count?.products || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sourceBrandIds.size > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#2d5a2d' }}>{sourceBrandIds.size}개 브랜드 선택됨</div>
              )}
              {selectedSourceBrands.length > 0 && targetBrand && (
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, fontSize: 14, marginTop: 12 }}>
                  <strong>미리보기:</strong>
                  <div style={{ marginTop: 8 }}>
                    • {selectedSourceBrands.map(b => b.name).join(', ')} →
                    <strong> {targetBrand.name}</strong>으로 통합
                  </div>
                  <div>
                    • 총 품목 {selectedSourceBrands.reduce((sum, b) => sum + (b._count?.productLines || 0), 0)}개,
                    상품 {selectedSourceBrands.reduce((sum, b) => sum + (b._count?.products || 0), 0)}개 이동
                  </div>
                  <div>• 원본 {selectedSourceBrands.length}개 브랜드는 비활성화됩니다.</div>
                </div>
              )}
            </div>
          )}

          {/* ===== 품목 관리 ===== */}
          {tab === 'lines' && (
            <div>
              <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>브랜드를 선택 후, 품목을 통합하거나 삭제할 수 있습니다.</p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>브랜드</label>
                  <select style={selectStyle} value={linesBrandId || ''} onChange={e => {
                    const id = Number(e.target.value) || null
                    setLinesBrandId(id)
                    setSourceLineIds(new Set())
                    setTargetLineId(null)
                    if (id) loadLines(id)
                    else setLinesData([])
                  }}>
                    <option value="">선택</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name} ({b._count?.productLines || 0}개 품목)</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>작업</label>
                  <select style={selectStyle} value={linesAction} onChange={e => { setLinesAction(e.target.value); setTargetLineId(null) }}>
                    <option value="merge">품목 통합</option>
                    <option value="delete">품목 삭제 (비활성화)</option>
                  </select>
                </div>
                {linesAction === 'merge' && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>대상 (합쳐질 품목)</label>
                    <select style={selectStyle} value={targetLineId || ''} onChange={e => setTargetLineId(Number(e.target.value) || null)}>
                      <option value="">선택</option>
                      {linesData.filter(l => !sourceLineIds.has(l.id)).map(l => <option key={l.id} value={l.id}>{l.name} ({l._count?.products || 0}개)</option>)}
                    </select>
                  </div>
                )}
              </div>
              {linesData.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: 8, maxHeight: 280, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                          <input type="checkbox"
                            checked={sourceLineIds.size === linesData.filter(l => l.id !== targetLineId).length && linesData.filter(l => l.id !== targetLineId).length > 0}
                            onChange={e => setSourceLineIds(e.target.checked ? new Set(linesData.filter(l => l.id !== targetLineId).map(l => l.id)) : new Set())}
                          />
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>품목명</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>상품 수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linesData.filter(l => l.id !== targetLineId).map(l => (
                        <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0', background: sourceLineIds.has(l.id) ? '#f0f7f0' : 'transparent' }}>
                          <td style={{ padding: '6px 12px' }}>
                            <input type="checkbox" checked={sourceLineIds.has(l.id)}
                              onChange={e => { const s = new Set(sourceLineIds); e.target.checked ? s.add(l.id) : s.delete(l.id); setSourceLineIds(s) }} />
                          </td>
                          <td style={{ padding: '6px 12px' }}>{l.name}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{l._count?.products || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sourceLineIds.size > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: linesAction === 'delete' ? '#dc3545' : '#2d5a2d' }}>
                  {sourceLineIds.size}개 품목 선택됨
                  {linesAction === 'merge' && targetLineId && (() => {
                    const target = linesData.find(l => l.id === targetLineId)
                    const totalProducts = linesData.filter(l => sourceLineIds.has(l.id)).reduce((sum, l) => sum + (l._count?.products || 0), 0)
                    return target ? ` → ${target.name}으로 상품 ${totalProducts}개 이동` : ''
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ===== 상품 이동 ===== */}
          {tab === 'move' && (
            <div>
              <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>브랜드를 선택하고, 이동할 상품을 체크한 뒤 대상을 지정하세요.</p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>원본 브랜드</label>
                  <select style={selectStyle} value={moveBrandId || ''} onChange={e => {
                    const id = Number(e.target.value) || null
                    setMoveBrandId(id)
                    setSelectedProductIds(new Set())
                    if (id) loadProducts(id, setMoveProducts)
                    else setMoveProducts([])
                  }}>
                    <option value="">선택</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>대상 브랜드</label>
                  <select style={selectStyle} value={moveTargetBrandId || ''} onChange={e => setMoveTargetBrandId(Number(e.target.value) || null)}>
                    <option value="">선택</option>
                    {brands.filter(b => b.id !== moveBrandId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>대상 품목</label>
                  <select style={selectStyle} value={moveTargetLineId || ''} onChange={e => setMoveTargetLineId(Number(e.target.value) || null)}>
                    <option value="">선택 (없으면 미지정)</option>
                    {targetLines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              {moveProducts.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: 8, maxHeight: 250, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                          <input type="checkbox"
                            checked={selectedProductIds.size === moveProducts.length}
                            onChange={e => setSelectedProductIds(e.target.checked ? new Set(moveProducts.map(p => p.id)) : new Set())}
                          />
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>상품명</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>판매가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moveProducts.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '6px 12px' }}>
                            <input type="checkbox" checked={selectedProductIds.has(p.id)}
                              onChange={e => { const s = new Set(selectedProductIds); e.target.checked ? s.add(p.id) : s.delete(p.id); setSelectedProductIds(s) }} />
                          </td>
                          <td style={{ padding: '6px 12px' }}>{p.name}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{p.sellingPrice?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedProductIds.size > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#2d5a2d' }}>{selectedProductIds.size}개 선택됨</div>
              )}
            </div>
          )}

          {/* ===== 가격 일괄수정 ===== */}
          {tab === 'price' && (
            <div>
              <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>브랜드를 선택 후, 가격 유형과 수정 방법을 지정하세요. 상품 미선택 시 전체 적용.</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>브랜드</label>
                  <select style={selectStyle} value={priceBrandId || ''} onChange={e => {
                    const id = Number(e.target.value) || null
                    setPriceBrandId(id)
                    setSelectedPriceIds(new Set())
                    if (id) loadProducts(id, setPriceProducts)
                    else setPriceProducts([])
                  }}>
                    <option value="">선택</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>가격 유형</label>
                  <select style={selectStyle} value={priceType} onChange={e => setPriceType(e.target.value)}>
                    <option value="purchasePrice">매입가</option>
                    <option value="sellingPrice">도매가</option>
                    <option value="retailPrice">소매가</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>수정 방법</label>
                  <select style={selectStyle} value={priceMethod} onChange={e => setPriceMethod(e.target.value)}>
                    <option value="set">금액 설정</option>
                    <option value="percent">% 조정</option>
                    <option value="add">금액 가감</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                    {priceMethod === 'set' ? '설정할 금액' : priceMethod === 'percent' ? '% (예: 10, -5)' : '가감액 (예: 1000, -500)'}
                  </label>
                  <input type="number" style={{ ...selectStyle, width: 140 }} value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="값 입력" />
                </div>
              </div>
              {priceProducts.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                          <input type="checkbox"
                            checked={selectedPriceIds.size === priceProducts.length && priceProducts.length > 0}
                            onChange={e => setSelectedPriceIds(e.target.checked ? new Set(priceProducts.map(p => p.id)) : new Set())}
                          />
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>상품명</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>매입가</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>도매가</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>소매가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceProducts.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '6px 12px' }}>
                            <input type="checkbox" checked={selectedPriceIds.has(p.id)}
                              onChange={e => { const s = new Set(selectedPriceIds); e.target.checked ? s.add(p.id) : s.delete(p.id); setSelectedPriceIds(s) }} />
                          </td>
                          <td style={{ padding: '6px 12px' }}>{p.name}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{p.purchasePrice?.toLocaleString()}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{p.sellingPrice?.toLocaleString()}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{(p.retailPrice || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedPriceIds.size > 0 ? (
                <div style={{ marginTop: 8, fontSize: 13, color: '#2d5a2d' }}>{selectedPriceIds.size}개 선택됨 (선택된 상품만 적용)</div>
              ) : priceProducts.length > 0 ? (
                <div style={{ marginTop: 8, fontSize: 13, color: '#888' }}>전체 {priceProducts.length}개 상품에 적용</div>
              ) : null}
            </div>
          )}

          {/* ===== 일괄 삭제/상태 ===== */}
          {tab === 'action' && (
            <div>
              <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>브랜드를 선택하고 작업을 실행합니다. 삭제 시 하위 품목·상품도 함께 비활성화됩니다.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>작업 유형</label>
                <select style={selectStyle} value={actionType} onChange={e => setActionType(e.target.value)}>
                  <option value="deactivate">비활성화</option>
                  <option value="activate">활성화</option>
                  <option value="delete">삭제 (비활성화 처리)</option>
                </select>
              </div>
              <div style={{ border: '1px solid #eee', borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                        <input type="checkbox"
                          checked={actionBrandIds.size === brands.length && brands.length > 0}
                          onChange={e => setActionBrandIds(e.target.checked ? new Set(brands.map(b => b.id)) : new Set())}
                        />
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>브랜드명</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>품목 수</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>상품 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 12px' }}>
                          <input type="checkbox" checked={actionBrandIds.has(b.id)}
                            onChange={e => { const s = new Set(actionBrandIds); e.target.checked ? s.add(b.id) : s.delete(b.id); setActionBrandIds(s) }} />
                        </td>
                        <td style={{ padding: '6px 12px' }}>{b.name}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{b._count?.productLines || 0}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{b._count?.products || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {actionBrandIds.size > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: actionType === 'delete' ? '#dc3545' : '#2d5a2d' }}>
                  {actionBrandIds.size}개 브랜드 선택됨
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={btnStyle('default')} onClick={onClose}>닫기</button>
          <button
            style={btnStyle((tab === 'action' && actionType === 'delete') || (tab === 'lines' && linesAction === 'delete') ? 'danger' : 'primary')}
            onClick={() => {
              const msg = tab === 'merge' ? `${sourceBrandIds.size}개 브랜드를 통합하시겠습니까?` :
                tab === 'lines' ? (linesAction === 'merge' ? `${sourceLineIds.size}개 품목을 통합하시겠습니까?` : `${sourceLineIds.size}개 품목을 삭제하시겠습니까?`) :
                tab === 'move' ? '상품을 이동하시겠습니까?' :
                tab === 'price' ? '가격을 수정하시겠습니까?' :
                `선택한 브랜드를 ${actionType === 'delete' ? '삭제' : actionType === 'activate' ? '활성화' : '비활성화'}하시겠습니까?`
              if (confirm(msg)) handleSubmit()
            }}
            disabled={loading}
          >
            {loading ? '처리중...' : '실행'}
          </button>
        </div>
      </div>
    </div>
  )
}
