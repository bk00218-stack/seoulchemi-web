'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/StoreCartContext'
import { useIsMobile } from '@/hooks/useIsMobile'

// 장바구니 아이템의 고유 키 생성
function getCartKey(item: { id: number; sph?: string; cyl?: string }): string {
  if (item.sph && item.cyl) {
    return `${item.id}-${item.sph}-${item.cyl}`
  }
  return `${item.id}`
}

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalPrice } = useCart()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderNo?: string; message?: string } | null>(null)

  // 주문하기
  const handleOrder = async () => {
    if (items.length === 0) return

    setLoading(true)
    setOrderResult(null)

    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.qty,
            sph: item.sph,
            cyl: item.cyl,
          }))
        })
      })

      const data = await res.json()

      if (data.success) {
        setOrderResult({
          success: true,
          orderNo: data.order.orderNo,
          message: '주문이 완료되었습니다!'
        })
        clearCart()
      } else {
        setOrderResult({ success: false, message: data.error || '주문 실패' })
      }
    } catch {
      setOrderResult({ success: false, message: '주문 중 오류가 발생했습니다' })
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  // 주문 완료 화면
  if (orderResult?.success) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '40px 16px' : '60px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1d1d1f', margin: '0 0 12px' }}>
          주문이 완료되었습니다!
        </h1>
        <p style={{ fontSize: 16, color: '#86868b', marginBottom: 8 }}>
          주문번호: <strong style={{ color: '#007aff' }}>{orderResult.orderNo}</strong>
        </p>
        <p style={{ fontSize: 14, color: '#86868b', marginBottom: 32 }}>
          관리자가 주문을 확인하면 출고됩니다.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/store/orders" style={{
            padding: '14px 28px', background: '#007aff', color: 'white',
            borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600,
          }}>
            주문내역 보기
          </Link>
          <Link href="/store/products" style={{
            padding: '14px 28px', background: '#f5f5f7', color: '#1d1d1f',
            borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600,
          }}>
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>장바구니</h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>주문하실 상품을 확인하세요</p>
      </div>

      {orderResult && !orderResult.success && (
        <div style={{
          background: '#fff2f2', color: '#ff3b30',
          padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14,
        }}>
          {orderResult.message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24 }}>
        {/* Cart Items */}
        <div style={{ flex: 1 }}>
          <div style={cardStyle}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? 40 : 60, color: '#86868b' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                <div style={{ fontSize: 16 }}>장바구니가 비어있습니다</div>
                <Link href="/store/products" style={{
                  display: 'inline-block', marginTop: 16,
                  padding: '12px 24px', background: '#007aff', color: 'white',
                  borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600,
                }}>
                  상품 주문하기
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                    총 {items.length}개 상품
                  </span>
                  <button
                    onClick={clearCart}
                    style={{
                      padding: '6px 12px', fontSize: 13, color: '#ff3b30',
                      background: 'transparent', border: '1px solid #ff3b30',
                      borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    전체 삭제
                  </button>
                </div>

                {items.map(item => {
                  const cartKey = getCartKey(item)
                  return (
                    <div key={cartKey} style={{
                      display: 'flex', alignItems: 'center',
                      padding: '16px 0', borderBottom: '1px solid #f5f5f7',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: isMobile ? 8 : 0,
                    }}>
                      <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
                        <div style={{ fontSize: 11, color: '#007aff', fontWeight: 600 }}>{item.brand}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: '4px 0' }}>
                          {item.name}
                        </div>
                        {/* 도수 표시 */}
                        {item.sph && item.cyl && (
                          <div style={{ 
                            fontSize: 12, 
                            color: '#34c759',
                            background: '#e8f5e9',
                            padding: '4px 8px',
                            borderRadius: 4,
                            display: 'inline-block',
                            marginBottom: 4,
                          }}>
                            SPH {item.sph} / CYL {item.cyl}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#86868b' }}>{item.optionType}</div>
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end',
                        marginTop: isMobile ? 8 : 0,
                      }}>
                        {/* 수량 조절 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateQty(cartKey, -1)}
                            style={{
                              width: 32, height: 32, border: '1px solid #e9ecef',
                              borderRadius: 8, background: 'white', fontSize: 16, cursor: 'pointer',
                            }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(cartKey, 1)}
                            style={{
                              width: 32, height: 32, border: '1px solid #e9ecef',
                              borderRadius: 8, background: 'white', fontSize: 16, cursor: 'pointer',
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* 가격 */}
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', minWidth: 80, textAlign: 'right' }}>
                          {(item.price * item.qty).toLocaleString()}원
                        </span>

                        {/* 삭제 */}
                        <button
                          onClick={() => removeItem(cartKey)}
                          style={{
                            padding: 8, background: 'none', border: 'none',
                            color: '#ff3b30', fontSize: 18, cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
          <div style={{ width: isMobile ? '100%' : 320 }}>
            <div style={{ ...cardStyle, position: isMobile ? 'static' : 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>주문 요약</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#86868b' }}>상품 수</span>
                <span style={{ fontWeight: 600 }}>{items.reduce((sum, item) => sum + item.qty, 0)}개</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: '#86868b' }}>총 금액</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#007aff' }}>
                  {totalPrice.toLocaleString()}원
                </span>
              </div>

              <button
                onClick={handleOrder}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px',
                  background: loading ? '#e9ecef' : 'linear-gradient(135deg, #007aff, #0056b3)',
                  color: loading ? '#86868b' : 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '주문 처리 중...' : '주문하기'}
              </button>

              <p style={{ fontSize: 12, color: '#86868b', textAlign: 'center', marginTop: 12 }}>
                주문 후 관리자 확인 → 출고됩니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
