'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface OrderItem {
  id: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sph?: string
  cyl?: string
}

interface OrderData {
  id: number
  orderNo: string
  storeName: string
  storeCode: string
  address?: string
  phone?: string
  totalAmount: number
  orderedAt: string
  items: OrderItem[]
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)
  
  // auto=true면 출고지시서로 시작, 아니면 거래명세서
  const autoParam = searchParams.get('auto')
  const typeParam = searchParams.get('type')
  const [docType, setDocType] = useState<'statement' | 'shipping' | 'confirm'>(
    autoParam === 'true' ? 'shipping' : (typeParam as 'statement' | 'shipping' | 'confirm') || 'statement'
  )

  useEffect(() => {
    fetchOrder()
  }, [id])

  // 자동 출력 (auto=true일 때)
  useEffect(() => {
    if (autoParam === 'true' && order && !loading && !printed) {
      // 약간의 딜레이 후 출력 (렌더링 완료 대기)
      const timer = setTimeout(() => {
        window.print()
        setPrinted(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoParam, order, loading, printed])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}/print?type=${docType}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {autoParam === 'true' ? '출고지시서 출력 준비 중...' : '로딩 중...'}
      </div>
    )
  }

  if (!order) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>주문을 찾을 수 없습니다.</div>
  }

  const today = new Date().toLocaleDateString('ko-KR')
  const supplyAmount = Math.round(order.totalAmount / 1.1)
  const taxAmount = order.totalAmount - supplyAmount

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; margin: 0; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      {/* 컨트롤 바 */}
      <div className="no-print" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderBottom: '1px solid #e9ecef',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setDocType('statement')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: docType === 'statement' ? '#007aff' : '#fff',
              color: docType === 'statement' ? '#fff' : '#1d1d1f',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            거래명세서
          </button>
          <button
            onClick={() => setDocType('shipping')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: docType === 'shipping' ? '#007aff' : '#fff',
              color: docType === 'shipping' ? '#fff' : '#1d1d1f',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            출고지시서
          </button>
          <button
            onClick={() => setDocType('confirm')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: docType === 'confirm' ? '#007aff' : '#fff',
              color: docType === 'confirm' ? '#fff' : '#1d1d1f',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            납품확인서
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#007aff',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            🖨️ 인쇄
          </button>
        </div>
      </div>

      {/* 출력 문서 */}
      <div style={{ paddingTop: '80px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
        <div className="print-page" style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '20mm',
          background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'Malgun Gothic, sans-serif'
        }}>
          {/* 제목 */}
          <h1 style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            borderBottom: '3px double #000',
            paddingBottom: '12px'
          }}>
            {docType === 'statement' && '거 래 명 세 서'}
            {docType === 'shipping' && '출 고 지 시 서'}
            {docType === 'confirm' && '납 품 확 인 서'}
          </h1>

          {/* 거래처 정보 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, width: '80px', border: '1px solid #ddd' }}>거래처명</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{order.storeName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>코드</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{order.storeCode}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>연락처</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{order.phone || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ width: '40px' }} />
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px' }}>문서번호: {order.orderNo}</p>
              <p style={{ margin: '0 0 4px', fontSize: '13px' }}>발행일자: {today}</p>
              <p style={{ margin: '0', fontSize: '13px' }}>주문일자: {new Date(order.orderedAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          {/* 품목 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>No</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>브랜드</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>품명</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>SPH</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>CYL</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>수량</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>단가</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 600 }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.brandName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.productName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.sph || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.cyl || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{item.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 20px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>공급가액</td>
                  <td style={{ padding: '8px 20px', border: '1px solid #ddd', textAlign: 'right', width: '120px' }}>
                    {supplyAmount.toLocaleString()} 원
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 20px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>부가세</td>
                  <td style={{ padding: '8px 20px', border: '1px solid #ddd', textAlign: 'right' }}>
                    {taxAmount.toLocaleString()} 원
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 20px', background: '#007aff', color: '#fff', fontWeight: 700, border: '1px solid #007aff' }}>합계금액</td>
                  <td style={{ padding: '10px 20px', border: '1px solid #007aff', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>
                    {order.totalAmount.toLocaleString()} 원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 서명란 (납품확인서만) */}
          {docType === 'confirm' && (
            <div style={{ marginTop: '40px' }}>
              <p style={{ fontSize: '13px', marginBottom: '20px' }}>
                위와 같이 납품하였음을 확인합니다.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '40px', fontSize: '13px' }}>인수자</p>
                  <div style={{ width: '150px', borderBottom: '1px solid #000' }} />
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>(서명)</p>
                </div>
              </div>
            </div>
          )}

          {/* 공급자 정보 */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>공급자</h3>
            <table style={{ width: '50%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, width: '80px', border: '1px solid #ddd' }}>상호</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>서울케미</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>대표자</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>홍길동</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 12px', background: '#f8f9fa', fontWeight: 600, border: '1px solid #ddd' }}>연락처</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>02-1234-5678</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
