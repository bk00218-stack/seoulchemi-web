'use client'

import { useState, useRef } from 'react'

interface ScannedItem {
  barcode: string
  productName: string
  brandName: string
  stock: number
  scannedAt: Date
}

export default function MobileScanPage() {
  const [barcode, setBarcode] = useState('')
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode.trim()) return

    const code = barcode.trim()
    setBarcode('')

    try {
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
            stock: option?.stock || 0,
            scannedAt: new Date()
          }, ...prev])

          setMessage({
            type: 'success',
            text: `${product.name} - ?¨Í≥†: ${option?.stock || 0}Í∞?
          })
        } else {
          setMessage({ type: 'error', text: `Î∞îÏΩî?úÎ? Ï∞æÏùÑ ???ÜÏäµ?àÎã§.` })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ï°∞Ìöå Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.' })
    }

    setTimeout(() => setMessage(null), 3000)
    inputRef.current?.focus()
  }

  return (
    <div>
      {/* Î©îÏãúÏßÄ */}
      {message && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#059669' : '#dc2626',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Î∞îÏΩî???ÖÎ†• */}
      <form onSubmit={handleScan} style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '12px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Î∞îÏΩî???§Ï∫î..."
            autoFocus
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: '8px',
              border: '2px solid #e5e5e5',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ?ïÏù∏
          </button>
        </div>
      </form>

      {/* ?§Ï∫î ?¥Î†• */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          ?§Ï∫î ?¥Î†• ({scannedItems.length})
        </h2>

        {scannedItems.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Î∞îÏΩî?úÎ? ?§Ï∫î?òÏÑ∏??
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scannedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
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
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {item.barcode}
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: item.stock > 5 ? '#d1fae5' : item.stock > 0 ? '#fef3c7' : '#fee2e2',
                  color: item.stock > 5 ? '#059669' : item.stock > 0 ? '#d97706' : '#dc2626',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  {item.stock}Í∞?
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
