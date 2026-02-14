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
      label: '?¼ì‹œ',
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
      label: '?¬ìš©??,
      render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span>
    },
    {
      key: 'success',
      label: 'ê²°ê³¼',
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
          {v ? '?±ê³µ' : '?¤íŒ¨'}
        </span>
      )
    },
    {
      key: 'failReason',
      label: '?¤íŒ¨ ?¬ìœ ',
      render: (v) => (
        <span style={{ fontSize: '13px', color: '#dc2626' }}>
          {v as string || '-'}
        </span>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP ì£¼ì†Œ',
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
      label: 'ë¸Œë¼?°ì?',
      render: (v) => (
        <span style={{ fontSize: '13px', color: '#666' }}>{v as string}</span>
      )
    },
  ]

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>?” ë¡œê·¸???´ë ¥</h1>
      </div>

      {/* ?µê³„ ì¹´ë“œ */}
      <StatCardGrid>
        <StatCard
          label="?¤ëŠ˜ ë¡œê·¸??
          value={stats.todayLogins}
          unit="??
          icon="??
        />
        <StatCard
          label="?¤ëŠ˜ ?¤íŒ¨"
          value={stats.todayFails}
          unit="??
          icon="??
          highlight={stats.todayFails > 5}
        />
        <StatCard
          label="?‘ì† ?¬ìš©??
          value={stats.uniqueUsers}
          unit="ëª?
          icon="?‘¤"
        />
      </StatCardGrid>

      {/* ?„í„° */}
      <div style={{ 
        background: 'var(--bg-primary)', 
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
            { key: 'all', label: '?„ì²´' },
            { key: 'success', label: '?±ê³µ' },
            { key: 'fail', label: '?¤íŒ¨' },
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
          <span style={{ color: 'var(--text-tertiary)' }}>~</span>
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
                background: 'var(--bg-primary)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ì´ˆê¸°??
            </button>
          )}
        </div>
      </div>

      {/* ?Œì´ë¸?*/}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="ë¡œê·¸???´ë ¥???†ìŠµ?ˆë‹¤"
      />

      {/* ?˜ì´ì§€?¤ì´??*/}
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
              background: 'var(--bg-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ?´ì „
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
              background: 'var(--bg-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            ?¤ìŒ
          </button>
        </div>
      )}

      {/* ?ˆë‚´ */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#0369a1' }}>
          ?’¡ ë³´ì•ˆ ?Œë¦¼
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0369a1' }}>
          <li>ë¡œê·¸???¤íŒ¨ê°€ 5???´ìƒ ë°œìƒ?˜ë©´ ?´ë‹¹ ê³„ì •???•ì¸?´ì£¼?¸ìš”.</li>
          <li>?µìˆ™?˜ì? ?Šì? IP ì£¼ì†Œ?ì„œ ?‘ì† ??ë¹„ë?ë²ˆí˜¸ ë³€ê²½ì„ ê¶Œì¥?©ë‹ˆ??</li>
          <li>ë¡œê·¸???´ë ¥?€ 90?¼ê°„ ë³´ê??©ë‹ˆ??</li>
        </ul>
      </div>
    </AdminLayout>
  )
}
