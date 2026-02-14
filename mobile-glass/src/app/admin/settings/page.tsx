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
        alert('?¤ì •???€?¥ë˜?ˆìŠµ?ˆë‹¤.')
      } else {
        alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
      }
    } catch (error) {
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
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
        ê¸°ë³¸?¤ì •
      </h2>

      {/* ?¬ì—…???•ë³´ */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>?¬ì—…???•ë³´</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>
              ?Œì‚¬ëª?<span style={{ color: '#ff3b30' }}>*</span>
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
              ?¬ì—…?ë“±ë¡ë²ˆ??<span style={{ color: '#ff3b30' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.bizNo}
              onChange={(e) => setFormData({ ...formData, bizNo: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>?€?œìëª?/label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>?€???°ë½ì²?/label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>?´ë©”??/label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>ì£¼ì†Œ</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ì£¼ë¬¸ ?¤ì • */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>ì£¼ë¬¸ ?¤ì •</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>ì£¼ë¬¸ë²ˆí˜¸ ?‘ë‘??/label>
            <input
              type="text"
              value={formData.orderPrefix}
              onChange={(e) => setFormData({ ...formData, orderPrefix: e.target.value })}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              ì£¼ë¬¸ë²ˆí˜¸ ?ì— ë¶™ì„ ë¬¸ì (?? ORD-2024-0001)
            </p>
          </div>
          <div>
            <label style={labelStyle}>?ë™ ?•ì • ê¸°ê°„</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={formData.autoConfirmDays}
                onChange={(e) => setFormData({ ...formData, autoConfirmDays: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ color: '#666' }}>??/span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              ë°°ì†¡ ?„ë£Œ ???ë™ êµ¬ë§¤?•ì • ê¸°ê°„
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>ìµœì†Œ ì£¼ë¬¸ê¸ˆì•¡</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ color: '#666' }}>??/span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              ìµœì†Œ ì£¼ë¬¸ê¸ˆì•¡ ë¯¸ë§Œ ??ì£¼ë¬¸ ë¶ˆê?
            </p>
          </div>
        </div>
      </div>

      {/* ?Œë¦¼ ?¤ì • */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>?Œë¦¼ ?¤ì •</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.pushNotification}
              onChange={(e) => setFormData({ ...formData, pushNotification: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#007aff' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>?¸ì‹œ ?Œë¦¼</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>??ì£¼ë¬¸, ?¬ê³  ë¶€ì¡??±ì˜ ?Œë¦¼??ë°›ìŠµ?ˆë‹¤.</div>
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
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>?´ë©”???Œë¦¼</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ì¤‘ìš” ?Œë¦¼???´ë©”?¼ë¡œ??ë°›ìŠµ?ˆë‹¤.</div>
            </div>
          </label>
        </div>
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
