'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Product {
  id: number
  name: string
  brand: { name: string }
  sellingPrice: number
}

interface BundleItem {
  id: number
  productId: number
  quantity: number
  product?: Product
}

interface Bundle {
  id: number
  name: string
  description: string | null
  discountRate: number
  discountAmount: number
  isActive: boolean
  items: BundleItem[]
  totalPrice: number
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    discountRate: 0,
    discountAmount: 0,
    items: [] as { productId: number; quantity: number }[]
  })

  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        fetch('/api/products/bundles'),
        fetch('/api/products')
      ])

      if (bundlesRes.ok) {
        const data = await bundlesRes.json()
        setBundles(data.bundles)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingBundle(null)
    setForm({
      name: '',
      description: '',
      discountRate: 0,
      discountAmount: 0,
      items: []
    })
    setShowModal(true)
  }

  const openEditModal = (bundle: Bundle) => {
    setEditingBundle(bundle)
    setForm({
      name: bundle.name,
      description: bundle.description || '',
      discountRate: bundle.discountRate,
      discountAmount: bundle.discountAmount,
      items: bundle.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    })
    setShowModal(true)
  }

  const addProduct = (product: Product) => {
    if (form.items.some(i => i.productId === product.id)) return
    setForm({
      ...form,
      items: [...form.items, { productId: product.id, quantity: 1 }]
    })
  }

  const removeProduct = (productId: number) => {
    setForm({
      ...form,
      items: form.items.filter(i => i.productId !== productId)
    })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setForm({
      ...form,
      items: form.items.map(i => 
        i.productId === productId ? { ...i, quantity } : i
      )
    })
  }

  const handleSubmit = async () => {
    if (!form.name || form.items.length === 0) {
      alert('묶음상품명과 구성상품을 입력해주세요')
      return
    }

    try {
      const url = editingBundle 
        ? `/api/products/bundles/${editingBundle.id}`
        : '/api/products/bundles'

      const res = await fetch(url, {
        method: editingBundle ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async (bundle: Bundle) => {
    if (!confirm(`"${bundle.name}" 묶음상품을 삭제하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/products/bundles/${bundle.id}`, {
        method: 'DELETE'
      })

      if (res.ok) fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const getProductById = (id: number) => products.find(p => p.id === id)
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const calculateBundlePrice = () => {
    const total = form.items.reduce((sum, item) => {
      const product = getProductById(item.productId)
      return sum + (product?.sellingPrice || 0) * item.quantity
    }, 0)
    
    let discount = 0
    if (form.discountRate > 0) {
      discount = Math.floor(total * form.discountRate / 100)
    } else if (form.discountAmount > 0) {
      discount = form.discountAmount
    }
    
    return { total, discount, final: total - discount }
  }

  return (
    <AdminLayout activeMenu="products">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>묶음상품 설정</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          여러 상품을 묶어서 할인 판매합니다
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + 묶음상품 등록
        </button>
      </div>

      {/* 목록 */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : bundles.length === 0 ? (
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '60px', 
            textAlign: 'center',
            color: '#86868b'
          }}>
            등록된 묶음상품이 없습니다
          </div>
        ) : (
          bundles.map(bundle => {
            const discount = bundle.discountRate > 0 
              ? Math.floor(bundle.totalPrice * bundle.discountRate / 100)
              : bundle.discountAmount
            const finalPrice = bundle.totalPrice - discount

            return (
              <div 
                key={bundle.id} 
                style={{ 
                  background: '#fff', 
                  borderRadius: '12px', 
                  padding: '20px',
                  opacity: bundle.isActive ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>
                      {bundle.name}
                      {!bundle.isActive && (
                        <span style={{ 
                          marginLeft: '8px', 
                          padding: '2px 6px', 
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
                          비활성
                        </span>
                      )}
                    </h3>
                    {bundle.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: '#86868b' }}>{bundle.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(bundle)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef',
                        background: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(bundle)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 구성 상품 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {bundle.items.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        padding: '6px 12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      {item.product?.brand.name} {item.product?.name}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </div>
                  ))}
                </div>

                {/* 가격 */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                  <span style={{ color: '#86868b' }}>
                    정가: <span style={{ textDecoration: 'line-through' }}>{bundle.totalPrice.toLocaleString()}원</span>
                  </span>
                  {discount > 0 && (
                    <span style={{ color: '#dc2626' }}>
                      할인: -{discount.toLocaleString()}원
                      {bundle.discountRate > 0 && ` (${bundle.discountRate}%)`}
                    </span>
                  )}
                  <span style={{ fontWeight: 600 }}>
                    판매가: {finalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 모달 */}
      {showModal && (
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
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {editingBundle ? '묶음상품 수정' : '묶음상품 등록'}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  묶음상품명 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 누진 + 착색 세트"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  설명
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    할인율 (%)
                  </label>
                  <input
                    type="number"
                    value={form.discountRate}
                    onChange={(e) => setForm({ ...form, discountRate: parseFloat(e.target.value) || 0, discountAmount: 0 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    할인액 (원)
                  </label>
                  <input
                    type="number"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: parseInt(e.target.value) || 0, discountRate: 0 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* 상품 선택 */}
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  구성 상품 *
                </label>
                
                {/* 선택된 상품 */}
                {form.items.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {form.items.map(item => {
                      const product = getProductById(item.productId)
                      return (
                        <div 
                          key={item.productId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            background: '#f9fafb',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{product?.name}</div>
                            <div style={{ fontSize: '12px', color: '#86868b' }}>{product?.brand.name}</div>
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            {product?.sellingPrice.toLocaleString()}원
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            style={{
                              width: '60px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #e9ecef',
                              textAlign: 'center'
                            }}
                          />
                          <button
                            onClick={() => removeProduct(item.productId)}
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
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 상품 검색/추가 */}
                <input
                  type="text"
                  placeholder="상품 검색..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                
                {productSearch && (
                  <div style={{ 
                    maxHeight: '150px', 
                    overflow: 'auto', 
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}>
                    {filteredProducts.slice(0, 10).map(product => (
                      <div
                        key={product.id}
                        onClick={() => { addProduct(product); setProductSearch(''); }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px' }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: '#86868b' }}>{product.brand.name}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {product.sellingPrice.toLocaleString()}원
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 가격 미리보기 */}
              {form.items.length > 0 && (
                <div style={{ 
                  padding: '16px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {(() => {
                    const { total, discount, final } = calculateBundlePrice()
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>정가</span>
                          <span>{total.toLocaleString()}원</span>
                        </div>
                        {discount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc2626' }}>
                            <span>할인</span>
                            <span>-{discount.toLocaleString()}원</span>
                          </div>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 600,
                          paddingTop: '8px',
                          borderTop: '1px solid #e5e5e5'
                        }}>
                          <span>판매가</span>
                          <span style={{ color: '#007aff' }}>{final.toLocaleString()}원</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#007aff',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {editingBundle ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
