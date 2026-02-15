'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileData {
  username: string
  name: string
  email: string
  phone: string
  department: string
  position: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AccountsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile')
  
  // 프로필
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  
  // 비밀번호
  const [password, setPassword] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingPassword, setSavingPassword] = useState(false)
  
  // 보안 설정
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(true)

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
        phone: '',
        department: '',
        position: ''
      })
    }
    // 실제로는 API에서 프로필 정보 가져오기
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/me')
      if (res.ok) {
        const data = await res.json()
        setProfile({
          username: data.username || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          position: data.position || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      alert('이름과 이메일은 필수 항목입니다.')
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          department: profile.department,
          position: profile.position
        })
      })

      if (res.ok) {
        alert('프로필이 저장되었습니다.')
      } else {
        const data = await res.json()
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!password.currentPassword || !password.newPassword || !password.confirmPassword) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    if (password.newPassword !== password.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword
        })
      })

      if (res.ok) {
        alert('비밀번호가 변경되었습니다.')
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        alert(data.error || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setSavingPassword(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#1d1d1f',
    marginBottom: '8px',
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>내 계정</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          계정 정보를 관리하고 보안 설정을 변경합니다
        </p>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'profile', label: '👤 프로필' },
          { key: 'password', label: '🔑 비밀번호' },
          { key: 'security', label: '🛡️ 보안' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeTab === tab.key ? 'none' : '1px solid #e5e5e5',
              background: activeTab === tab.key ? '#007aff' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#1d1d1f',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 프로필 탭 */}
      {activeTab === 'profile' && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>프로필 정보</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>아이디</label>
              <input
                type="text"
                value={profile.username}
                disabled
                style={{ ...inputStyle, background: '#f5f5f7', color: '#86868b' }}
              />
            </div>
            <div>
              <label style={labelStyle}>
                이름 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>
                이메일 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>연락처</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="010-0000-0000"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>부서</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                placeholder="예: 영업부"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>직책</label>
              <input
                type="text"
                value={profile.position}
                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                placeholder="예: 대리"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: savingProfile ? '#e5e5e5' : '#007aff',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: savingProfile ? 'not-allowed' : 'pointer'
              }}
            >
              {savingProfile ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 비밀번호 탭 */}
      {activeTab === 'password' && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>비밀번호 변경</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>현재 비밀번호</label>
            <input
              type="password"
              value={password.currentPassword}
              onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>새 비밀번호</label>
            <input
              type="password"
              value={password.newPassword}
              onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
              placeholder="8자 이상"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>새 비밀번호 확인</label>
            <input
              type="password"
              value={password.confirmPassword}
              onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
              style={inputStyle}
            />
            {password.newPassword && password.confirmPassword && password.newPassword !== password.confirmPassword && (
              <p style={{ color: '#ff3b30', fontSize: '12px', marginTop: '4px' }}>
                비밀번호가 일치하지 않습니다
              </p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: savingPassword ? '#e5e5e5' : '#007aff',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: savingPassword ? 'not-allowed' : 'pointer'
            }}
          >
            {savingPassword ? '변경 중...' : '비밀번호 변경'}
          </button>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f0f7ff', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#007aff'
          }}>
            💡 비밀번호는 8자 이상, 영문/숫자를 포함하는 것을 권장합니다
          </div>
        </div>
      )}

      {/* 보안 탭 */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 2단계 인증 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>2단계 인증</h3>
                <p style={{ fontSize: '13px', color: '#86868b', margin: 0 }}>
                  로그인 시 추가 인증 코드를 요구합니다
                </p>
              </div>
              <label style={{ 
                position: 'relative', 
                display: 'inline-block', 
                width: '50px', 
                height: '28px' 
              }}>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: twoFactorEnabled ? '#34c759' : '#e5e5e5',
                  borderRadius: '28px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '22px',
                    width: '22px',
                    left: twoFactorEnabled ? '25px' : '3px',
                    bottom: '3px',
                    background: '#fff',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
            {twoFactorEnabled && (
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: '#e8f5e9', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '13px', color: '#2e7d32', margin: 0 }}>
                  ✓ 2단계 인증이 활성화되어 있습니다
                </p>
              </div>
            )}
          </div>

          {/* 로그인 알림 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>로그인 알림</h3>
                <p style={{ fontSize: '13px', color: '#86868b', margin: 0 }}>
                  새 기기에서 로그인 시 이메일로 알림을 받습니다
                </p>
              </div>
              <label style={{ 
                position: 'relative', 
                display: 'inline-block', 
                width: '50px', 
                height: '28px' 
              }}>
                <input
                  type="checkbox"
                  checked={loginAlertEnabled}
                  onChange={(e) => setLoginAlertEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: loginAlertEnabled ? '#34c759' : '#e5e5e5',
                  borderRadius: '28px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '22px',
                    width: '22px',
                    left: loginAlertEnabled ? '25px' : '3px',
                    bottom: '3px',
                    background: '#fff',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* 활성 세션 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>활성 세션</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f0f7ff',
                borderRadius: '8px',
                border: '1px solid #007aff30'
              }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    🖥️ 현재 세션
                  </div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>
                    Chrome · Windows · 서울
                  </div>
                </div>
                <span style={{ 
                  padding: '4px 8px', 
                  background: '#e8f5e9', 
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  활성
                </span>
              </div>
            </div>
            
            <button
              onClick={() => alert('다른 모든 세션에서 로그아웃되었습니다.')}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #ff3b30',
                background: '#fff',
                color: '#ff3b30',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              다른 모든 세션 로그아웃
            </button>
          </div>

          {/* 계정 삭제 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '24px',
            border: '1px solid #fee2e2'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: '#dc2626' }}>
              계정 삭제
            </h3>
            <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '16px' }}>
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <button
              onClick={() => {
                if (confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  alert('관리자에게 문의해주세요.')
                }
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              계정 삭제 요청
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
