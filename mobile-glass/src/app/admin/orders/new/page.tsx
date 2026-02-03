'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../../components/Navigation'

interface Store {
  id: number
  name: string
  code: string
}

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  brandId: number
  brand: Brand
  sellingPrice: number
  optionType: string
}

interface OrderItem {
  productId: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
  sph?: string
  cyl?: string
  axis?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [selectedStore, setSelectedStore] = useState('')
  const [orderType, setOrderType] = useState('stock')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [memo, setMemo] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  
  // RX용 처방 정보
  const [sph, setSph] = useState('')
  const [cyl, setCyl] = useState('')
  const [axis, setAxis] = useState('')

  useEffect(() => {
    fetchFormData()
  }, [])

  const fetchFormData = async () => {
    try {
      const res = await fetch('/api/orders/create')
      const json = await res.json()
      setStores(json.stores || [])
      setProducts(json.products || [])
      setBrands(json.brands || [])
    } catch (error) {
      console.error('Failed to fetch form data:', error)
    }
    setLoading(false)
  }

  const filteredProducts = selectedBrand 
    ? products.filter(p => p.brandId === parseInt(selectedBrand))
    : products

  const addItem = () => {
    if (!selectedProduct) {
      alert('상품을 선택해주세요')
      return
    }
    
    const product = products.find(p => p.id === parseInt(selectedProduct))
    if (!product) return

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      brandName: product.brand.name,
      quantity,
      unitPrice: product.sellingPrice,
      ...(orderType === 'rx' && { sph, cyl, axis })
    }

    setItems([...items, newItem])
    setSelectedProduct('')
    setQuantity(1)
    setSph('')
    setCyl('')
    setAxis('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const handleSubmit = async () => {
    if (!selectedStore) {
      alert('가맹점을 선택해주세요')
      return
    }
    if (items.length === 0) {
      alert('상품을 추가해주세요')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore,
          orderType,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sph: item.sph,
            cyl: item.cyl,
            axis: item.axis,
          })),
          memo,
        }),
      })

      const json = await res.json()
      if (json.success) {
        alert(`주문이 등록되었습니다. (${json.order.orderNo})`)
        router.push('/admin/orders')
      } else {
        alert(json.error || '주문 등록에 실패했습니다.')
      }
    } catch (error) {
      alert('주문 등록에 실패했습니다.')
    }
    setSubmitting(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  }

  const selectStyle = {
    ...inputStyle,
    background: '#fff',
    cursor: 'pointer',
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="order">
        <div style={{ textAlign: 'center', padding: '100px', color: '#86868b' }}>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ maxWidth: '900px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
          관리자 주문등록
        </h2>

        {/* 기본 정보 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>기본 정보</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                가맹점 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <select 
                value={selectedStore} 
                onChange={(e) => setSelectedStore(e.target.value)}
                style={selectStyle}
              >
                <option value="">선택하세요</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                주문 유형
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    value="stock" 
                    checked={orderType === 'stock'}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <span>여벌</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    value="rx" 
                    checked={orderType === 'rx'}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <span>RX (맞춤)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 추가 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>상품 추가</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: '12px', marginBottom: '16px' }}>
            <select 
              value={selectedBrand} 
              onChange={(e) => { setSelectedBrand(e.target.value); setSelectedProduct(''); }}
              style={selectStyle}
            >
              <option value="">전체 브랜드</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={selectStyle}
            >
              <option value="">상품 선택</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.id}>
                  [{product.brand.name}] {product.name} - {product.sellingPrice.toLocaleString()}원
                </option>
              ))}
            </select>
            
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={inputStyle}
              placeholder="수량"
            />
          </div>

          {/* RX 처방 정보 */}
          {orderType === 'rx' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>SPH</label>
                <input 
                  type="text" 
                  value={sph}
                  onChange={(e) => setSph(e.target.value)}
                  style={inputStyle}
                  placeholder="-2.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>CYL</label>
                <input 
                  type="text" 
                  value={cyl}
                  onChange={(e) => setCyl(e.target.value)}
                  style={inputStyle}
                  placeholder="-0.50"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>AXIS</label>
                <input 
                  type="text" 
                  value={axis}
                  onChange={(e) => setAxis(e.target.value)}
                  style={inputStyle}
                  placeholder="180"
                />
              </div>
            </div>
          )}

          <button 
            onClick={addItem}
            style={{
              padding: '10px 20px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + 상품 추가
          </button>
        </div>

        {/* 주문 상품 목록 */}
        {items.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              주문 상품 ({items.length}개)
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', color: '#666' }}>브랜드</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', color: '#666' }}>상품명</th>
                  {orderType === 'rx' && (
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', color: '#666' }}>처방</th>
                  )}
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', color: '#666' }}>수량</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', color: '#666' }}>단가</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', color: '#666' }}>소계</th>
                  <th style={{ padding: '12px 8px', width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f5f5f7' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
                        {item.brandName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.productName}</td>
                    {orderType === 'rx' && (
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
                        {item.sph}/{item.cyl}/{item.axis}
                      </td>
                    )}
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}원</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                      {(item.quantity * item.unitPrice).toLocaleString()}원
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button 
                        onClick={() => removeItem(index)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#ff3b30', 
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f5f5f7' }}>
                  <td colSpan={orderType === 'rx' ? 5 : 4} style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600 }}>
                    총 합계
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 700, color: '#007aff', fontSize: '16px' }}>
                    {totalAmount.toLocaleString()}원
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 메모 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>메모</h3>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="주문 관련 메모를 입력하세요"
            style={{
              ...inputStyle,
              minHeight: '80px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: '1px solid #e1e1e1',
              background: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: 'none',
              background: submitting || items.length === 0 ? '#ccc' : '#007aff',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: submitting || items.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '등록 중...' : '주문 등록'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
