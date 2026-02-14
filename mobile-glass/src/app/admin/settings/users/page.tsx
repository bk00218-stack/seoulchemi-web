'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  username: string
  name: string
  role: string
  storeId: number | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
    role: 'user'
  })

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
    const method = editUser ? 'PATCH' : 'POST'

    try {
      const body = editUser
        ? { ...formData, password: formData.password || undefined }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowModal(false)
        setEditUser(null)
        setFormData({ email: '', username: '', password: '', name: '', role: 'user' })
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.name}님을 삭제하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      name: user.name,
      role: user.role
    })
    setShowModal(true)
  }

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: '#fee2e2', text: '#dc2626' },
    manager: { bg: '#dbeafe', text: '#2563eb' },
    user: { bg: '#f3f4f6', text: '#374151' },
    store: { bg: '#d1fae5', text: '#059669' }
  }

  const roleLabels: Record<string, string> = {
    admin: '관리자',
    manager: '매니저',
    user: '사용자',
    store: '가맹점'
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="settings">
        <div style={{ textAlign: 'center', padding: '60px' }}>로딩 중...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>사용자 관리</h1>
          <p style={{ color: '#86868b', margin: '4px 0 0', fontSize: '14px' }}>
            시스템 사용자를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => {
            setEditUser(null)
            setFormData({ email: '', username: '', password: '', name: '', role: 'user' })
            setShowModal(true)
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + 사용자 추가
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e9ecef', background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>아이디</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>이름</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>이메일</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>역할</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>최근 로그인</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{user.username}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>{user.name}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{user.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: roleColors[user.role]?.bg || '#f3f4f6',
                    color: roleColors[user.role]?.text || '#374151'
                  }}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af' }}>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('ko-KR')
                    : '-'
                  }
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => openEdit(user)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      background: '#fff',
                      fontSize: '13px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    수정
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDelete(user)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        background: '#fff',
                        fontSize: '13px',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editUser ? '사용자 수정' : '사용자 추가'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  아이디 *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editUser}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px',
                    background: editUser ? '#f5f5f7' : '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  이메일 *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  비밀번호 {editUser ? '' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editUser}
                  placeholder={editUser ? '변경하려면 입력' : ''}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  역할 *
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px'
                  }}
                >
                  <option value="admin">관리자</option>
                  <option value="manager">매니저</option>
                  <option value="user">사용자</option>
                  <option value="store">가맹점</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    background: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#007aff',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {editUser ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
