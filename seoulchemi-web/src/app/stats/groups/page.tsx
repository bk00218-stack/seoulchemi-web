'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockGroupData = [
  { name: '서울 그룹', stores: 25, orders: 450, revenue: 45000000, outstanding: 5000000 },
  { name: '경기 그룹', stores: 18, orders: 320, revenue: 32000000, outstanding: 3200000 },
  { name: '인천 그룹', stores: 12, orders: 180, revenue: 18000000, outstanding: 1800000 },
  { name: '부산 그룹', stores: 15, orders: 220, revenue: 22000000, outstanding: 2500000 },
  { name: '대구 그룹', stores: 10, orders: 150, revenue: 15000000, outstanding: 1500000 },
]

const mockTrendData = [
  { month: '1월', 서울: 40, 경기: 30, 인천: 15, 부산: 20 },
  { month: '2월', 서울: 42, 경기: 32, 인천: 18, 부산: 22 },
  { month: '3월', 서울: 45, 경기: 35, 인천: 16, 부산: 21 },
  { month: '4월', 서울: 48, 경기: 33, 인천: 20, 부산: 24 },
  { month: '5월', 서울: 50, 경기: 38, 인천: 22, 부산: 25 },
  { month: '6월', 서울: 52, 경기: 40, 인천: 24, 부산: 28 },
]

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

function formatCurrency(num: number): string {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`
  if (num >= 10000) return `${Math.round(num / 10000)}만`
  return formatNumber(num)
}

export default function GroupStatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  const totalStores = mockGroupData.reduce((sum, g) => sum + g.stores, 0)
  const totalOrders = mockGroupData.reduce((sum, g) => sum + g.orders, 0)
  const totalRevenue = mockGroupData.reduce((sum, g) => sum + g.revenue, 0)
  const totalOutstanding = mockGroupData.reduce((sum, g) => sum + g.outstanding, 0)

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>그룹별 통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점 그룹별 매출 현황을 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selectStyle}>
            <option>그룹 전체</option>
            {mockGroupData.map(g => <option key={g.name}>{g.name}</option>)}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: '총 그룹 수', value: mockGroupData.length + '개', color: 'var(--primary)' },
          { label: '총 가맹점', value: totalStores + '개', color: 'var(--success)' },
          { label: '총 매출', value: formatCurrency(totalRevenue) + '원', color: 'var(--warning)' },
          { label: '총 미수금', value: formatCurrency(totalOutstanding) + '원', color: 'var(--danger)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bar Chart - 그룹별 매출 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📊 그룹별 매출 비교
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockGroupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="name" stroke="var(--gray-400)" fontSize={12} />
              <YAxis stroke="var(--gray-400)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value: number) => [`${formatNumber(value)}원`, '매출']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }}
              />
              <Bar dataKey="revenue" fill="#667eea" radius={[4, 4, 0, 0]} name="매출" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - 월별 추이 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📈 그룹별 월별 추이 (단위: 백만원)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="month" stroke="var(--gray-400)" fontSize={12} />
              <YAxis stroke="var(--gray-400)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
              <Legend />
              <Line type="monotone" dataKey="서울" stroke="#667eea" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="경기" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="인천" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="부산" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>그룹별 상세 현황</h3>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>그룹명</th>
                <th style={thStyle}>가맹점 수</th>
                <th style={thStyle}>주문 수</th>
                <th style={thStyle}>매출액</th>
                <th style={thStyle}>미수금</th>
                <th style={thStyle}>점유율</th>
              </tr>
            </thead>
            <tbody>
              {mockGroupData.map((group, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                  <td style={tdStyle}>{group.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{group.stores}개</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(group.orders)}건</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(group.revenue)}원</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--danger)' }}>{formatNumber(group.outstanding)}원</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{((group.revenue / totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td style={tdStyle} colSpan={2}>합계</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{totalStores}개</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totalOrders)}건</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totalRevenue)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--danger)' }}>{formatNumber(totalOutstanding)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Layout>
  )
}
