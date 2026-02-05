'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/app/components/Navigation'

interface Store {
  id: number
  name: string
  code: string
  phone?: string
  outstandingAmount: number
  creditLimit: number
}

interface Product {
  id: number
  name: string
  brandId: number
  brandName: string
  optionType: string
  sellingPrice: number
  hasSph: boolean
  hasCyl: boolean
  options?: {
    id: number
    sph?: string
    cyl?: string
    optionName?: string
    stock: number
  }[]
}

interface CartItem {
  id: string
  productId: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sph?: string
  cyl?: string
  axis?: string
  memo?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 상태
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [storeSearch, setStoreSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<number | 'all'>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // 도수 입력
  const [sph, setSph] = useState('')
  const [cyl, setCyl] = useState('')
  const [axis, setAxis] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    fetchStores()
    fetchProducts()
    fetchBrands()
  }, [])

  const fetchStores = async () => {
    const res = await fetch('/api/stores?limit=500&isActive=true')
    if (res.ok) {
      const data = await res.json()
      setStores(data.stores || [])
    }
  }

  const fetchProducts = async () => {
    const res = await fetch('/api/products?limit=500&isActive=true')
    if (res.ok) {
      const data = await res.json()
      setProducts(data.products || [])
    }
  }

  const fetchBrands = async () => {
    const res = await fetch('/api/brands')
    if (res.ok) {
      const data = await res.json()
      setBrands(data.brands || [])
    }
  }

  // 가맹점 필터링
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.code.toLowerCase().includes(storeSearch.toLowerCase())
  )

  // 상품 필터링
  const filteredProducts = products.filter(product => {
    const matchesBrand = selectedBrand === 'all' || product.brandId === selectedBrand
    const matchesSearch = productSearch === '' ||
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.brandName.toLowerCase().includes(productSearch.toLowerCase())
    return matchesBrand && matchesSearch
  })

  // 장바구니에 추가
  const addToCart = () => {
    if (!selectedProduct) return

    const item: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      brandName: selectedProduct.brandName,
      quantity: qty,
      unitPrice: selectedProduct.sellingPrice,
      totalPrice: selectedProduct.sellingPrice * qty,
      sph: sph || undefined,
      cyl: cyl || undefined,
      axis: axis || undefined,
    }

    setCart([...cart, item])
    setSelectedProduct(null)
    setShowProductModal(false)
    setSph('')
    setCyl('')
    setAxis('')
    setQty(1)
  }

  // 장바구니에서 제거
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  // 수량 변경
  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty }
        : item
    ))
  }

  // 총액 계산
  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  // 주문 제출
  const handleSubmit = async () => {
    if (!selectedStore) {
      alert('가맹점을 선택해주세요.')
      return
    }
    if (cart.length === 0) {
      alert('상품을 추가해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.id,
          orderType: 'stock',
          memo,
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            brandName: item.brandName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            sph: item.sph,
            cyl: item.cyl,
            axis: item.axis,
            memo: item.memo,
          }))
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`주문이 등록되었습니다!\n주문번호: ${data.order.orderNo}`)
        router.push('/admin/orders')
      } else {
        const data = await res.json()
        alert(data.error || '주문 등록에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 빠른 상품 선택
  const quickSelectProduct = (product: Product) => {
    if (product.hasSph || product.hasCyl) {
      setSelectedProduct(product)
      setShowProductModal(true)
    } else {
      // 도수 필요 없는 상품은 바로 추가
      const item: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        brandName: product.brandName,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice,
      }
      setCart([...cart, item])
    }
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          주문 등록
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          새 주문을 등록합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* 왼쪽: 상품 선택 */}
        <div>
          {/* 가맹점 선택 */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>가맹점</h2>
              {selectedStore && (
                <button
                  onClick={() => setSelectedStore(null)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  변경
                </button>
              )}
            </div>

            {selectedStore ? (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{selectedStore.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedStore.code} · 미수금: {selectedStore.outstandingAmount.toLocaleString()}원
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="가맹점 검색..."
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  onFocus={() => setShowStoreModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
                {showStoreModal && (
                  <div style={{
                    marginTop: '8px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)'
                  }}>
                    {filteredStores.slice(0, 20).map(store => (
                      <div
                        key={store.id}
                        onClick={() => {
                          setSelectedStore(store)
                          setShowStoreModal(false)
                          setStoreSearch('')
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{store.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{store.code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 상품 검색 */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>상품 선택</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="상품명 검색... (단축키: /)"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
              <select
                value={selectedBrand === 'all' ? 'all' : selectedBrand}
                onChange={e => setSelectedBrand(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">전체 브랜드</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* 상품 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {filteredProducts.slice(0, 50).map(product => (
                <div
                  key={product.id}
                  onClick={() => quickSelectProduct(product)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: 'var(--bg-primary)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    {product.brandName}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)'
                  }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                    {product.sellingPrice.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 장바구니 */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '20px',
          position: 'sticky',
          top: '80px',
          height: 'fit-content'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            주문 내역 ({cart.length})
          </h2>

          {cart.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              상품을 선택해주세요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '300px', overflow: 'auto' }}>
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.brandName}</div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</div>
                      {(item.sph || item.cyl) && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {item.sph && `SPH: ${item.sph}`} {item.cyl && `CYL: ${item.cyl}`}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'var(--danger-light)',
                        color: 'var(--danger)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 500, minWidth: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.totalPrice.toLocaleString()}원</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 메모 */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="메모 (선택)"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* 총액 */}
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>총 금액</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 주문 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedStore || cart.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: submitting || !selectedStore || cart.length === 0
                ? 'var(--text-tertiary)'
                : 'var(--primary)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: submitting || !selectedStore || cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '등록 중...' : '주문 등록'}
          </button>
        </div>
      </div>

      {/* 도수 입력 모달 */}
      {showProductModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {selectedProduct.brandName} {selectedProduct.name}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              도수를 입력해주세요
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {selectedProduct.hasSph && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>SPH</label>
                  <input
                    type="text"
                    value={sph}
                    onChange={e => setSph(e.target.value)}
                    placeholder="-2.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              )}
              {selectedProduct.hasCyl && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>CYL</label>
                  <input
                    type="text"
                    value={cyl}
                    onChange={e => setCyl(e.target.value)}
                    placeholder="-1.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>수량</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(parseInt(e.target.value) || 1)}
                min={1}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedProduct(null)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                취소
              </button>
              <button
                onClick={addToCart}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
