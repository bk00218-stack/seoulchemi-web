'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import { useRouter } from 'next/navigation'

interface Supplier {
  id: number
  name: string
  code: string
}

interface Product {
  id: number
  name: string
  brandId: number
  brand: { name: string }
  purchasePrice: number
}

interface PurchaseItem {
  productId: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])

  // 상품 추가 모달
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        fetch('/api/purchase/suppliers'),
        fetch('/api/products')
      ])

      if (suppliersRes.ok) {
        const data = await suppliersRes.json()
        setSuppliers(data.suppliers)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || data)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = (product: Product) => {
    // 이미 추가된 상품인지 확인
    if (items.some(item => item.productId === product.id)) {
      alert('이미 추가된 상품입니다')
      return
    }

    setItems([...items, {
      productId: product.id,
      productName: product.name,
      brandName: product.brand.name,
      quantity: 1,
      unitPrice: product.purchasePrice
    }])
    setShowProductModal(false)
    setProductSearch('')
  }

  const updateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

  const handleSubmit = async () => {
    if (!supplierId) {
      alert('매입처를 선택해주세요')
      return
    }

    if (items.length === 0) {
      alert('상품을 추가해주세요')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          purchasedAt,
          memo,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        })
      })

      if (res.ok) {
        router.push('/admin/purchase')
      } else {
        const error = await res.json()
        alert(error.error || '등록에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to create purchase:', error)
      alert('등록에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout activeMenu="purchase">
        <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>매입 등록</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          매입처에서 입고받을 상품을 등록합니다
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* 메인 폼 */}
        <div>
          {/* 매입 정보 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>매입 정보</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  매입처 *
                </label>
                <select
                  value={supplierId || ''}
                  onChange={(e) => setSupplierId(parseInt(e.target.value) || null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px'
                  }}
                >
                  <option value="">선택하세요</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  매입일
                </label>
                <input
                  type="date"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                메모
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* 상품 목록 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>상품 목록</h2>
              <button
                onClick={() => setShowProductModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #007aff',
                  background: '#fff',
                  color: '#007aff',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                + 상품 추가
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b', background: '#f9fafb', borderRadius: '8px' }}>
                상품을 추가해주세요
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>상품</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '100px' }}>수량</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 500, width: '120px' }}>단가</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 500, width: '120px' }}>소계</th>
                    <th style={{ padding: '12px 8px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.productName}</div>
                        <div style={{ fontSize: '12px', color: '#86868b' }}>{item.brandName}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          style={{
                            width: '70px',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #e5e5e5',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                          style={{
                            width: '100px',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #e5e5e5',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500 }}>
                        {(item.quantity * item.unitPrice).toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeItem(index)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 사이드 - 요약 */}
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>주문 요약</h2>
            
            <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>상품 수</span>
                <span>{items.length}개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>총 수량</span>
                <span>{items.reduce((sum, item) => sum + item.quantity, 0)}개</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>합계</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#007aff' }}>
                {totalAmount.toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !supplierId || items.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: submitting || !supplierId || items.length === 0 ? '#e5e5e5' : '#007aff',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: submitting || !supplierId || items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? '등록 중...' : '매입 등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 상품 선택 모달 */}
      {showProductModal && (
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
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>상품 선택</h2>
              <button
                onClick={() => setShowProductModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#86868b' }}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="상품명, 브랜드 검색..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            />

            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                  검색 결과가 없습니다
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredProducts.slice(0, 50).map(product => (
                    <div
                      key={product.id}
                      onClick={() => addProduct(product)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#86868b' }}>{product.brand.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 500 }}>{product.purchasePrice.toLocaleString()}원</div>
                        <div style={{ fontSize: '12px', color: '#86868b' }}>매입가</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
