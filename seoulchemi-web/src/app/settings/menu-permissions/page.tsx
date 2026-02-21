'use client'

import React, { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface UserStats {
  role: string
  count: number
}

// 역할별 메뉴 권한은 서버 설정(Setting 모델)으로 관리 가능
// 현재는 User 모델의 role 필드(admin/manager/user)를 기반으로 표시
const ROLES = [
  { id: 'admin', name: '관리자', description: '모든 권한 보유' },
  { id: 'manager', name: '매니저', description: '일반 관리 권한' },
  { id: 'user', name: '직원', description: '기본 조회 권한' },
]

const MENUS = [
  { id: 'orders', name: '📦 주문 관리' },
  { id: 'products', name: '📋 상품 관리' },
  { id: 'stores', name: '🏪 가맹점 관리' },
  { id: 'stats', name: '📊 통계' },
  { id: 'purchase', name: '📥 매입 관리' },
  { id: 'settings', name: '⚙️ 설정' },
]

// 기본 권한 (admin=all, manager=대부분, user=조회만)
const DEFAULT_PERMISSIONS: Record<string, Record<string, { view: boolean; edit: boolean; delete: boolean }>> = {
  admin: Object.fromEntries(MENUS.map(m => [m.id, { view: true, edit: true, delete: true }])),
  manager: {
    orders: { view: true, edit: true, delete: false },
    products: { view: true, edit: true, delete: true },
    stores: { view: true, edit: true, delete: false },
    stats: { view: true, edit: false, delete: false },
    purchase: { view: true, edit: true, delete: false },
    settings: { view: true, edit: false, delete: false },
  },
  user: Object.fromEntries(MENUS.map(m => [m.id, { view: true, edit: false, delete: false }])),
}

export default function MenuPermissionsPage() {
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 사용자 수 가져오기
      const usersRes = await fetch('/api/users')
      const usersData = await usersRes.json()
      const users = usersData.users || []

      const stats: UserStats[] = ROLES.map(role => ({
        role: role.id,
        count: users.filter((u: { role: string }) => u.role === role.id).length,
      }))
      setUserStats(stats)

      // 저장된 권한 설정 로드
      const settingsRes = await fetch('/api/admin/settings?group=permissions')
      const settingsData = await settingsRes.json()
      if (settingsData.settings && Object.keys(settingsData.settings).length > 0) {
        try {
          const savedPerms = JSON.parse(settingsData.settings['permissions.matrix'] || '{}')
          if (Object.keys(savedPerms).length > 0) {
            setPermissions(savedPerms)
          }
        } catch { /* use defaults */ }
      }
    } catch (e) {
      console.error('Failed to fetch permissions data:', e)
    } finally {
      setLoading(false)
    }
  }

  const getUserCount = (roleId: string) => {
    return userStats.find(s => s.role === roleId)?.count || 0
  }

  const togglePermission = (roleId: string, menuId: string, permType: 'view' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [menuId]: {
          ...(prev[roleId]?.[menuId] || { view: false, edit: false, delete: false }),
          [permType]: !(prev[roleId]?.[menuId]?.[permType] ?? false),
        }
      }
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { 'permissions.matrix': JSON.stringify(permissions) }
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      console.error('Failed to save permissions')
    }
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
        <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>메뉴 권한 설정</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            역할별 메뉴 접근 권한을 설정합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ color: '#059669', fontSize: '13px' }}>✓ 저장되었습니다</span>}
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#007aff', color: '#fff', fontWeight: 500, cursor: 'pointer',
            }}
          >저장</button>
        </div>
      </div>

      {/* 역할 목록 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>🔐 역할 관리</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {ROLES.map(role => (
            <div key={role.id} style={{
              padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e9ecef',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{role.name}</span>
                <span style={{ fontSize: '11px', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>
                  {getUserCount(role.id)}명
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 권한 매트릭스 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>📋 권한 매트릭스</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>메뉴</th>
                {ROLES.map(role => (
                  <th key={role.id} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }} colSpan={3}>
                    {role.name}
                  </th>
                ))}
              </tr>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '8px 16px' }}></th>
                {ROLES.map(role => (
                  <React.Fragment key={role.id}>
                    <th style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>조회</th>
                    <th style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>수정</th>
                    <th style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>삭제</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {MENUS.map(menu => (
                <tr key={menu.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{menu.name}</td>
                  {ROLES.map(role => (
                    <React.Fragment key={role.id}>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={permissions[role.id]?.[menu.id]?.view ?? false}
                          onChange={() => togglePermission(role.id, menu.id, 'view')}
                          style={{ width: 16, height: 16, accentColor: '#22c55e' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={permissions[role.id]?.[menu.id]?.edit ?? false}
                          onChange={() => togglePermission(role.id, menu.id, 'edit')}
                          style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={permissions[role.id]?.[menu.id]?.delete ?? false}
                          onChange={() => togglePermission(role.id, menu.id, 'delete')}
                          style={{ width: 16, height: 16, accentColor: '#ef4444' }}
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px' }}>
          ⚠️ 권한 변경 시 해당 역할의 모든 사용자에게 즉시 적용됩니다.
        </div>
      </div>
    </Layout>
  )
}
