'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'

interface Role {
  id: string
  name: string
  label: string
  description: string
}

interface MenuItem {
  key: string
  label: string
  children?: MenuItem[]
}

const ROLES: Role[] = [
  { id: 'admin', name: 'admin', label: '관리자', description: '모든 메뉴 접근 가능' },
  { id: 'manager', name: 'manager', label: '매니저', description: '대부분의 메뉴 접근 가능' },
  { id: 'user', name: 'user', label: '사용자', description: '기본 메뉴만 접근 가능' },
  { id: 'store', name: 'store', label: '가맹점', description: '가맹점용 메뉴만 접근 가능' },
]

const MENUS: MenuItem[] = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'orders', label: '주문관리', children: [
    { key: 'orders.list', label: '주문 목록' },
    { key: 'orders.new', label: '신규 주문' },
    { key: 'orders.shipping', label: '출고 관리' },
    { key: 'orders.returns', label: '반품/교환' },
    { key: 'orders.rx', label: 'RX 주문' },
    { key: 'orders.scan', label: '바코드 스캔' },
  ]},
  { key: 'products', label: '상품관리', children: [
    { key: 'products.list', label: '상품 목록' },
    { key: 'products.brands', label: '브랜드 관리' },
    { key: 'products.inventory', label: '재고 관리' },
    { key: 'products.bundles', label: '묶음상품' },
  ]},
  { key: 'purchase', label: '매입관리', children: [
    { key: 'purchase.list', label: '매입 내역' },
    { key: 'purchase.new', label: '매입 등록' },
    { key: 'purchase.suppliers', label: '매입처 관리' },
    { key: 'purchase.outstanding', label: '미결제 관리' },
  ]},
  { key: 'stores', label: '가맹점관리', children: [
    { key: 'stores.list', label: '가맹점 목록' },
    { key: 'stores.receivables', label: '미수금 관리' },
    { key: 'stores.notices', label: '공지사항' },
    { key: 'stores.discounts', label: '할인 설정' },
  ]},
  { key: 'stats', label: '통계', children: [
    { key: 'stats.overview', label: '통계 개요' },
    { key: 'stats.closing', label: '월마감/결산' },
    { key: 'stats.products', label: '상품 통계' },
  ]},
  { key: 'settings', label: '설정', children: [
    { key: 'settings.general', label: '기본 설정' },
    { key: 'settings.users', label: '사용자 관리' },
    { key: 'settings.printers', label: '프린터 설정' },
    { key: 'settings.backup', label: '백업 관리' },
  ]},
]

export default function MenuPermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>({
    admin: new Set(MENUS.flatMap(m => [m.key, ...(m.children?.map(c => c.key) || [])])),
    manager: new Set(MENUS.flatMap(m => [m.key, ...(m.children?.map(c => c.key) || [])])),
    user: new Set(['dashboard', 'orders', 'orders.list', 'products', 'products.list']),
    store: new Set(['dashboard', 'orders', 'orders.list', 'orders.new']),
  })
  const [selectedRole, setSelectedRole] = useState<string>('manager')
  const [saving, setSaving] = useState(false)

  const togglePermission = (menuKey: string) => {
    if (selectedRole === 'admin') return // 관리자는 변경 불가
    
    setPermissions(prev => {
      const rolePerms = new Set(prev[selectedRole])
      if (rolePerms.has(menuKey)) {
        rolePerms.delete(menuKey)
        // 부모 메뉴 권한 해제 시 자식도 해제
        MENUS.find(m => m.key === menuKey)?.children?.forEach(c => {
          rolePerms.delete(c.key)
        })
      } else {
        rolePerms.add(menuKey)
        // 자식 메뉴 권한 부여 시 부모도 부여
        const parent = MENUS.find(m => m.children?.some(c => c.key === menuKey))
        if (parent) rolePerms.add(parent.key)
      }
      return { ...prev, [selectedRole]: rolePerms }
    })
  }

  const toggleAllChildren = (parentKey: string) => {
    if (selectedRole === 'admin') return
    
    const parent = MENUS.find(m => m.key === parentKey)
    if (!parent?.children) return

    setPermissions(prev => {
      const rolePerms = new Set(prev[selectedRole])
      const allChildrenSelected = parent.children!.every(c => rolePerms.has(c.key))
      
      if (allChildrenSelected) {
        parent.children!.forEach(c => rolePerms.delete(c.key))
        rolePerms.delete(parentKey)
      } else {
        rolePerms.add(parentKey)
        parent.children!.forEach(c => rolePerms.add(c.key))
      }
      
      return { ...prev, [selectedRole]: rolePerms }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('권한 설정이 저장되었습니다.')
    } catch (error) {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const currentPerms = permissions[selectedRole]
  const selectedRoleInfo = ROLES.find(r => r.id === selectedRole)

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>그룹별 메뉴설정</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          사용자 역할별로 접근 가능한 메뉴를 설정합니다
        </p>
      </div>

      {/* 역할 선택 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: selectedRole === role.id ? '2px solid #007aff' : '1px solid #e5e5e5',
              background: selectedRole === role.id ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '15px', color: selectedRole === role.id ? '#007aff' : '#1d1d1f' }}>
              {role.label}
            </div>
            <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
              {role.description}
            </div>
          </button>
        ))}
      </div>

      {/* 권한 설정 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {selectedRoleInfo?.label} 메뉴 권한
          </h2>
          {selectedRole === 'admin' && (
            <span style={{ 
              padding: '6px 12px', 
              background: '#fee2e2', 
              color: '#dc2626', 
              borderRadius: '6px', 
              fontSize: '12px' 
            }}>
              🔒 관리자 권한은 수정할 수 없습니다
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MENUS.map(menu => {
            const hasChildren = menu.children && menu.children.length > 0
            const allChildrenSelected = hasChildren && menu.children!.every(c => currentPerms.has(c.key))
            const someChildrenSelected = hasChildren && menu.children!.some(c => currentPerms.has(c.key))
            
            return (
              <div key={menu.key} style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* 부모 메뉴 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: currentPerms.has(menu.key) ? '#f8f9fa' : '#fff',
                  cursor: selectedRole === 'admin' ? 'default' : 'pointer'
                }}
                onClick={() => hasChildren ? toggleAllChildren(menu.key) : togglePermission(menu.key)}
                >
                  <input
                    type="checkbox"
                    checked={currentPerms.has(menu.key)}
                    onChange={() => hasChildren ? toggleAllChildren(menu.key) : togglePermission(menu.key)}
                    disabled={selectedRole === 'admin'}
                    style={{ width: '18px', height: '18px', accentColor: '#007aff' }}
                    ref={el => {
                      if (el && hasChildren) {
                        el.indeterminate = someChildrenSelected && !allChildrenSelected
                      }
                    }}
                  />
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{menu.label}</span>
                  {hasChildren && (
                    <span style={{ fontSize: '12px', color: '#86868b', marginLeft: 'auto' }}>
                      {menu.children!.filter(c => currentPerms.has(c.key)).length} / {menu.children!.length}
                    </span>
                  )}
                </div>

                {/* 자식 메뉴 */}
                {hasChildren && (
                  <div style={{ 
                    padding: '12px 16px 12px 48px',
                    background: '#f9fafb',
                    borderTop: '1px solid #e9ecef',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px'
                  }}>
                    {menu.children!.map(child => (
                      <label 
                        key={child.key} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: selectedRole === 'admin' ? 'default' : 'pointer',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: currentPerms.has(child.key) ? '#e8f5e9' : '#fff',
                          border: '1px solid',
                          borderColor: currentPerms.has(child.key) ? '#34c75940' : '#e9ecef'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={currentPerms.has(child.key)}
                          onChange={() => togglePermission(child.key)}
                          disabled={selectedRole === 'admin'}
                          style={{ width: '16px', height: '16px', accentColor: '#34c759' }}
                        />
                        <span style={{ fontSize: '13px' }}>{child.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 저장 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedRole === 'admin'}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: saving || selectedRole === 'admin' ? '#e5e5e5' : '#007aff',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving || selectedRole === 'admin' ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        background: '#fff7ed',
        borderRadius: '12px',
        border: '1px solid #fed7aa'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#c2410c' }}>
          💡 권한 설정 안내
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#c2410c' }}>
          <li>상위 메뉴 권한을 해제하면 하위 메뉴도 모두 해제됩니다.</li>
          <li>하위 메뉴 권한을 부여하면 상위 메뉴 권한도 자동으로 부여됩니다.</li>
          <li>관리자(admin) 역할은 모든 메뉴에 접근 가능하며 수정할 수 없습니다.</li>
          <li>변경된 권한은 해당 사용자가 다음 로그인 시 적용됩니다.</li>
        </ul>
      </div>
    </AdminLayout>
  )
}
