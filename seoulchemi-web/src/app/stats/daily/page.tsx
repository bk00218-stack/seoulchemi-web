'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'
import { useToast } from '@/contexts/ToastContext'

interface DailyData {
  totalOrders: number
  totalAmount: number
  depositAmount: number
  topStores: Array<{ name: string; amount: number; orders: number }>
  topProducts: Array<{ name: string; brand: string; quantity: number; amount: number }>
  hourlyOrders: Array<{ hour: number; count: number; amount: number }>
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DailyReportPage() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: selectedDate, endDate: selectedDate })
      const res = await fetch(`/api/stats?${params}`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      // 주문 데이터 집계
      const orders = result.storeStats || []
      const totalOrders = orders.reduce((s: number, o: any) => s + (o.totalOrders || o.orderCount || 0), 0)
      const totalAmount = orders.reduce((s: number, o: any) => s + (o.totalAmount || o.amount || 0), 0)

      // 입금 데이터
      const txRes = await fetch(`/api/receivables/transactions?type=deposit&startDate=${selectedDate}&endDate=${selectedDate}&limit=500`)
      const txData = await txRes.json()
      const depositAmount = (txData.transactions || []).reduce((s: number, t: any) => s + (t.amount || 0), 0)

      // 상위 가맹점
      const topStores = orders
        .map((s: any) => ({ name: s.storeName || s.name || '', amount: s.totalAmount || 0, orders: s.totalOrders || s.orderCount || 0 }))
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 10)

      // 상위 상품
      const products = result.productStats || []
      const topProducts = products
        .map((p: any) => ({ name: p.productName || p.name || '', brand: p.brandName || '', quantity: p.totalQuantity || 0, amount: p.totalAmount || 0 }))
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 10)

      // 시간대별 (dailyStats에서 추출 가능한 경우)
      const hourlyOrders: Array<{ hour: number; count: number; amount: number }> = []

      setData({ totalOrders, totalAmount, depositAmount, topStores, topProducts, hourlyOrders })
    } catch (err: any) {
      toast.error(err.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [])

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(formatDate(d))
  }
  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(formatDate(d))
  }

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* 날짜 선택 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={prevDay} style={{ ...btnStyle, padding: '8px 12px' }}>◀</button>
        <input
          type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
        />
        <button onClick={nextDay} style={{ ...btnStyle, padding: '8px 12px' }}>▶</button>
        <button onClick={handleSearch} disabled={loading}
          style={{ ...btnStyle, background: '#2563eb', color: '#fff', padding: '10px 20px' }}>
          {loading ? '조회중...' : '조회'}
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
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>입금액</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{(data?.depositAmount || 0).toLocaleString()}원</div>
        </div>
      </div>

      {/* 가맹점별 + 상품별 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 상위 가맹점 */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>상위 가맹점</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={thStyle}>가맹점</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>주문</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.topStores || data.topStores.length === 0) ? (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '30px' }}>
                  {loading ? '조회 중...' : '데이터 없음'}
                </td></tr>
              ) : data.topStores.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{s.orders}건</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{s.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상위 상품 */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>상위 상품</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={thStyle}>상품</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>수량</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.topProducts || data.topProducts.length === 0) ? (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '30px' }}>
                  {loading ? '조회 중...' : '데이터 없음'}
                </td></tr>
              ) : data.topProducts.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>{p.brand}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{p.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
