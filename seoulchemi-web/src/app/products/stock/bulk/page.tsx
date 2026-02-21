'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

interface StockOption {
  id: number
  sph: string | null
  cyl: string | null
  stock: number
  product: {
    id: number
    name: string
    brand: { id: number; name: string } | null
  }
  // 클라이언트 전용
  newStock?: number
  selected?: boolean
}

interface BrandItem {
  id: number
  name: string
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
}

export default function BulkStockPage() {
  const { toast } = useToast()
  const [options, setOptions] = useState<StockOption[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [adjustType, setAdjustType] = useState<'set' | 'add' | 'subtract'>('set')
  const [adjustValue, setAdjustValue] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/admin/stock')
      const data = await res.json()
      const opts = (data.options || []).map((o: StockOption) => ({ ...o, newStock: o.stock, selected: false }))
      setOptions(opts)
      setBrands(data.brands || [])
    } catch (e) {
      console.error('Failed to fetch stock:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredOptions = options.filter(o => {
    const matchesSearch = !search ||
      o.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.sph || '').includes(search) || (o.cyl || '').includes(search)
    const matchesBrand = brandFilter === 'all' || o.product.brand?.id === parseInt(brandFilter)
    return matchesSearch && matchesBrand
  })

  const selectedOptions = options.filter(o => o.selected)

  const handleSelectAll = () => {
    const allSelected = filteredOptions.every(o => o.selected)
    const filteredIds = new Set(filteredOptions.map(o => o.id))
    setOptions(options.map(o =>
      filteredIds.has(o.id) ? { ...o, selected: !allSelected } : o
    ))
  }

  const handleToggleSelect = (id: number) => {
    setOptions(options.map(o => o.id === id ? { ...o, selected: !o.selected } : o))
  }

  const handleApplyAdjustment = () => {
    if (!adjustValue || selectedOptions.length === 0) return
    const value = parseInt(adjustValue)
    setOptions(options.map(o => {
      if (!o.selected) return o
      let newStock = o.stock
      switch (adjustType) {
        case 'set': newStock = value; break
        case 'add': newStock = o.stock + value; break
        case 'subtract': newStock = Math.max(0, o.stock - value); break
      }
      return { ...o, newStock }
    }))
  }

  const handleSave = async () => {
    const changes = options.filter(o => o.stock !== (o.newStock ?? o.stock))
    if (changes.length === 0) {
      toast.error('변경된 재고가 없습니다.')
      return
    }
    if (!reason.trim()) {
      toast.warning('조정 사유를 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustments: changes.map(o => ({ optionId: o.id, newStock: o.newStock })),
          reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.adjusted}개 상품의 재고가 조정되었습니다.`)
        setReason('')
        fetchStock()
      } else {
        toast.error(data.error || '재고 조정 실패')
      }
    } catch {
      toast.error('재고 조정 중 오류 발생')
    } finally {
      setSaving(false)
    }
  }

  const totalChange = options.reduce((sum, o) => sum + ((o.newStock ?? o.stock) - o.stock), 0)

  if (loading) {
    return (
      <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>로딩 중...</div>
      </Layout>
    )
  }

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
            <select value={adjustType} onChange={e => setAdjustType(e.target.value as 'set' | 'add' | 'subtract')} style={{ ...inputStyle, minWidth: 140 }}>
              <option value="set">값으로 설정</option>
              <option value="add">더하기 (+)</option>
              <option value="subtract">빼기 (-)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-600)' }}>수량</label>
            <input type="number" min="0" value={adjustValue} onChange={e => setAdjustValue(e.target.value)} placeholder="0" style={{ ...inputStyle, width: 100 }} />
          </div>
          <button
            onClick={handleApplyAdjustment}
            disabled={!adjustValue || selectedOptions.length === 0}
            style={{
              ...btnStyle,
              background: selectedOptions.length > 0 && adjustValue ? '#007aff' : 'var(--gray-200)',
              color: selectedOptions.length > 0 && adjustValue ? '#fff' : 'var(--gray-400)',
            }}
          >
            선택된 {selectedOptions.length}개에 적용
          </button>
          <div style={{ flex: 1 }} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-600)' }}>조정 사유 *</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="예: 월말 재고실사" style={{ ...inputStyle, width: 200 }} />
          </div>
          <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: '#34c759', color: '#fff' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ ...inputStyle, minWidth: 120 }}>
            <option value="all">전체 브랜드</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="text" placeholder="🔍 상품명, 도수 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 280 }} />
        </div>
        {totalChange !== 0 && (
          <span style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: totalChange > 0 ? '#e8f5e9' : '#ffebee',
            color: totalChange > 0 ? '#34c759' : '#ff3b30',
          }}>
            총 변동: {totalChange > 0 ? '+' : ''}{totalChange}
          </span>
        )}
      </div>

      {/* 상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredOptions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>재고 옵션이 없습니다</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: 50 }}>
                  <input type="checkbox" checked={filteredOptions.length > 0 && filteredOptions.every(o => o.selected)} onChange={handleSelectAll} style={{ width: 18, height: 18, accentColor: '#007aff' }} />
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
              {filteredOptions.map(option => {
                const change = (option.newStock ?? option.stock) - option.stock
                return (
                  <tr key={option.id} style={{
                    borderBottom: '1px solid var(--gray-100)',
                    background: option.selected ? '#f0f8ff' : change !== 0 ? '#fffbf0' : '#fff',
                  }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input type="checkbox" checked={option.selected || false} onChange={() => handleToggleSelect(option.id)} style={{ width: 18, height: 18, accentColor: '#007aff' }} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{option.product.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>{option.product.brand?.name || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{option.sph || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{option.cyl || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>{option.stock}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="number" min="0"
                        value={option.newStock ?? option.stock}
                        onChange={e => setOptions(options.map(o =>
                          o.id === option.id ? { ...o, newStock: parseInt(e.target.value) || 0 } : o
                        ))}
                        style={{
                          width: 60, padding: '6px 8px', borderRadius: 6,
                          border: change !== 0 ? '2px solid #ff9500' : '1px solid var(--gray-200)',
                          fontSize: 14, fontWeight: 500, textAlign: 'center', outline: 'none',
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {change !== 0 && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600,
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
        )}
      </div>
    </Layout>
  )
}
