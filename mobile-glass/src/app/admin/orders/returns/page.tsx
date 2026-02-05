'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface ReturnData {
  id: number
  returnNo: string
  orderId: number
  orderNo: string
  storeId: number
  storeName: string
  status: string
  type: string
  totalQuantity: number
  totalAmount: number
  reason: string | null
  requestedAt: string
  approvedAt: string | null
  receivedAt: string | null
  items: {
    id: number
    productName: string
    optionName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    reason: string | null
    condition: string | null
  }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  requested: { label: '요청', color: '#f59e0b', bg: '#fef3c7' },
  approved: { label: '승인', color: '#3b82f6', bg: '#dbeafe' },
  received: { label: '입고완료', color: '#10b981', bg: '#d1fae5' },
  rejected: { label: '거절', color: '#ef4444', bg: '#fee2e2' }
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedReturn, setSelectedReturn] = useState<ReturnData | null>(null)
  const [stats, setStats] = useState({ requested: 0, approved: 0, received: 0, rejected: 0 })

  useEffect(() => {
    fetchReturns()
  }, [selectedStatus])

  const fetchReturns = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.set('status', selectedStatus)

      const res = await fetch(`/api/returns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (returnData: ReturnData, action: 'approve' | 'receive' | 'reject') => {
    if (action === 'reject') {
      const memo = prompt('거절 사유를 입력해주세요.')
      if (!memo) return
      await processAction(returnData.id, action, memo)
    } else {
      if (!confirm(`${action === 'approve' ? '승인' : '입고 처리'}하시겠습니까?`)) return
      await processAction(returnData.id, action)
    }
  }

  const processAction = async (returnId: number, action: string, memo?: string) => {
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, memo, processedBy: '관리자' })
      })

      if (res.ok) {
        fetchReturns()
        setSelectedReturn(null)
      } else {
        const data = await res.json()
        alert(data.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>반품/교환 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>반품 및 교환 요청을 처리합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div
            key={key}
            onClick={() => setSelectedStatus(key)}
            style={{
              background: selectedStatus === key ? config.bg : '#fff',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              border: selectedStatus === key ? `2px solid ${config.color}` : '2px solid transparent'
            }}
          >
            <div style={{ fontSize: '13px', color: config.color, marginBottom: '4px' }}>{config.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>
              {stats[key as keyof typeof stats] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <button
          onClick={() => setSelectedStatus('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: selectedStatus === 'all' ? '#007aff' : '#f3f4f6',
            color: selectedStatus === 'all' ? '#fff' : '#1d1d1f',
            marginRight: '8px',
            cursor: 'pointer'
          }}
        >
          전체
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: selectedStatus === key ? config.bg : '#f3f4f6',
              color: selectedStatus === key ? config.color : '#1d1d1f',
              marginRight: '8px',
              cursor: 'pointer'
            }}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* 반품 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : returns.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>반품 데이터가 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>반품번호</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>원주문</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>가맹점</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>유형</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>수량</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>금액</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>요청일</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => {
                const statusConfig = STATUS_CONFIG[ret.status] || STATUS_CONFIG.requested
                return (
                  <tr key={ret.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{ret.returnNo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#007aff' }}>{ret.orderNo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ret.storeName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: ret.type === 'exchange' ? '#f3e8ff' : '#f3f4f6',
                        color: ret.type === 'exchange' ? '#9333ea' : '#374151'
                      }}>
                        {ret.type === 'exchange' ? '교환' : '반품'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: statusConfig.bg,
                        color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px' }}>{ret.totalQuantity}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>
                      {ret.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(ret.requestedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e5e5',
                          background: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedReturn && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>{selectedReturn.returnNo}</h2>
                <p style={{ fontSize: '14px', color: '#86868b', margin: 0 }}>원주문: {selectedReturn.orderNo}</p>
              </div>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: STATUS_CONFIG[selectedReturn.status]?.bg,
                color: STATUS_CONFIG[selectedReturn.status]?.color
              }}>
                {STATUS_CONFIG[selectedReturn.status]?.label}
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>가맹점:</strong> {selectedReturn.storeName}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>유형:</strong> {selectedReturn.type === 'exchange' ? '교환' : '반품'}
              </div>
              {selectedReturn.reason && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>사유:</strong> {selectedReturn.reason}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>품목</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>상품</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>수량</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>금액</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px' }}>
                        {item.productName}
                        {item.optionName && <span style={{ color: '#86868b', marginLeft: '4px' }}>({item.optionName})</span>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.totalPrice.toLocaleString()}</td>
                      <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                        {item.condition === 'good' && '양호'}
                        {item.condition === 'damaged' && '파손'}
                        {item.condition === 'defective' && '불량'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 600 }}>
                    <td style={{ padding: '12px 8px' }}>합계</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedReturn.totalQuantity}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedReturn.totalAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedReturn(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer' }}
              >
                닫기
              </button>

              {selectedReturn.status === 'requested' && (
                <>
                  <button
                    onClick={() => handleAction(selectedReturn, 'reject')}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleAction(selectedReturn, 'approve')}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', cursor: 'pointer' }}
                  >
                    승인
                  </button>
                </>
              )}

              {selectedReturn.status === 'approved' && (
                <button
                  onClick={() => handleAction(selectedReturn, 'receive')}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer' }}
                >
                  입고 처리
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
