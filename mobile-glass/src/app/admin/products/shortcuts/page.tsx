'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Product {
  id: number
  name: string
  brand: { name: string }
  sellingPrice: number
}

interface Shortcut {
  id: number
  shortcode: string
  productId: number
  description: string | null
  useCount: number
  isActive: boolean
  product?: Product
}

export default function ShortcutsPage() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)

  const [form, setForm] = useState({
    shortcode: '',
    productId: null as number | null,
    description: ''
  })

  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [shortcutsRes, productsRes] = await Promise.all([
        fetch('/api/products/shortcuts'),
        fetch('/api/products')
      ])

      if (shortcutsRes.ok) {
        const data = await shortcutsRes.json()
        setShortcuts(data.shortcuts)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredShortcuts = shortcuts.filter(s =>
    s.shortcode.toLowerCase().includes(search.toLowerCase()) ||
    s.product?.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateModal = () => {
    setEditingShortcut(null)
    setForm({ shortcode: '', productId: null, description: '' })
    setShowModal(true)
  }

  const openEditModal = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut)
    setForm({
      shortcode: shortcut.shortcode,
      productId: shortcut.productId,
      description: shortcut.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.shortcode || !form.productId) {
      alert('?¨ì¶•ì½”ë“œ?€ ?í’ˆ???…ë ¥?´ì£¼?¸ìš”')
      return
    }

    try {
      const url = editingShortcut 
        ? `/api/products/shortcuts/${editingShortcut.id}`
        : '/api/products/shortcuts'

      const res = await fetch(url, {
        method: editingShortcut ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || '?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤')
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async (shortcut: Shortcut) => {
    if (!confirm(`"${shortcut.shortcode}" ?¨ì¶•ì½”ë“œë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?`)) return

    try {
      const res = await fetch(`/api/products/shortcuts/${shortcut.id}`, {
        method: 'DELETE'
      })

      if (res.ok) fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const toggleActive = async (shortcut: Shortcut) => {
    try {
      await fetch(`/api/products/shortcuts/${shortcut.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !shortcut.isActive })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to toggle:', error)
    }
  }

  const getProductById = (id: number) => products.find(p => p.id === id)
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <AdminLayout activeMenu="products">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>?í’ˆ ?¨ì¶•ì½”ë“œ</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          ?¨ì¶•ì½”ë“œë¡?ë¹ ë¥´ê²??í’ˆ??ì°¾ìŠµ?ˆë‹¤ (?? K156 ??ì¼€ë¯?1.56)
        </p>
      </div>

      {/* ê²€??ì¶”ê? */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="?¨ì¶•ì½”ë“œ, ?í’ˆëª?ê²€??.."
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
          + ?¨ì¶•ì½”ë“œ ?±ë¡
        </button>
      </div>

      {/* ëª©ë¡ */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?¨ì¶•ì½”ë“œ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?í’ˆ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?¤ëª…</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?¬ìš©?Ÿìˆ˜</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>?íƒœ</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>ê´€ë¦?/th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  ë¡œë”© ì¤?..
                </td>
              </tr>
            ) : filteredShortcuts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  {search ? 'ê²€??ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤' : '?±ë¡???¨ì¶•ì½”ë“œê°€ ?†ìŠµ?ˆë‹¤'}
                </td>
              </tr>
            ) : (
              filteredShortcuts.map(shortcut => (
                <tr key={shortcut.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: shortcut.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: '#007aff',
                      color: '#fff',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>
                      {shortcut.shortcode}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{shortcut.product?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{shortcut.product?.brand.name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {shortcut.description || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: shortcut.useCount > 0 ? '#d1fae5' : '#f3f4f6',
                      borderRadius: '10px',
                      fontSize: '13px'
                    }}>
                      {shortcut.useCount}??
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleActive(shortcut)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        background: shortcut.isActive ? '#d1fae5' : '#f3f4f6',
                        color: shortcut.isActive ? '#059669' : '#6b7280',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {shortcut.isActive ? '?¬ìš©' : 'ë¯¸ì‚¬??}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(shortcut)}
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
                      onClick={() => handleDelete(shortcut)}
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
            width: '450px'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {editingShortcut ? '?¨ì¶•ì½”ë“œ ?˜ì •' : '?¨ì¶•ì½”ë“œ ?±ë¡'}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ?¨ì¶•ì½”ë“œ *
                </label>
                <input
                  type="text"
                  value={form.shortcode}
                  onChange={(e) => setForm({ ...form, shortcode: e.target.value.toUpperCase() })}
                  placeholder="?? K156, CHM174"
                  disabled={!!editingShortcut}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    background: editingShortcut ? '#f9fafb' : '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ?í’ˆ *
                </label>
                
                {form.productId && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#f0f7ff',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{getProductById(form.productId)?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{getProductById(form.productId)?.brand.name}</div>
                    </div>
                    <button
                      onClick={() => setForm({ ...form, productId: null })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      ë³€ê²?
                    </button>
                  </div>
                )}
                
                {!form.productId && (
                  <>
                    <input
                      type="text"
                      placeholder="?í’ˆ ê²€??.."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '14px'
                      }}
                    />
                    
                    {productSearch && (
                      <div style={{ 
                        maxHeight: '200px', 
                        overflow: 'auto', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        marginTop: '8px'
                      }}>
                        {filteredProducts.slice(0, 15).map(product => (
                          <div
                            key={product.id}
                            onClick={() => { 
                              setForm({ ...form, productId: product.id })
                              setProductSearch('')
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                          >
                            <div style={{ fontSize: '14px' }}>{product.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{product.brand.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  ?¤ëª… (? íƒ)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="?? ì¼€ë¯?1.56 ê¸°ë³¸"
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
                {editingShortcut ? '?˜ì •' : '?±ë¡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
