'use client'

import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, inputStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockProductSales = [
  { name: '안경테 A형', sales: 150, revenue: 4500000 },
  { name: '선글라스 B형', sales: 120, revenue: 3600000 },
  { name: '콘택트렌즈 C형', sales: 200, revenue: 2000000 },
  { name: '안경 클리너', sales: 300, revenue: 900000 },
  { name: '안경케이스', sales: 180, revenue: 540000 },
  { name: '렌즈 D형', sales: 80, revenue: 2400000 },
]

const mockCategoryData = [
  { name: '안경테', value: 45, color: '#667eea' },
  { name: '선글라스', value: 25, color: '#10b981' },
  { name: '콘택트렌즈', value: 20, color: '#f59e0b' },
  { name: '액세서리', value: 10, color: '#ec4899' },
]

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

export default function ProductStatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  const totalSales = mockProductSales.reduce((sum, p) => sum + p.sales, 0)
  const totalRevenue = mockProductSales.reduce((sum, p) => sum + p.revenue, 0)

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>상품별 통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>상품별 판매량 및 매출을 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['이번주', '이번달', '3개월', '6개월'].map(label => (
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
          { label: '총 판매수량', value: formatNumber(totalSales) + '개', color: 'var(--primary)' },
          { label: '총 매출', value: formatNumber(totalRevenue) + '원', color: 'var(--success)' },
          { label: '등록 상품', value: '156개', color: 'var(--warning)' },
          { label: '판매 상품', value: mockProductSales.length + '개', color: 'var(--gray-700)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Bar Chart - 상품별 판매량 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📊 상품별 판매량
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockProductSales} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis type="number" stroke="var(--gray-400)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="var(--gray-400)" fontSize={12} width={100} />
              <Tooltip
                formatter={(value: number) => [`${formatNumber(value)}개`, '판매량']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }}
              />
              <Bar dataKey="sales" fill="#667eea" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - 카테고리별 비율 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            🥧 카테고리별 비율
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '비율']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>상품별 상세 현황</h3>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>상품명</th>
                <th style={thStyle}>카테고리</th>
                <th style={thStyle}>판매수량</th>
                <th style={thStyle}>매출액</th>
                <th style={thStyle}>점유율</th>
              </tr>
            </thead>
            <tbody>
              {mockProductSales.map((product, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                  <td style={tdStyle}>{product.name}</td>
                  <td style={tdStyle}>안경</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(product.sales)}개</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(product.revenue)}원</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{((product.revenue / totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td style={tdStyle} colSpan={3}>합계</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totalSales)}개</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totalRevenue)}원</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Layout>
  )
}
