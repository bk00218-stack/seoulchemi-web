'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockStoreData = [
  { name: '서울안경 강남점', group: '서울 그룹', orders: 85, revenue: 8500000, outstanding: 850000 },
  { name: '비전옵틱 홍대점', group: '서울 그룹', orders: 72, revenue: 7200000, outstanding: 500000 },
  { name: '클리어뷰 부산점', group: '부산 그룹', orders: 65, revenue: 6500000, outstanding: 1200000 },
  { name: '아이케어 수원점', group: '경기 그룹', orders: 58, revenue: 5800000, outstanding: 300000 },
  { name: '프리미엄안경 대구점', group: '대구 그룹', orders: 52, revenue: 5200000, outstanding: 600000 },
  { name: '스타일옵틱 인천점', group: '인천 그룹', orders: 48, revenue: 4800000, outstanding: 400000 },
  { name: '눈사랑 안경원', group: '서울 그룹', orders: 45, revenue: 4500000, outstanding: 200000 },
  { name: '아이스타 분당점', group: '경기 그룹', orders: 42, revenue: 4200000, outstanding: 350000 },
]

const mockMonthlyTrend = [
  { month: '1월', 매출: 42, 주문: 380 },
  { month: '2월', 매출: 45, 주문: 420 },
  { month: '3월', 매출: 48, 주문: 450 },
  { month: '4월', 매출: 52, 주문: 480 },
  { month: '5월', 매출: 55, 주문: 520 },
  { month: '6월', 매출: 58, 주문: 550 },
]

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

function formatCurrency(num: number): string {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`
  if (num >= 10000) return `${Math.round(num / 10000)}만`
  return formatNumber(num)
}

export default function StoreStatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [sortBy, setSortBy] = useState<'revenue' | 'orders'>('revenue')

  const totalOrders = mockStoreData.reduce((sum, s) => sum + s.orders, 0)
  const totalRevenue = mockStoreData.reduce((sum, s) => sum + s.revenue, 0)
  const totalOutstanding = mockStoreData.reduce((sum, s) => sum + s.outstanding, 0)
  const avgRevenue = Math.round(totalRevenue / mockStoreData.length)

  const sortedStores = [...mockStoreData].sort((a, b) => 
    sortBy === 'revenue' ? b.revenue - a.revenue : b.orders - a.orders
  )

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>가맹점별 통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점별 매출 및 주문 현황을 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selectStyle}>
            <option>그룹 전체</option>
            <option>서울 그룹</option>
            <option>경기 그룹</option>
            <option>부산 그룹</option>
            <option>대구 그룹</option>
            <option>인천 그룹</option>
          </select>
          <select style={selectStyle}>
            <option>지역 전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>인천</option>
            <option>부산</option>
            <option>대구</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['이번달', '3개월', '6개월', '1년'].map(label => (
              <button key={label} style={{
                padding: '6px 12px', borderRadius: 20,
                border: '1px solid var(--gray-200)', background: '#fff',
                fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer'
              }}>{label}</button>
            ))}
          </div>
          <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>조회</button>
          <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>📥 엑셀다운</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: '총 가맹점', value: mockStoreData.length + '개', color: 'var(--gray-700)' },
          { label: '총 주문수', value: formatNumber(totalOrders) + '건', color: 'var(--primary)' },
          { label: '총 매출', value: formatCurrency(totalRevenue) + '원', color: 'var(--success)' },
          { label: '평균 매출', value: formatCurrency(avgRevenue) + '원', color: 'var(--warning)' },
          { label: '총 미수금', value: formatCurrency(totalOutstanding) + '원', color: 'var(--danger)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Bar Chart - 가맹점별 매출 TOP */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            🏆 가맹점별 매출 TOP 8
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedStores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis type="number" stroke="var(--gray-400)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis dataKey="name" type="category" stroke="var(--gray-400)" fontSize={11} width={120} />
              <Tooltip
                formatter={(value: number) => [`${formatNumber(value)}원`, '매출']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }}
              />
              <Bar dataKey="revenue" fill="#667eea" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - 월별 추이 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📈 월별 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMonthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="month" stroke="var(--gray-400)" fontSize={12} />
              <YAxis yAxisId="left" stroke="#667eea" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="매출" stroke="#667eea" strokeWidth={2} name="매출(백만)" />
              <Line yAxisId="right" type="monotone" dataKey="주문" stroke="#10b981" strokeWidth={2} name="주문(건)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>가맹점별 상세 현황</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setSortBy('revenue')}
              style={{ 
                ...btnStyle, 
                background: sortBy === 'revenue' ? 'var(--primary)' : '#fff',
                color: sortBy === 'revenue' ? '#fff' : 'var(--gray-600)',
                border: '1px solid var(--gray-200)'
              }}>매출순</button>
            <button 
              onClick={() => setSortBy('orders')}
              style={{ 
                ...btnStyle, 
                background: sortBy === 'orders' ? 'var(--primary)' : '#fff',
                color: sortBy === 'orders' ? '#fff' : 'var(--gray-600)',
                border: '1px solid var(--gray-200)'
              }}>주문순</button>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>가맹점명</th>
                <th style={thStyle}>그룹</th>
                <th style={thStyle}>주문수</th>
                <th style={thStyle}>매출액</th>
                <th style={thStyle}>미수금</th>
                <th style={thStyle}>평균 주문액</th>
                <th style={thStyle}>점유율</th>
              </tr>
            </thead>
            <tbody>
              {sortedStores.map((store, i) => {
                const avgOrder = Math.round(store.revenue / store.orders)
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{store.name}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: 'var(--gray-100)', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 12 
                      }}>{store.group}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(store.orders)}건</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatNumber(store.revenue)}원</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: store.outstanding > 500000 ? 'var(--danger)' : 'var(--gray-600)' }}>
                      {formatNumber(store.outstanding)}원
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(avgOrder)}원</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{((store.revenue / totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td style={tdStyle} colSpan={3}>합계</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totalOrders)}건</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--success)' }}>{formatNumber(totalRevenue)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--danger)' }}>{formatNumber(totalOutstanding)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(avgRevenue)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Layout>
  )
}
