'use client'

import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface ScannedItem {
  barcode: string
  productName: string
  brandName: string
  optionName: string
  stock: number
  scannedAt: Date
}

interface PendingOrder {
  id: number
  orderNo: string
  storeName: string
  items: {
    id: number
    productName: string
    brandName: string
    quantity: number
    sph?: string
    cyl?: string
    barcode?: string
    picked: boolean
  }[]
}

export default function BarcodeScanPage() {
  const [mode, setMode] = useState<'inventory' | 'shipping'>('shipping')
  const [barcode, setBarcode] = useState('')
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'shipping') {
      fetchPendingOrders()
    }
    inputRef.current?.focus()
  }, [mode])

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch('/api/orders?status=confirmed&limit=50')
      if (res.ok) {
        const data = await res.json()
        setPendingOrders(data.orders.map((order: any) => ({
          ...order,
          items: order.items?.map((item: any) => ({ ...item, picked: false })) || []
        })))
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode.trim()) return

    const scannedBarcode = barcode.trim()
    setBarcode('')

    if (mode === 'inventory') {
      // ?�고 ?�인 모드
      await checkInventory(scannedBarcode)
    } else {
      // 출고 ?�킹 모드
      await pickItem(scannedBarcode)
    }

    inputRef.current?.focus()
  }

  const checkInventory = async (code: string) => {
    try {
      // 바코?�로 ?�품 검??
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.products && data.products.length > 0) {
          const product = data.products[0]
          const option = product.options?.find((o: any) => o.barcode === code)
          
          setScannedItems(prev => [{
            barcode: code,
            productName: product.name,
            brandName: product.brand?.name || '',
            optionName: option ? `${option.sph || ''} ${option.cyl || ''}`.trim() : '',
            stock: option?.stock || 0,
            scannedAt: new Date()
          }, ...prev])

          setMessage({
            type: 'success',
            text: `${product.name} - ?�고: ${option?.stock || 0}�?
          })
        } else {
          setMessage({ type: 'error', text: `바코??${code}�?찾을 ???�습?�다.` })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: '조회 �??�류가 발생?�습?�다.' })
    }

    setTimeout(() => setMessage(null), 3000)
  }

  const pickItem = async (code: string) => {
    if (!selectedOrder) {
      setMessage({ type: 'info', text: '먼�? 주문???�택?�주?�요.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    // 주문?�서 ?�당 바코???�이??찾기
    const itemIndex = selectedOrder.items.findIndex(
      item => item.barcode === code && !item.picked
    )

    if (itemIndex === -1) {
      // 바코?��? ?�거???��? ?�킹??
      const alreadyPicked = selectedOrder.items.find(item => item.barcode === code && item.picked)
      if (alreadyPicked) {
        setMessage({ type: 'info', text: '?��? ?�킹???�품?�니??' })
      } else {
        setMessage({ type: 'error', text: '??주문???�당 바코?��? ?�습?�다.' })
      }
      setTimeout(() => setMessage(null), 3000)
      return
    }

    // ?�킹 처리
    const newItems = [...selectedOrder.items]
    newItems[itemIndex].picked = true

    setSelectedOrder({ ...selectedOrder, items: newItems })

    const pickedItem = newItems[itemIndex]
    setMessage({
      type: 'success',
      text: `??${pickedItem.productName} ${pickedItem.sph || ''} ${pickedItem.cyl || ''}`
    })

    // 모든 ?�이???�킹 ?�료 ?�인
    const allPicked = newItems.every(item => item.picked)
    if (allPicked) {
      setTimeout(() => {
        setMessage({ type: 'success', text: '?�� 모든 ?�품 ?�킹 ?�료!' })
      }, 1000)
    }

    setTimeout(() => setMessage(null), 2000)
  }

  const completeShipping = async () => {
    if (!selectedOrder) return

    const unpicked = selectedOrder.items.filter(item => !item.picked)
    if (unpicked.length > 0) {
      if (!confirm(`${unpicked.length}�?미피???�품???�습?�다. 계속?�시겠습?�까?`)) {
        return
      }
    }

    try {
      // 출고 처리 API ?�출
      const res = await fetch(`/api/orders/${selectedOrder.id}/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'packed',
          processedBy: '관리자'
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: '출고 처리가 ?�료?�었?�니??' })
        setSelectedOrder(null)
        fetchPendingOrders()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || '출고 처리???�패?�습?�다.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '?�버 ?�류가 발생?�습?�다.' })
    }

    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>바코???�캔</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          바코?��? ?�캔?�여 ?�고�??�인?�거??출고 ?�킹??진행?�니??
        </p>
      </div>

      {/* 모드 ?�택 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setMode('shipping')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'shipping' ? '#007aff' : '#f3f4f6',
            color: mode === 'shipping' ? '#fff' : 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ?�� 출고 ?�킹
        </button>
        <button
          onClick={() => setMode('inventory')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'inventory' ? '#007aff' : '#f3f4f6',
            color: mode === 'inventory' ? '#fff' : 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ?�� ?�고 ?�인
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          background: message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#dbeafe',
          color: message.type === 'success' ? '#059669' : message.type === 'error' ? '#dc2626' : '#2563eb',
          fontSize: '16px',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* 바코???�력 */}
      <form onSubmit={handleScan} style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="바코?��? ?�캔?�세??.."
            autoFocus
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid #e5e5e5',
              fontSize: '18px',
              outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = '#007aff'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
          <button
            type="submit"
            style={{
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ?�캔
          </button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: mode === 'shipping' ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* 출고 모드: 주문 ?�택 */}
        {mode === 'shipping' && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              출고 ?��?주문 ({pendingOrders.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflow: 'auto' }}>
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: selectedOrder?.id === order.id ? '2px solid #007aff' : '1px solid #e5e5e5',
                    background: selectedOrder?.id === order.id ? '#eff6ff' : 'var(--bg-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{order.storeName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {order.orderNo} · {order.items?.length || 0}�??�목
                  </div>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  출고 ?��?주문???�습?�다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 출고 모드: ?�킹 목록 */}
        {mode === 'shipping' && selectedOrder && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                ?�킹 목록 - {selectedOrder.storeName}
              </h2>
              <button
                onClick={completeShipping}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                출고 ?�료
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: item.picked ? '#d1fae5' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: item.picked ? '#10b981' : 'var(--gray-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px'
                  }}>
                    {item.picked ? '?? : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                      {item.brandName} {item.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      {item.sph || '-'} / {item.cyl || '-'} · {item.quantity}�?
                    </div>
                  </div>
                  {item.barcode && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      {item.barcode}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px' }}>
                ?�킹 ?�료: {selectedOrder.items.filter(i => i.picked).length} / {selectedOrder.items.length}
              </span>
            </div>
          </div>
        )}

        {/* ?�고 ?�인 모드: ?�캔 ?�력 */}
        {mode === 'inventory' && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              ?�캔 ?�력 ({scannedItems.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflow: 'auto' }}>
              {scannedItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                      {item.brandName} {item.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      {item.optionName || '-'} · 바코?? {item.barcode}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: item.stock > 5 ? '#d1fae5' : item.stock > 0 ? '#fef3c7' : '#fee2e2',
                    color: item.stock > 5 ? '#059669' : item.stock > 0 ? '#d97706' : '#dc2626',
                    fontWeight: 600
                  }}>
                    {item.stock}�?
                  </div>
                </div>
              ))}
              {scannedItems.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  바코?��? ?�캔?�면 ?�기???�시?�니??
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
