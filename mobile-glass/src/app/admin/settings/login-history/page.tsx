'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface LoginRecord {
  id: number
  userId: number
  username: string
  ipAddress: string
  userAgent: string
  success: boolean
  failReason: string | null
  createdAt: string
}

interface Stats {
  todayLogins: number
  todayFails: number
  uniqueUsers: number
}

export default function LoginHistoryPage() {
  const [data, setData] = useState<LoginRecord[]>([])
  const [stats, setStats] = useState<Stats>({ todayLogins: 0, todayFails: 0, uniqueUsers: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'fail'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter === 'success') params.set('success', 'true')
      if (filter === 'fail') params.set('success', 'false')
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/login-history?${params}`)
      const json = await res.json()

      if (json.error) {
        console.error(json.error)
        return
      }

      setData(json.history)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filter, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns: Column<LoginRecord>[] = [
    {
      key: 'createdAt',
      label: '일시',
      width: '160px',
      render: (v) => (
        <span style={{ fontSize: '13px', color: '#666' }}>
          {new Date(v as string).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'username',
      label: '사용자',
      render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span>
    },
    {
      key: 'success',
      label: '결과',
      align: 'center',
      width: '80px',
      render: (v) => (
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          background: v ? '#d1fae5' : '#fee2e2',
          color: v ? '#059669' : '#dc2626',
        }}>
          {v ? '성공' : '실패'}
        </span>
      )
    },
    {
      key: 'failReason',
      label: '실패 사유',
      render: (v) => (
        <span style={{ fontSize: '13px', color: '#dc2626' }}>
          {v as string || '-'}
        </span>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP 주소',
      render: (v) => (
        <code style={{ 
          fontSize: '12px', 
          background: '#f3f4f6', 
          padding: '2px 6px', 
          borderRadius: '4px' 
        }}>
          {v as string}
        </code>
      )
    },
    {
      key: 'userAgent',
      label: '브라우저',
      render: (v) => (
        <span style={{ fontSize: '13px', color: '#666' }}>{v as string}</span>
      )
    },
  ]

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>🔐 로그인 이력</h1>
      </div>

      {/* 통계 카드 */}
      <StatCardGrid>
        <StatCard
          label="오늘 로그인"
          value={stats.todayLogins}
          unit="회"
          icon="✅"
        />
        <StatCard
          label="오늘 실패"
          value={stats.todayFails}
          unit="회"
          icon="❌"
          highlight={stats.todayFails > 5}
        />
        <StatCard
          label="접속 사용자"
          value={stats.uniqueUsers}
          unit="명"
          icon="👤"
        />
      </StatCardGrid>

      {/* 필터 */}
      <div style={{ 
        background: '#fff', 
        padding: '16px 20px', 
        borderRadius: '12px', 
        marginBottom: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: '전체' },
            { key: 'success', label: '성공' },
            { key: 'fail', label: '실패' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => { setFilter(item.key as typeof filter); setPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === item.key ? '#007aff' : '#f3f4f6',
                color: filter === item.key ? '#fff' : '#666',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          <span style={{ color: '#999' }}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="로그인 이력이 없습니다"
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            이전
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* 안내 */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#0369a1' }}>
          💡 보안 알림
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0369a1' }}>
          <li>로그인 실패가 5회 이상 발생하면 해당 계정을 확인해주세요.</li>
          <li>익숙하지 않은 IP 주소에서 접속 시 비밀번호 변경을 권장합니다.</li>
          <li>로그인 이력은 90일간 보관됩니다.</li>
        </ul>
      </div>
    </AdminLayout>
  )
}
