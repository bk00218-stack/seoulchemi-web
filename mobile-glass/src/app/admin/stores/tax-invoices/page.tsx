'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface TaxInvoice {
  id: number
  invoiceNo: string
  storeId: number
  buyerName: string
  buyerBizNo: string
  supplyAmount: number
  taxAmount: number
  totalAmount: number
  issueDate: string
  supplyDate: string
  status: string
  items: {
    id: number
    itemName: string
    quantity: number
    unitPrice: number
    supplyAmount: number
    taxAmount: number
  }[]
}

interface Store {
  id: number
  name: string
  code: string
  bizNo?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  issued: { label: 'Î∞úÌñâ', color: '#3b82f6', bg: '#dbeafe' },
  sent: { label: '?ÑÏÜ°?ÑÎ£å', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: 'Ï∑®ÏÜå', color: '#ef4444', bg: '#fee2e2' }
}

export default function TaxInvoicesPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null)
  const [stats, setStats] = useState({ issued: 0, sent: 0, cancelled: 0, totalAmount: 0 })

  // ???∏Í∏àÍ≥ÑÏÇ∞????
  const [formData, setFormData] = useState({
    storeId: '',
    supplyDate: new Date().toISOString().slice(0, 10),
    items: [{ itemName: '?àÍ≤Ω?åÏ¶à', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
  })

  useEffect(() => {
    fetchInvoices()
    fetchStores()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/tax-invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores?limit=500')
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Í≥µÍ∏âÍ∞Ä???êÎèô Í≥ÑÏÇ∞
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].supplyAmount = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.storeId) {
      alert('Í∞ÄÎßπÏ†ê???†ÌÉù?¥Ï£º?∏Ïöî.')
      return
    }

    if (formData.items.some(item => !item.itemName || item.supplyAmount <= 0)) {
      alert('?àÎ™© ?ïÎ≥¥Î•??¨Î∞îÎ•¥Í≤å ?ÖÎ†•?¥Ï£º?∏Ïöî.')
      return
    }

    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: parseInt(formData.storeId),
          supplyDate: formData.supplyDate,
          items: formData.items
        })
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({
          storeId: '',
          supplyDate: new Date().toISOString().slice(0, 10),
          items: [{ itemName: '?àÍ≤Ω?åÏ¶à', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
        })
        fetchInvoices()
      } else {
        const data = await res.json()
        alert(data.error || 'Î∞úÌñâ???§Ìå®?àÏäµ?àÎã§.')
      }
    } catch (error) {
      alert('?úÎ≤Ñ ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.')
    }
  }

  const totalSupply = formData.items.reduce((sum, item) => sum + item.supplyAmount, 0)
  const totalTax = Math.round(totalSupply * 0.1)

  return (
    <AdminLayout activeMenu="stores">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>?∏Í∏àÍ≥ÑÏÇ∞??/h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>?∏Í∏àÍ≥ÑÏÇ∞??Î∞úÌñâ Î∞?Í¥ÄÎ¶?/p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          + ?∏Í∏àÍ≥ÑÏÇ∞??Î∞úÌñâ
        </button>
      </div>

      {/* ?µÍ≥Ñ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '4px' }}>Î∞úÌñâ</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.issued}</div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#10b981', marginBottom: '4px' }}>?ÑÏÜ°?ÑÎ£å</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.sent}</div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>Ï∑®ÏÜå</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.cancelled}</div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Ï¥?Î∞úÌñâ??/div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.totalAmount.toLocaleString()}??/div>
        </div>
      </div>

      {/* Î™©Î°ù */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Î°úÎî© Ï§?..</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>?∏Í∏àÍ≥ÑÏÇ∞?úÍ? ?ÜÏäµ?àÎã§.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Í≥ÑÏÇ∞?úÎ≤à??/th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Í±∞ÎûòÏ≤?/th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?¨ÏóÖ?êÎ≤à??/th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Í≥µÍ∏âÍ∞Ä??/th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?∏Ïï°</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?©Í≥Ñ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>?ÅÌÉú</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Î∞úÌñâ??/th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Í¥ÄÎ¶?/th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.issued
                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{invoice.invoiceNo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{invoice.buyerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{invoice.buyerBizNo || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right' }}>{invoice.supplyAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right' }}>{invoice.taxAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{invoice.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: statusConfig.bg,
                        color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(invoice.issueDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        ?ÅÏÑ∏
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Î∞úÌñâ Î™®Îã¨ */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>?∏Í∏àÍ≥ÑÏÇ∞??Î∞úÌñâ</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Í±∞ÎûòÏ≤?*</label>
                  <select
                    value={formData.storeId}
                    onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  >
                    <option value="">?†ÌÉù</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Í≥µÍ∏â?ºÏûê *</label>
                  <input
                    type="date"
                    value={formData.supplyDate}
                    onChange={e => setFormData({ ...formData, supplyDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* ?àÎ™© */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>?àÎ™©</label>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #007aff', background: 'var(--bg-primary)', color: '#007aff', fontSize: '13px', cursor: 'pointer' }}
                  >
                    + ?àÎ™© Ï∂îÍ?
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>?àÎ™Ö</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500, width: '100px' }}>Í∑úÍ≤©</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '80px' }}>?òÎüâ</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '100px' }}>?®Í?</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '120px' }}>Í≥µÍ∏âÍ∞Ä??/th>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={e => updateItem(idx, 'itemName', e.target.value)}
                            placeholder="?àÎ™Ö"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            value={item.specification}
                            onChange={e => updateItem(idx, 'specification', e.target.value)}
                            placeholder="Í∑úÍ≤©"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                            min={1}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                            min={0}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'right', fontWeight: 500 }}>
                          {item.supplyAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              style={{ padding: '4px 8px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              ??
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ?©Í≥Ñ */}
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Í≥µÍ∏âÍ∞Ä??/span>
                  <span>{totalSupply.toLocaleString()} ??/span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>?∏Ïï° (10%)</span>
                  <span>{totalTax.toLocaleString()} ??/span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '16px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span>?©Í≥Ñ</span>
                  <span>{(totalSupply + totalTax).toLocaleString()} ??/span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontSize: '14px', cursor: 'pointer' }}
                >
                  Ï∑®ÏÜå
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Î∞úÌñâ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ?ÅÏÑ∏ Î™®Îã¨ */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{selectedInvoice.invoiceNo}</h2>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: STATUS_CONFIG[selectedInvoice.status]?.bg,
                color: STATUS_CONFIG[selectedInvoice.status]?.color
              }}>
                {STATUS_CONFIG[selectedInvoice.status]?.label}
              </span>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Í±∞ÎûòÏ≤?</strong> {selectedInvoice.buyerName}</div>
              <div style={{ marginBottom: '8px' }}><strong>?¨ÏóÖ?êÎ≤à??</strong> {selectedInvoice.buyerBizNo || '-'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Î∞úÌñâ??</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString('ko-KR')}</div>
              <div><strong>Í≥µÍ∏â??</strong> {new Date(selectedInvoice.supplyDate).toLocaleDateString('ko-KR')}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>?àÎ™Ö</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>?òÎüâ</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>?®Í?</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Í≥µÍ∏âÍ∞Ä??/th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>?∏Ïï°</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>{item.itemName}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.supplyAmount.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.taxAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 600, borderTop: '2px solid #e5e5e5' }}>
                  <td colSpan={3} style={{ padding: '12px 8px' }}>?©Í≥Ñ</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedInvoice.supplyAmount.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedInvoice.taxAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ background: '#007aff', color: '#fff', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>Ï¥??©Í≥Ñ</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{selectedInvoice.totalAmount.toLocaleString()} ??/div>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontSize: '14px', cursor: 'pointer' }}
            >
              ?´Í∏∞
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
