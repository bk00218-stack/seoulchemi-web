'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface ProductOption {
  id: number
  sph: string | null
  cyl: string | null
  optionName: string | null
  stock: number
  barcode: string | null
}

interface ProductInventory {
  id: number
  brandId: number
  brandName: string
  name: string
  totalStock: number
  optionCount: number
  options: ProductOption[]
}

interface Transaction {
  id: number
  type: string
  reason: string
  quantity: number
  beforeStock: number
  afterStock: number
  memo: string | null
  processedBy: string | null
  createdAt: string
  product?: { name: string }
  productOption?: { sph: string | null; cyl: string | null; optionName: string | null }
}

export default function StockAdjustPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null)
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null)
  
  // 조정 모달 상태
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in')
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustMemo, setAdjustMemo] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedBrand, search])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBrand !== 'all') params.set('brandId', selectedBrand)
      if (search) params.set('search', search)

      const [invRes, txRes] = await Promise.all([
        fetch(`/api/inventory?${params}`),
        fetch('/api/inventory/transactions?limit=20')
      ])

      if (invRes.ok) {
        const data = await invRes.json()
        setProducts(data.products || [])
        setBrands(data.brands || [])
      }

      if (txRes.ok) {
        const data = await txRes.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAdjustModal = (product: ProductInventory, option: ProductOption) => {
    setSelectedProduct(product)
    setSelectedOption(option)
    setAdjustType('in')
    setAdjustQty(0)
    setAdjustMemo('')
    setShowAdjustModal(true)
  }

  const handleAdjust = async () => {
    if (!selectedOption || adjustQty === 0) {
      toast.warning('조정 수량을 입력해주세요.')
      return
    }

    setAdjusting(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productOptionId: selectedOption.id,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustType === 'in' ? '입고' : adjustType === 'out' ? '출고' : '재고조정',
          memo: adjustMemo,
          processedBy: '관리자'
        })
      })

      if (res.ok) {
        setShowAdjustModal(false)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || '재고 조정에 실패했습니다.')
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.')
    } finally {
      setAdjusting(false)
    }
  }

  const getPreviewStock = () => {
    if (!selectedOption) return 0
    if (adjustType === 'in') return selectedOption.stock + adjustQty
    if (adjustType === 'out') return Math.max(0, selectedOption.stock - adjustQty)
    return adjustQty // adjust
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return { label: '입고', color: '#34c759', bg: '#e8f5e9' }
      case 'out': return { label: '출고', color: '#ff3b30', bg: '#ffebee' }
      case 'adjust': return { label: '조정', color: '#007aff', bg: '#e3f2fd' }
      default: return { label: type, color: '#666', bg: '#f5f5f5' }
    }
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>재고 조정</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
          상품별 재고를 입고, 출고, 직접 조정할 수 있습니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
        {/* 왼쪽: 상품 목록 */}
        <div>
          {/* 필터 */}
          <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', gap: 12 }}>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none', minWidth: 140 }}
            >
              <option value="all">전체 브랜드</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🔍 상품명, 바코드 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none' }}
            />
          </div>

          {/* 상품 목록 */}
          <div style={{ ...cardStyle, overflow: 'hidden', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</div>
            ) : products.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <p>상품이 없습니다.</p>
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ padding: '14px 16px', background: 'var(--gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--gray-400)', fontSize: 12, marginRight: 8 }}>{product.brandName}</span>
                      <span style={{ fontWeight: 500 }}>{product.name}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>총 재고: {product.totalStock}</span>
                  </div>
                  <div>
                    {product.options.map(option => (
                      <div
                        key={option.id}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid var(--gray-50)',
                          fontSize: 14
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ color: 'var(--gray-500)', minWidth: 80 }}>
                            {option.sph || '-'} / {option.cyl || '-'}
                          </span>
                          {option.optionName && (
                            <span style={{ color: 'var(--gray-600)' }}>{option.optionName}</span>
                          )}
                          {option.barcode && (
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-400)' }}>{option.barcode}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            fontWeight: 600,
                            color: option.stock === 0 ? '#ff3b30' : option.stock <= 5 ? '#ff9500' : '#1d1d1f'
                          }}>
                            {option.stock}
                          </span>
                          <button
                            onClick={() => openAdjustModal(product, option)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              background: '#007aff',
                              color: '#fff',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            조정
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 최근 조정 이력 */}
        <div>
          <div style={{ ...cardStyle, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' }}>최근 조정 이력</h3>
            {transactions.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                조정 이력이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.map(tx => {
                  const typeInfo = getTypeLabel(tx.type)
                  return (
                    <div key={tx.id} style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{tx.product?.name || '상품'}</span>
                          {tx.productOption && (
                            <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 8 }}>
                              {tx.productOption.sph || '-'}/{tx.productOption.cyl || '-'}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: typeInfo.bg,
                          color: typeInfo.color,
                          fontWeight: 500
                        }}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                          {tx.beforeStock} → <strong style={{ color: '#1d1d1f' }}>{tx.afterStock}</strong>
                          <span style={{ color: tx.quantity >= 0 ? '#34c759' : '#ff3b30', marginLeft: 8 }}>
                            ({tx.quantity >= 0 ? '+' : ''}{tx.quantity})
                          </span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                          {new Date(tx.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {tx.memo && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                          💬 {tx.memo}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 재고 조정 모달 */}
      {showAdjustModal && selectedProduct && selectedOption && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>재고 조정</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', margin: '0 0 24px' }}>
              {selectedProduct.brandName} - {selectedProduct.name}
              {selectedOption.sph && ` (${selectedOption.sph}/${selectedOption.cyl || '0'})`}
            </p>

            <div style={{ marginBottom: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>현재 재고</span>
              <span style={{ fontSize: 24, fontWeight: 600 }}>{selectedOption.stock}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 10 }}>조정 유형</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'in', label: '➕ 입고', desc: '재고 증가' },
                  { value: 'out', label: '➖ 출고', desc: '재고 감소' },
                  { value: 'adjust', label: '✏️ 직접설정', desc: '재고 지정' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAdjustType(opt.value as any)}
                    style={{
                      flex: 1,
                      padding: '14px 12px',
                      borderRadius: 10,
                      border: '2px solid',
                      borderColor: adjustType === opt.value ? '#007aff' : 'var(--gray-200)',
                      background: adjustType === opt.value ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: adjustType === opt.value ? '#007aff' : '#1d1d1f', marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                {adjustType === 'adjust' ? '변경할 재고 수량' : '조정 수량'}
              </label>
              <input
                type="number"
                value={adjustQty || ''}
                onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                min={0}
                placeholder="수량 입력"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--gray-200)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {adjustQty > 0 && (
              <div style={{ marginBottom: 20, padding: 16, background: '#e8f5e9', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#2e7d32' }}>변경 후 재고</span>
                <span style={{ fontSize: 24, fontWeight: 600, color: '#2e7d32' }}>{getPreviewStock()}</span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>메모 (선택)</label>
              <input
                type="text"
                value={adjustMemo}
                onChange={e => setAdjustMemo(e.target.value)}
                placeholder="조정 사유를 입력하세요"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowAdjustModal(false)}
                disabled={adjusting}
                style={{ flex: 1, padding: '14px', borderRadius: 10, border: '1px solid var(--gray-200)', background: '#fff', fontSize: 15, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || adjustQty === 0}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: adjustQty === 0 ? 'var(--gray-300)' : '#007aff',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: adjustQty === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {adjusting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
