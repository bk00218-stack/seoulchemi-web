'use client'

import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockShippingStatus = [
  { name: '배송완료', value: 450, color: '#10b981' },
  { name: '배송중', value: 85, color: '#667eea' },
  { name: '배송대기', value: 45, color: '#f59e0b' },
  { name: '반품', value: 20, color: '#ef4444' },
]

const mockDriverData = [
  { name: '김배송', completed: 120, pending: 15, avgTime: 2.5 },
  { name: '이운송', completed: 98, pending: 12, avgTime: 2.8 },
  { name: '박택배', completed: 85, pending: 8, avgTime: 3.0 },
  { name: '최배달', completed: 75, pending: 10, avgTime: 2.2 },
  { name: '정운전', completed: 72, pending: 5, avgTime: 2.6 },
]

const mockDailyShipping = [
  { date: '월', 완료: 65, 대기: 15 },
  { date: '화', 완료: 72, 대기: 12 },
  { date: '수', 완료: 80, 대기: 18 },
  { date: '목', 완료: 68, 대기: 10 },
  { date: '금', 완료: 90, 대기: 20 },
  { date: '토', 완료: 45, 대기: 8 },
  { date: '일', 완료: 30, 대기: 2 },
]

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

export default function ShippingStatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  const totalShipping = mockShippingStatus.reduce((sum, s) => sum + s.value, 0)
  const completedCount = mockShippingStatus.find(s => s.name === '배송완료')?.value || 0
  const completionRate = ((completedCount / totalShipping) * 100).toFixed(1)

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>배송 통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>배송 현황 및 배송 담당자별 실적을 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selectStyle}>
            <option>담당자 전체</option>
            {mockDriverData.map(d => <option key={d.name}>{d.name}</option>)}
          </select>
          <select style={selectStyle}>
            <option>상태 전체</option>
            {mockShippingStatus.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['오늘', '이번주', '이번달'].map(label => (
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
          { label: '총 배송건', value: formatNumber(totalShipping) + '건', color: 'var(--gray-700)' },
          { label: '배송완료', value: formatNumber(completedCount) + '건', color: 'var(--success)' },
          { label: '배송중', value: '85건', color: 'var(--primary)' },
          { label: '배송대기', value: '45건', color: 'var(--warning)' },
          { label: '완료율', value: completionRate + '%', color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pie Chart - 배송 현황 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            🥧 배송 현황 분포
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={mockShippingStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockShippingStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}건`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - 일별 배송 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📊 요일별 배송 현황
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockDailyShipping}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="date" stroke="var(--gray-400)" fontSize={12} />
              <YAxis stroke="var(--gray-400)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
              <Legend />
              <Bar dataKey="완료" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="대기" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver Performance Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>🚚 배송 담당자별 실적</h3>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>담당자</th>
                <th style={thStyle}>배송완료</th>
                <th style={thStyle}>배송대기</th>
                <th style={thStyle}>평균 배송시간</th>
                <th style={thStyle}>완료율</th>
                <th style={thStyle}>실적 그래프</th>
              </tr>
            </thead>
            <tbody>
              {mockDriverData.map((driver, i) => {
                const total = driver.completed + driver.pending
                const rate = ((driver.completed / total) * 100).toFixed(1)
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>🚗</span>
                        {driver.name}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--success)' }}>{driver.completed}건</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--warning)' }}>{driver.pending}건</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{driver.avgTime}시간</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{rate}%</td>
                    <td style={tdStyle}>
                      <div style={{ 
                        background: 'var(--gray-100)', 
                        borderRadius: 4, 
                        height: 8, 
                        width: 100,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          background: 'var(--success)', 
                          height: '100%', 
                          width: `${rate}%`,
                          borderRadius: 4
                        }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
