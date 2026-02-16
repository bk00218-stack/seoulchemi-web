'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface OrderData {
  orderNo: string
  storeName: string
  storeCode: string
  storePhone?: string
  storeAddress?: string
  orderedAt: string
  totalAmount: number
  memo?: string
  items: {
    productName: string
    brandName: string
    sph?: string | null
    cyl?: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

export default function PrintShippingSlipPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    fetch(`/api/orders/${orderId}/print`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setOrder(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('데이터를 불러올 수 없습니다')
        setLoading(false)
      })
  }, [orderId])

  // 데이터 로드 완료 후 자동 인쇄
  useEffect(() => {
    if (order && !loading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order, loading])

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>{error || '주문 정보를 찾을 수 없습니다'}</p>
        <button onClick={() => window.close()} style={{ marginTop: 20, padding: '8px 16px' }}>
          닫기
        </button>
      </div>
    )
  }

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const printDate = new Date().toLocaleString('ko-KR')

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Malgun Gothic', sans-serif;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: 'Malgun Gothic', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 10px;
          background: #f5f5f5;
        }
        .slip {
          background: #fff;
          width: 72mm;
          padding: 5mm;
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 4px;
        }
        .info {
          margin-bottom: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .info-label {
          color: #666;
        }
        .items-header {
          display: grid;
          grid-template-columns: 1fr 60px 40px 50px;
          background: #f0f0f0;
          padding: 4px;
          font-weight: bold;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .item-row {
          display: grid;
          grid-template-columns: 1fr 60px 40px 50px;
          padding: 4px;
          border-bottom: 1px dotted #ccc;
        }
        .item-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .total {
          border-top: 2px solid #000;
          padding-top: 8px;
          margin-top: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #ccc;
          color: #666;
          font-size: 10px;
        }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', marginBottom: 20, padding: 10 }}>
        <button 
          onClick={() => window.print()} 
          style={{ padding: '10px 24px', fontSize: 14, cursor: 'pointer', marginRight: 10 }}
        >
          🖨️ 인쇄
        </button>
        <button 
          onClick={() => window.close()} 
          style={{ padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}
        >
          닫기
        </button>
      </div>

      <div className="slip">
        <div className="header">
          <div className="title">출 고 지 시 서</div>
        </div>

        <div className="info">
          <div className="info-row">
            <span className="info-label">주문번호</span>
            <span style={{ fontWeight: 'bold' }}>{order.orderNo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">거래처</span>
            <span>{order.storeName} ({order.storeCode})</span>
          </div>
          {order.storePhone && (
            <div className="info-row">
              <span className="info-label">연락처</span>
              <span>{order.storePhone}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">주문일</span>
            <span>{new Date(order.orderedAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>

        <div className="items-header">
          <span>상품</span>
          <span className="text-center">도수</span>
          <span className="text-center">수량</span>
          <span className="text-right">금액</span>
        </div>

        {order.items.map((item, i) => (
          <div key={i} className="item-row">
            <span className="item-name" title={`${item.brandName} ${item.productName}`}>
              {item.productName}
            </span>
            <span className="text-center" style={{ fontSize: 10 }}>
              {item.sph && item.cyl ? `${item.sph}/${item.cyl}` : '-'}
            </span>
            <span className="text-center">{item.quantity}</span>
            <span className="text-right">{item.totalPrice.toLocaleString()}</span>
          </div>
        ))}

        <div className="total">
          <div className="total-row">
            <span>합계 ({totalQuantity}개)</span>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {order.memo && (
          <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', fontSize: 11 }}>
            📝 {order.memo}
          </div>
        )}

        <div className="footer">
          출력: {printDate}
        </div>
      </div>
    </>
  )
}
