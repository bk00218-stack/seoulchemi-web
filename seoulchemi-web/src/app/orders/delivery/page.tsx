'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

type StatusFilter = '전체' | '접수' | '가공중' | '가공완료' | '배송중' | '완료'

interface Processor {
  id: number
  name: string
  pendingCount: number
  processingCount: number
}

interface RxOrder {
  id: number
  orderNumber: string
  storeName: string
  storeCode: string
  customerName: string
  productName: string
  brandName: string
  // 처방 정보
  rSph: string
  rCyl: string
  rAxis: string
  lSph: string
  lCyl: string
  lAxis: string
  pd: string
  add?: string
  // 주문 정보
  amount: number
  status: '접수' | '가공중' | '가공완료' | '배송중' | '완료'
  processorName: string
  processorId: number
  orderedAt: string
  expectedAt: string
  // 배송 정보
  deliveryType: '택배' | '직배송' | '픽업'
  trackingNumber?: string
}

export default function DeliveryPage() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('전체')
  const [selectedProcessor, setSelectedProcessor] = useState<number | null>(null)
  const [orders, setOrders] = useState<RxOrder[]>([])
  const [processors, setProcessors] = useState<Processor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())
  const [showDetailModal, setShowDetailModal] = useState<RxOrder | null>(null)

  // 데이터 로드 (데모 데이터)
  useEffect(() => {
    // 가공사 데모 데이터
    const demoProcessors: Processor[] = [
      { id: 1, name: '한국호야', pendingCount: 12, processingCount: 8 },
      { id: 2, name: '에실로코리아', pendingCount: 8, processingCount: 5 },
      { id: 3, name: '니콘렌즈', pendingCount: 6, processingCount: 4 },
      { id: 4, name: '자이스비전', pendingCount: 4, processingCount: 3 },
      { id: 5, name: '케미렌즈 RX', pendingCount: 5, processingCount: 2 },
    ]
    setProcessors(demoProcessors)

    // RX 주문 데모 데이터
    const demoOrders: RxOrder[] = [
      { 
        id: 1, 
        orderNumber: 'RX-2026-0001', 
        storeName: '글라스 망우점', 
        storeCode: '8107',
        customerName: '김철수',
        productName: 'HOYA 누진 1.60 블루컷', 
        brandName: 'HOYA', 
        rSph: '-2.00', rCyl: '-0.50', rAxis: '180',
        lSph: '-2.25', lCyl: '-0.75', lAxis: '175',
        pd: '64', add: '2.00',
        amount: 185000, 
        status: '접수',
        processorName: '한국호야', 
        processorId: 1, 
        orderedAt: '2026-02-15 09:00',
        expectedAt: '2026-02-17',
        deliveryType: '택배'
      },
      { 
        id: 2, 
        orderNumber: 'RX-2026-0002', 
        storeName: '눈편한안경원', 
        storeCode: '7753',
        customerName: '이영희',
        productName: 'Essilor Varilux 1.67', 
        brandName: 'Essilor', 
        rSph: '-4.00', rCyl: '-1.00', rAxis: '90',
        lSph: '-3.75', lCyl: '-0.75', lAxis: '85',
        pd: '62', add: '2.50',
        amount: 280000, 
        status: '가공중',
        processorName: '에실로코리아', 
        processorId: 2, 
        orderedAt: '2026-02-14 14:30',
        expectedAt: '2026-02-16',
        deliveryType: '택배'
      },
      { 
        id: 3, 
        orderNumber: 'RX-2026-0003', 
        storeName: '그랑프리 성수점', 
        storeCode: '4143',
        customerName: '박민수',
        productName: 'NIKON 양면비구면 1.74', 
        brandName: 'NIKON', 
        rSph: '-6.00', rCyl: '-2.00', rAxis: '15',
        lSph: '-5.75', lCyl: '-1.75', lAxis: '170',
        pd: '66',
        amount: 220000, 
        status: '가공완료',
        processorName: '니콘렌즈', 
        processorId: 3, 
        orderedAt: '2026-02-13 11:00',
        expectedAt: '2026-02-15',
        deliveryType: '직배송'
      },
      { 
        id: 4, 
        orderNumber: 'RX-2026-0004', 
        storeName: '더밝은안경 구리', 
        storeCode: '9697',
        customerName: '최지은',
        productName: 'ZEISS Progressive 1.60', 
        brandName: 'ZEISS', 
        rSph: '-1.50', rCyl: '-0.25', rAxis: '180',
        lSph: '-1.75', lCyl: '-0.50', lAxis: '180',
        pd: '60', add: '1.75',
        amount: 350000, 
        status: '배송중',
        processorName: '자이스비전', 
        processorId: 4, 
        orderedAt: '2026-02-12 16:00',
        expectedAt: '2026-02-14',
        deliveryType: '택배',
        trackingNumber: '1234567890'
      },
      { 
        id: 5, 
        orderNumber: 'RX-2026-0005', 
        storeName: '로이스 성신여대', 
        storeCode: '9701',
        customerName: '정호진',
        productName: 'HOYA Nulux 1.67 변색', 
        brandName: 'HOYA', 
        rSph: '-3.25', rCyl: '-0.75', rAxis: '10',
        lSph: '-3.00', lCyl: '-1.00', lAxis: '5',
        pd: '63',
        amount: 195000, 
        status: '접수',
        processorName: '한국호야', 
        processorId: 1, 
        orderedAt: '2026-02-15 10:30',
        expectedAt: '2026-02-17',
        deliveryType: '픽업'
      },
      { 
        id: 6, 
        orderNumber: 'RX-2026-0006', 
        storeName: '눈이야기', 
        storeCode: '11485',
        customerName: '강서연',
        productName: '케미 RX 중굴절 1.60', 
        brandName: '케미', 
        rSph: '-2.50', rCyl: '-0.50', rAxis: '175',
        lSph: '-2.75', lCyl: '-0.75', lAxis: '180',
        pd: '61',
        amount: 85000, 
        status: '가공중',
        processorName: '케미렌즈 RX', 
        processorId: 5, 
        orderedAt: '2026-02-14 09:00',
        expectedAt: '2026-02-16',
        deliveryType: '택배'
      },
      { 
        id: 7, 
        orderNumber: 'RX-2026-0007', 
        storeName: '글라스타 잠실점', 
        storeCode: '7899',
        customerName: '윤민재',
        productName: 'Essilor Eyezen 1.60', 
        brandName: 'Essilor', 
        rSph: '-1.00', rCyl: '-0.25', rAxis: '90',
        lSph: '-0.75', lCyl: '-0.25', lAxis: '90',
        pd: '65',
        amount: 165000, 
        status: '완료',
        processorName: '에실로코리아', 
        processorId: 2, 
        orderedAt: '2026-02-10 13:00',
        expectedAt: '2026-02-12',
        deliveryType: '직배송'
      },
      { 
        id: 8, 
        orderNumber: 'RX-2026-0008', 
        storeName: '글라스스토리 미사점', 
        storeCode: '8128',
        customerName: '한소희',
        productName: 'NIKON Presio Master 1.67', 
        brandName: 'NIKON', 
        rSph: '-4.50', rCyl: '-1.25', rAxis: '5',
        lSph: '-4.25', lCyl: '-1.00', lAxis: '175',
        pd: '62', add: '2.25',
        amount: 295000, 
        status: '가공완료',
        processorName: '니콘렌즈', 
        processorId: 3, 
        orderedAt: '2026-02-13 15:00',
        expectedAt: '2026-02-15',
        deliveryType: '택배'
      },
    ]
    setOrders(demoOrders)
    setLoading(false)
  }, [])

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    const matchesStatus = activeStatus === '전체' || order.status === activeStatus
    const matchesProcessor = selectedProcessor === null || order.processorId === selectedProcessor
    return matchesStatus && matchesProcessor
  })

  // 상태별 카운트
  const statusCounts = {
    '전체': orders.length,
    '접수': orders.filter(o => o.status === '접수').length,
    '가공중': orders.filter(o => o.status === '가공중').length,
    '가공완료': orders.filter(o => o.status === '가공완료').length,
    '배송중': orders.filter(o => o.status === '배송중').length,
    '완료': orders.filter(o => o.status === '완료').length,
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

  // 상태 변경
  const handleStatusChange = (newStatus: '접수' | '가공중' | '가공완료' | '배송중' | '완료') => {
    if (selectedOrders.size === 0) {
      alert('상태를 변경할 주문을 선택해주세요.')
      return
    }
    const statusLabels: { [key: string]: string } = {
      '접수': '접수',
      '가공중': '가공중',
      '가공완료': '가공완료',
      '배송중': '배송중',
      '완료': '완료'
    }
    alert(`${selectedOrders.size}건의 주문이 "${statusLabels[newStatus]}" 상태로 변경되었습니다.`)
    setSelectedOrders(new Set())
  }

  // 선택된 주문 합계
  const selectedTotal = filteredOrders
    .filter(o => selectedOrders.has(o.id))
    .reduce((sum, o) => sum + o.amount, 0)

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수': return { bg: '#fff3e0', color: '#ff9800' }
      case '가공중': return { bg: '#e3f2fd', color: '#2196f3' }
      case '가공완료': return { bg: '#e8f5e9', color: '#4caf50' }
      case '배송중': return { bg: '#fce4ec', color: '#e91e63' }
      case '완료': return { bg: '#f5f5f5', color: '#757575' }
      default: return { bg: '#f5f5f5', color: '#757575' }
    }
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #1976d2'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>RX 출고 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            맞춤 렌즈 가공 현황 및 배송 관리
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

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 15, height: 'calc(100vh - 180px)' }}>
        
        {/* 왼쪽: 가공사별 현황 */}
        <div style={{ 
          background: '#f8f9fa',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 15px',
            background: '#1976d2',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600
          }}>
            가공사별 현황
          </div>
          
          {/* 전체 보기 */}
          <div
            onClick={() => setSelectedProcessor(null)}
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              background: selectedProcessor === null ? '#e3f2fd' : '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>전체</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {processors.reduce((sum, p) => sum + p.pendingCount + p.processingCount, 0)}건
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#ff9800' }}>
                대기 {processors.reduce((sum, p) => sum + p.pendingCount, 0)}
              </div>
              <div style={{ fontSize: 11, color: '#2196f3' }}>
                가공 {processors.reduce((sum, p) => sum + p.processingCount, 0)}
              </div>
            </div>
          </div>
          
          {/* 가공사 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {processors.map(processor => (
              <div
                key={processor.id}
                onClick={() => setSelectedProcessor(processor.id)}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: selectedProcessor === processor.id ? '#e3f2fd' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{processor.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#ff9800' }}>
                    대기 {processor.pendingCount}
                  </div>
                  <div style={{ fontSize: 11, color: '#2196f3' }}>
                    가공 {processor.processingCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: RX 주문 목록 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* 상태 탭 */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #1976d2',
            background: '#f8f9fa',
            overflowX: 'auto'
          }}>
            {(['전체', '접수', '가공중', '가공완료', '배송중', '완료'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: activeStatus === status ? '#1976d2' : 'transparent',
                  color: activeStatus === status ? '#fff' : '#333',
                  fontWeight: activeStatus === status ? 600 : 400,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap'
                }}
              >
                {status}
                <span style={{
                  background: activeStatus === status ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 10
                }}>
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>

          {/* 테이블 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '35px 90px 130px 140px 200px 80px 80px 70px',
            padding: '8px 10px',
            background: '#f0f0f0',
            fontSize: 11,
            fontWeight: 600,
            borderBottom: '1px solid #ccc',
            gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div>주문번호</div>
            <div>가맹점</div>
            <div>상품</div>
            <div>처방 (R/L)</div>
            <div style={{ textAlign: 'right' }}>금액</div>
            <div style={{ textAlign: 'center' }}>상태</div>
            <div style={{ textAlign: 'center' }}>배송</div>
          </div>

          {/* 주문 목록 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>
                로딩 중...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👓</div>
                해당 상태의 RX 주문이 없습니다
              </div>
            ) : (
              filteredOrders.map((order, index) => {
                const statusStyle = getStatusColor(order.status)
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '35px 90px 130px 140px 200px 80px 80px 70px',
                      padding: '10px 10px',
                      fontSize: 11,
                      borderBottom: '1px solid #eee',
                      background: selectedOrders.has(order.id) ? '#e3f2fd' : (index % 2 === 0 ? '#fff' : '#fafafa'),
                      cursor: 'pointer',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => setShowDetailModal(order)}
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
                      <div style={{ fontWeight: 500, fontSize: 10, color: '#1976d2' }}>{order.orderNumber}</div>
                      <div style={{ fontSize: 9, color: '#999' }}>{order.orderedAt.split(' ')[0]}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 11 }}>{order.storeName}</div>
                      <div style={{ fontSize: 9, color: '#666' }}>{order.customerName}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 10 }}>{order.productName}</div>
                      <div style={{ fontSize: 9, color: '#666' }}>{order.processorName}</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10 }}>
                      <div>R: {order.rSph} / {order.rCyl} × {order.rAxis}°</div>
                      <div>L: {order.lSph} / {order.lCyl} × {order.lAxis}°</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 11 }}>
                      {order.amount.toLocaleString()}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10,
                        color: order.deliveryType === '택배' ? '#1976d2' : order.deliveryType === '직배송' ? '#4caf50' : '#ff9800'
                      }}>
                        {order.deliveryType === '택배' ? '📦' : order.deliveryType === '직배송' ? '🚗' : '🏪'}
                        {order.deliveryType}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 하단 액션 바 */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #ccc',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 12 }}>
              선택: <strong>{selectedOrders.size}</strong>건 
              <span style={{ marginLeft: 15, color: '#1976d2', fontWeight: 600 }}>
                {selectedTotal.toLocaleString()}원
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setSelectedOrders(new Set())}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                선택 해제
              </button>
              <button
                onClick={() => handleStatusChange('가공중')}
                disabled={selectedOrders.size === 0}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: selectedOrders.size === 0 ? '#ccc' : '#2196f3',
                  color: '#fff',
                  borderRadius: 4,
                  cursor: selectedOrders.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 11
                }}
              >
                가공시작
              </button>
              <button
                onClick={() => handleStatusChange('가공완료')}
                disabled={selectedOrders.size === 0}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: selectedOrders.size === 0 ? '#ccc' : '#4caf50',
                  color: '#fff',
                  borderRadius: 4,
                  cursor: selectedOrders.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 11
                }}
              >
                가공완료
              </button>
              <button
                onClick={() => handleStatusChange('배송중')}
                disabled={selectedOrders.size === 0}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: selectedOrders.size === 0 ? '#ccc' : '#e91e63',
                  color: '#fff',
                  borderRadius: 4,
                  cursor: selectedOrders.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 11
                }}
              >
                🚚 배송처리
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDetailModal(null)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 12,
              width: 500,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>RX 주문 상세</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{showDetailModal.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div style={{ padding: 20 }}>
              {/* 기본 정보 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: '#666', marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  📍 기본 정보
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#999' }}>가맹점:</span> <strong>{showDetailModal.storeName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>고객명:</span> <strong>{showDetailModal.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>주문일:</span> {showDetailModal.orderedAt}
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>예상출고:</span> {showDetailModal.expectedAt}
                  </div>
                </div>
              </div>

              {/* 상품 정보 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: '#666', marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  👓 상품 정보
                </h4>
                <div style={{ fontSize: 13 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>{showDetailModal.productName}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div><span style={{ color: '#999' }}>브랜드:</span> {showDetailModal.brandName}</div>
                    <div><span style={{ color: '#999' }}>가공사:</span> {showDetailModal.processorName}</div>
                  </div>
                </div>
              </div>

              {/* 처방 정보 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: '#666', marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  📋 처방 정보
                </h4>
                <div style={{ 
                  background: '#f8f9fa', 
                  borderRadius: 8, 
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 12
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}></div>
                    <div style={{ fontWeight: 600, textAlign: 'center' }}>SPH</div>
                    <div style={{ fontWeight: 600, textAlign: 'center' }}>CYL</div>
                    <div style={{ fontWeight: 600, textAlign: 'center' }}>AXIS</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: '#1976d2' }}>R</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.rSph}</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.rCyl}</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.rAxis}°</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr', gap: 8 }}>
                    <div style={{ fontWeight: 600, color: '#4caf50' }}>L</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.lSph}</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.lCyl}</div>
                    <div style={{ textAlign: 'center' }}>{showDetailModal.lAxis}°</div>
                  </div>
                  <div style={{ 
                    marginTop: 12, 
                    paddingTop: 10, 
                    borderTop: '1px dashed #ddd',
                    display: 'flex',
                    gap: 30
                  }}>
                    <div><span style={{ color: '#666' }}>PD:</span> <strong>{showDetailModal.pd}mm</strong></div>
                    {showDetailModal.add && (
                      <div><span style={{ color: '#666' }}>ADD:</span> <strong>+{showDetailModal.add}</strong></div>
                    )}
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: '#666', marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  🚚 배송 정보
                </h4>
                <div style={{ fontSize: 13, display: 'flex', gap: 20 }}>
                  <div><span style={{ color: '#999' }}>배송방법:</span> <strong>{showDetailModal.deliveryType}</strong></div>
                  {showDetailModal.trackingNumber && (
                    <div><span style={{ color: '#999' }}>운송장:</span> <strong>{showDetailModal.trackingNumber}</strong></div>
                  )}
                </div>
              </div>

              {/* 금액 */}
              <div style={{ 
                background: '#1976d2', 
                color: '#fff', 
                padding: 15, 
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 14 }}>결제 금액</span>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{showDetailModal.amount.toLocaleString()}원</span>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div style={{ 
              padding: '12px 20px', 
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8
            }}>
              <button
                onClick={() => setShowDetailModal(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                닫기
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: '#1976d2',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                🖨️ 가공의뢰서 출력
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
