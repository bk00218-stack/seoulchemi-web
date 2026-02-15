'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface Role {
  id: string
  name: string
  description: string
  userCount: number
}

interface MenuPermission {
  menuId: string
  menuName: string
  permissions: {
    [roleId: string]: { view: boolean; edit: boolean; delete: boolean }
  }
}

const mockRoles: Role[] = [
  { id: 'admin', name: '관리자', description: '모든 권한 보유', userCount: 2 },
  { id: 'manager', name: '매니저', description: '일반 관리 권한', userCount: 5 },
  { id: 'staff', name: '직원', description: '기본 조회 권한', userCount: 12 },
  { id: 'store', name: '가맹점', description: '가맹점 전용 권한', userCount: 8 },
]

const mockMenuPermissions: MenuPermission[] = [
  { 
    menuId: 'orders', 
    menuName: '📦 주문 관리',
    permissions: {
      admin: { view: true, edit: true, delete: true },
      manager: { view: true, edit: true, delete: false },
      staff: { view: true, edit: false, delete: false },
      store: { view: true, edit: false, delete: false },
    }
  },
  { 
    menuId: 'products', 
    menuName: '📋 상품 관리',
    permissions: {
      admin: { view: true, edit: true, delete: true },
      manager: { view: true, edit: true, delete: true },
      staff: { view: true, edit: false, delete: false },
      store: { view: false, edit: false, delete: false },
    }
  },
  { 
    menuId: 'customers', 
    menuName: '👥 고객 관리',
    permissions: {
      admin: { view: true, edit: true, delete: true },
      manager: { view: true, edit: true, delete: false },
      staff: { view: true, edit: false, delete: false },
      store: { view: false, edit: false, delete: false },
    }
  },
  { 
    menuId: 'statistics', 
    menuName: '📊 통계',
    permissions: {
      admin: { view: true, edit: true, delete: true },
      manager: { view: true, edit: false, delete: false },
      staff: { view: false, edit: false, delete: false },
      store: { view: true, edit: false, delete: false },
    }
  },
  { 
    menuId: 'settings', 
    menuName: '⚙️ 설정',
    permissions: {
      admin: { view: true, edit: true, delete: true },
      manager: { view: true, edit: false, delete: false },
      staff: { view: false, edit: false, delete: false },
      store: { view: false, edit: false, delete: false },
    }
  },
]

export default function MenuPermissionsPage() {
  const [roles] = useState(mockRoles)
  const [permissions, setPermissions] = useState(mockMenuPermissions)
  const [saved, setSaved] = useState(false)

  const togglePermission = (menuId: string, roleId: string, permType: 'view' | 'edit' | 'delete') => {
    setPermissions(prev => prev.map(menu => {
      if (menu.menuId === menuId) {
        const newPerms = { ...menu.permissions }
        newPerms[roleId] = { ...newPerms[roleId], [permType]: !newPerms[roleId][permType] }
        return { ...menu, permissions: newPerms }
      }
      return menu
    }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 역할 목록 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>🔐 역할 관리</h3>
          <button style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer'
          }}>
            + 역할 추가
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {roles.map(role => (
            <div 
              key={role.id}
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{role.name}</span>
                <span style={{ 
                  fontSize: '11px', 
                  background: '#e5e7eb', 
                  padding: '2px 6px', 
                  borderRadius: '4px' 
                }}>
                  {role.userCount}명
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>메뉴</th>
                {roles.map(role => (
                  <th key={role.id} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }} colSpan={3}>
                    {role.name}
                  </th>
                ))}
              </tr>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11px', color: '#666' }}></th>
                {roles.map(role => (
                  <>
                    <th key={`${role.id}-view`} style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>조회</th>
                    <th key={`${role.id}-edit`} style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>수정</th>
                    <th key={`${role.id}-delete`} style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#666' }}>삭제</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(menu => (
                <tr key={menu.menuId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{menu.menuName}</td>
                  {roles.map(role => (
                    <>
                      <td key={`${menu.menuId}-${role.id}-view`} style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={menu.permissions[role.id]?.view || false}
                          onChange={() => togglePermission(menu.menuId, role.id, 'view')}
                          style={{ width: 16, height: 16, accentColor: '#22c55e' }}
                        />
                      </td>
                      <td key={`${menu.menuId}-${role.id}-edit`} style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={menu.permissions[role.id]?.edit || false}
                          onChange={() => togglePermission(menu.menuId, role.id, 'edit')}
                          style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        />
                      </td>
                      <td key={`${menu.menuId}-${role.id}-delete`} style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={menu.permissions[role.id]?.delete || false}
                          onChange={() => togglePermission(menu.menuId, role.id, 'delete')}
                          style={{ width: 16, height: 16, accentColor: '#ef4444' }}
                        />
                      </td>
                    </>
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
