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
        alert(data.error || '?Ä?•Ïóê ?§Ìå®?àÏäµ?àÎã§.')
      }
    } catch (error) {
      alert('?úÎ≤Ñ ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.')
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.name}?òÏùÑ ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || '??†ú???§Ìå®?àÏäµ?àÎã§.')
      }
    } catch (error) {
      alert('?úÎ≤Ñ ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.')
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
    admin: 'Í¥ÄÎ¶¨Ïûê',
    manager: 'Îß§Îãà?Ä',
    user: '?¨Ïö©??,
    store: 'Í∞ÄÎßπÏ†ê'
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="settings">
        <div style={{ textAlign: 'center', padding: '60px' }}>Î°úÎî© Ï§?..</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>?¨Ïö©??Í¥ÄÎ¶?/h1>
          <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0', fontSize: '14px' }}>
            ?úÏä§???¨Ïö©?êÎ? Í¥ÄÎ¶¨Ìï©?àÎã§.
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
          + ?¨Ïö©??Ï∂îÍ?
        </button>
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?ÑÏù¥??/th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?¥Î¶Ñ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?¥Î©î??/th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>??ï†</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>ÏµúÍ∑º Î°úÍ∑∏??/th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Í¥ÄÎ¶?/th>
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
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    ?òÏ†ï
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDelete(user)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        background: 'var(--bg-primary)',
                        fontSize: '13px',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
                    >
                      ??†ú
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Î™®Îã¨ */}
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
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editUser ? '?¨Ïö©???òÏ†ï' : '?¨Ïö©??Ï∂îÍ?'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  ?ÑÏù¥??*
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
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    background: editUser ? '#f5f5f7' : '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  ?¥Î¶Ñ *
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
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  ?¥Î©î??*
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
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  ÎπÑÎ?Î≤àÌò∏ {editUser ? '' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editUser}
                  placeholder={editUser ? 'Î≥ÄÍ≤ΩÌïò?§Î©¥ ?ÖÎ†•' : ''}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  ??ï† *
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="admin">Í¥ÄÎ¶¨Ïûê</option>
                  <option value="manager">Îß§Îãà?Ä</option>
                  <option value="user">?¨Ïö©??/option>
                  <option value="store">Í∞ÄÎßπÏ†ê</option>
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
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Ï∑®ÏÜå
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
                  {editUser ? '?òÏ†ï' : 'Ï∂îÍ?'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
