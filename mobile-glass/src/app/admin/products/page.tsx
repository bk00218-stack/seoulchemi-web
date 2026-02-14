'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface Product {
  id: number
  code: string
  brand: string
  brandId: number
  name: string
  optionType: string
  productType: string
  bundleName: string | null
  refractiveIndex: string | null
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  status: string
  imageUrl: string | null
  erpCode: string | null
}

interface Brand {
  id: number
  name: string
}

interface ProductOption {
  id: number
  sph: string
  cyl: string
  axis: string | null
  optionName: string | null
  memo: string | null
  barcode: string | null
  stock: number
  status: string
  stockLocation: string | null
  priceAdjustment: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [brandFilter, setBrandFilter] = useState('')
  const [optionFilter, setOptionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  // ?ÅÌíà ?òÏ†ï???µÏÖò(?ÑÏàò?? Î∂àÎü¨?§Í∏∞
  useEffect(() => {
    if (editingProduct) {
      fetchProductOptions(editingProduct.id)
    } else {
      setProductOptions([])
    }
  }, [editingProduct])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
      setBrands(data.brands || [])
      setStats(data.stats || { total: 0, active: 0, inactive: 0 })
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductOptions(productId: number) {
    setOptionsLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/options`)
      const data = await res.json()
      setProductOptions(data.options || [])
    } catch (error) {
      console.error('Failed to fetch product options:', error)
      setProductOptions([])
    } finally {
      setOptionsLoading(false)
    }
  }

  const columns: Column<Product>[] = [
    { key: 'imageUrl', label: '', render: (v) => (
      v ? (
        <img 
          src={v as string} 
          alt="" 
          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
        />
      ) : (
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: 'var(--text-tertiary)'
        }}>?ì∑</div>
      )
    )},
    { key: 'code', label: 'ÏΩîÎìú', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>{v as string}</span>
    )},
    { key: 'brand', label: 'Î∏åÎûú??, render: (v) => (
      <span style={{ background: '#eef4ee', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'name', label: '?ÅÌíàÎ™?, render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'optionType', label: '?µÏÖò?Ä??, render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'refractiveIndex', label: 'Íµ¥Ï†àÎ•?, render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{v as string || '-'}</span>
    )},
    { key: 'sellingPrice', label: '?êÎß§Í∞Ä', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'status', label: '?ÅÌÉú', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: 'Í¥ÄÎ¶?, align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingProduct(row); setShowModal(true); }}
        style={{
          padding: '4px 10px',
          borderRadius: '4px',
          background: 'var(--bg-secondary)',
          color: '#007aff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        ?òÏ†ï
      </button>
    )},
  ]

  // ?ÑÌÑ∞Îß?
  let filteredProducts = products
  if (filter !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.status === filter)
  }
  if (brandFilter) {
    filteredProducts = filteredProducts.filter(p => p.brand === brandFilter)
  }
  if (optionFilter) {
    filteredProducts = filteredProducts.filter(p => p.optionType === optionFilter)
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  }

  // ?µÏÖò?Ä??Î™©Î°ù Ï∂îÏ∂ú
  const optionTypes = [...new Set(products.map(p => p.optionType))]

  // ?¥Î?ÏßÄ ?ÖÎ°ú???∏Îì§??
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingProduct || !e.target.files?.[0]) return
    
    setImageUploading(true)
    const formData = new FormData()
    formData.append('image', e.target.files[0])
    
    try {
      const res = await fetch(`/api/products/${editingProduct.id}/image`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.imageUrl) {
        setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl })
        // Î™©Î°ù???ÖÎç∞?¥Ìä∏
        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...p, imageUrl: data.imageUrl } : p
        ))
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('?¥Î?ÏßÄ ?ÖÎ°ú???§Ìå®')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleImageDelete() {
    if (!editingProduct) return
    
    try {
      await fetch(`/api/products/${editingProduct.id}/image`, { method: 'DELETE' })
      setEditingProduct({ ...editingProduct, imageUrl: null })
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, imageUrl: null } : p
      ))
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout activeMenu="products">
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          Î°úÎî© Ï§?..
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ?êÎß§?ÅÌíà Í¥ÄÎ¶?
      </h2>

      <StatCardGrid>
        <StatCard label="Ï¥??ÅÌíà" value={stats.total} unit="Í∞? icon="?ì¶" />
        <StatCard label="?úÏÑ± ?ÅÌíà" value={stats.active} unit="Í∞? />
        <StatCard label="ÎπÑÌôú???ÅÌíà" value={stats.inactive} unit="Í∞? />
        <StatCard label="Î∏åÎûú?? value={brands.length} unit="Í∞? />
      </StatCardGrid>

      <SearchFilter
        placeholder="?ÅÌíàÏΩîÎìú, ?ÅÌíàÎ™?Í≤Ä??
        onSearch={setSearchQuery}
        filters={[
          { 
            label: 'Î∏åÎûú??, 
            key: 'brand', 
            options: brands.map(b => ({ label: b.name, value: b.name })),
            onChange: setBrandFilter
          },
          { 
            label: '?µÏÖò?Ä??, 
            key: 'optionType', 
            options: optionTypes.map(t => ({ label: t, value: t })),
            onChange: setOptionFilter
          }
        ]}
        actions={
          <>
            <OutlineButton onClick={() => alert('?ëÏ? ?§Ïö¥Î°úÎìú')}>?ì• ?ëÏ?</OutlineButton>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              + ?ÅÌíà ?±Î°ù
            </button>
          </>
        }
      />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '?ÑÏ≤¥', value: 'all' },
            { label: '?úÏÑ±', value: 'active' },
            { label: 'ÎπÑÌôú??, value: 'inactive' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="?±Î°ù???ÅÌíà???ÜÏäµ?àÎã§"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Ï¥?{filteredProducts.length}Í∞??ÅÌíà
        </span>
      </div>

      {/* ?±Î°ù/?òÏ†ï Î™®Îã¨ */}
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
            width: editingProduct ? '600px' : '500px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingProduct ? '?ÅÌíà ?òÏ†ï' : '?ÅÌíà ?±Î°ù'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* ?¥Î?ÏßÄ ?πÏÖò */}
              {editingProduct && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #e5e5e5'
                  }}>
                    {editingProduct.imageUrl ? (
                      <img 
                        src={editingProduct.imageUrl} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>?ì∑</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                      ?ÅÌíà ?¥Î?ÏßÄ
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#007aff',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: imageUploading ? 'wait' : 'pointer',
                        opacity: imageUploading ? 0.6 : 1
                      }}>
                        {imageUploading ? '?ÖÎ°ú??Ï§?..' : '?¥Î?ÏßÄ ?†ÌÉù'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {editingProduct.imageUrl && (
                        <button
                          onClick={handleImageDelete}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-primary)',
                            color: '#ff3b30',
                            border: '1px solid #ff3b30',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          ??†ú
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                      JPG, PNG ?ïÏãù (ÏµúÎ? 5MB)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Î∏åÎûú??*</label>
                <select 
                  defaultValue={editingProduct?.brandId || ''} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                >
                  <option value="">?†ÌÉù</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?ÅÌíàÎ™?*</label>
                <input 
                  type="text" 
                  defaultValue={editingProduct?.name} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?µÏÖò?Ä??/label>
                  <select 
                    defaultValue={editingProduct?.optionType || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  >
                    <option value="">?†ÌÉù</option>
                    <option value="?àÍ≤Ω?åÏ¶à RX">?àÍ≤Ω?åÏ¶à RX</option>
                    <option value="?àÍ≤Ω?åÏ¶à ?¨Î≤å">?àÍ≤Ω?åÏ¶à ?¨Î≤å</option>
                    <option value="ÏΩòÌÉù?∏Î†åÏ¶?>ÏΩòÌÉù?∏Î†åÏ¶?/option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Íµ¥Ï†àÎ•?/label>
                  <select 
                    defaultValue={editingProduct?.refractiveIndex || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  >
                    <option value="">?†ÌÉù</option>
                    <option value="1.50">1.50</option>
                    <option value="1.56">1.56</option>
                    <option value="1.60">1.60</option>
                    <option value="1.67">1.67</option>
                    <option value="1.74">1.74</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Î¨∂Ïùå?ÅÌíàÎ™?/label>
                  <input 
                    type="text" 
                    defaultValue={editingProduct?.bundleName || ''} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>ERP ÏΩîÎìú</label>
                  <input 
                    type="text" 
                    defaultValue={editingProduct?.erpCode || ''} 
                    placeholder="?àÌã∞???ÅÌíàÏΩîÎìú"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?êÎß§Í∞Ä</label>
                  <input 
                    type="number" 
                    defaultValue={editingProduct?.sellingPrice || 0} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Îß§ÏûÖÍ∞Ä</label>
                  <input 
                    type="number" 
                    defaultValue={editingProduct?.purchasePrice || 0} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>?ÅÌÉú</label>
                <select 
                  defaultValue={editingProduct?.isActive ? 'active' : 'inactive'} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                >
                  <option value="active">?úÏÑ±</option>
                  <option value="inactive">ÎπÑÌôú??/option>
                </select>
              </div>

              {/* ?ÑÏàò???πÏÖò */}
              {editingProduct && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ?ìã ?ÑÏàò??({productOptions.length}Í∞?
                    </label>
                    <button
                      onClick={() => alert('?ÑÏàò Ï∂îÍ? Í∏∞Îä• Ï§ÄÎπÑÏ§ë')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: '#007aff',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + ?ÑÏàò Ï∂îÍ?
                    </button>
                  </div>
                  
                  {optionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      Î°úÎî© Ï§?..
                    </div>
                  ) : productOptions.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      color: 'var(--text-tertiary)',
                      fontSize: '13px'
                    }}>
                      ?±Î°ù???ÑÏàòÍ∞Ä ?ÜÏäµ?àÎã§
                    </div>
                  ) : (
                    <div style={{ 
                      maxHeight: '250px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>SPH</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>CYL</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>?¨Í≥†</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>?ÅÌÉú</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Í¥ÄÎ¶?/th>
                          </tr>
                        </thead>
                        <tbody>
                          {productOptions.map((opt, idx) => (
                            <tr key={opt.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{opt.sph}</td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{opt.cyl}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{opt.stock}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  background: opt.status === 'Ï£ºÎ¨∏Í∞Ä?? ? '#e8f5e9' : '#ffebee',
                                  color: opt.status === 'Ï£ºÎ¨∏Í∞Ä?? ? '#2e7d32' : '#c62828'
                                }}>
                                  {opt.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => alert(`?ÑÏàò ?òÏ†ï: SPH ${opt.sph}, CYL ${opt.cyl}`)}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: 'transparent',
                                    color: '#007aff',
                                    border: '1px solid #007aff',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ?òÏ†ï
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                Ï∑®ÏÜå
              </button>
              <button 
                onClick={() => { alert('?Ä?•Îêò?àÏäµ?àÎã§.'); setShowModal(false); }} 
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                ?Ä??
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
