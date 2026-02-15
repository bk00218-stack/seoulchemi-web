'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../../../components/Navigation'

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  brandId: number
  sellingPrice: number
}

interface BrandDiscount {
  id: number
  brandId: number
  discountRate: number
  brand: { id: number; name: string }
}

interface ProductDiscount {
  id: number
  productId: number
  discountRate: number
  product: Product
}

interface ProductPrice {
  id: number
  productId: number
  specialPrice: number
  product: Product
}

interface StoreDiscountData {
  store: { id: number; name: string; code: string; discountRate: number }
  brandDiscounts: BrandDiscount[]
  productDiscounts: ProductDiscount[]
  productPrices: ProductPrice[]
  brands: Brand[]
  products: Product[]
}

export default function StoreDiscountsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<StoreDiscountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'brand' | 'product_discount' | 'product_price'>('brand')
  
  // ????ª© ì¶”ê???
  const [newBrandId, setNewBrandId] = useState<number>(0)
  const [newBrandRate, setNewBrandRate] = useState<number>(0)
  const [newProductId, setNewProductId] = useState<number>(0)
  const [newProductRate, setNewProductRate] = useState<number>(0)
  const [newPriceProductId, setNewPriceProductId] = useState<number>(0)
  const [newSpecialPrice, setNewSpecialPrice] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/stores/${id}/discounts`)
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch (error) {
      console.error('Failed:', error)
      alert('?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤')
    } finally {
      setLoading(false)
    }
  }

  const updateBaseRate = async (discountRate: number) => {
    setSaving(true)
    try {
      await fetch(`/api/stores/${id}/discounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountRate })
      })
      loadData()
    } catch (error) {
      alert('?€???¤íŒ¨')
    } finally {
      setSaving(false)
    }
  }

  const addDiscount = async (type: string, payload: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch(`/api/stores/${id}/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload })
      })
      loadData()
      // Reset forms
      setNewBrandId(0)
      setNewBrandRate(0)
      setNewProductId(0)
      setNewProductRate(0)
      setNewPriceProductId(0)
      setNewSpecialPrice(0)
    } catch (error) {
      alert('?€???¤íŒ¨')
    } finally {
      setSaving(false)
    }
  }

  const deleteDiscount = async (type: string, targetId: number) => {
    if (!confirm('?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return
    try {
      await fetch(`/api/stores/${id}/discounts?type=${type}&targetId=${targetId}`, {
        method: 'DELETE'
      })
      loadData()
    } catch (error) {
      alert('?? œ ?¤íŒ¨')
    }
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="stores">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          ë¡œë”© ì¤?..
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout activeMenu="stores">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          ê±°ë˜ì²˜ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤
        </div>
      </AdminLayout>
    )
  }

  const { store, brandDiscounts, productDiscounts, productPrices, brands, products } = data

  // ?´ë? ?¤ì •??ë¸Œëœ???í’ˆ ?œì™¸
  const availableBrands = brands.filter(b => !brandDiscounts.find(bd => bd.brandId === b.id))
  const availableProductsForDiscount = products.filter(p => !productDiscounts.find(pd => pd.productId === p.id))
  const availableProductsForPrice = products.filter(p => !productPrices.find(pp => pp.productId === p.id))

  return (
    <AdminLayout activeMenu="stores">
      {/* ?¤ë” */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          ??
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            {store.name} <span style={{ color: '#86868b', fontWeight: 400 }}>({store.code})</span>
          </h2>
          <p style={{ color: '#86868b', fontSize: '14px', margin: '4px 0 0' }}>? ì¸ ?¤ì •</p>
        </div>
      </div>

      {/* ê°€ê²??ìš© ?°ì„ ?œìœ„ ?ˆë‚´ */}
      <div style={{ 
        background: '#fff3cd', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '24px', 
        fontSize: '14px',
        border: '1px solid #ffc107'
      }}>
        <strong>?“Œ ê°€ê²??ìš© ?°ì„ ?œìœ„:</strong> ?¹ìˆ˜?¨ê? ??ë¸Œëœ?œë³„ ? ì¸ ???í’ˆë³?? ì¸ ??ê¸°ë³¸? ì¸?????•ê?
      </div>

      {/* ê¸°ë³¸ ? ì¸??*/}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>ê¸°ë³¸ ? ì¸??/h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            defaultValue={store.discountRate}
            step="0.5"
            min="0"
            max="100"
            style={{
              width: '100px',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              textAlign: 'right'
            }}
            onBlur={(e) => {
              const val = parseFloat(e.target.value) || 0
              if (val !== store.discountRate) {
                updateBaseRate(val)
              }
            }}
          />
          <span style={{ fontSize: '16px' }}>%</span>
          <span style={{ color: '#86868b', fontSize: '13px' }}>
            (ëª¨ë“  ?í’ˆ??ê¸°ë³¸ ?ìš©)
          </span>
        </div>
      </div>

      {/* ??*/}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'brand', label: 'ë¸Œëœ?œë³„ ? ì¸', count: brandDiscounts.length },
          { key: 'product_discount', label: '?í’ˆë³?? ì¸', count: productDiscounts.length },
          { key: 'product_price', label: '?¹ìˆ˜?¨ê?', count: productPrices.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? '#007aff' : '#f5f5f7',
              color: activeTab === tab.key ? '#fff' : '#1d1d1f',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ??ì»¨í…ì¸?*/}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {activeTab === 'brand' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>ë¸Œëœ?œë³„ ? ì¸??/h3>
            
            {/* ì¶”ê? ??*/}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newBrandId}
                onChange={(e) => setNewBrandId(parseInt(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>ë¸Œëœ??? íƒ</option>
                {availableBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="? ì¸??
                value={newBrandRate || ''}
                onChange={(e) => setNewBrandRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>%</span>
              <button
                onClick={() => newBrandId && addDiscount('brand', { brandId: newBrandId, discountRate: newBrandRate })}
                disabled={!newBrandId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newBrandId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newBrandId ? 'pointer' : 'not-allowed'
                }}
              >
                ì¶”ê?
              </button>
            </div>

            {/* ëª©ë¡ */}
            {brandDiscounts.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>?¤ì •??ë¸Œëœ?œë³„ ? ì¸???†ìŠµ?ˆë‹¤</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>ë¸Œëœ??/th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>? ì¸??/th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>?? œ</th>
                  </tr>
                </thead>
                <tbody>
                  {brandDiscounts.map(bd => (
                    <tr key={bd.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                      <td style={{ padding: '12px' }}>{bd.brand.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                          {bd.discountRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteDiscount('brand', bd.brandId)}
                          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ?? œ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'product_discount' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>?í’ˆë³?? ì¸??/h3>
            
            {/* ì¶”ê? ??*/}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newProductId}
                onChange={(e) => setNewProductId(parseInt(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>?í’ˆ ? íƒ</option>
                {availableProductsForDiscount.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sellingPrice.toLocaleString()}??</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="? ì¸??
                value={newProductRate || ''}
                onChange={(e) => setNewProductRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>%</span>
              <button
                onClick={() => newProductId && addDiscount('product_discount', { productId: newProductId, discountRate: newProductRate })}
                disabled={!newProductId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newProductId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newProductId ? 'pointer' : 'not-allowed'
                }}
              >
                ì¶”ê?
              </button>
            </div>

            {/* ëª©ë¡ */}
            {productDiscounts.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>?¤ì •???í’ˆë³?? ì¸???†ìŠµ?ˆë‹¤</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>?í’ˆ</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>?•ê?</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>? ì¸??/th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>? ì¸ê°€</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>?? œ</th>
                  </tr>
                </thead>
                <tbody>
                  {productDiscounts.map(pd => {
                    const discountedPrice = Math.round(pd.product.sellingPrice * (1 - pd.discountRate / 100))
                    return (
                      <tr key={pd.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                        <td style={{ padding: '12px' }}>{pd.product.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#86868b' }}>{pd.product.sellingPrice.toLocaleString()}??/td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                            {pd.discountRate}%
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#007aff' }}>{discountedPrice.toLocaleString()}??/td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteDiscount('product_discount', pd.productId)}
                            style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ?? œ
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'product_price' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>?í’ˆë³??¹ìˆ˜?¨ê?</h3>
            <p style={{ color: '#86868b', fontSize: '13px', marginBottom: '16px' }}>
              ?¹ìˆ˜?¨ê?ê°€ ?¤ì •???í’ˆ?€ ?¤ë¥¸ ? ì¸ê³?ê´€ê³„ì—†????ê°€ê²©ì´ ?ìš©?©ë‹ˆ??
            </p>
            
            {/* ì¶”ê? ??*/}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
              <select
                value={newPriceProductId}
                onChange={(e) => {
                  const pid = parseInt(e.target.value)
                  setNewPriceProductId(pid)
                  const product = products.find(p => p.id === pid)
                  if (product) setNewSpecialPrice(product.sellingPrice)
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}
              >
                <option value={0}>?í’ˆ ? íƒ</option>
                {availableProductsForPrice.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (?•ê?: {p.sellingPrice.toLocaleString()}??</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="?¹ìˆ˜?¨ê?"
                value={newSpecialPrice || ''}
                onChange={(e) => setNewSpecialPrice(parseInt(e.target.value) || 0)}
                style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'right' }}
              />
              <span style={{ alignSelf: 'center' }}>??/span>
              <button
                onClick={() => newPriceProductId && addDiscount('product_price', { productId: newPriceProductId, specialPrice: newSpecialPrice })}
                disabled={!newPriceProductId || saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newPriceProductId ? '#007aff' : '#ccc',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: newPriceProductId ? 'pointer' : 'not-allowed'
                }}
              >
                ì¶”ê?
              </button>
            </div>

            {/* ëª©ë¡ */}
            {productPrices.length === 0 ? (
              <p style={{ color: '#86868b', textAlign: 'center', padding: '40px' }}>?¤ì •???¹ìˆ˜?¨ê?ê°€ ?†ìŠµ?ˆë‹¤</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>?í’ˆ</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>?•ê?</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>?¹ìˆ˜?¨ê?</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>? ì¸??/th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 500, width: '80px' }}>?? œ</th>
                  </tr>
                </thead>
                <tbody>
                  {productPrices.map(pp => {
                    const discount = pp.product.sellingPrice - pp.specialPrice
                    const discountRate = ((discount / pp.product.sellingPrice) * 100).toFixed(1)
                    return (
                      <tr key={pp.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                        <td style={{ padding: '12px' }}>{pp.product.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#86868b', textDecoration: 'line-through' }}>{pp.product.sellingPrice.toLocaleString()}??/td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ff3b30' }}>{pp.specialPrice.toLocaleString()}??/td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                            -{discount.toLocaleString()}??({discountRate}%)
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteDiscount('product_price', pp.productId)}
                            style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ?? œ
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
