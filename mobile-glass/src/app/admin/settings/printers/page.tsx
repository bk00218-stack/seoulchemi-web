'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'

interface PrinterConfig {
  printers: string[]  // ?±ë¡???„ë¦°??ëª©ë¡
  deliveryOrder: string  // ì¶œê³ ì§€?œì„œ ?„ë¦°??
  invoice: string  // ê±°ë˜ëª…ì„¸???„ë¦°??
  rxReceipt: string  // Rx ?‘ìˆ˜?´ìš© ?„ë¦°??
}

const DOCUMENT_TYPES = [
  { key: 'deliveryOrder', label: 'ì¶œê³ ì§€?œì„œ', description: 'ì¶œê³  ?‘ì—… ??ì¶œë ¥?˜ëŠ” ì§€?œì„œ' },
  { key: 'invoice', label: 'ê±°ë˜ëª…ì„¸??, description: 'ê±°ë˜ì²˜ì— ë°œí–‰?˜ëŠ” ëª…ì„¸?? },
  { key: 'rxReceipt', label: 'Rx ?‘ìˆ˜?´ìš©', description: 'ì²˜ë°©???‘ìˆ˜ ?•ì¸?? },
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
        alert('?„ë¦°???¤ì •???€?¥ë˜?ˆìŠµ?ˆë‹¤.')
      } else {
        alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
      }
    } catch (error) {
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
    setSaving(false)
  }

  const addPrinter = () => {
    const name = newPrinter.trim()
    if (!name) return
    if (config.printers.includes(name)) {
      alert('?´ë? ?±ë¡???„ë¦°?°ì…?ˆë‹¤.')
      return
    }
    setConfig({ ...config, printers: [...config.printers, name] })
    setNewPrinter('')
  }

  const removePrinter = (index: number) => {
    const printerName = config.printers[index]
    const newPrinters = config.printers.filter((_, i) => i !== index)
    
    // ?? œ???„ë¦°?°ê? ë§¤í•‘?˜ì–´ ?ˆìœ¼ë©??´ì œ
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
      alert('?´ë? ?±ë¡???„ë¦°?°ì…?ˆë‹¤.')
      return
    }
    
    const newPrinters = [...config.printers]
    newPrinters[editingIndex] = newName
    
    // ë§¤í•‘???…ë°?´íŠ¸
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
    color: 'var(--text-primary)',
    marginBottom: '8px',
  }

  const sectionStyle = {
    background: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  }

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: 'var(--text-primary)',
    marginBottom: '20px',
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="settings">
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-tertiary)' }}>
          ë¡œë”© ì¤?..
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ?–¨ï¸??„ë¦°???¤ì •
      </h2>

      {/* ?„ë¦°???±ë¡ */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>?„ë¦°???±ë¡</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
          PC???¤ì¹˜???„ë¦°???´ë¦„???±ë¡?˜ì„¸?? Windows ?¤ì • &gt; ?„ë¦°??ë°??¤ìº?ˆì—???•í™•???´ë¦„???•ì¸?????ˆìŠµ?ˆë‹¤.
        </p>
        
        {/* ?„ë¦°??ì¶”ê? */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newPrinter}
            onChange={(e) => setNewPrinter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPrinter()}
            placeholder="?„ë¦°???´ë¦„ ?…ë ¥"
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
            + ì¶”ê?
          </button>
        </div>

        {/* ?±ë¡???„ë¦°??ëª©ë¡ */}
        {config.printers.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            color: 'var(--text-tertiary)'
          }}>
            ?±ë¡???„ë¦°?°ê? ?†ìŠµ?ˆë‹¤
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
                  background: 'var(--bg-secondary)',
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
                    <span style={{ fontSize: '18px' }}>?–¨ï¸?/span>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{printer}</span>
                    <button
                      onClick={() => startEdit(index)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e1e1e1',
                        background: 'var(--bg-primary)',
                        fontSize: '12px',
                        color: '#666',
                        cursor: 'pointer',
                      }}
                    >
                      ?˜ì •
                    </button>
                    <button
                      onClick={() => removePrinter(index)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ff3b30',
                        background: 'var(--bg-primary)',
                        fontSize: '12px',
                        color: '#ff3b30',
                        cursor: 'pointer',
                      }}
                    >
                      ?? œ
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ë¬¸ì„œë³??„ë¦°??ì§€??*/}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>ë¬¸ì„œë³??„ë¦°??ì§€??/h3>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
          ê°?ë¬¸ì„œ ì¢…ë¥˜ë³„ë¡œ ?¬ìš©???„ë¦°?°ë? ì§€?•í•˜?¸ìš”. ì¶œë ¥ ???´ë‹¹ ?„ë¦°?°ê? ê¸°ë³¸ ? íƒ?©ë‹ˆ??
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
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {doc.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
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
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">?„ë¦°??? íƒ...</option>
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
            ? ï¸ ë¨¼ì? ?„ì—???„ë¦°?°ë? ?±ë¡?´ì£¼?¸ìš”
          </div>
        )}
      </div>

      {/* ?€??ë²„íŠ¼ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={() => fetchSettings()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #e1e1e1',
            background: 'var(--bg-primary)',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          ì·¨ì†Œ
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
          {saving ? '?€??ì¤?..' : '?€??}
        </button>
      </div>
    </AdminLayout>
  )
}
