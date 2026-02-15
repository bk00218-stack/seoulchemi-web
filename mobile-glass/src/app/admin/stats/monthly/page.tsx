'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'

interface MonthlyData {
  month: string
  year: number
  monthNum: number
  orders: number
  amount: number
  stores: number
  avgOrder: number
  growth: number
}

interface Summary {
  yearTotal: number
  yearOrders: number
  avgMonthly: number
  bestMonth: string
}

export default function MonthlyReportPage() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [summary, setSummary] = useState<Summary>({ yearTotal: 0, yearOrders: 0, avgMonthly: 0, bestMonth: '' })
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData()
  }, [year])

  const loadData = async () => {
    setLoading(true)
    try {
      // Mock monthly data
      const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      const currentMonth = new Date().getMonth()
      
      const mockData: MonthlyData[] = months.slice(0, year === new Date().getFullYear() ? currentMonth + 1 : 12).map((month, idx) => {
        const baseAmount = 15000000 + Math.random() * 10000000
        const prevAmount = idx > 0 ? (15000000 + Math.random() * 10000000) : baseAmount
        return {
          month,
          year,
          monthNum: idx + 1,
          orders: Math.floor(150 + Math.random() * 100),
          amount: Math.floor(baseAmount),
          stores: Math.floor(30 + Math.random() * 20),
          avgOrder: Math.floor(baseAmount / (150 + Math.random() * 100)),
          growth: idx > 0 ? Math.round(((baseAmount - prevAmount) / prevAmount) * 100) : 0
        }
      })
      
      setData(mockData)
      
      // Calculate summary
      const totalAmount = mockData.reduce((sum, d) => sum + d.amount, 0)
      const totalOrders = mockData.reduce((sum, d) => sum + d.orders, 0)
      const bestMonthData = mockData.reduce((max, d) => d.amount > max.amount ? d : max, mockData[0])
      
      setSummary({
        yearTotal: totalAmount,
        yearOrders: totalOrders,
        avgMonthly: Math.round(totalAmount / mockData.length),
        bestMonth: bestMonthData?.month || '-'
      })
    } catch (error) {
      console.error('Failed to load monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<MonthlyData>[] = [
    { key: 'month', label: '월', render: (v, row) => (
      <span style={{ fontWeight: 600, fontSize: '15px' }}>{row.year}년 {v as string}</span>
    )},
    { key: 'orders', label: '주문수', align: 'center', render: (v) => (
      <span>{(v as number).toLocaleString()}건</span>
    )},
    { key: 'amount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, fontSize: '15px' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'stores', label: '거래처', align: 'center', render: (v) => (
      <span>{v as number}개</span>
    )},
    { key: 'avgOrder', label: '평균주문액', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'growth', label: '전월대비', align: 'center', render: (v) => {
      const growth = v as number
      if (growth === 0) return <span style={{ color: '#86868b' }}>-</span>
      return (
        <span style={{ 
          color: growth > 0 ? '#34c759' : '#ff3b30',
          fontWeight: 500
        }}>
          {growth > 0 ? '▲' : '▼'} {Math.abs(growth)}%
        </span>
      )
    }},
  ]

  const maxAmount = Math.max(...data.map(d => d.amount), 1)
  const years = [2024, 2025]

  return (
    <AdminLayout activeMenu="stats">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>월별 리포트</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>월별 매출 추이 및 실적을 분석합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {years.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: year === y ? '#007aff' : '#f3f4f6',
                color: year === y ? '#fff' : '#1d1d1f',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {y}년
            </button>
          ))}
        </div>
      </div>

      {/* 연간 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{year}년 총 매출</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{(summary.yearTotal / 100000000).toFixed(1)}억원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>총 주문</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{summary.yearOrders.toLocaleString()}건</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>월평균 매출</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{(summary.avgMonthly / 10000).toFixed(0)}만원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>최고 매출 월</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{summary.bestMonth}</div>
        </div>
      </div>

      {/* 월별 차트 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>📊 월별 매출 추이</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '0 20px' }}>
          {data.map((d, idx) => {
            const height = (d.amount / maxAmount) * 180
            const isCurrentMonth = d.year === new Date().getFullYear() && d.monthNum === new Date().getMonth() + 1
            return (
              <div 
                key={d.month}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '50px',
                    height: `${height}px`,
                    background: isCurrentMonth 
                      ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                      : `linear-gradient(180deg, #007aff ${100 - (idx * 5)}%, #5ac8fa 100%)`,
                    borderRadius: '6px 6px 0 0',
                    position: 'relative',
                    transition: 'height 0.3s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#666',
                    whiteSpace: 'nowrap'
                  }}>
                    {(d.amount / 10000).toFixed(0)}만
                  </div>
                </div>
                <span style={{ 
                  fontSize: '12px', 
                  color: isCurrentMonth ? '#007aff' : '#86868b',
                  fontWeight: isCurrentMonth ? 600 : 400
                }}>
                  {d.monthNum}월
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 월별 테이블 */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>월별 상세 데이터</h3>
          <button
            onClick={() => window.open(`/api/stats/export?type=monthly&year=${year}`, '_blank')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff',
              color: '#1d1d1f',
              border: '1px solid #e9ecef',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📥 엑셀 다운로드
          </button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="데이터가 없습니다"
        />
      </div>

      {/* 분기별 요약 */}
      {data.length >= 3 && (
        <div style={{ marginTop: '24px', background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>📅 분기별 요약</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4].map(quarter => {
              const quarterData = data.filter(d => Math.ceil(d.monthNum / 3) === quarter)
              const quarterAmount = quarterData.reduce((sum, d) => sum + d.amount, 0)
              const quarterOrders = quarterData.reduce((sum, d) => sum + d.orders, 0)
              
              if (quarterData.length === 0) {
                return (
                  <div key={quarter} style={{ 
                    padding: '20px', 
                    background: '#f9fafb', 
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Q{quarter}</div>
                    <div style={{ color: '#c5c5c7', fontSize: '13px' }}>데이터 없음</div>
                  </div>
                )
              }

              return (
                <div key={quarter} style={{ 
                  padding: '20px', 
                  background: '#f9fafb', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#007aff' }}>Q{quarter}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                    {(quarterAmount / 10000).toFixed(0)}만원
                  </div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>
                    {quarterOrders.toLocaleString()}건 주문
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
