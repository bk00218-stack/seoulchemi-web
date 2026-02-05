'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface PeriodData {
  period: string
  label: string
  orders: number
  amount: number
  avgOrder: number
  stores: number
}

export default function StatsComparePage() {
  const [data, setData] = useState<{
    monthly: PeriodData[]
    quarterly: PeriodData[]
    yearly: PeriodData[]
  }>({ monthly: [], quarterly: [], yearly: [] })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchCompareData()
  }, [])

  const fetchCompareData = async () => {
    try {
      const res = await fetch('/api/stats/compare')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch compare data:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentData = data[view]
  const maxAmount = Math.max(...currentData.map(d => d.amount), 1)

  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  return (
    <AdminLayout activeMenu="stats">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          기간별 비교
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          월별, 분기별, 연도별 매출을 비교합니다.
        </p>
      </div>

      {/* 뷰 선택 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { value: 'monthly', label: '월별' },
          { value: 'quarterly', label: '분기별' },
          { value: 'yearly', label: '연도별' }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setView(opt.value as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: view === opt.value ? 'var(--primary)' : 'var(--bg-primary)',
              color: view === opt.value ? '#fff' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</div>
      ) : currentData.length === 0 ? (
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          데이터가 없습니다.
        </div>
      ) : (
        <>
          {/* 차트 */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              매출 추이
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
              {currentData.map((item, idx) => {
                const prevItem = idx > 0 ? currentData[idx - 1] : null
                const growth = prevItem ? parseFloat(getGrowth(item.amount, prevItem.amount)) : 0
                
                return (
                  <div key={item.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {(item.amount / 10000).toFixed(0)}만
                    </div>
                    {prevItem && (
                      <div style={{
                        fontSize: '11px',
                        color: growth >= 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {growth >= 0 ? '↑' : '↓'}{Math.abs(growth)}%
                      </div>
                    )}
                    <div style={{
                      width: '100%',
                      height: `${(item.amount / maxAmount) * 150}px`,
                      background: idx === currentData.length - 1 
                        ? 'linear-gradient(180deg, var(--primary) 0%, #5856D6 100%)'
                        : 'var(--bg-tertiary)',
                      borderRadius: '6px',
                      minHeight: '8px'
                    }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 상세 테이블 */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>기간</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>주문 수</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>매출액</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>평균 주문액</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>거래 가맹점</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>전기 대비</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, idx) => {
                  const prevItem = idx > 0 ? currentData[idx - 1] : null
                  const growth = prevItem ? parseFloat(getGrowth(item.amount, prevItem.amount)) : 0
                  
                  return (
                    <tr key={item.period} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-primary)' }}>{item.orders.toLocaleString()}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{item.amount.toLocaleString()}원</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.avgOrder.toLocaleString()}원</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.stores}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {prevItem ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: growth >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                            color: growth >= 0 ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {growth >= 0 ? '+' : ''}{growth}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
