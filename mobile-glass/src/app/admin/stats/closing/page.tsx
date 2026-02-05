'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface ClosingData {
  period: { year: number; month: number }
  sales: {
    totalOrders: number
    totalAmount: number
    totalItems: number
    byStatus: Record<string, number>
    byType: { stock: number; rx: number }
  }
  purchases: {
    totalPurchases: number
    totalAmount: number
    byStatus: { pending: number; completed: number }
  }
  deposits: {
    totalDeposits: number
    totalAmount: number
    byMethod: { cash: number; card: number; transfer: number }
  }
  returns: {
    totalReturns: number
    totalAmount: number
  }
  inventory: {
    totalOptions: number
    totalStock: number
    lowStock: number
    outOfStock: number
  }
  receivables: number
  payables: number
  profit: {
    gross: number
    net: number
    margin: number
  }
  dailySales: { date: string; orders: number; amount: number }[]
  isClosed: boolean
}

export default function ClosingPage() {
  const [data, setData] = useState<ClosingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [year, month])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/closing?year=${year}&month=${month}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async (action: 'close' | 'reopen') => {
    const confirmMsg = action === 'close' 
      ? `${year}년 ${month}월을 마감하시겠습니까?`
      : `${year}년 ${month}월 마감을 취소하시겠습니까?`
    
    if (!confirm(confirmMsg)) return

    setProcessing(true)
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, action })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to process:', error)
    } finally {
      setProcessing(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  return (
    <AdminLayout activeMenu="stats">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>월마감/결산</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          월별 매출/매입 현황을 확인하고 마감 처리합니다
        </p>
      </div>

      {/* 기간 선택 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px'
      }}>
        <button
          onClick={prevMonth}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← 이전
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {year}년 {month}월
          </div>
          {data?.isClosed && (
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              background: '#10b981',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500
            }}>
              ✓ 마감 완료
            </span>
          )}
        </div>

        <button
          onClick={nextMonth}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          다음 →
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
      ) : data ? (
        <>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              borderRadius: '16px', 
              padding: '24px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>매출</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>
                {data.sales.totalAmount.toLocaleString()}원
              </div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                {data.sales.totalOrders}건
              </div>
            </div>

            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#86868b' }}>매입</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>
                {data.purchases.totalAmount.toLocaleString()}원
              </div>
              <div style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
                {data.purchases.totalPurchases}건
              </div>
            </div>

            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#86868b' }}>입금 (회수)</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>
                {data.deposits.totalAmount.toLocaleString()}원
              </div>
              <div style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
                {data.deposits.totalDeposits}건
              </div>
            </div>

            <div style={{ 
              background: data.profit.gross >= 0 ? '#d1fae5' : '#fef2f2', 
              borderRadius: '16px', 
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: data.profit.gross >= 0 ? '#059669' : '#dc2626' }}>
                매출총이익
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                marginTop: '8px',
                color: data.profit.gross >= 0 ? '#059669' : '#dc2626'
              }}>
                {data.profit.gross.toLocaleString()}원
              </div>
              <div style={{ fontSize: '13px', color: data.profit.gross >= 0 ? '#059669' : '#dc2626', marginTop: '4px' }}>
                마진율 {data.profit.margin}%
              </div>
            </div>
          </div>

          {/* 상세 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* 일별 추이 */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>일별 매출 추이</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px' }}>
                {data.dailySales.map((day, idx) => {
                  const maxAmount = Math.max(...data.dailySales.map(d => d.amount), 1)
                  const height = (day.amount / maxAmount) * 120
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={`${day.date}: ${day.amount.toLocaleString()}원 (${day.orders}건)`}
                    >
                      <div style={{
                        width: '100%',
                        height: `${height}px`,
                        background: day.amount > 0 
                          ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' 
                          : '#e5e5e5',
                        borderRadius: '2px',
                        minHeight: '2px'
                      }} />
                      {idx % 5 === 0 && (
                        <div style={{ fontSize: '10px', color: '#86868b' }}>
                          {day.date.slice(8)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 채권/채무 */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>채권/채무 현황</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#d97706' }}>미수금 (받을 돈)</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
                    {data.receivables.toLocaleString()}원
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#dc2626' }}>미납금 (줄 돈)</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                    {data.payables.toLocaleString()}원
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 재고/반품 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>재고 현황</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>총 재고</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{data.inventory.totalStock.toLocaleString()}</div>
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>품목 수</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{data.inventory.totalOptions}</div>
                </div>
                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#d97706' }}>재고 부족</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#d97706' }}>{data.inventory.lowStock}</div>
                </div>
                <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>품절</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626' }}>{data.inventory.outOfStock}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>반품 현황</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#86868b' }}>반품 건수</div>
                  <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.returns.totalReturns}건</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#86868b' }}>반품 금액</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626' }}>
                    -{data.returns.totalAmount.toLocaleString()}원
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 마감 버튼 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>월 마감</h2>
              <p style={{ fontSize: '14px', color: '#86868b', margin: 0 }}>
                {data.isClosed 
                  ? '이 달은 마감되었습니다. 데이터 수정이 제한됩니다.'
                  : '마감하면 해당 월의 데이터 수정이 제한됩니다.'
                }
              </p>
            </div>
            {data.isClosed ? (
              <button
                onClick={() => handleClose('reopen')}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  fontSize: '15px',
                  cursor: processing ? 'not-allowed' : 'pointer'
                }}
              >
                {processing ? '처리 중...' : '마감 취소'}
              </button>
            ) : (
              <button
                onClick={() => handleClose('close')}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: processing ? '#e5e5e5' : '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: processing ? 'not-allowed' : 'pointer'
                }}
              >
                {processing ? '처리 중...' : `${year}년 ${month}월 마감`}
              </button>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
          데이터를 불러올 수 없습니다
        </div>
      )}
    </AdminLayout>
  )
}
