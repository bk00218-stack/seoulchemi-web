'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: number
  name: string
  brand: string
  price: number
  qty: number
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderNo?: string; message?: string } | null>(null)

  // localStorage?�서 ?�바구니 불러?�기
  useEffect(() => {
    const saved = localStorage.getItem('store-cart')
    if (saved) {
      setItems(JSON.parse(saved))
    }
  }, [])

  // ?�바구니 변경시 localStorage ?�??
  useEffect(() => {
    localStorage.setItem('store-cart', JSON.stringify(items))
  }, [items])

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, qty: Math.max(1, item.qty + delta) }
        : item
    ))
  }

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  // 주문?�기
  const handleOrder = async () => {
    if (items.length === 0) return
    
    setLoading(true)
    setOrderResult(null)

    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // storeId 미�??�시 API?�서 밝�??�경(BK-001) ?�용
          items: items.map(item => ({
            productId: item.id,
            quantity: item.qty,
          }))
        })
      })

      const data = await res.json()

      if (data.success) {
        setOrderResult({ 
          success: true, 
          orderNo: data.order.orderNo,
          message: `주문???�료?�었?�니??`
        })
        setItems([]) // ?�바구니 비우�?
        localStorage.removeItem('store-cart')
      } else {
        setOrderResult({ success: false, message: data.error || '주문 ?�패' })
      }
    } catch (e) {
      setOrderResult({ success: false, message: '주문 �??�류가 발생?�습?�다' })
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  // 주문 ?�료 ?�면
  if (orderResult?.success) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>??/div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
          주문???�료?�었?�니??
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-tertiary)', marginBottom: 8 }}>
          주문번호: <strong style={{ color: '#007aff' }}>{orderResult.orderNo}</strong>
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 32 }}>
          관리자가 주문???�인?�면 출고?�니??
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            href="/store/orders"
            style={{
              padding: '14px 28px',
              background: '#007aff',
              color: 'white',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            주문?�역 보기
          </Link>
          <Link
            href="/store/products"
            style={{
              padding: '14px 28px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            계속 ?�핑?�기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          ?�바구니
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 8 }}>
          주문?�실 ?�품???�인?�세??
        </p>
      </div>

      {orderResult && !orderResult.success && (
        <div style={{
          background: '#fff2f2',
          color: '#ff3b30',
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 14,
        }}>
          ??{orderResult.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Cart Items */}
        <div style={{ flex: 1 }}>
          <div style={cardStyle}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>?��</div>
                <div style={{ fontSize: 16 }}>?�바구니가 비어?�습?�다</div>
                <Link
                  href="/store/products"
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    padding: '12px 24px',
                    background: '#007aff',
                    color: 'white',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  ?�품 주문?�기
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    �?{items.length}�??�품
                  </span>
                  <button
                    onClick={() => setItems([])}
                    style={{
                      padding: '6px 12px',
                      fontSize: 13,
                      color: '#ff3b30',
                      background: 'transparent',
                      border: '1px solid #ff3b30',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    ?�체 ??��
                  </button>
                </div>

                {items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: '1px solid #f5f5f7',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600 }}>
                        {item.brand}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {item.price.toLocaleString()}??
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'white',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                        >-</button>
                        <span style={{ width: 32, textAlign: 'center', fontWeight: 600 }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'white',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                        >+</button>
                      </div>

                      <div style={{ width: 100, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                        {(item.price * item.qty).toLocaleString()}??
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '8px',
                          color: 'var(--text-tertiary)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 18,
                        }}
                      >??/button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ width: 320 }}>
          <div style={{ ...cardStyle, position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
              주문 ?�약
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>?�품금액</span>
                <span style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}??/span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>배송�?/span>
                <span style={{ color: '#34c759' }}>무료</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>�?결제금액</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#007aff' }}>{total.toLocaleString()}??/span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={items.length === 0 || loading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                background: items.length === 0 || loading ? '#86868b' : 'linear-gradient(135deg, #007aff, #0056b3)',
                border: 'none',
                borderRadius: 12,
                cursor: items.length === 0 || loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '주문 처리�?..' : '주문?�기'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 12 }}>
              ?�불 결제 (?�말 ?�산)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
