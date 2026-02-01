'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: number
  name: string
  brandName: string
  optionType: string
  refractiveIndex: string | null
  sellingPrice: number
  hasSph: boolean
  hasCyl: boolean
  hasAxis: boolean
}

interface Store {
  id: number
  name: string
  code: string
}

interface SelectedProduct {
  product: Product
  sph: string
  cyl: string
  axis: string
  quantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Record<string, Product[]>>({})
  const [storeId, setStoreId] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores)
    fetch('/api/products').then(r => r.json()).then(data => {
      const grouped: Record<string, Product[]> = {}
      data.forEach((p: Product) => {
        if (!grouped[p.brandName]) grouped[p.brandName] = []
        grouped[p.brandName].push(p)
      })
      setProducts(grouped)
    })
  }, [])

  const addProduct = (product: Product) => {
    if (selectedProducts.find(sp => sp.product.id === product.id)) return
    setSelectedProducts([...selectedProducts, {
      product,
      sph: '0.00',
      cyl: '0.00', 
      axis: '0',
      quantity: 1
    }])
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== productId))
  }

  const updatePrescription = (productId: number, field: string, value: string) => {
    setSelectedProducts(selectedProducts.map(sp => 
      sp.product.id === productId ? { ...sp, [field]: value } : sp
    ))
  }

  const totalAmount = selectedProducts.reduce((sum, sp) => 
    sum + sp.product.sellingPrice * sp.quantity, 0
  )

  const handleSubmit = async () => {
    if (!storeId || selectedProducts.length === 0) {
      alert('가맹점과 상품을 선택해주세요.')
      return
    }
    
    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: parseInt(storeId),
        memo,
        items: selectedProducts.map(sp => ({
          productId: sp.product.id,
          quantity: sp.quantity,
          sph: sp.sph,
          cyl: sp.cyl,
          axis: sp.axis
        }))
      })
    })
    
    if (res.ok) {
      router.push('/orders')
    } else {
      alert('주문 생성 실패')
    }
    setLoading(false)
  }

  // SPH/CYL 옵션 생성
  const sphOptions = []
  for (let i = -20; i <= 8; i += 0.25) {
    sphOptions.push(i.toFixed(2))
  }
  
  const cylOptions = []
  for (let i = 0; i >= -6; i -= 0.25) {
    cylOptions.push(i.toFixed(2))
  }

  const axisOptions = []
  for (let i = 0; i <= 180; i += 5) {
    axisOptions.push(i.toString())
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        borderBottom: '2px solid #333', 
        paddingBottom: '20px', 
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>🛒 새 주문</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>모바일글라스</p>
        </div>
        <a href="/orders" style={{ color: '#0066cc', textDecoration: 'none' }}>← 주문목록</a>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* 왼쪽: 상품 선택 */}
        <div>
          {/* 가맹점 선택 */}
          <section style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '16px' }}>1️⃣ 가맹점</h2>
            <select 
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">선택하세요</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </section>

          {/* 상품 선택 */}
          <section style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ margin: '0 0 15px', fontSize: '16px' }}>2️⃣ 상품 선택</h2>
            
            {Object.entries(products).map(([brand, brandProducts]) => (
              <div key={brand} style={{ marginBottom: '15px' }}>
                <h3 style={{ 
                  margin: '0 0 8px', 
                  fontSize: '13px', 
                  color: '#666',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '4px'
                }}>
                  {brand} ({brandProducts.length})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {brandProducts.map(product => {
                    const isSelected = selectedProducts.some(sp => sp.product.id === product.id)
                    return (
                      <button
                        key={product.id}
                        onClick={() => isSelected ? removeProduct(product.id) : addProduct(product)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          border: isSelected ? '2px solid #4caf50' : '1px solid #ddd',
                          borderRadius: '4px',
                          background: isSelected ? '#e8f5e9' : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {product.name}
                        <span style={{ color: '#999', marginLeft: '4px' }}>
                          {product.sellingPrice.toLocaleString()}원
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* 오른쪽: 선택한 상품 + 도수 입력 */}
        <div>
          <div style={{ 
            position: 'sticky', 
            top: '20px',
            background: '#fff',
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>📋 선택한 상품</h2>
            
            {selectedProducts.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>
                상품을 선택하세요
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {selectedProducts.map(sp => (
                  <div 
                    key={sp.product.id}
                    style={{ 
                      padding: '12px', 
                      background: '#f5f5f5', 
                      borderRadius: '6px',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={() => removeProduct(sp.product.id)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                    
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', paddingRight: '25px' }}>
                      {sp.product.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      {sp.product.brandName} | {sp.product.sellingPrice.toLocaleString()}원
                    </div>
                    
                    {/* 도수 입력 */}
                    {sp.product.optionType !== '콘택트렌즈' && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '8px',
                        background: '#fff',
                        padding: '10px',
                        borderRadius: '4px'
                      }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#666' }}>SPH</label>
                          <select
                            value={sp.sph}
                            onChange={e => updatePrescription(sp.product.id, 'sph', e.target.value)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                          >
                            {sphOptions.map(v => (
                              <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#666' }}>CYL</label>
                          <select
                            value={sp.cyl}
                            onChange={e => updatePrescription(sp.product.id, 'cyl', e.target.value)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                          >
                            {cylOptions.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#666' }}>AXIS</label>
                          <select
                            value={sp.axis}
                            onChange={e => updatePrescription(sp.product.id, 'axis', e.target.value)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                          >
                            {axisOptions.map(v => (
                              <option key={v} value={v}>{v}°</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 메모 */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>메모</label>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="주문 메모..."
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd',
                  minHeight: '60px',
                  marginTop: '4px'
                }}
              />
            </div>

            {/* 합계 */}
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '2px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px' }}>합계</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {totalAmount.toLocaleString()}원
              </span>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading || !storeId || selectedProducts.length === 0}
              style={{
                width: '100%',
                marginTop: '15px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: loading ? '#ccc' : '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '처리중...' : '📦 주문 생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
