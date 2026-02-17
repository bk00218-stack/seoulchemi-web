'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout, { cardStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

// 목업 데이터
const mockProducts = [
  { id: 1, name: '다비치 단초점 1.60', brand: '다비치', sph: '-2.00', cyl: '-0.50', currentStock: 5, newStock: 5, selected: false },
  { id: 2, name: '다비치 단초점 1.60', brand: '다비치', sph: '-2.25', cyl: '-0.50', currentStock: 3, newStock: 3, selected: false },
  { id: 3, name: '다비치 단초점 1.60', brand: '다비치', sph: '-2.50', cyl: '-0.50', currentStock: 0, newStock: 0, selected: false },
  { id: 4, name: '다비치 단초점 1.60', brand: '다비치', sph: '-2.75', cyl: '-0.50', currentStock: 2, newStock: 2, selected: false },
  { id: 5, name: '다비치 단초점 1.67', brand: '다비치', sph: '-3.00', cyl: '-0.75', currentStock: 8, newStock: 8, selected: false },
  { id: 6, name: '에실로 누진 1.60', brand: '에실로', sph: '+1.00', cyl: '-0.50', currentStock: 4, newStock: 4, selected: false },
  { id: 7, name: '에실로 누진 1.60', brand: '에실로', sph: '+1.25', cyl: '-0.50', currentStock: 1, newStock: 1, selected: false },
  { id: 8, name: '호야 단초점 1.60', brand: '호야', sph: '-4.00', cyl: '-1.00', currentStock: 6, newStock: 6, selected: false },
]

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--gray-200)',
  fontSize: 14,
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export default function BulkStockPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState(mockProducts)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [adjustType, setAdjustType] = useState<'set' | 'add' | 'subtract'>('set')
  const [adjustValue, setAdjustValue] = useState('')
  const [reason, setReason] = useState('')

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.sph.includes(search) || p.cyl.includes(search)
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter
    return matchesSearch && matchesBrand
  })

  const selectedProducts = products.filter(p => p.selected)
  const brands = [...new Set(products.map(p => p.brand))]

  const handleSelectAll = () => {
    const allSelected = filteredProducts.every(p => p.selected)
    setProducts(products.map(p => 
      filteredProducts.find(f => f.id === p.id) 
        ? { ...p, selected: !allSelected }
        : p
    ))
  }

  const handleToggleSelect = (id: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  }

  const handleApplyAdjustment = () => {
    if (!adjustValue || selectedProducts.length === 0) return
    
    const value = parseInt(adjustValue)
    setProducts(products.map(p => {
      if (!p.selected) return p
      let newStock = p.currentStock
      switch (adjustType) {
        case 'set': newStock = value; break
        case 'add': newStock = p.currentStock + value; break
        case 'subtract': newStock = Math.max(0, p.currentStock - value); break
      }
      return { ...p, newStock }
    }))
  }

  const handleSave = () => {
    const changes = products.filter(p => p.currentStock !== p.newStock)
    if (changes.length === 0) {
      toast.error('변경된 재고가 없습니다.')
      return
    }
    if (!reason.trim()) {
      toast.warning('조정 사유를 입력해주세요.')
      return
    }
    toast.success(`${changes.length}개 상품의 재고가 조정되었습니다.\n사유: ${reason}`)
    setProducts(products.map(p => ({ ...p, currentStock: p.newStock, selected: false })))
    setReason('')
  }

  const totalChange = products.reduce((sum, p) => sum + (p.newStock - p.currentStock), 0)

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>대량 재고 조정</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          여러 상품의 재고를 한 번에 조정합니다. 재고실사, 입고, 폐기 등에 사용하세요.
        </p>
      </div>

      {/* 조정 패널 */}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-600)' }}>조정 방식</label>
            <select
              value={adjustType}
              onChange={e => setAdjustType(e.target.value as 'set' | 'add' | 'subtract')}
              style={{ ...inputStyle, minWidth: 140 }}
            >
              <option value="set">값으로 설정</option>
              <option value="add">더하기 (+)</option>
              <option value="subtract">빼기 (-)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-600)' }}>수량</label>
            <input
              type="number"
              min="0"
              value={adjustValue}
              onChange={e => setAdjustValue(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
          <button
            onClick={handleApplyAdjustment}
            disabled={!adjustValue || selectedProducts.length === 0}
            style={{
              ...btnStyle,
              background: selectedProducts.length > 0 && adjustValue ? '#007aff' : 'var(--gray-200)',
              color: selectedProducts.length > 0 && adjustValue ? '#fff' : 'var(--gray-400)',
              cursor: selectedProducts.length > 0 && adjustValue ? 'pointer' : 'not-allowed',
            }}
          >
            선택된 {selectedProducts.length}개에 적용
          </button>
          <div style={{ flex: 1 }} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-600)' }}>조정 사유 *</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="예: 월말 재고실사"
              style={{ ...inputStyle, width: 200 }}
            />
          </div>
          <button
            onClick={handleSave}
            style={{ ...btnStyle, background: '#34c759', color: '#fff' }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            style={{ ...inputStyle, minWidth: 120 }}
          >
            <option value="all">전체 브랜드</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="🔍 상품명, 도수 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 280 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {totalChange !== 0 && (
            <span style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: totalChange > 0 ? '#e8f5e9' : '#ffebee',
              color: totalChange > 0 ? '#34c759' : '#ff3b30',
            }}>
              총 변동: {totalChange > 0 ? '+' : ''}{totalChange}
            </span>
          )}
        </div>
      </div>

      {/* 상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'center', width: 50 }}>
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && filteredProducts.every(p => p.selected)}
                  onChange={handleSelectAll}
                  style={{ width: 18, height: 18, accentColor: '#007aff' }}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>상품명</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>브랜드</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>SPH</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>CYL</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>현재 재고</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>조정 후</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>변동</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const change = product.newStock - product.currentStock
              return (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: '1px solid var(--gray-100)',
                    background: product.selected ? '#f0f8ff' : change !== 0 ? '#fffbf0' : '#fff',
                  }}
                >
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={product.selected}
                      onChange={() => handleToggleSelect(product.id)}
                      style={{ width: 18, height: 18, accentColor: '#007aff' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>{product.brand}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{product.sph}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{product.cyl}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>{product.currentStock}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={product.newStock}
                      onChange={e => setProducts(products.map(p => 
                        p.id === product.id ? { ...p, newStock: parseInt(e.target.value) || 0 } : p
                      ))}
                      style={{
                        width: 60,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: change !== 0 ? '2px solid #ff9500' : '1px solid var(--gray-200)',
                        fontSize: 14,
                        fontWeight: 500,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {change !== 0 && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        background: change > 0 ? '#e8f5e9' : '#ffebee',
                        color: change > 0 ? '#34c759' : '#ff3b30',
                      }}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
