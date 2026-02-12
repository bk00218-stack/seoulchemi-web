'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

type OrderType = '전체' | '여벌' | '착색' | 'RX'

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
  const [activeTab, setActiveTab] = useState<OrderType>('전체')
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)
  const [orders, setOrders] = useState<ShippingOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())

  // 데이터 로드 (데모 데이터)
  useEffect(() => {
    // 매입처 데모 데이터
    const demoSuppliers: Supplier[] = [
      { id: 1, name: '케미렌즈', pendingCount: 45, pendingAmount: 2350000 },
      { id: 2, name: '한국호야', pendingCount: 23, pendingAmount: 1850000 },
      { id: 3, name: '에실로코리아', pendingCount: 18, pendingAmount: 2100000 },
      { id: 4, name: '니콘렌즈', pendingCount: 12, pendingAmount: 980000 },
      { id: 5, name: '자이스', pendingCount: 8, pendingAmount: 1200000 },
    ]
    setSuppliers(demoSuppliers)

    // 출고 대기 주문 데모 데이터
    const demoOrders: ShippingOrder[] = [
      { id: 1, orderNumber: 'O-2026-0001', storeName: '글라스 망우점', storeCode: '8107', productName: '[케미 일반] 중', brandName: '케미', sph: '-2.00', cyl: '-0.50', quantity: 2, amount: 3500, orderType: '여벌', supplierName: '케미렌즈', supplierId: 1, orderedAt: '2026-02-09 09:00', status: '출고대기' },
      { id: 2, orderNumber: 'O-2026-0002', storeName: '글라스스토리 미사점', storeCode: '8128', productName: '[케미 퍼펙트] 고비', brandName: '케미', sph: '-3.50', cyl: '-1.00', quantity: 1, amount: 5500, orderType: '여벌', supplierName: '케미렌즈', supplierId: 1, orderedAt: '2026-02-09 09:15', status: '출고대기' },
      { id: 3, orderNumber: 'O-2026-0003', storeName: '눈편한안경원', storeCode: '7753', productName: '착색 1.60 브라운', brandName: '진명', sph: '-4.00', cyl: '-0.75', quantity: 1, amount: 12000, orderType: '착색', supplierName: '에실로코리아', supplierId: 3, orderedAt: '2026-02-09 09:30', status: '출고대기' },
      { id: 4, orderNumber: 'O-2026-0004', storeName: '그랑프리 성수점', storeCode: '4143', productName: 'RX 누진 1.67', brandName: '호야', sph: '-2.25', cyl: '-0.25', quantity: 1, amount: 85000, orderType: 'RX', supplierName: '한국호야', supplierId: 2, orderedAt: '2026-02-09 09:45', status: '출고대기' },
      { id: 5, orderNumber: 'O-2026-0005', storeName: '더밝은안경 구리', storeCode: '9697', productName: '[케미 초발수] 중비', brandName: '케미', sph: '-1.50', cyl: '0.00', quantity: 2, amount: 6930, orderType: '여벌', supplierName: '케미렌즈', supplierId: 1, orderedAt: '2026-02-09 10:00', status: '출고대기' },
      { id: 6, orderNumber: 'O-2026-0006', storeName: '로이스 성신여대', storeCode: '9701', productName: '착색 1.56 그레이', brandName: '진명', sph: '-5.00', cyl: '-1.50', quantity: 1, amount: 8500, orderType: '착색', supplierName: '에실로코리아', supplierId: 3, orderedAt: '2026-02-09 10:15', status: '출고대기' },
      { id: 7, orderNumber: 'O-2026-0007', storeName: '눈이야기', storeCode: '11485', productName: 'RX 양면비구면 1.74', brandName: '니콘', sph: '-6.00', cyl: '-2.00', quantity: 1, amount: 120000, orderType: 'RX', supplierName: '니콘렌즈', supplierId: 4, orderedAt: '2026-02-09 10:30', status: '출고대기' },
      { id: 8, orderNumber: 'O-2026-0008', storeName: '글라스타 잠실점', storeCode: '7899', productName: '[케미 변색] GEN 8(B)', brandName: '케미', sph: '-2.75', cyl: '-0.50', quantity: 1, amount: 42500, orderType: '여벌', supplierName: '케미렌즈', supplierId: 1, orderedAt: '2026-02-09 10:45', status: '출고대기' },
    ]
    setOrders(demoOrders)
    setLoading(false)
  }, [])

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === '전체' || order.orderType === activeTab
    const matchesSupplier = selectedSupplier === null || order.supplierId === selectedSupplier
    return matchesTab && matchesSupplier
  })

  // 탭별 카운트
  const tabCounts = {
    '전체': orders.length,
    '여벌': orders.filter(o => o.orderType === '여벌').length,
    '착색': orders.filter(o => o.orderType === '착색').length,
    'RX': orders.filter(o => o.orderType === 'RX').length,
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  // 개별 선택
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedOrders)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedOrders(newSet)
  }

  // 출고 처리
  const handleShipping = () => {
    if (selectedOrders.size === 0) {
      alert('출고할 주문을 선택해주세요.')
      return
    }
    alert(`${selectedOrders.size}건의 주문이 출고 처리되었습니다.`)
    setSelectedOrders(new Set())
  }

  // 선택된 주문 합계
  const selectedTotal = filteredOrders
    .filter(o => selectedOrders.has(o.id))
    .reduce((sum, o) => sum + o.amount * o.quantity, 0)

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #333'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>전표발행 (출고 확인)</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            OlwsPro 스타일 출고 관리
          </p>
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
        
        {/* 왼쪽: 매입처별 대기량 */}
        <div style={{ 
          background: '#f5f5f5',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 15px',
            background: '#333',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600
          }}>
            매입처별 출고 대기
          </div>
          
          {/* 전체 보기 */}
          <div
            onClick={() => setSelectedSupplier(null)}
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedSupplier === null ? '#e3f2fd' : '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>전체</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {suppliers.reduce((sum, s) => sum + s.pendingCount, 0)}건 대기
              </div>
            </div>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#1976d2' 
            }}>
              {suppliers.reduce((sum, s) => sum + s.pendingAmount, 0).toLocaleString()}원
            </div>
          </div>
          
          {/* 매입처 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {suppliers.map(supplier => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier.id)}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: selectedSupplier === supplier.id ? '#e3f2fd' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{supplier.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {supplier.pendingCount}건 대기
                  </div>
                </div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 500, 
                  color: supplier.pendingCount > 30 ? '#f44336' : '#333'
                }}>
                  {supplier.pendingAmount.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 출고 대기 목록 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* 탭 */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #1976d2',
            background: '#f5f5f5'
          }}>
            {(['전체', '여벌', '착색', 'RX'] as OrderType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: activeTab === tab ? '#1976d2' : 'transparent',
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

          {/* 테이블 헤더 */}
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
            <div>가맹점</div>
            <div>상품명</div>
            <div style={{ textAlign: 'center' }}>SPH</div>
            <div style={{ textAlign: 'center' }}>CYL</div>
            <div style={{ textAlign: 'center' }}>수량</div>
            <div style={{ textAlign: 'right' }}>금액</div>
            <div style={{ textAlign: 'center' }}>매입처</div>
          </div>

          {/* 주문 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                로딩 중...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                출고 대기 주문이 없습니다
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
                    background: selectedOrders.has(order.id) ? '#e3f2fd' : (index % 2 === 0 ? '#fff' : '#fafafa'),
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
                    <div style={{ fontSize: 10, color: '#999' }}>{order.storeCode} · {order.orderedAt}</div>
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
                      background: order.supplierId === 1 ? '#e3f2fd' : order.supplierId === 2 ? '#fff3e0' : '#e8f5e9',
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

          {/* 하단 액션 바 */}
          <div style={{
            padding: '12px 15px',
            borderTop: '1px solid #ccc',
            background: '#f5f5f5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 13 }}>
              선택: <strong>{selectedOrders.size}</strong>건 
              <span style={{ marginLeft: 15, color: '#1976d2', fontWeight: 600 }}>
                {selectedTotal.toLocaleString()}원
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedOrders(new Set())}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                선택 해제
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
                출고 처리 ({selectedOrders.size}건)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
