'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const roleLabels: Record<string, string> = {
    admin: '관리자',
    manager: '매니저',
    user: '일반',
    store: '가맹점'
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>사용자 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          시스템 사용자 계정을 관리합니다.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#007aff',
          color: '#fff',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          + 사용자 추가
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>아이디</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>이름</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>이메일</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>권한</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>마지막 로그인</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>등록된 사용자가 없습니다</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>{user.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                      color: user.role === 'admin' ? '#1d4ed8' : '#6b7280'
                    }}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: user.isActive ? '#d1fae5' : '#fee2e2',
                      color: user.isActive ? '#059669' : '#dc2626'
                    }}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      background: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
