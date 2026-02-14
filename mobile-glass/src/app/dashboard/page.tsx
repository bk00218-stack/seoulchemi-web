'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
    return `${(num / 100000000).toFixed(1)}??
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(0)}ë§?
  }
  return formatNumber(num)
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
      background: 'var(--bg-primary)',
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
          {trend === 'up' ? '?? : trend === 'down' ? '?? : '??} ?„ì¼ ?€ë¹?
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
      setError('?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>??/div>
        <p>?€?œë³´??ë¡œë”© ì¤?..</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>??/div>
        <p>{error}</p>
      </div>
    )
  }

  if (!data) return null

  const chartData = data.chart.daily.map(d => ({
    ...d,
    date: d.date.slice(5), // MM-DD ?•ì‹
    ë§¤ì¶œ: d.revenue,
    ì£¼ë¬¸: d.orders
  }))

  return (
    <div style={{ padding: '24px', background: 'var(--gray-100)', minHeight: '100vh' }}>
      {/* ?¤ë” */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>?€?œë³´??/h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            ?¤ì‹œê°?ë¹„ì¦ˆ?ˆìŠ¤ ?„í™©
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
              {p === '7d' ? '7?? : p === '30d' ? '30?? : '90??}
            </button>
          ))}
        </div>
      </div>

      {/* ?µê³„ ì¹´ë“œ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="?¤ëŠ˜ ì£¼ë¬¸"
          value={data.today.orders}
          subValue={`?€ê¸?${data.today.pending}ê±?}
          icon="?“¦"
          color="#667eea"
        />
        <StatCard
          title="?¤ëŠ˜ ë§¤ì¶œ"
          value={`${formatCurrency(data.today.revenue)}??}
          subValue={`?¼í‰ê·?${formatCurrency(data.period.avgRevenuePerDay)}??}
          icon="?’°"
          color="#10b981"
        />
        <StatCard
          title="?œì„± ê±°ë˜ì²?
          value={data.stores.active}
          subValue={`ë¯¸ìˆ˜ê¸?${formatCurrency(data.stores.totalOutstanding)}??}
          icon="?ª"
          color="#f59e0b"
        />
        <StatCard
          title="?±ë¡ ?í’ˆ"
          value={data.products.total}
          subValue={`?¬ê³ ë¶€ì¡?${data.products.lowStock}ê°?}
          icon="?‘“"
          color="#ec4899"
        />
      </div>

      {/* ì°¨íŠ¸ ?ì—­ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '16px'
      }}>
        {/* ë§¤ì¶œ ì¶”ì´ */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
            ?“ˆ ë§¤ì¶œ ì¶”ì´
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip 
                formatter={(value: number) => [`${formatNumber(value)}??, 'ë§¤ì¶œ']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }}
              />
              <Area 
                type="monotone" 
                dataKey="ë§¤ì¶œ" 
                stroke="#667eea" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ì£¼ë¬¸ ??ì¶”ì´ */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
            ?“Š ì£¼ë¬¸ ??ì¶”ì´
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value}ê±?, 'ì£¼ë¬¸']}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)' }}
              />
              <Bar 
                dataKey="ì£¼ë¬¸" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ê¸°ê°„ ?”ì•½ */}
      <div style={{
        marginTop: '24px',
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          ?“‹ {data.period.days}???”ì•½
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>ì´?ì£¼ë¬¸</p>
            <p style={{ fontSize: '24px', fontWeight: 600 }}>{formatNumber(data.period.orders)}ê±?/p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>ì´?ë§¤ì¶œ</p>
            <p style={{ fontSize: '24px', fontWeight: 600 }}>{formatNumber(data.period.revenue)}??/p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>?¼í‰ê·?ì£¼ë¬¸</p>
            <p style={{ fontSize: '24px', fontWeight: 600 }}>{data.period.avgOrdersPerDay}ê±?/p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>?¼í‰ê·?ë§¤ì¶œ</p>
            <p style={{ fontSize: '24px', fontWeight: 600 }}>{formatCurrency(data.period.avgRevenuePerDay)}??/p>
          </div>
        </div>
      </div>
    </div>
  )
}
