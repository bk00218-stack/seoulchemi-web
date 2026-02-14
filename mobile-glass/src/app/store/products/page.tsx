'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Brand {
  id: number
  name: string
  productCount: number
}

interface Product {
  id: number
  name: string
  brandId: number
  brand: string  // API returns 'brand' not 'brandName'
  optionType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
}

interface CartItem {
  id: number
  name: string
  brand: string
  price: number
  qty: number
}

export default function StoreProductsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [addedProduct, setAddedProduct] = useState<string | null>(null)

  // localStorage?êÏÑú ?•Î∞îÍµ¨Îãà Î∂àÎü¨?§Í∏∞
  useEffect(() => {
    const saved = localStorage.getItem('store-cart')
    if (saved) {
      setCart(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      // API returns { products, brands, stats }
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

  const addToCart = (product: Product) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.sellingPrice,
      qty: 1
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      let newCart: CartItem[]
      if (existing) {
        newCart = prev.map(item => 
          item.id === product.id 
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      } else {
        newCart = [...prev, cartItem]
      }
      // localStorage???Ä??
      localStorage.setItem('store-cart', JSON.stringify(newCart))
      return newCart
    })

    // Ï∂îÍ? ?åÎ¶º ?úÏãú
    setAddedProduct(product.name)
    setTimeout(() => setAddedProduct(null), 2000)
  }

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          ?ÅÌíà Ï£ºÎ¨∏
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 8 }}>
          ?êÌïò?úÎäî ?åÏ¶àÎ•??†ÌÉù?òÏó¨ Ï£ºÎ¨∏?òÏÑ∏??
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #007aff' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>?ÑÏ≤¥ ?ÅÌíà</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#007aff', marginTop: 4 }}>{products.length}<span style={{ fontSize: 14, fontWeight: 400 }}>Í∞?/span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #34c759' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Î∏åÎûú??/div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#34c759', marginTop: 4 }}>{brands.length}<span style={{ fontSize: 14, fontWeight: 400 }}>Í∞?/span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ff9500' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>?•Î∞îÍµ¨Îãà</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff9500', marginTop: 4 }}>{cart.length}<span style={{ fontSize: 14, fontWeight: 400 }}>Í∞?/span></div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #af52de' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Ï£ºÎ¨∏Í∏àÏï°</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#af52de', marginTop: 4 }}>
            {cart.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString()}
            <span style={{ fontSize: 14, fontWeight: 400 }}>??/span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Brands Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>Î∏åÎûú??/h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setSelectedBrand(null)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: !selectedBrand ? '#007aff' : 'transparent',
                  color: !selectedBrand ? 'white' : '#1d1d1f',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                ?ÑÏ≤¥ ({products.length})
              </button>
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: selectedBrand === brand.id ? '#007aff' : 'transparent',
                    color: selectedBrand === brand.id ? 'white' : '#1d1d1f',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {brand.name} ({brand.productCount})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {/* Search */}
          <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
            <input
              type="text"
              placeholder="?ÅÌíàÎ™? Î∏åÎûú??Í≤Ä??.."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Products */}
          <div style={cardStyle}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                Î°úÎî© Ï§?..
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                ?ÅÌíà???ÜÏäµ?àÎã§
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {filteredProducts.slice(0, 30).map(product => (
                  <div
                    key={product.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 12,
                      padding: 16,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600, marginBottom: 4 }}>
                      {product.brand}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                      {product.bundleName || product.optionType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {product.sellingPrice?.toLocaleString()}??
                      </span>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'white',
                          background: '#007aff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        ?¥Í∏∞
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {filteredProducts.length > 30 && (
              <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                + {filteredProducts.length - 30}Í∞????àÏùå
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Added notification */}
      {addedProduct && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 24,
          background: '#34c759',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: 14,
          fontWeight: 500,
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
        }}>
          ??{addedProduct} ?•Î∞îÍµ¨Îãà???¥Í?
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Link
          href="/store/cart"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #007aff, #0056b3)',
            color: 'white',
            borderRadius: 50,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,122,255,0.4)',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span>?õí</span>
          <span>?•Î∞îÍµ¨Îãà ({cart.length})</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20 }}>
            {cart.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString()}??
          </span>
        </Link>
      )}
    </div>
  )
}
