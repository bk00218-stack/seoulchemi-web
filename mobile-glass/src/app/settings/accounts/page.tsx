'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface Account {
  id: number
  platform: string
  accountName: string
  apiKey: string
  isConnected: boolean
  lastSync: string | null
}

const mockAccounts: Account[] = [
  { id: 1, platform: '네이버 스마트스토어', accountName: 'seoulchemi_naver', apiKey: 'sk_live_***', isConnected: true, lastSync: '2025-01-20 14:30' },
  { id: 2, platform: '쿠팡', accountName: 'seoulchemi_coupang', apiKey: 'cp_key_***', isConnected: true, lastSync: '2025-01-20 14:25' },
  { id: 3, platform: '11번가', accountName: 'seoulchemi_11st', apiKey: '', isConnected: false, lastSync: null },
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(mockAccounts)
  const [showAddModal, setShowAddModal] = useState(false)

  const toggleConnection = (id: number) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, isConnected: !acc.isConnected } : acc
    ))
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
          onClick={() => setShowAddModal(true)}
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>플랫폼</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>계정명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>API 키</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>마지막 동기화</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{account.platform}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>{account.accountName}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace', color: '#666' }}>
                  {account.apiKey || '-'}
                </td>
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
                      onClick={() => toggleConnection(account.id)}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API 설정 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⚙️ API 설정</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              동기화 주기
            </label>
            <select style={{ ...inputStyle, width: '200px' }}>
              <option value="5">5분</option>
              <option value="10">10분</option>
              <option value="30">30분</option>
              <option value="60">1시간</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>자동 동기화 사용</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>동기화 실패 시 알림 발송</span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
