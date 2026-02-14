'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Supplier {
  id: number
  name: string
  code: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  bankInfo: string | null
  memo: string | null
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  isActive: boolean
  _count: { purchases: number }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [stats, setStats] = useState({ totalSuppliers: 0, totalOutstanding: 0 })

  const [form, setForm] = useState({
    name: '',
    code: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankInfo: '',
    memo: '',
    creditLimit: 0,
    paymentTermDays: 30,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [search])

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/purchase/suppliers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingSupplier(null)
    setForm({
      name: '',
      code: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      bankInfo: '',
      memo: '',
      creditLimit: 0,
      paymentTermDays: 30,
    })
    setShowModal(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name,
      code: supplier.code,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      bankInfo: supplier.bankInfo || '',
      memo: supplier.memo || '',
      creditLimit: supplier.creditLimit,
      paymentTermDays: supplier.paymentTermDays,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      alert('ë§¤ì…ì²˜ëª…ê³?ì½”ë“œ???„ìˆ˜?…ë‹ˆ??)
      return
    }

    try {
      const url = editingSupplier 
        ? `/api/purchase/suppliers/${editingSupplier.id}`
        : '/api/purchase/suppliers'
      
      const res = await fetch(url, {
        method: editingSupplier ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        fetchSuppliers()
      } else {
        const error = await res.json()
        alert(error.error || '?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤')
      }
    } catch (error) {
      console.error('Failed to save supplier:', error)
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`"${supplier.name}" ë§¤ì…ì²˜ë? ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?`)) return

    try {
      const res = await fetch(`/api/purchase/suppliers/${supplier.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error)
    }
  }

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>ë§¤ì…ì²?ê´€ë¦?/h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          ì´?{stats.totalSuppliers}ê°??…ì²´ Â· ë¯¸ë‚©ê¸??©ê³„ {stats.totalOutstanding.toLocaleString()}??
        </p>
      </div>

      {/* ê²€???„í„° */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ë§¤ì…ì²˜ëª…, ì½”ë“œ, ?´ë‹¹??ê²€??.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '14px'
          }}
        />
        <button
          onClick={openCreateModal}
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
          + ë§¤ì…ì²??±ë¡
        </button>
      </div>

      {/* ëª©ë¡ */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>ì½”ë“œ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>ë§¤ì…ì²˜ëª…</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?´ë‹¹??/th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?°ë½ì²?/th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>ë¯¸ë‚©ê¸?/th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ë§¤ì…ê±´ìˆ˜</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?íƒœ</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ê´€ë¦?/th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  ë¡œë”© ì¤?..
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  ?±ë¡??ë§¤ì…ì²˜ê? ?†ìŠµ?ˆë‹¤
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                    {supplier.code}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                    {supplier.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {supplier.contactName || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {supplier.phone || '-'}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    textAlign: 'right',
                    fontWeight: supplier.outstandingAmount > 0 ? 600 : 400,
                    color: supplier.outstandingAmount > 0 ? '#dc2626' : '#666'
                  }}>
                    {supplier.outstandingAmount.toLocaleString()}??
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#666' }}>
                    {supplier._count.purchases}ê±?
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: supplier.isActive ? '#d1fae5' : '#f3f4f6',
                      color: supplier.isActive ? '#059669' : '#6b7280'
                    }}>
                      {supplier.isActive ? '?¬ìš©' : 'ë¯¸ì‚¬??}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(supplier)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginRight: '4px'
                      }}
                    >
                      ?˜ì •
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ?? œ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ëª¨ë‹¬ */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {editingSupplier ? 'ë§¤ì…ì²??˜ì •' : 'ë§¤ì…ì²??±ë¡'}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ë§¤ì…ì²˜ëª… *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ì½”ë“œ *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={!!editingSupplier}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      background: editingSupplier ? '#f9fafb' : '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ?´ë‹¹?ëª…
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ?°ë½ì²?
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ?´ë©”??
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ì£¼ì†Œ
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ê³„ì¢Œ?•ë³´
                </label>
                <input
                  type="text"
                  value={form.bankInfo}
                  onChange={(e) => setForm({ ...form, bankInfo: e.target.value })}
                  placeholder="?€?‰ëª… ê³„ì¢Œë²ˆí˜¸ ?ˆê¸ˆì£?
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ? ìš©?œë„
                  </label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    ê²°ì œê¸°í•œ (??
                  </label>
                  <input
                    type="number"
                    value={form.paymentTermDays}
                    onChange={(e) => setForm({ ...form, paymentTermDays: parseInt(e.target.value) || 30 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ë©”ëª¨
                </label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer'
                }}
              >
                ì·¨ì†Œ
              </button>
              <button
                onClick={handleSubmit}
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
                {editingSupplier ? '?˜ì •' : '?±ë¡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
