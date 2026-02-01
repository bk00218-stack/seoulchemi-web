'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, CancelButton, SaveButton } from '../../components/FormInput'

interface Settings {
  companyName: string
  businessNo: string
  ceoName: string
  phone: string
  email: string
  address: string
  orderPrefix: string
  autoConfirmDays: number
  minOrderAmount: number
  enableNotification: boolean
  enableEmailAlert: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: 'BK COMPANY',
    businessNo: '123-45-67890',
    ceoName: '홍길동',
    phone: '02-1234-5678',
    email: 'admin@opticore.co.kr',
    address: '서울시 강남구 테헤란로 123',
    orderPrefix: 'ORD',
    autoConfirmDays: 3,
    minOrderAmount: 50000,
    enableNotification: true,
    enableEmailAlert: true
  })

  const handleChange = (name: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    alert('설정이 저장되었습니다.')
  }

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        기본설정
      </h2>

      <FormSection title="사업자 정보">
        <FormGrid>
          <FormInput
            label="회사명"
            name="companyName"
            value={settings.companyName}
            onChange={handleChange}
            required
          />
          <FormInput
            label="사업자등록번호"
            name="businessNo"
            value={settings.businessNo}
            onChange={handleChange}
            required
          />
        </FormGrid>
        <FormGrid>
          <FormInput
            label="대표자명"
            name="ceoName"
            value={settings.ceoName}
            onChange={handleChange}
          />
          <FormInput
            label="대표 연락처"
            name="phone"
            type="tel"
            value={settings.phone}
            onChange={handleChange}
          />
        </FormGrid>
        <FormInput
          label="이메일"
          name="email"
          type="email"
          value={settings.email}
          onChange={handleChange}
        />
        <FormInput
          label="주소"
          name="address"
          value={settings.address}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection title="주문 설정">
        <FormGrid>
          <FormInput
            label="주문번호 접두사"
            name="orderPrefix"
            value={settings.orderPrefix}
            onChange={handleChange}
            hint="주문번호 앞에 붙을 문자 (예: ORD-2024-0001)"
          />
          <FormInput
            label="자동 확정 기간"
            name="autoConfirmDays"
            type="number"
            value={settings.autoConfirmDays}
            onChange={handleChange}
            suffix="일"
            hint="배송 완료 후 자동 구매확정 기간"
          />
        </FormGrid>
        <FormInput
          label="최소 주문금액"
          name="minOrderAmount"
          type="number"
          value={settings.minOrderAmount}
          onChange={handleChange}
          suffix="원"
          hint="최소 주문금액 미만 시 주문 불가"
        />
      </FormSection>

      <FormSection title="알림 설정">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={settings.enableNotification}
              onChange={(e) => setSettings(prev => ({ ...prev, enableNotification: e.target.checked }))}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>푸시 알림</div>
              <div style={{ fontSize: '12px', color: '#86868b' }}>새 주문, 재고 부족 등의 알림을 받습니다.</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={settings.enableEmailAlert}
              onChange={(e) => setSettings(prev => ({ ...prev, enableEmailAlert: e.target.checked }))}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>이메일 알림</div>
              <div style={{ fontSize: '12px', color: '#86868b' }}>중요 알림을 이메일로도 받습니다.</div>
            </div>
          </label>
        </div>
        <FormActions>
          <CancelButton onClick={() => window.location.reload()} />
          <SaveButton onClick={handleSave} />
        </FormActions>
      </FormSection>
    </AdminLayout>
  )
}
