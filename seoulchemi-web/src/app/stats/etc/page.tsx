'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockVisitData = [
  { date: '월', 방문: 120, 주문: 45 },
  { date: '화', 방문: 150, 주문: 52 },
  { date: '수', 방문: 180, 주문: 68 },
  { date: '목', 방문: 140, 주문: 48 },
  { date: '금', 방문: 200, 주문: 75 },
  { date: '토', 방문: 90, 주문: 32 },
  { date: '일', 방문: 60, 주문: 20 },
]

const mockPaymentData = [
  { name: '카드결제', value: 55, color: '#667eea' },
  { name: '현금', value: 20, color: '#10b981' },
  { name: '계좌이체', value: 15, color: '#f59e0b' },
  { name: '외상', value: 10, color: '#ef4444' },
]

const mockAgeData = [
  { age: '20대', 비율: 15 },
  { age: '30대', 비율: 28 },
  { age: '40대', 비율: 32 },
  { age: '50대', 비율: 18 },
  { age: '60대+', 비율: 7 },
]

const mockTimeData = [
  { time: '09-10', 주문: 12 },
  { time: '10-11', 주문: 25 },
  { time: '11-12', 주문: 35 },
  { time: '12-13', 주문: 28 },
  { time: '13-14', 주문: 42 },
  { time: '14-15', 주문: 38 },
  { time: '15-16', 주문: 45 },
  { time: '16-17', 주문: 50 },
  { time: '17-18', 주문: 32 },
  { time: '18-19', 주문: 18 },
]

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

export default function EtcStatsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>기타 통계</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>결제, 방문, 시간대 등 다양한 지표를 확인합니다</p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selectStyle}>
            <option>통계 유형 전체</option>
            <option>방문/주문 분석</option>
            <option>결제수단 분석</option>
            <option>시간대 분석</option>
            <option>고객 연령대 분석</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>기간:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--gray-400)' }}>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['이번주', '이번달', '3개월'].map(label => (
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
          { label: '총 방문수', value: '940회', icon: '👥', color: 'var(--primary)' },
          { label: '전환율', value: '36.2%', icon: '📈', color: 'var(--success)' },
          { label: '평균 주문액', value: '125,000원', icon: '💰', color: 'var(--warning)' },
          { label: '재구매율', value: '42.5%', icon: '🔄', color: 'var(--gray-700)' },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Area Chart - 방문/주문 추이 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            📊 방문 vs 주문 추이
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockVisitData}>
              <defs>
                <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrder" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="date" stroke="var(--gray-400)" fontSize={12} />
              <YAxis stroke="var(--gray-400)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
              <Legend />
              <Area type="monotone" dataKey="방문" stroke="#667eea" strokeWidth={2} fillOpacity={1} fill="url(#colorVisit)" />
              <Area type="monotone" dataKey="주문" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrder)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - 결제수단 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            💳 결제수단 비율
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={mockPaymentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockPaymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '비율']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bar Chart - 시간대별 주문 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            ⏰ 시간대별 주문 분포
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="time" stroke="var(--gray-400)" fontSize={11} />
              <YAxis stroke="var(--gray-400)" fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value}건`, '주문']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} 
              />
              <Bar dataKey="주문" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              💡 <strong>피크타임:</strong> 15:00 ~ 17:00 (평균 대비 35% 증가)
            </div>
          </div>
        </div>

        {/* Bar Chart - 연령대별 분포 */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
            👥 고객 연령대 분포
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockAgeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="age" stroke="var(--gray-400)" fontSize={12} />
              <YAxis stroke="var(--gray-400)" fontSize={12} unit="%" />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '비율']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }} 
              />
              <Bar dataKey="비율" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              💡 <strong>주요 고객층:</strong> 40대 (32%) &gt; 30대 (28%) &gt; 50대 (18%)
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-900)' }}>
          📋 추가 지표
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: '신규 고객', value: '45명', change: '+12%', positive: true },
            { label: '반품률', value: '3.2%', change: '-0.5%', positive: true },
            { label: '평균 결제시간', value: '2.3분', change: '-15초', positive: true },
            { label: '고객 만족도', value: '4.5/5', change: '+0.2', positive: true },
            { label: '1인당 구매 수', value: '1.8개', change: '+0.1', positive: true },
            { label: '할인 사용률', value: '28%', change: '+5%', positive: false },
            { label: '포인트 적립률', value: '78%', change: '+3%', positive: true },
            { label: '앱 주문 비율', value: '42%', change: '+8%', positive: true },
          ].map((metric, i) => (
            <div key={i} style={{ 
              padding: 16, 
              background: 'var(--gray-50)', 
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{metric.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>{metric.value}</div>
              <div style={{ 
                fontSize: 12, 
                color: metric.positive ? 'var(--success)' : 'var(--warning)',
                fontWeight: 500
              }}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
