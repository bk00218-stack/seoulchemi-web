'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface PrinterSettings {
  // 출고지시서
  shippingSlipEnabled: boolean
  shippingSlipForm: string
  shippingSlipPrinter: string
  // 거래명세표
  invoiceEnabled: boolean
  invoiceForm: string
  invoicePrinter: string
  // 기타
  autoPrintOnOrder: boolean
}

const DEFAULT_SETTINGS: PrinterSettings = {
  shippingSlipEnabled: true,
  shippingSlipForm: 'default',
  shippingSlipPrinter: '',
  invoiceEnabled: true,
  invoiceForm: 'default',
  invoicePrinter: '',
  autoPrintOnOrder: true,
}

const FORM_OPTIONS = [
  { value: 'default', label: '기본 양식' },
  { value: 'simple', label: '간단 양식' },
  { value: 'detailed', label: '상세 양식' },
]

export default function PrinterSettingsPage() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [printers, setPrinters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 서버에서 설정 로드
        const res = await fetch('/api/settings/printer')
        if (res.ok) {
          const data = await res.json()
          setSettings({ ...DEFAULT_SETTINGS, ...data })
        } else {
          // 로컬스토리지 폴백
          const stored = localStorage.getItem('printerSettings')
          if (stored) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
          }
        }
      } catch {
        const stored = localStorage.getItem('printerSettings')
        if (stored) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
          } catch {}
        }
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // 설정 저장
  const handleSave = async () => {
    try {
      // 서버에 저장
      const res = await fetch('/api/settings/printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!res.ok) throw new Error('저장 실패')
      
      // 로컬스토리지에도 백업
      localStorage.setItem('printerSettings', JSON.stringify(settings))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      // 로컬스토리지에만 저장
      localStorage.setItem('printerSettings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // 테스트 인쇄
  const handleTestPrint = (type: 'shipping' | 'invoice') => {
    const printWindow = window.open(`/orders/print-test?type=${type}`, '_blank', 'width=800,height=600')
    if (printWindow) printWindow.focus()
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
        <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#212529' }}>
          🖨️ 프린터 설정
        </h1>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          
          {/* 출고지시서 설정 */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>
                📋 출고지시서
              </h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.shippingSlipEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, shippingSlipEnabled: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#5d7a5d' }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>자동 출력</span>
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  양식
                </label>
                <select
                  value={settings.shippingSlipForm}
                  onChange={e => setSettings(prev => ({ ...prev, shippingSlipForm: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff' }}
                >
                  {FORM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  프린터
                </label>
                <input
                  type="text"
                  value={settings.shippingSlipPrinter}
                  onChange={e => setSettings(prev => ({ ...prev, shippingSlipPrinter: e.target.value }))}
                  placeholder="기본 프린터 사용"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button
              onClick={() => handleTestPrint('shipping')}
              style={{ marginTop: 12, padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              테스트 인쇄
            </button>
          </section>

          {/* 거래명세표 설정 */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>
                📄 거래명세표
              </h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.invoiceEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, invoiceEnabled: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#5d7a5d' }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>출고 시 자동 출력</span>
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  양식
                </label>
                <select
                  value={settings.invoiceForm}
                  onChange={e => setSettings(prev => ({ ...prev, invoiceForm: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff' }}
                >
                  {FORM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  프린터
                </label>
                <input
                  type="text"
                  value={settings.invoicePrinter}
                  onChange={e => setSettings(prev => ({ ...prev, invoicePrinter: e.target.value }))}
                  placeholder="기본 프린터 사용"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button
              onClick={() => handleTestPrint('invoice')}
              style={{ marginTop: 12, padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              테스트 인쇄
            </button>
          </section>

          {/* 안내 */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                💡 <strong>프린터 이름</strong>은 운영체제에 설치된 프린터 이름을 정확히 입력하세요.<br/>
                비워두면 브라우저 기본 프린터를 사용합니다.<br/>
                <span style={{ color: '#6b7280' }}>예: "Samsung M2020 Series", "HP LaserJet Pro"</span>
              </p>
            </div>
          </section>

          {/* 저장 버튼 */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
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
