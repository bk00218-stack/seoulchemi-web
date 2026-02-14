'use client'

import { useState } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '환경설정',
    items: [
      { label: '기본설정', href: '/settings' },
      { label: '구분설정', href: '/settings/categories' },
      { label: '배송비 설정', href: '/settings/shipping' },
    ]
  },
  {
    title: '쇼핑몰 화면설정',
    items: [
      { label: '메인화면 설정', href: '/settings/main' },
      { label: '상품 상세화면 설정', href: '/settings/product-detail' },
    ]
  },
  {
    title: '접속권한 설정',
    items: [
      { label: '그룹별 메뉴설정', href: '/settings/menu-permissions' },
      { label: '계정관리', href: '/settings/accounts' },
    ]
  }
]

interface Setting {
  key: string
  label: string
  description: string
  type: 'text' | 'toggle' | 'image'
  value: string | boolean
}

const defaultSettings: Setting[] = [
  { key: 'logo', label: '쇼핑몰 상단 로고', description: '상단 로고 설정 (사이즈: 160x32픽셀)', type: 'image', value: '' },
  { key: 'return_menu', label: '반품 메뉴', description: '반품 메뉴 사용여부 설정', type: 'toggle', value: false },
  { key: 'exchange_menu', label: '교환 메뉴', description: '교환 메뉴 사용여부 설정', type: 'toggle', value: false },
  { key: 'show_price', label: '메인상품 금액표시', description: '메인상품명에 가격표시여부 설정', type: 'toggle', value: true },
  { key: 'cs_phone', label: '고객센터 연락처', description: '고객센터 전화번호', type: 'text', value: '02-521-2323' },
  { key: 'cs_time', label: '고객센터 영업시간', description: '영업시간 안내', type: 'text', value: '09:00 ~ 18:00' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [saved, setSaved] = useState(false)

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    setSaved(false)
  }

  const handleSave = () => {
    // Save to API
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="설정">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>화면설정 - 주문</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>주문 화면 관련 설정을 관리합니다</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ 저장되었습니다</span>}
          <button 
            onClick={handleSave}
            style={{ ...btnStyle, background: 'var(--danger)', color: '#fff', border: 'none' }}
          >
            저장
          </button>
        </div>
      </div>

      {/* Notice */}
      <div style={{ 
        background: 'var(--warning-light)', 
        border: '1px solid var(--warning)',
        borderRadius: 8, 
        padding: '12px 16px',
        fontSize: 13,
        color: 'var(--gray-700)'
      }}>
        ※ 변경된 사항은 재 로그인 후 확인가능합니다.
      </div>

      {/* Settings List */}
      <div style={cardStyle}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', width: 200, fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>설정</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>기능</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', width: 200, fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>설정값</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting, idx) => (
              <tr key={setting.key} style={{ borderBottom: idx < settings.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{setting.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{setting.key.toUpperCase()}</div>
                </td>
                <td style={{ padding: '16px', color: 'var(--gray-600)', fontSize: 13 }}>
                  {setting.description}
                </td>
                <td style={{ padding: '16px' }}>
                  {setting.type === 'toggle' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={setting.value as boolean}
                        onChange={e => updateSetting(setting.key, e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 13, color: setting.value ? 'var(--success)' : 'var(--gray-500)' }}>
                        {setting.value ? '사용' : '미사용'}
                      </span>
                    </label>
                  ) : setting.type === 'image' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnStyle}>업로드</button>
                      <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <input 
                      type="text"
                      value={setting.value as string}
                      onChange={e => updateSetting(setting.key, e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
