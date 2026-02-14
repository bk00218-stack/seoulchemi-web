'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

type OrderType = '?„ì²´' | '?¬ë²Œ' | 'ì°©ìƒ‰' | 'RX'

interface Supplier {
  id: number
  name: string
  pendingCount: number
  pendingAmount: number
}

interface ShippingOrder {
  id: number
  orderNumber: string
  storeName: string
  storeCode: string
  productName: string
  brandName: string
  sph: string
  cyl: string
  quantity: number
  amount: number
  orderType: string
  supplierName: string
  supplierId: number
  orderedAt: string
  status: string
}

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<OrderType>('?„ì²´')
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)
  const [orders, setOrders] = useState<ShippingOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())

  // ?°ì´??ë¡œë“œ (?°ëª¨ ?°ì´??
  useEffect(() => {
    // ë§¤ì…ì²??°ëª¨ ?°ì´??    const demoSuppliers: Supplier[] = [
      { id: 1, name: 'ì¼€ë¯¸ë Œì¦?, pendingCount: 45, pendingAmount: 2350000 },
      { id: 2, name: '?œêµ­?¸ì•¼', pendingCount: 23, pendingAmount: 1850000 },
      { id: 3, name: '?ì‹¤ë¡œì½”ë¦¬ì•„', pendingCount: 18, pendingAmount: 2100000 },
      { id: 4, name: '?ˆì½˜?Œì¦ˆ', pendingCount: 12, pendingAmount: 980000 },
      { id: 5, name: '?ì´??, pendingCount: 8, pendingAmount: 1200000 },
    ]
    setSuppliers(demoSuppliers)

    // ì¶œê³  ?€ê¸?ì£¼ë¬¸ ?°ëª¨ ?°ì´??    const demoOrders: ShippingOrder[] = [
      { id: 1, orderNumber: 'O-2026-0001', storeName: 'ê¸€?¼ìŠ¤ ë§ìš°??, storeCode: '8107', productName: '[ì¼€ë¯??¼ë°˜] ì¤?, brandName: 'ì¼€ë¯?, sph: '-2.00', cyl: '-0.50', quantity: 2, amount: 3500, orderType: '?¬ë²Œ', supplierName: 'ì¼€ë¯¸ë Œì¦?, supplierId: 1, orderedAt: '2026-02-09 09:00', status: 'ì¶œê³ ?€ê¸? },
      { id: 2, orderNumber: 'O-2026-0002', storeName: 'ê¸€?¼ìŠ¤?¤í† ë¦?ë¯¸ì‚¬??, storeCode: '8128', productName: '[ì¼€ë¯??¼í™?? ê³ ë¹„', brandName: 'ì¼€ë¯?, sph: '-3.50', cyl: '-1.00', quantity: 1, amount: 5500, orderType: '?¬ë²Œ', supplierName: 'ì¼€ë¯¸ë Œì¦?, supplierId: 1, orderedAt: '2026-02-09 09:15', status: 'ì¶œê³ ?€ê¸? },
      { id: 3, orderNumber: 'O-2026-0003', storeName: '?ˆí¸?œì•ˆê²½ì›', storeCode: '7753', productName: 'ì°©ìƒ‰ 1.60 ë¸Œë¼??, brandName: 'ì§„ëª…', sph: '-4.00', cyl: '-0.75', quantity: 1, amount: 12000, orderType: 'ì°©ìƒ‰', supplierName: '?ì‹¤ë¡œì½”ë¦¬ì•„', supplierId: 3, orderedAt: '2026-02-09 09:30', status: 'ì¶œê³ ?€ê¸? },
      { id: 4, orderNumber: 'O-2026-0004', storeName: 'ê·¸ë‘?„ë¦¬ ?±ìˆ˜??, storeCode: '4143', productName: 'RX ?„ì§„ 1.67', brandName: '?¸ì•¼', sph: '-2.25', cyl: '-0.25', quantity: 1, amount: 85000, orderType: 'RX', supplierName: '?œêµ­?¸ì•¼', supplierId: 2, orderedAt: '2026-02-09 09:45', status: 'ì¶œê³ ?€ê¸? },
      { id: 5, orderNumber: 'O-2026-0005', storeName: '?”ë°?€?ˆê²½ êµ¬ë¦¬', storeCode: '9697', productName: '[ì¼€ë¯?ì´ˆë°œ?? ì¤‘ë¹„', brandName: 'ì¼€ë¯?, sph: '-1.50', cyl: '0.00', quantity: 2, amount: 6930, orderType: '?¬ë²Œ', supplierName: 'ì¼€ë¯¸ë Œì¦?, supplierId: 1, orderedAt: '2026-02-09 10:00', status: 'ì¶œê³ ?€ê¸? },
      { id: 6, orderNumber: 'O-2026-0006', storeName: 'ë¡œì´???±ì‹ ?¬ë?', storeCode: '9701', productName: 'ì°©ìƒ‰ 1.56 ê·¸ë ˆ??, brandName: 'ì§„ëª…', sph: '-5.00', cyl: '-1.50', quantity: 1, amount: 8500, orderType: 'ì°©ìƒ‰', supplierName: '?ì‹¤ë¡œì½”ë¦¬ì•„', supplierId: 3, orderedAt: '2026-02-09 10:15', status: 'ì¶œê³ ?€ê¸? },
      { id: 7, orderNumber: 'O-2026-0007', storeName: '?ˆì´?¼ê¸°', storeCode: '11485', productName: 'RX ?‘ë©´ë¹„êµ¬ë©?1.74', brandName: '?ˆì½˜', sph: '-6.00', cyl: '-2.00', quantity: 1, amount: 120000, orderType: 'RX', supplierName: '?ˆì½˜?Œì¦ˆ', supplierId: 4, orderedAt: '2026-02-09 10:30', status: 'ì¶œê³ ?€ê¸? },
      { id: 8, orderNumber: 'O-2026-0008', storeName: 'ê¸€?¼ìŠ¤?€ ? ì‹¤??, storeCode: '7899', productName: '[ì¼€ë¯?ë³€?? GEN 8(B)', brandName: 'ì¼€ë¯?, sph: '-2.75', cyl: '-0.50', quantity: 1, amount: 42500, orderType: '?¬ë²Œ', supplierName: 'ì¼€ë¯¸ë Œì¦?, supplierId: 1, orderedAt: '2026-02-09 10:45', status: 'ì¶œê³ ?€ê¸? },
    ]
    setOrders(demoOrders)
    setLoading(false)
  }, [])

  // ?„í„°ë§ëœ ì£¼ë¬¸
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === '?„ì²´' || order.orderType === activeTab
    const matchesSupplier = selectedSupplier === null || order.supplierId === selectedSupplier
    return matchesTab && matchesSupplier
  })

  // ??³„ ì¹´ìš´??  const tabCounts = {
    '?„ì²´': orders.length,
    '?¬ë²Œ': orders.filter(o => o.orderType === '?¬ë²Œ').length,
    'ì°©ìƒ‰': orders.filter(o => o.orderType === 'ì°©ìƒ‰').length,
    'RX': orders.filter(o => o.orderType === 'RX').length,
  }

  // ?„ì²´ ? íƒ/?´ì œ
  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  // ê°œë³„ ? íƒ
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedOrders)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedOrders(newSet)
  }

  // ì¶œê³  ì²˜ë¦¬
  const handleShipping = () => {
    if (selectedOrders.size === 0) {
      alert('ì¶œê³ ??ì£¼ë¬¸??? íƒ?´ì£¼?¸ìš”.')
      return
    }
    alert(`${selectedOrders.size}ê±´ì˜ ì£¼ë¬¸??ì¶œê³  ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??`)
    setSelectedOrders(new Set())
  }

  // ? íƒ??ì£¼ë¬¸ ?©ê³„
  const selectedTotal = filteredOrders
    .filter(o => selectedOrders.has(o.id))
    .reduce((sum, o) => sum + o.amount * o.quantity, 0)

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="ì£¼ë¬¸">
      {/* ?¤ë” */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>?„í‘œë°œí–‰ (ì¶œê³  ?•ì¸)</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            OlwsPro ?¤í???ì¶œê³  ê´€ë¦?          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666' }}>
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 15, height: 'calc(100vh - 180px)' }}>
        
        {/* ?¼ìª½: ë§¤ì…ì²˜ë³„ ?€ê¸°ëŸ‰ */}
        <div style={{ 
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 15px',
            background: '#5d7a5d',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600
          }}>
            ë§¤ì…ì²˜ë³„ ì¶œê³  ?€ê¸?          </div>
          
          {/* ?„ì²´ ë³´ê¸° */}
          <div
            onClick={() => setSelectedSupplier(null)}
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedSupplier === null ? '#eef4ee' : '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>?„ì²´</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {suppliers.reduce((sum, s) => sum + s.pendingCount, 0)}ê±??€ê¸?              </div>
            </div>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#5d7a5d' 
            }}>
              {suppliers.reduce((sum, s) => sum + s.pendingAmount, 0).toLocaleString()}??            </div>
          </div>
          
          {/* ë§¤ì…ì²?ëª©ë¡ */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {suppliers.map(supplier => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier.id)}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: selectedSupplier === supplier.id ? '#eef4ee' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{supplier.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {supplier.pendingCount}ê±??€ê¸?                  </div>
                </div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 500, 
                  color: supplier.pendingCount > 30 ? '#f44336' : '#333'
                }}>
                  {supplier.pendingAmount.toLocaleString()}??                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ?¤ë¥¸ìª? ì¶œê³  ?€ê¸?ëª©ë¡ */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* ??*/}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #5d7a5d',
            background: 'var(--bg-secondary)'
          }}>
            {(['?„ì²´', '?¬ë²Œ', 'ì°©ìƒ‰', 'RX'] as OrderType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: activeTab === tab ? '#5d7a5d' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#333',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {tab}
                <span style={{
                  background: activeTab === tab ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11
                }}>
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* ?Œì´ë¸??¤ë” */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 80px 80px 70px 80px 100px',
            padding: '10px 12px',
            background: '#f0f0f0',
            fontSize: 11,
            fontWeight: 600,
            borderBottom: '1px solid #ccc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div>ê°€ë§¹ì </div>
            <div>?í’ˆëª?/div>
            <div style={{ textAlign: 'center' }}>SPH</div>
            <div style={{ textAlign: 'center' }}>CYL</div>
            <div style={{ textAlign: 'center' }}>?˜ëŸ‰</div>
            <div style={{ textAlign: 'right' }}>ê¸ˆì•¡</div>
            <div style={{ textAlign: 'center' }}>ë§¤ì…ì²?/div>
          </div>

          {/* ì£¼ë¬¸ ëª©ë¡ */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                ë¡œë”© ì¤?..
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>?“¦</div>
                ì¶œê³  ?€ê¸?ì£¼ë¬¸???†ìŠµ?ˆë‹¤
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 80px 80px 70px 80px 100px',
                    padding: '10px 12px',
                    fontSize: 12,
                    borderBottom: '1px solid #eee',
                    background: selectedOrders.has(order.id) ? '#eef4ee' : (index % 2 === 0 ? '#fff' : '#fafafa'),
                    cursor: 'pointer',
                    alignItems: 'center'
                  }}
                  onClick={() => toggleSelect(order.id)}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{order.storeName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{order.storeCode} Â· {order.orderedAt}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 11 }}>{order.productName}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{order.brandName}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>{order.sph}</div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>{order.cyl}</div>
                  <div style={{ textAlign: 'center' }}>{order.quantity}</div>
                  <div style={{ textAlign: 'right', fontWeight: 500 }}>
                    {(order.amount * order.quantity).toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      background: order.supplierId === 1 ? '#eef4ee' : order.supplierId === 2 ? '#fff3e0' : '#e8f5e9',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10
                    }}>
                      {order.supplierName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ?˜ë‹¨ ?¡ì…˜ ë°?*/}
          <div style={{
            padding: '12px 15px',
            borderTop: '1px solid #ccc',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 13 }}>
              ? íƒ: <strong>{selectedOrders.size}</strong>ê±?
              <span style={{ marginLeft: 15, color: '#5d7a5d', fontWeight: 600 }}>
                {selectedTotal.toLocaleString()}??              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedOrders(new Set())}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  background: 'var(--bg-primary)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                ? íƒ ?´ì œ
              </button>
              <button
                onClick={handleShipping}
                disabled={selectedOrders.size === 0}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  background: selectedOrders.size === 0 ? '#ccc' : '#4caf50',
                  color: '#fff',
                  borderRadius: 4,
                  cursor: selectedOrders.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                ì¶œê³  ì²˜ë¦¬ ({selectedOrders.size}ê±?
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
