'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalCustomers: number
  newCustomersThisMonth: number
  todaySales: number
  monthSales: number
  pendingReminders: number
  recentCustomers: Array<{
    id: number
    name: string
    phone: string
    lastVisitAt: string | null
  }>
  todayBirthdays: Array<{
    id: number
    name: string
    phone: string
  }>
}

function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
  if (amount >= 10000) return `${Math.round(amount / 10000).toLocaleString()}만`
  return new Intl.NumberFormat('ko-KR').format(amount)
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function CrmDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/crm/dashboard')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setStats(data)
      } catch {
        setError('데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: 'var(--gray-400)' }}>대시보드 로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
      {/* 페이지 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)' }}>CRM 대시보드</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>오늘의 현황을 확인하세요</p>
        </div>
        <Link
          href="/crm/customers/new"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 8,
            background: '#667eea', color: '#fff',
            fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + 신규 고객
        </Link>
      </div>

      {/* 통계 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <StatCard icon="👥" label="전체 고객" value={stats?.totalCustomers?.toLocaleString() || '0'} sub={`+${stats?.newCustomersThisMonth || 0} 이번달`} color="#667eea" />
        <StatCard icon="💰" label="오늘 매출" value={`${formatCurrency(stats?.todaySales || 0)}원`} color="#10b981" />
        <StatCard icon="📈" label="이번달 매출" value={`${formatCurrency(stats?.monthSales || 0)}원`} color="#8b5cf6" />
        <StatCard icon="🔔" label="예정 알림" value={`${stats?.pendingReminders || 0}건`} color="#f59e0b" />
      </div>

      {/* 두 컬럼 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* 최근 방문 고객 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>최근 방문 고객</h2>
            <Link href="/crm/customers" style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}>전체보기</Link>
          </div>
          {stats?.recentCustomers && stats.recentCustomers.length > 0 ? (
            <div>
              {stats.recentCustomers.map(customer => (
                <Link
                  key={customer.id}
                  href={`/crm/customers/${customer.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--gray-50)', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--gray-100)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, color: 'var(--gray-600)',
                    }}>
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{customer.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{customer.phone}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatDate(customer.lastVisitAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              등록된 고객이 없습니다
            </div>
          )}
        </div>

        {/* 오늘 생일 */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>🎂 오늘 생일</h2>
          </div>
          {stats?.todayBirthdays && stats.todayBirthdays.length > 0 ? (
            <div>
              {stats.todayBirthdays.map(customer => (
                <div key={customer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--gray-50)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#fce7f3', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, color: '#ec4899',
                    }}>
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{customer.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{customer.phone}</p>
                    </div>
                  </div>
                  <button style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 8,
                    background: '#fce7f3', color: '#ec4899',
                    border: 'none', cursor: 'pointer', fontWeight: 500,
                  }}>
                    축하 문자
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              오늘 생일인 고객이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 빠른 실행 */}
      <div style={cardStyle}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>빠른 실행</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, padding: 16 }}>
          <QuickAction href="/crm/customers/new" icon="👤" label="신규 고객" bg="#eff6ff" color="#2563eb" />
          <QuickAction href="/crm/sales" icon="🧾" label="판매 내역" bg="#f0fdf4" color="#16a34a" />
          <QuickAction href="/crm/orders" icon="📦" label="렌즈 주문" bg="#faf5ff" color="#7c3aed" />
          <QuickAction href="/crm/customers" icon="🔍" label="고객 검색" bg="#fff7ed" color="#ea580c" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid var(--gray-100)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>{value}</p>
        </div>
      </div>
      {sub && <p style={{ marginTop: 6, fontSize: 12, color: '#10b981' }}>{sub}</p>}
    </div>
  )
}

function QuickAction({ href, icon, label, bg, color }: { href: string; icon: string; label: string; bg: string; color: string }) {
  return (
    <Link href={href} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '16px 12px', borderRadius: 12, background: bg,
      textDecoration: 'none', transition: 'opacity 0.2s',
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
    </Link>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid var(--gray-100)',
  overflow: 'hidden',
}
