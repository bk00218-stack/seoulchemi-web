'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { btnStyle, cardStyle, inputStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

interface Supplier {
  id: number
  name: string
  code: string
  outstandingAmount: number
}

interface Product {
  id: number
  name: string
  brand?: string
  purchasePrice: number
  sellingPrice: number
}

interface PurchaseItem {
  tempId: number
  productId: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--gray-700)',
  marginBottom: 6,
}

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 20,
}

export default function PurchaseNewPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Form state
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [memo, setMemo] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [saving, setSaving] = useState(false)

  // Supplier search
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierDropdown, setSupplierDropdown] = useState(false)
  const [selectedSupplierName, setSelectedSupplierName] = useState('')

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productDropdown, setProductDropdown] = useState(false)
  const [addQuantity, setAddQuantity] = useState(1)

  // temp ID counter
  const [nextTempId, setNextTempId] = useState(1)

  // Load suppliers
  useEffect(() => {
    fetch('/api/purchase/suppliers?status=active&limit=200')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => {})
  }, [])

  // Debounced product search
  useEffect(() => {
    if (productSearch.length < 1) {
      setProductResults([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=20&simple=true`)
        .then(r => r.json())
        .then(d => {
          const products = d.products || d || []
          setProductResults(products.slice(0, 20))
        })
        .catch(() => setProductResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s =>
    s.name.includes(supplierSearch) || s.code.includes(supplierSearch)
  )

  // Select supplier
  const handleSelectSupplier = (s: Supplier) => {
    setSupplierId(s.id)
    setSelectedSupplierName(s.name)
    setSupplierSearch('')
    setSupplierDropdown(false)
  }

  // Add product to items
  const handleAddProduct = (p: Product) => {
    const existing = items.find(i => i.productId === p.id)
    if (existing) {
      setItems(prev => prev.map(i =>
        i.productId === p.id ? { ...i, quantity: i.quantity + addQuantity } : i
      ))
    } else {
      setItems(prev => [...prev, {
        tempId: nextTempId,
        productId: p.id,
        productName: p.name,
        brandName: p.brand || '',
        quantity: addQuantity,
        unitPrice: p.purchasePrice,
      }])
      setNextTempId(n => n + 1)
    }
    setProductSearch('')
    setProductDropdown(false)
    setAddQuantity(1)
    toast.success(`${p.name} 추가됨`)
  }

  // Remove item
  const handleRemoveItem = (tempId: number) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  // Update item
  const handleItemChange = (tempId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(prev => prev.map(i =>
      i.tempId === tempId ? { ...i, [field]: value } : i
    ))
  }

  // Total
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  // Submit
  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('매입처를 선택해주세요.')
      return
    }
    if (items.length === 0) {
      toast.error('상품을 1개 이상 추가해주세요.')
      return
    }
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`${item.productName}: 수량은 0보다 커야 합니다.`)
        return
      }
      if (item.unitPrice <= 0) {
        toast.error(`${item.productName}: 단가는 0보다 커야 합니다.`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          purchasedAt: purchaseDate,
          memo,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '매입 등록에 실패했습니다.')
      }

      const result = await res.json()
      toast.success(`매입 등록 완료 (${result.purchaseNo})`)
      router.push('/purchase')
    } catch (err: any) {
      toast.error(err.message || '매입 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>매입 등록</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입처를 선택하고 상품을 추가하세요</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
        {/* 기본 정보 */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>기본 정보</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* 매입일자 */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>매입일자 *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>

            {/* 매입처 */}
            <div style={{ ...fieldGroupStyle, position: 'relative' }}>
              <label style={labelStyle}>매입처 *</label>
              {selectedSupplierName ? (
                <div style={{
                  ...inputStyle, width: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  background: '#f0f9ff', borderColor: '#667eea',
                }}>
                  <span style={{ fontWeight: 600, color: '#667eea' }}>{selectedSupplierName}</span>
                  <button
                    onClick={() => { setSupplierId(null); setSelectedSupplierName('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="매입처 검색..."
                    value={supplierSearch}
                    onChange={e => { setSupplierSearch(e.target.value); setSupplierDropdown(true) }}
                    onFocus={() => setSupplierDropdown(true)}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                  {supplierDropdown && filteredSuppliers.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      background: '#fff', border: '1px solid var(--gray-200)',
                      borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      maxHeight: 200, overflowY: 'auto',
                    }}>
                      {filteredSuppliers.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSupplier(s)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-50)',
                            fontSize: 14,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: 'var(--gray-400)', marginLeft: 8, fontSize: 12 }}>({s.code})</span>
                          {s.outstandingAmount > 0 && (
                            <span style={{ float: 'right', color: '#ef4444', fontSize: 12 }}>
                              미납 {s.outstandingAmount.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 비고 */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>비고</label>
            <textarea
              placeholder="비고사항을 입력하세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={2}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* 상품 추가 */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>상품 추가</h2>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={labelStyle}>상품 검색</label>
              <input
                type="text"
                placeholder="상품명 또는 브랜드로 검색..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setProductDropdown(true) }}
                onFocus={() => { if (productResults.length > 0) setProductDropdown(true) }}
                style={{ ...inputStyle, width: '100%' }}
              />
              {productDropdown && productResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: '#fff', border: '1px solid var(--gray-200)',
                  borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxHeight: 250, overflowY: 'auto',
                }}>
                  {productResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-50)',
                        fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <div>
                        {p.brand && (
                          <span style={{
                            background: '#f0f0ff', color: '#667eea', padding: '2px 6px',
                            borderRadius: 4, fontSize: 11, fontWeight: 600, marginRight: 8,
                          }}>
                            {p.brand}
                          </span>
                        )}
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                      </div>
                      <span style={{ color: 'var(--gray-500)', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 12 }}>
                        매입 {p.purchasePrice.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ width: 100 }}>
              <label style={labelStyle}>수량</label>
              <input
                type="number"
                min={1}
                value={addQuantity}
                onChange={e => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ ...inputStyle, width: '100%', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* 추가된 상품 목록 */}
          {items.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 100px 120px 120px 40px',
                gap: 0,
                background: 'var(--gray-50)',
                borderRadius: '8px 8px 0 0',
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--gray-500)',
              }}>
                <span>#</span>
                <span>상품명</span>
                <span style={{ textAlign: 'center' }}>수량</span>
                <span style={{ textAlign: 'right' }}>단가</span>
                <span style={{ textAlign: 'right' }}>소계</span>
                <span></span>
              </div>
              {items.map((item, idx) => (
                <div
                  key={item.tempId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 100px 120px 120px 40px',
                    gap: 0,
                    padding: '12px',
                    borderBottom: '1px solid var(--gray-100)',
                    alignItems: 'center',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{idx + 1}</span>
                  <div>
                    {item.brandName && (
                      <span style={{
                        background: '#f0f0ff', color: '#667eea', padding: '1px 5px',
                        borderRadius: 3, fontSize: 11, fontWeight: 600, marginRight: 6,
                      }}>
                        {item.brandName}
                      </span>
                    )}
                    <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{item.productName}</span>
                  </div>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={item.quantity}
                    onChange={e => handleItemChange(item.tempId, 'quantity', parseFloat(e.target.value) || 1)}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center', padding: '6px 8px', fontSize: 13, margin: '0 auto' }}
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={e => handleItemChange(item.tempId, 'unitPrice', parseInt(e.target.value) || 0)}
                    style={{ ...inputStyle, width: '100px', textAlign: 'right', padding: '6px 8px', fontSize: 13, marginLeft: 'auto' }}
                  />
                  <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gray-900)' }}>
                    {(item.quantity * item.unitPrice).toLocaleString()}원
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.tempId)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ef4444', fontSize: 16, padding: 4,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* 합계 */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                padding: '16px 12px', background: '#f8fafc',
                borderRadius: '0 0 8px 8px', gap: 20,
              }}>
                <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                  {items.length}개 품목 · 총 수량 {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)', marginRight: 8 }}>합계</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#667eea' }}>
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div style={{
              marginTop: 20, padding: 40, textAlign: 'center',
              background: 'var(--gray-50)', borderRadius: 8, color: 'var(--gray-400)',
              fontSize: 13,
            }}>
              상품을 검색하여 추가해주세요
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-600)', border: 'none' }}
            onClick={() => router.push('/purchase')}
          >
            취소
          </button>
          <button
            style={{
              ...btnStyle, background: '#667eea', color: '#fff', border: 'none',
              opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '등록 중...' : `매입 등록 (${totalAmount.toLocaleString()}원)`}
          </button>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(supplierDropdown || productDropdown) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          onClick={() => { setSupplierDropdown(false); setProductDropdown(false) }}
        />
      )}
    </Layout>
  )
}
