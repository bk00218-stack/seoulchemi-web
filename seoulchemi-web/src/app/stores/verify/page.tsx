'use client'

import { useEffect, useState, useCallback } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import { useToast } from '@/contexts/ToastContext'

interface StoreUser {
  id: number
  username: string
  name: string
  email: string
  isActive: boolean
  storeId: number | null
  createdAt: string
  lastLoginAt: string | null
  store: {
    id: number
    name: string
    ownerName: string | null
    phone: string | null
    code: string
  } | null
}

export default function VerifyPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<StoreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending')
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab })
      if (search) params.set('search', search)
      const res = await fetch(`/api/stores/verify?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error('목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAction = async (userId: number, action: 'approve' | 'reject', userName: string) => {
    const msg = action === 'approve'
      ? `${userName} 계정을 승인하시겠습니까?`
      : `${userName} 계정을 거절(삭제)하시겠습니까?`
    if (!confirm(msg)) return

    try {
      const res = await fetch('/api/stores/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.error || '처리 실패')
      }
    } catch {
      toast.error('처리 실패')
    }
  }

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--primary)' : '#fff',
    color: active ? '#fff' : 'var(--gray-600)',
    border: '1px solid',
    borderColor: active ? 'var(--primary)' : 'var(--gray-200)',
    borderRadius: 8,
    cursor: 'pointer',
  })

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--gray-600)',
    background: 'var(--gray-50)',
    borderBottom: '2px solid var(--gray-200)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid var(--gray-100)',
    whiteSpace: 'nowrap',
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>가맹점 승인관리</h1>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
          안경원 사이트에서 회원가입한 계정을 승인/거절합니다
        </p>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {/* 탭 + 검색 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setTab('pending')} style={tabBtnStyle(tab === 'pending')}>
              대기중
            </button>
            <button onClick={() => setTab('approved')} style={tabBtnStyle(tab === 'approved')}>
              승인완료
            </button>
            <button onClick={() => setTab('all')} style={tabBtnStyle(tab === 'all')}>
              전체
            </button>
          </div>
          <input
            type="text"
            placeholder="이름, 아이디, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--gray-200)',
              fontSize: 13,
              width: 240,
              outline: 'none',
            }}
          />
        </div>

        {/* 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              {tab === 'pending' ? '대기중인 계정이 없습니다' : '데이터가 없습니다'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>아이디</th>
                  <th style={thStyle}>이름</th>
                  <th style={thStyle}>가맹점</th>
                  <th style={thStyle}>이메일</th>
                  <th style={thStyle}>가입일</th>
                  <th style={thStyle}>최근 로그인</th>
                  <th style={thStyle}>상태</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{user.username}</td>
                    <td style={tdStyle}>{user.name}</td>
                    <td style={tdStyle}>
                      {user.store ? (
                        <span>{user.store.name} <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>({user.store.code})</span></span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--gray-500)' }}>{user.email}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gray-500)' }}>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: user.isActive ? 'var(--success-light)' : '#fff3e0',
                        color: user.isActive ? 'var(--success)' : '#e65100',
                        fontWeight: 600,
                      }}>
                        {user.isActive ? '승인됨' : '대기중'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {!user.isActive ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAction(user.id, 'approve', user.name)}
                            style={{
                              padding: '4px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: 6,
                              background: 'var(--primary)',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleAction(user.id, 'reject', user.name)}
                            style={{
                              padding: '4px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid var(--error)',
                              borderRadius: 6,
                              background: '#fff',
                              color: 'var(--error)',
                              cursor: 'pointer',
                            }}
                          >
                            거절
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
