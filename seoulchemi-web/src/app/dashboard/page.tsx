'use client'

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ORDER_SIDEBAR } from '../constants/sidebar'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface DashboardData {
  today: {
    orders: number
    revenue: number
    pending: number
  }
  period: {
    days: number
    orders: number
    revenue: number
    avgOrdersPerDay: number
    avgRevenuePerDay: number
  }
  stores: {
    active: number
    totalOutstanding: number
  }
  products: {
    total: number
    lowStock: number
  }
  chart: {
    daily: Array<{
      date: string
      orders: number
      revenue: number
    }>
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

function formatCurrency(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(0)}만`
  }
  return formatNumber(num)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function StatCard({ title, value, subValue, icon, color, trend }: {
  title: string
  value: string | number
  subValue?: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: color,
        opacity: 0.1,
        borderRadius: '50%'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {subValue && (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{subValue}</p>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          background: color,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : 'var(--text-secondary)'
        }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} 전일 대비
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [period])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {loading && !data ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p>대시보드 로딩 중...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>❌</div>
          <p>{error}</p>
        </div>
      ) : !data ? null : (
      <div>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>대시보드</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            실시간 비즈니스 현황
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: period === p ? '#667eea' : '#fff',
                color: period === p ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : '90일'}
            </button>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="오늘 주문"
          value={data.today.orders}
          subValue={`대기 ${data.today.pending}건`}
          icon="📦"
          color="#667eea"
        />
        <StatCard
          title="오늘 매출"
          value={`${formatCurrency(data.today.revenue)}원`}
          subValue={`일평균 ${formatCurrency(data.period.avgRevenuePerDay)}원`}
          icon="💰"
          color="#10b981"
        />
        <StatCard
          title="활성 거래처"
          value={data.stores.active}
          subValue={`미수금 ${formatCurrency(data.stores.totalOutstanding)}원`}
          icon="🏪"
          color="#f59e0b"
        />
        <StatCard
          title="등록 상품"
          value={data.products.total}
          subValue={`재고부족 ${data.products.lowStock}개`}
          icon="👓"
          color="#ec4899"
        />
      </div>

      {/* 기간 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="기간 총 주문"
          value={`${formatNumber(data.period.orders)}건`}
          subValue={`일평균 ${data.period.avgOrdersPerDay}건`}
          icon="📊"
          color="#8b5cf6"
        />
        <StatCard
          title="기간 총 매출"
          value={`${formatCurrency(data.period.revenue)}원`}
          subValue={`일평균 ${formatCurrency(data.period.avgRevenuePerDay)}원`}
          icon="📈"
          color="#06b6d4"
        />
      </div>

      {/* 일별 매출/주문 차트 */}
      {data.chart.daily.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                일별 매출 추이
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                최근 {data.period.days}일간 매출 및 주문 현황
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.chart.daily.map(d => ({
                ...d,
                dateLabel: formatDateLabel(d.date),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}건`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: 13,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === '매출') return [`${formatNumber(value)}원`, name]
                    return [`${value}건`, name]
                  }}
                  labelFormatter={(label: string) => label}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  name="매출"
                  fill="#667eea"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name="주문"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
      )}
    </Layout>
  )
}
