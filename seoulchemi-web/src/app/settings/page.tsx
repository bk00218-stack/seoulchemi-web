'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle } from '../components/Layout'
import { SETTINGS_SIDEBAR } from '../constants/sidebar'

interface Setting {
  key: string
  label: string
  description: string
  type: 'text' | 'toggle' | 'image' | 'textarea'
  value: string | boolean
  group: string
}

const defaultSettings: Setting[] = [
  // 회사 정보
  { key: 'company.name', label: '회사명', description: '세금계산서 등에 표시될 회사명', type: 'text', value: '서울케미', group: '회사 정보' },
  { key: 'company.bizNo', label: '사업자번호', description: '사업자등록번호', type: 'text', value: '', group: '회사 정보' },
  { key: 'company.owner', label: '대표자', description: '대표자명', type: 'text', value: '', group: '회사 정보' },
  { key: 'company.phone', label: '대표전화', description: '회사 대표 전화번호', type: 'text', value: '02-521-2323', group: '회사 정보' },
  { key: 'company.email', label: '이메일', description: '회사 대표 이메일', type: 'text', value: '', group: '회사 정보' },
  { key: 'company.address', label: '주소', description: '회사 주소', type: 'text', value: '', group: '회사 정보' },
  // 주문 설정
  { key: 'order.prefix', label: '주문번호 접두사', description: '주문번호 앞에 붙는 접두사 (예: ORD)', type: 'text', value: 'ORD', group: '주문 설정' },
  { key: 'order.autoConfirmDays', label: '자동확정 일수', description: '출고 후 자동확정까지 일수', type: 'text', value: '3', group: '주문 설정' },
  { key: 'order.minAmount', label: '최소주문금액', description: '최소주문금액 (0이면 제한없음)', type: 'text', value: '0', group: '주문 설정' },
  // 화면 설정
  { key: 'ui.logo', label: '쇼핑몰 상단 로고', description: '상단 로고 설정 (사이즈: 160x32픽셀)', type: 'image', value: '', group: '화면 설정' },
  { key: 'ui.return_menu', label: '반품 메뉴', description: '반품 메뉴 사용여부 설정', type: 'toggle', value: false, group: '화면 설정' },
  { key: 'ui.exchange_menu', label: '교환 메뉴', description: '교환 메뉴 사용여부 설정', type: 'toggle', value: false, group: '화면 설정' },
  { key: 'ui.show_price', label: '메인상품 금액표시', description: '메인상품명에 가격표시여부 설정', type: 'toggle', value: true, group: '화면 설정' },
  // 고객센터
  { key: 'cs.phone', label: '고객센터 연락처', description: '고객센터 전화번호', type: 'text', value: '02-521-2323', group: '고객센터' },
  { key: 'cs.time', label: '고객센터 영업시간', description: '영업시간 안내', type: 'text', value: '09:00 ~ 18:00', group: '고객센터' },
  // 알림 설정
  { key: 'notification.push', label: '푸시 알림', description: '새 주문/출고 등 푸시 알림 사용', type: 'toggle', value: true, group: '알림 설정' },
  { key: 'notification.email', label: '이메일 알림', description: '이메일 알림 사용여부', type: 'toggle', value: false, group: '알림 설정' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)

  // API에서 설정 로드
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const serverSettings = data.settings || {}
        // 서버 값으로 덮어쓰기
        setSettings(prev => prev.map(s => {
          const serverVal = serverSettings[s.key]
          if (serverVal !== undefined) {
            if (s.type === 'toggle') {
              return { ...s, value: serverVal === 'true' || serverVal === true }
            }
            return { ...s, value: serverVal }
          }
          return s
        }))
      }
    } catch (e) {
      console.error('설정 로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    setSaved(false)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // key-value 맵으로 변환
      const settingsMap: Record<string, string> = {}
      for (const s of settings) {
        settingsMap[s.key] = String(s.value)
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsMap }),
      })

      if (res.ok) {
        setSaved(true)
        setDirty(false)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch (e) {
      console.error('설정 저장 실패:', e)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 그룹별로 분리
  const groups = [...new Set(settings.map(s => s.group))]

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>시스템 설정</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>회사 정보, 주문, 화면, 알림 등 시스템 설정을 관리합니다</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ 저장되었습니다</span>}
          {dirty && !saved && <span style={{ color: 'var(--warning)', fontSize: 12 }}>변경사항 있음</span>}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            style={{
              ...btnStyle,
              background: dirty ? 'var(--danger)' : 'var(--gray-300)',
              color: '#fff',
              border: 'none',
              opacity: saving || !dirty ? 0.6 : 1,
              cursor: saving || !dirty ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
          설정을 불러오는 중...
        </div>
      ) : (
        <>
          {/* Notice */}
          <div style={{
            background: 'var(--warning-light)',
            border: '1px solid var(--warning)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 13,
            color: 'var(--gray-700)'
          }}>
            ※ 변경 후 &apos;저장&apos; 버튼을 누르면 즉시 반영됩니다.
          </div>

          {/* Settings by Group */}
          {groups.map(group => (
            <div key={group} style={cardStyle}>
              <div style={{
                padding: '12px 16px',
                background: 'var(--gray-50)',
                borderBottom: '1px solid var(--gray-100)',
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--gray-700)',
              }}>
                {group}
              </div>
              <table style={{ width: '100%' }}>
                <tbody>
                  {settings.filter(s => s.group === group).map((setting, idx, arr) => (
                    <tr key={setting.key} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', width: 180 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{setting.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{setting.key}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--gray-500)', fontSize: 12 }}>
                        {setting.description}
                      </td>
                      <td style={{ padding: '14px 16px', width: 250 }}>
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
          ))}
        </>
      )}
    </Layout>
  )
}
