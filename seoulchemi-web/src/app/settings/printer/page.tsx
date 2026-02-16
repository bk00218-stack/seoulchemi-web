'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface PrinterSettings {
  autoPrintShippingSlip: boolean  // 출고지시서 자동 인쇄
  autoPrintOnOrder: boolean       // 주문 전송 시 자동 인쇄
}

const DEFAULT_SETTINGS: PrinterSettings = {
  autoPrintShippingSlip: true,
  autoPrintOnOrder: true,
}

export default function PrinterSettingsPage() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  // 로컬스토리지에서 설정 로드
  useEffect(() => {
    const stored = localStorage.getItem('printerSettings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }
  }, [])

  // 설정 저장
  const handleSave = () => {
    localStorage.setItem('printerSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 테스트 인쇄
  const handleTestPrint = () => {
    const printWindow = window.open('/orders/print-test', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.focus()
    }
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#212529' }}>
          🖨️ 프린터 설정
        </h1>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {/* 자동 인쇄 설정 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              자동 인쇄 설정
            </h2>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, cursor: 'pointer', marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={settings.autoPrintOnOrder}
                onChange={e => setSettings(prev => ({ ...prev, autoPrintOnOrder: e.target.checked }))}
                style={{ width: 20, height: 20, accentColor: '#5d7a5d' }}
              />
              <div>
                <div style={{ fontWeight: 500, color: '#212529' }}>주문 전송 시 자동 인쇄</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  주문 전송 시 출고지시서를 자동으로 인쇄합니다
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoPrintShippingSlip}
                onChange={e => setSettings(prev => ({ ...prev, autoPrintShippingSlip: e.target.checked }))}
                style={{ width: 20, height: 20, accentColor: '#5d7a5d' }}
              />
              <div>
                <div style={{ fontWeight: 500, color: '#212529' }}>출고지시서 인쇄</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  출고 처리 시 출고지시서를 인쇄합니다
                </div>
              </div>
            </label>
          </section>

          {/* 프린터 안내 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              프린터 선택 방법
            </h2>
            <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                💡 프린터는 <strong>브라우저의 기본 프린터 설정</strong>을 사용합니다.<br/>
                인쇄 대화상자에서 원하는 프린터를 선택하고 "기본값으로 설정"하시면<br/>
                다음 인쇄부터 자동으로 해당 프린터가 선택됩니다.
              </p>
            </div>
          </section>

          {/* 테스트 인쇄 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              테스트 인쇄
            </h2>
            <button
              onClick={handleTestPrint}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151'
              }}
            >
              🖨️ 테스트 페이지 인쇄
            </button>
          </section>

          {/* 저장 버튼 */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {saved && (
              <span style={{ color: '#10b981', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                ✓ 저장되었습니다
              </span>
            )}
            <button
              onClick={handleSave}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600
              }}
            >
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
