'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface Account {
  platform: string
  accountName: string
  apiKey: string
  isConnected: boolean
  lastSync: string | null
}

interface ApiSettings {
  syncInterval: string
  autoSync: boolean
  failNotify: boolean
}

export default function AccountsPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [apiSettings, setApiSettings] = useState<ApiSettings>({ syncInterval: '30', autoSync: true, failNotify: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/settings?group=accounts')
      const data = await res.json()
      const s = data.settings || {}

      // 계정 목록 파싱
      try {
        const raw = s['accounts.platforms']
        if (raw) setAccounts(JSON.parse(raw))
      } catch { /* ignore */ }

      // API 설정 파싱
      setApiSettings({
        syncInterval: s['accounts.syncInterval'] || '30',
        autoSync: s['accounts.autoSync'] === 'true',
        failNotify: s['accounts.failNotify'] === 'true',
      })
    } catch (e) {
      console.error('Failed to fetch accounts:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveAll = async (newAccounts?: Account[], newApiSettings?: ApiSettings) => {
    const accs = newAccounts || accounts
    const api = newApiSettings || apiSettings
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            'accounts.platforms': JSON.stringify(accs),
            'accounts.syncInterval': api.syncInterval,
            'accounts.autoSync': String(api.autoSync),
            'accounts.failNotify': String(api.failNotify),
          }
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('저장되었습니다.')
      } else {
        toast.error(data.error || '저장 실패')
      }
    } catch {
      toast.error('저장 중 오류 발생')
    }
  }

  const toggleConnection = (idx: number) => {
    const updated = accounts.map((acc, i) =>
      i === idx ? { ...acc, isConnected: !acc.isConnected, lastSync: acc.isConnected ? acc.lastSync : null } : acc
    )
    setAccounts(updated)
    saveAll(updated)
  }

  const removeAccount = (idx: number) => {
    const updated = accounts.filter((_, i) => i !== idx)
    setAccounts(updated)
    saveAll(updated)
  }

  const addAccount = () => {
    const platform = prompt('플랫폼명을 입력하세요 (예: 네이버 스마트스토어)')
    if (!platform) return
    const accountName = prompt('계정명을 입력하세요') || ''
    const newAcc: Account = { platform, accountName, apiKey: '', isConnected: false, lastSync: null }
    const updated = [...accounts, newAcc]
    setAccounts(updated)
    saveAll(updated)
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>계정 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          외부 플랫폼 연동 계정을 관리합니다.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={addAccount}
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
          + 계정 추가
        </button>
      </div>

      {/* 연동 계정 목록 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>🔗 연동 계정</h3>
        {accounts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            등록된 계정이 없습니다. &apos;+ 계정 추가&apos; 버튼으로 계정을 추가하세요.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>플랫폼</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>계정명</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>마지막 동기화</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{account.platform}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>{account.accountName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: account.isConnected ? '#d1fae5' : '#fee2e2',
                      color: account.isConnected ? '#059669' : '#dc2626'
                    }}>
                      {account.isConnected ? '연결됨' : '미연결'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {account.lastSync || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => toggleConnection(idx)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e9ecef',
                          background: '#fff',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {account.isConnected ? '연결해제' : '연결'}
                      </button>
                      <button
                        onClick={() => removeAccount(idx)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #fee2e2',
                          background: '#fff',
                          fontSize: '12px',
                          color: '#dc2626',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API 설정 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⚙️ API 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              동기화 주기
            </label>
            <select
              value={apiSettings.syncInterval}
              onChange={e => {
                const updated = { ...apiSettings, syncInterval: e.target.value }
                setApiSettings(updated)
                saveAll(undefined, updated)
              }}
              style={{ ...inputStyle, width: '200px' }}
            >
              <option value="5">5분</option>
              <option value="10">10분</option>
              <option value="30">30분</option>
              <option value="60">1시간</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={apiSettings.autoSync}
                onChange={e => {
                  const updated = { ...apiSettings, autoSync: e.target.checked }
                  setApiSettings(updated)
                  saveAll(undefined, updated)
                }}
                style={{ width: 18, height: 18, accentColor: '#007aff' }}
              />
              <span style={{ fontSize: '14px' }}>자동 동기화 사용</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={apiSettings.failNotify}
                onChange={e => {
                  const updated = { ...apiSettings, failNotify: e.target.checked }
                  setApiSettings(updated)
                  saveAll(undefined, updated)
                }}
                style={{ width: 18, height: 18, accentColor: '#007aff' }}
              />
              <span style={{ fontSize: '14px' }}>동기화 실패 시 알림 발송</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
