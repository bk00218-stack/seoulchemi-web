'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'

interface PrinterConfig {
  printers: string[]  // 등록된 프린터 목록
  deliveryOrder: string  // 출고지시서 프린터
  invoice: string  // 거래명세표 프린터
  rxReceipt: string  // Rx 접수내용 프린터
}

const DOCUMENT_TYPES = [
  { key: 'deliveryOrder', label: '출고지시서', description: '출고 작업 시 출력되는 지시서' },
  { key: 'invoice', label: '거래명세표', description: '거래처에 발행하는 명세서' },
  { key: 'rxReceipt', label: 'Rx 접수내용', description: '처방전 접수 확인서' },
] as const

export default function PrinterSettingsPage() {
  const [config, setConfig] = useState<PrinterConfig>({
    printers: [],
    deliveryOrder: '',
    invoice: '',
    rxReceipt: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPrinter, setNewPrinter] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

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

      const settings = json.settings || {}
      setConfig({
        printers: settings['printer.list'] ? JSON.parse(settings['printer.list']) : [],
        deliveryOrder: settings['printer.deliveryOrder'] || '',
        invoice: settings['printer.invoice'] || '',
        rxReceipt: settings['printer.rxReceipt'] || '',
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
        'printer.list': JSON.stringify(config.printers),
        'printer.deliveryOrder': config.deliveryOrder,
        'printer.invoice': config.invoice,
        'printer.rxReceipt': config.rxReceipt,
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (res.ok) {
        alert('프린터 설정이 저장되었습니다.')
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const addPrinter = () => {
    const name = newPrinter.trim()
    if (!name) return
    if (config.printers.includes(name)) {
      alert('이미 등록된 프린터입니다.')
      return
    }
    setConfig({ ...config, printers: [...config.printers, name] })
    setNewPrinter('')
  }

  const removePrinter = (index: number) => {
    const printerName = config.printers[index]
    const newPrinters = config.printers.filter((_, i) => i !== index)
    
    // 삭제된 프린터가 매핑되어 있으면 해제
    const newConfig = { ...config, printers: newPrinters }
    if (config.deliveryOrder === printerName) newConfig.deliveryOrder = ''
    if (config.invoice === printerName) newConfig.invoice = ''
    if (config.rxReceipt === printerName) newConfig.rxReceipt = ''
    
    setConfig(newConfig)
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditingName(config.printers[index])
  }

  const saveEdit = () => {
    if (editingIndex === null) return
    const oldName = config.printers[editingIndex]
    const newName = editingName.trim()
    
    if (!newName) {
      setEditingIndex(null)
      return
    }
    
    if (newName !== oldName && config.printers.includes(newName)) {
      alert('이미 등록된 프린터입니다.')
      return
    }
    
    const newPrinters = [...config.printers]
    newPrinters[editingIndex] = newName
    
    // 매핑도 업데이트
    const newConfig = { ...config, printers: newPrinters }
    if (config.deliveryOrder === oldName) newConfig.deliveryOrder = newName
    if (config.invoice === oldName) newConfig.invoice = newName
    if (config.rxReceipt === oldName) newConfig.rxReceipt = newName
    
    setConfig(newConfig)
    setEditingIndex(null)
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
        🖨️ 프린터 설정
      </h2>

      {/* 프린터 등록 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>프린터 등록</h3>
        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '16px' }}>
          PC에 설치된 프린터 이름을 등록하세요. Windows 설정 &gt; 프린터 및 스캐너에서 정확한 이름을 확인할 수 있습니다.
        </p>
        
        {/* 프린터 추가 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newPrinter}
            onChange={(e) => setNewPrinter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPrinter()}
            placeholder="프린터 이름 입력"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={addPrinter}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#007aff',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + 추가
          </button>
        </div>

        {/* 등록된 프린터 목록 */}
        {config.printers.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: '#f5f5f7', 
            borderRadius: '8px',
            color: '#86868b'
          }}>
            등록된 프린터가 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {config.printers.map((printer, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: '#f5f5f7',
                  borderRadius: '8px',
                }}
              >
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') setEditingIndex(null)
                      }}
                      onBlur={saveEdit}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #007aff',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '18px' }}>🖨️</span>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{printer}</span>
                    <button
                      onClick={() => startEdit(index)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e1e1e1',
                        background: '#fff',
                        fontSize: '12px',
                        color: '#666',
                        cursor: 'pointer',
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => removePrinter(index)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ff3b30',
                        background: '#fff',
                        fontSize: '12px',
                        color: '#ff3b30',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 문서별 프린터 지정 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>문서별 프린터 지정</h3>
        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '20px' }}>
          각 문서 종류별로 사용할 프린터를 지정하세요. 출력 시 해당 프린터가 기본 선택됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {DOCUMENT_TYPES.map((doc) => (
            <div
              key={doc.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: '16px',
                alignItems: 'center',
                padding: '16px',
                background: '#f5f5f7',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>
                  {doc.label}
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>
                  {doc.description}
                </div>
              </div>
              <select
                value={config[doc.key]}
                onChange={(e) => setConfig({ ...config, [doc.key]: e.target.value })}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #e1e1e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="">프린터 선택...</option>
                {config.printers.map((printer) => (
                  <option key={printer} value={printer}>
                    {printer}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {config.printers.length === 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fff3cd',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#856404',
          }}>
            ⚠️ 먼저 위에서 프린터를 등록해주세요
          </div>
        )}
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
