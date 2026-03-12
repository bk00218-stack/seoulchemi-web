'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NoticePopup from '../components/NoticePopup'
import NoticeBanner from '../components/NoticeBanner'
import DiopterSelectModal from '../components/DiopterSelectModal'
import { useCart } from '@/contexts/StoreCartContext'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Brand {
  id: number
  name: string
  productCount: number
}

interface Product {
  id: number
  name: string
  brandId: number
  brand: string
  optionType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  retailPrice: number
  imageUrl?: string | null
}

const PAGE_SIZE = 30

export default function StoreProductsPage() {
  const { items: cart, addItem, addItemWithDiopter, updateQty, removeItem, totalCount, totalPrice } = useCart()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [addedProduct, setAddedProduct] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  
  // 도수 선택 모달
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDiopterModal, setShowDiopterModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedBrand, searchTerm])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
      setBrands(data.brands?.map((b: { id: number; name: string }) => ({
        id: b.id,
        name: b.name,
        productCount: (data.products || []).filter((p: Product) => p.brandId === b.id).length
      })) || [])
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesBrand = !selectedBrand || p.brandId === selectedBrand
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesBrand && matchesSearch
  })

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = filteredProducts.length > visibleCount

  // 상품 클릭 처리
  const handleProductClick = (product: Product) => {
    // 여벌렌즈는 도수 선택 모달 표시
    if (product.optionType === '안경렌즈 여벌' || product.optionType === '여벌') {
      setSelectedProduct(product)
      setShowDiopterModal(true)
    } else {
      // RX, 콘택트렌즈 등은 바로 장바구니에 담기
      addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        optionType: product.optionType,
        price: product.retailPrice,
      })
      setAddedProduct(product.name)
      setTimeout(() => setAddedProduct(null), 2000)
    }
  }

  // 도수 선택 후 장바구니 담기
  const handleAddWithDiopter = (sph: string, cyl: string, qty: number, price: number) => {
    if (selectedProduct) {
      addItemWithDiopter(
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          optionType: selectedProduct.optionType,
          price: price,
        },
        sph,
        cyl,
        qty
      )
      setAddedProduct(`${selectedProduct.name} (${sph}/${cyl})`)
      setTimeout(() => setAddedProduct(null), 2000)
    }
  }

  // 장바구니에서 해당 상품 수량 가져오기
  const getCartQty = (product: Product): number => {
    return cart
      .filter(c => c.id === product.id)
      .reduce((sum, c) => sum + c.qty, 0)
  }

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  return (
    <div style={{ marginRight: isMobile ? 0 : 280 }}>
      <NoticePopup />
      <NoticeBanner />

      {/* Page Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          상품 주문
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          원하시는 렌즈를 선택하여 주문하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 16,
        marginBottom: isMobile ? 16 : 24,
      }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #007aff', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: 12, color: '#86868b' }}>전체 상품</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#007aff', marginTop: 4 }}>{products.length}<span style={{ fontSize: 14, fontWeight: 400 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #34c759', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: 12, color: '#86868b' }}>브랜드</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#34c759', marginTop: 4 }}>{brands.length}<span style={{ fontSize: 14, fontWeight: 400 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ff9500', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: 12, color: '#86868b' }}>장바구니</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#ff9500', marginTop: 4 }}>{totalCount}<span style={{ fontSize: 14, fontWeight: 400 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #af52de', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: 12, color: '#86868b' }}>주문금액</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#af52de', marginTop: 4 }}>
            {totalPrice.toLocaleString()}
            <span style={{ fontSize: 14, fontWeight: 400 }}>원</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 20 }}>
        {/* Brands - Horizontal scroll on mobile, sidebar on desktop */}
        {isMobile ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <button
                onClick={() => setSelectedBrand(null)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none',
                  background: !selectedBrand ? '#007aff' : '#f5f5f7',
                  color: !selectedBrand ? 'white' : '#1d1d1f',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                전체 ({products.length})
              </button>
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, border: 'none',
                    background: selectedBrand === brand.id ? '#007aff' : '#f5f5f7',
                    color: selectedBrand === brand.id ? 'white' : '#1d1d1f',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {brand.name} ({brand.productCount})
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, width: 220, flexShrink: 0, height: 'fit-content', position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>브랜드</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setSelectedBrand(null)}
                style={{
                  padding: '10px 12px', borderRadius: 8, border: 'none',
                  background: !selectedBrand ? '#007aff' : 'transparent',
                  color: !selectedBrand ? 'white' : '#1d1d1f',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                }}
              >
                전체 ({products.length})
              </button>
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: selectedBrand === brand.id ? '#007aff' : 'transparent',
                    color: selectedBrand === brand.id ? 'white' : '#1d1d1f',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {brand.name} ({brand.productCount})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {/* Search */}
          <div style={{ ...cardStyle, marginBottom: 16, padding: isMobile ? 12 : 16 }}>
            <input
              type="text"
              placeholder="상품명, 브랜드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', fontSize: 14,
                border: '1px solid #e9ecef', borderRadius: 10,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {searchTerm && (
              <div style={{ fontSize: 12, color: '#86868b', marginTop: 8 }}>
                검색 결과: {filteredProducts.length}개
              </div>
            )}
          </div>

          {/* Products */}
          <div style={cardStyle}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>로딩 중...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>상품이 없습니다</div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: isMobile ? 8 : 16,
                }}>
                  {visibleProducts.map(product => {
                    const cartQty = getCartQty(product)
                    const isSpare = product.optionType === '안경렌즈 여벌' || product.optionType === '여벌'
                    const hasImage = !!product.imageUrl
                    return (
                      <div
                        key={product.id}
                        style={{
                          border: cartQty > 0 ? '2px solid #007aff' : '1px solid #e9ecef',
                          borderRadius: 12,
                          transition: 'all 0.2s', cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: hasImage && !isMobile ? 'row' : 'column',
                          overflow: 'hidden',
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        {cartQty > 0 && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8,
                            background: '#007aff', color: 'white',
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 10,
                            zIndex: 1,
                          }}>
                            {cartQty}개
                          </div>
                        )}
                        {hasImage && (
                          <div style={{
                            flexShrink: 0,
                            width: isMobile ? '100%' : 110,
                            height: isMobile ? 100 : 'auto',
                            minHeight: isMobile ? undefined : 110,
                            background: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8,
                          }}>
                            <img
                              src={product.imageUrl!}
                              alt={product.name}
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'contain',
                                borderRadius: 6,
                              }}
                            />
                          </div>
                        )}
                        <div style={{
                          flex: 1, minWidth: 0,
                          padding: isMobile ? 10 : 14,
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        }}>
                          <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600, marginBottom: 2 }}>
                            {product.brand}
                          </div>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>
                            {product.bundleName || product.optionType}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#1d1d1f' }}>
                              {product.retailPrice?.toLocaleString()}원
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleProductClick(product) }}
                              style={{
                                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                color: 'white',
                                background: isSpare ? '#34c759' : '#007aff',
                                border: 'none', borderRadius: 6, cursor: 'pointer',
                              }}
                            >
                              {isSpare ? '도수선택' : '담기'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setVisibleCount(prev => prev + PAGE_SIZE) }}
                      style={{
                        padding: '12px 32px', fontSize: 14, fontWeight: 600,
                        color: '#007aff', background: '#f0f7ff',
                        border: '1px solid #007aff', borderRadius: 10, cursor: 'pointer',
                      }}
                    >
                      더보기 ({filteredProducts.length - visibleCount}개 남음)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Added notification */}
      {addedProduct && (
        <div style={{
          position: 'fixed', top: 80, right: isMobile ? 24 : 300,
          background: '#34c759', color: 'white',
          padding: '12px 20px', borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: 14, fontWeight: 500, zIndex: 1000,
        }}>
          ✓ {addedProduct} 장바구니에 담김
        </div>
      )}

      {/* Mobile: Floating Cart Button */}
      {isMobile && totalCount > 0 && (
        <Link
          href="/store/cart"
          style={{
            position: 'fixed', bottom: 24, right: 24,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #007aff, #0056b3)',
            color: 'white', borderRadius: 50, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,122,255,0.4)',
            fontSize: 13, fontWeight: 600,
          }}
        >
          <span>🛒</span>
          <span>장바구니 ({totalCount})</span>
        </Link>
      )}

      {/* Desktop: Fixed Cart Sidebar */}
      {!isMobile && (
        <div style={{
          position: 'fixed', top: 64, right: 0, bottom: 0,
          width: 280, background: 'white',
          borderLeft: '1px solid #e9ecef',
          display: 'flex', flexDirection: 'column',
          zIndex: 100,
        }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>🛒 장바구니</span>
              <span style={{ fontSize: 12, color: '#007aff', fontWeight: 600 }}>{totalCount}개</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#86868b', fontSize: 13 }}>
                장바구니가 비어있습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cart.map((item) => {
                  const cartKey = item.sph && item.cyl ? `${item.id}-${item.sph}-${item.cyl}` : `${item.id}`
                  return (
                    <div key={cartKey} style={{
                      padding: '10px 12px', background: '#f8f9fa', borderRadius: 10, fontSize: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600 }}>{item.brand}</div>
                          <div style={{ fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          {item.sph && item.cyl && (
                            <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>
                              SPH {item.sph} / CYL {item.cyl}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(cartKey)}
                          style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: 14, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}
                        >×</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => updateQty(cartKey, -0.5)} style={{ width: 22, height: 22, border: '1px solid #e0e0e0', borderRadius: 4, background: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1)}</span>
                          <button onClick={() => updateQty(cartKey, 0.5)} style={{ width: 22, height: 22, border: '1px solid #e0e0e0', borderRadius: 4, background: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <span style={{ fontWeight: 700, color: '#1d1d1f' }}>{(item.price * item.qty).toLocaleString()}원</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {totalCount > 0 && (
            <div style={{ padding: 12, borderTop: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#86868b' }}>합계</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f' }}>{totalPrice.toLocaleString()}원</span>
              </div>
              <button
                onClick={() => router.push('/store/cart')}
                style={{
                  width: '100%', padding: '12px', fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #007aff, #0056b3)',
                  color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                }}
              >
                주문하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Diopter Select Modal */}
      {showDiopterModal && selectedProduct && (
        <DiopterSelectModal
          product={selectedProduct}
          onClose={() => {
            setShowDiopterModal(false)
            setSelectedProduct(null)
          }}
          onAdd={handleAddWithDiopter}
        />
      )}
    </div>
  )
}
