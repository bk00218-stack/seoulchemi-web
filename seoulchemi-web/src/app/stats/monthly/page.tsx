'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'
import { useToast } from '@/contexts/ToastContext'

interface DailyStat {
  date: string
  orders: number
  amount: number
}

interface MonthlyData {
  totalOrders: number
  totalAmount: number
  dailyAvg: number
  prevMonthAmount: number
  changePercent: number
  dailyStats: DailyStat[]
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MonthlyReportPage() {
  const { toast } = useToast()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlyData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      // 당월 데이터
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const params = new URLSearchParams({ startDate, endDate })
      const res = await fetch(`/api/stats?${params}`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      const storeStats = result.storeStats || []
      const totalOrders = storeStats.reduce((s: number, o: any) => s + (o.totalOrders || o.orderCount || 0), 0)
      const totalAmount = storeStats.reduce((s: number, o: any) => s + (o.totalAmount || o.amount || 0), 0)

      // 전월 데이터
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
      const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
      const prevLastDay = new Date(prevYear, prevMonth, 0).getDate()
      const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`

      const prevRes = await fetch(`/api/stats?startDate=${prevStartDate}&endDate=${prevEndDate}`)
      const prevResult = await prevRes.json()
      const prevStats = prevResult.storeStats || []
      const prevMonthAmount = prevStats.reduce((s: number, o: any) => s + (o.totalAmount || o.amount || 0), 0)

      const changePercent = prevMonthAmount > 0 ? Math.round(((totalAmount - prevMonthAmount) / prevMonthAmount) * 100) : 0
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      const elapsedDays = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
        ? now.getDate() : daysInMonth
      const dailyAvg = elapsedDays > 0 ? Math.round(totalAmount / elapsedDays) : 0

      // 일별 매출 (dailyStats)
      const dailyStats: DailyStat[] = (result.dailyStats || []).map((d: any) => ({
        date: d.period || d.date,
        orders: d.orders || d.count || 0,
        amount: d.amount || 0,
      }))

      setData({ totalOrders, totalAmount, dailyAvg, prevMonthAmount, changePercent, dailyStats })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [])

  const handleExport = () => {
    if (!data?.dailyStats || data.dailyStats.length === 0) { toast.error('내보낼 데이터가 없습니다.'); return }
    exportToCSV(data.dailyStats as any[], [
      { key: 'date', label: '날짜' },
      { key: 'orders', label: '주문수' },
      { key: 'amount', label: '매출액' },
    ], `월별리포트_${selectedYear}${String(selectedMonth).padStart(2, '0')}`)
  }

  const maxAmount = data?.dailyStats ? Math.max(...data.dailyStats.map(d => d.amount), 1) : 1

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* 월 선택 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
        <button onClick={handleSearch} disabled={loading}
          style={{ ...btnStyle, background: '#2563eb', color: '#fff', padding: '10px 20px' }}>
          {loading ? '조회중...' : '조회'}
        </button>
        <button onClick={handleExport} style={{ ...btnStyle, background: '#fff', color: '#10b981', border: '1px solid #10b981' }}>
          📥 CSV
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>총 주문</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111' }}>{data?.totalOrders || 0}건</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>총 매출</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>{(data?.totalAmount || 0).toLocaleString()}원</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>전월 대비</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: (data?.changePercent || 0) >= 0 ? '#10b981' : '#dc2626' }}>
            {data?.changePercent !== undefined ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%` : '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>전월: {(data?.prevMonthAmount || 0).toLocaleString()}원</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>일 평균</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111' }}>{(data?.dailyAvg || 0).toLocaleString()}원</div>
        </div>
      </div>

      {/* 일별 매출 차트 (bar chart) */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>일별 매출 추이</h3>
        {(!data?.dailyStats || data.dailyStats.length === 0) ? (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            {loading ? '조회 중...' : '데이터가 없습니다'}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '200px', padding: '0 4px' }}>
            {data.dailyStats.map((d, i) => {
              const height = Math.max((d.amount / maxAmount) * 180, 2)
              const dayNum = d.date.split('-')[2] || String(i + 1)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    title={`${d.date}: ${d.amount.toLocaleString()}원 (${d.orders}건)`}
                    style={{
                      width: '100%', maxWidth: '24px', height: `${height}px`,
                      background: d.amount > 0 ? '#2563eb' : '#e5e7eb',
                      borderRadius: '2px 2px 0 0', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: '#9ca3af' }}>{dayNum}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 일별 상세 테이블 */}
      {data?.dailyStats && data.dailyStats.length > 0 && (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={thStyle}>날짜</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>주문수</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>매출액</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyStats.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={tdStyle}>{d.date}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{d.orders}건</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{d.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>합계</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {data.dailyStats.reduce((s, d) => s + d.orders, 0)}건
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {data.dailyStats.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Layout>
  )
}
