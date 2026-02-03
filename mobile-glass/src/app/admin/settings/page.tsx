'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/Navigation'

interface FormData {
  companyName: string
  bizNo: string
  owner: string
  phone: string
  email: string
  address: string
  orderPrefix: string
  autoConfirmDays: number
  minAmount: number
  pushNotification: boolean
  emailNotification: boolean
}

export default function SettingsPage() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    bizNo: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    orderPrefix: 'ORD',
    autoConfirmDays: 3,
    minAmount: 50000,
    pushNotification: true,
    emailNotification: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }

      setFormData({
        companyName: json.company.name || '',
        bizNo: json.company.bizNo || '',
        owner: json.company.owner || '',
        phone: json.company.phone || '',
        email: json.company.email || '',
        address: json.company.address || '',
        orderPrefix: json.order.prefix || 'ORD',
        autoConfirmDays: json.order.autoConfirmDays || 3,
        minAmount: json.order.minAmount || 0,
        pushNotification: json.notification.push ?? true,
        emailNotification: json.notification.email ?? true,
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settings = {
        'company.name': formData.companyName,
        'company.bizNo': formData.bizNo,
        'company.owner': formData.owner,
        'company.phone': formData.phone,
        'company.email': formData.email,
        'company.address': formData.address,
        'order.prefix': formData.orderPrefix,
        'order.autoConfirmDays': String(formData.autoConfirmDays),
        'order.minAmount': String(formData.minAmount),
        'notification.push': String(formData.pushNotification),
        'notification.email': String(formData.emailNotification),
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (res.ok) {
        alert('설정이 저장되었습니다.')
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#1d1d1f',
    marginBottom: '8px',
  }

  const sectionStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  }

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: '#1d1d1f',
    marginBottom: '20px',
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="settings">
        <div style={{ textAlign: 'center', padding: '100px', color: '#86868b' }}>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        기본설정
      </h2>

      {/* 사업자 정보 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>사업자 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>
              회사명 <span style={{ color: '#ff3b30' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              사업자등록번호 <span style={{ color: '#ff3b30' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.bizNo}
              onChange={(e) => setFormData({ ...formData, bizNo: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>대표자명</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>대표 연락처</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>주소</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 주문 설정 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>주문 설정</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>주문번호 접두사</label>
            <input
              type="text"
              value={formData.orderPrefix}
              onChange={(e) => setFormData({ ...formData, orderPrefix: e.target.value })}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
              주문번호 앞에 붙을 문자 (예: ORD-2024-0001)
            </p>
          </div>
          <div>
            <label style={labelStyle}>자동 확정 기간</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={formData.autoConfirmDays}
                onChange={(e) => setFormData({ ...formData, autoConfirmDays: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ color: '#666' }}>일</span>
            </div>
            <p style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
              배송 완료 후 자동 구매확정 기간
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>최소 주문금액</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ color: '#666' }}>원</span>
            </div>
            <p style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
              최소 주문금액 미만 시 주문 불가
            </p>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>알림 설정</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.pushNotification}
              onChange={(e) => setFormData({ ...formData, pushNotification: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#007aff' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>푸시 알림</div>
              <div style={{ fontSize: '12px', color: '#86868b' }}>새 주문, 재고 부족 등의 알림을 받습니다.</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.emailNotification}
              onChange={(e) => setFormData({ ...formData, emailNotification: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#007aff' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>이메일 알림</div>
              <div style={{ fontSize: '12px', color: '#86868b' }}>중요 알림을 이메일로도 받습니다.</div>
            </div>
          </label>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={() => fetchSettings()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #e1e1e1',
            background: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1d1d1f',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            fontSize: '14px',
            fontWeight: 500,
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </AdminLayout>
  )
}
