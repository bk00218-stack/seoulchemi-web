'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

interface ShortcutData {
  id: number
  shortcode: string
  description: string | null
  productId: number | null
  product: {
    id: number
    name: string
    sellingPrice: number
    optionType: string | null
    brand: { name: string } | null
  } | null
  useCount: number
  isActive: boolean
}

interface ProductItem {
  id: number
  name: string
  sellingPrice: number
  optionType: string | null
  brand: string
}

const FUNCTION_KEYS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']
const NUMPAD_KEYS = ['Num1', 'Num2', 'Num3', 'Num4', 'Num5', 'Num6', 'Num7', 'Num8', 'Num9']

export default function ShortcutsPage() {
  const { toast } = useToast()
  const [shortcuts, setShortcuts] = useState<ShortcutData[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [shortcutsRes, productsRes] = await Promise.all([
        fetch('/api/admin/shortcuts'),
        fetch('/api/products'),
      ])
      const shortcutsData = await shortcutsRes.json()
      const productsData = await productsRes.json()
      setShortcuts(shortcutsData.shortcuts || [])
      setProducts(productsData.products || [])
    } catch (e) {
      console.error('Failed to fetch shortcuts:', e)
    } finally {
      setLoading(false)
    }
  }

  const getShortcut = (key: string) => shortcuts.find(s => s.shortcode === key)

  const fnAssigned = FUNCTION_KEYS.filter(k => getShortcut(k)?.productId).length
  const numAssigned = NUMPAD_KEYS.filter(k => getShortcut(k)?.productId).length

  const handleKeyClick = (key: string) => {
    setSelectedKey(key)
    setProductSearch('')
    setShowModal(true)
  }

  const handleAssign = async (productId: number) => {
    if (!selectedKey) return
    try {
      const res = await fetch('/api/admin/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode: selectedKey, productId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${selectedKey}에 상품이 등록되었습니다`)
        fetchData()
        setShowModal(false)
      } else {
        toast.error(data.error || '등록 실패')
      }
    } catch {
      toast.error('등록 중 오류 발생')
    }
  }

  const handleClear = async () => {
    if (!selectedKey) return
    try {
      const res = await fetch(`/api/admin/shortcuts?shortcode=${selectedKey}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`${selectedKey} 단축키가 해제되었습니다`)
        fetchData()
        setShowModal(false)
      }
    } catch {
      toast.error('해제 중 오류 발생')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 20)

  const renderKeyGrid = (keys: string[], color: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: keys.length > 9 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
      {keys.map(key => {
        const sc = getShortcut(key)
        const hasProduct = !!sc?.productId
        return (
          <div
            key={key}
            onClick={() => handleKeyClick(key)}
            style={{
              padding: 16, borderRadius: 12,
              border: hasProduct ? `2px solid ${color}` : '2px dashed var(--gray-200)',
              background: hasProduct ? `${color}08` : 'var(--gray-50)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: hasProduct ? color : 'var(--gray-300)', color: '#fff',
              }}>{key}</span>
            </div>
            {hasProduct && sc?.product ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{sc.product.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{sc.product.brand?.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 8 }}>
                  {sc.product.sellingPrice?.toLocaleString()}원
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--gray-400)', padding: '8px 0' }}>
                클릭하여 상품 등록
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

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
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>단축키 설정</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          POS에서 빠르게 상품을 선택할 수 있도록 키보드 단축키를 설정합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>펑션키 (F1-F12)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: '#007aff' }}>{fnAssigned}</span>
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--gray-400)' }}> / 12 설정됨</span>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>넘패드 (Num1-9)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: '#34c759' }}>{numAssigned}</span>
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--gray-400)' }}> / 9 설정됨</span>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>미설정 슬롯</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>
            {21 - fnAssigned - numAssigned}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>⌨️ 펑션키 (F1 - F12)</h3>
        {renderKeyGrid(FUNCTION_KEYS, '#007aff')}
      </div>

      <div style={{ ...cardStyle, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>🔢 넘패드 (Num 1 - 9)</h3>
        {renderKeyGrid(NUMPAD_KEYS, '#34c759')}
      </div>

      {showModal && selectedKey && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 500, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px' }}>
              {selectedKey} 단축키 설정
            </h3>

            {getShortcut(selectedKey)?.product && (
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>현재 설정</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{getShortcut(selectedKey)?.product?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  {getShortcut(selectedKey)?.product?.brand?.name} · {getShortcut(selectedKey)?.product?.sellingPrice?.toLocaleString()}원
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="🔍 상품명, 브랜드 검색..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />

            <div style={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleAssign(p.id)}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--gray-200)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{p.brand}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#007aff' }}>
                    {p.sellingPrice?.toLocaleString()}원
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)', fontSize: 13 }}>
                  {productSearch ? '검색 결과가 없습니다' : '상품을 검색하세요'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              {getShortcut(selectedKey)?.product && (
                <button onClick={handleClear}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: '#fff0f0', color: '#ff3b30' }}
                >해제</button>
              )}
              <button onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'var(--gray-100)', color: '#1d1d1f' }}
              >닫기</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
