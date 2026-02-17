'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import { exportToCSV } from '../../components/ExcelExport'

interface Store {
  id: number
  code: string
  name: string
  region: string
  ownerName: string
  phone: string
  address: string
  balance: number
  salesStaffName: string
  deliveryStaffName: string
  groupName: string
  email: string
  businessRegNo: string
  businessType: string
  businessCategory: string
  deliveryContact: string
  deliveryPhone: string
  deliveryAddress: string
  deliveryMemo: string
  creditLimit: number
  paymentTermDays: number
  billingDay: number | null
  lastPaymentAt: string | null
  discountRate: number
  status: string
  memo: string
}

interface TransactionItem {
  id?: number
  brand: string
  product: string
  qty: number
  sph?: string
  cyl?: string
  axis?: string
  add?: string
  price: number
}

interface Transaction {
  id: number
  storeId: number
  type: string
  amount: number
  balanceAfter: number
  orderNo: string | null
  paymentMethod: string | null
  memo: string | null
  processedAt: string
  items?: TransactionItem[]
}

interface ShipmentSearchResult {
  id: number
  orderNo: string
  storeName: string
  storeCode: string
  brandName: string
  productName: string
  sph: string | null
  cyl: string | null
  quantity: number
  totalPrice: number
  shippedAt: string
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#1565c0', bg: '#e3f2fd' },
  deposit: { label: '입금', color: '#2e7d32', bg: '#e8f5e9' },
  return: { label: '반품', color: '#e65100', bg: '#fff3e0' },
  adjustment: { label: '조정', color: '#666', bg: '#f5f5f5' },
}

const DISPLAY_FIELDS = [
  { key: 'ownerName', label: '대표자' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'businessRegNo', label: '사업자번호' },
  { key: 'salesStaffName', label: '영업담당' },
  { key: 'deliveryStaffName', label: '배송담당' },
  { key: 'groupName', label: '그룹' },
  { key: 'discountRate', label: '할인율' },
  { key: 'creditLimit', label: '신용한도' },
  { key: 'address', label: '주소' },
  { key: 'memo', label: '메모' },
] as const

const DEFAULT_VISIBLE_FIELDS = ['ownerName', 'phone', 'salesStaffName', 'deliveryStaffName', 'groupName', 'discountRate', 'address']

// 전체 출고 검색 모달
function ShipmentSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchParams, setSearchParams] = useState({
    dateFrom: '',
    dateTo: '',
    brandId: '',
    productId: '',
    sph: '',
    cyl: '',
    store: ''
  })
  const [results, setResults] = useState<ShipmentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [brands, setBrands] = useState<{id: number, name: string}[]>([])
  const [products, setProducts] = useState<{id: number, name: string, brandId: number}[]>([])
  const [filteredProducts, setFilteredProducts] = useState<{id: number, name: string, brandId: number}[]>([])

  // 브랜드/상품 목록 로드
  useEffect(() => {
    if (isOpen) {
      fetch('/api/brands?limit=100').then(r => r.json()).then(data => setBrands(data.brands || []))
      fetch('/api/products?limit=1000').then(r => r.json()).then(data => setProducts(data.products || []))
    }
  }, [isOpen])

  // 브랜드 선택 시 상품 필터링
  useEffect(() => {
    if (searchParams.brandId) {
      setFilteredProducts(products.filter(p => p.brandId === parseInt(searchParams.brandId)))
    } else {
      setFilteredProducts(products)
    }
  }, [searchParams.brandId, products])

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (searchParams.dateFrom) params.set('dateFrom', searchParams.dateFrom)
      if (searchParams.dateTo) params.set('dateTo', searchParams.dateTo)
      if (searchParams.brandId) params.set('brandId', searchParams.brandId)
      if (searchParams.productId) params.set('productId', searchParams.productId)
      if (searchParams.sph) params.set('sph', searchParams.sph)
      if (searchParams.cyl) params.set('cyl', searchParams.cyl)
      if (searchParams.store) params.set('store', searchParams.store)

      const res = await fetch(`/api/orders/shipped/search?${params.toString()}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') onClose()
  }

  const resetSearch = () => {
    setSearchParams({ dateFrom: '', dateTo: '', brandId: '', productId: '', sph: '', cyl: '', store: '' })
    setResults([])
    setSearched(false)
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* 헤더 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>🔍 전체 출고 내역 검색</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
        </div>

        {/* 검색 필터 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef', background: '#f8f9fa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} onKeyDown={handleKeyDown}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>시작일</label>
              <input type="date" value={searchParams.dateFrom} onChange={e => setSearchParams(p => ({ ...p, dateFrom: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>종료일</label>
              <input type="date" value={searchParams.dateTo} onChange={e => setSearchParams(p => ({ ...p, dateTo: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>브랜드</label>
              <select value={searchParams.brandId} onChange={e => setSearchParams(p => ({ ...p, brandId: e.target.value, productId: '' }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
                <option value="">전체</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>상품</label>
              <select value={searchParams.productId} onChange={e => setSearchParams(p => ({ ...p, productId: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
                <option value="">전체</option>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>SPH</label>
              <input type="text" placeholder="예: -3.00" value={searchParams.sph} onChange={e => setSearchParams(p => ({ ...p, sph: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>CYL</label>
              <input type="text" placeholder="예: -0.75" value={searchParams.cyl} onChange={e => setSearchParams(p => ({ ...p, cyl: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>가맹점 (상호/전화번호)</label>
              <input type="text" placeholder="상호 또는 전화번호" value={searchParams.store} onChange={e => setSearchParams(p => ({ ...p, store: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button onClick={handleSearch} disabled={loading}
                style={{ flex: 1, padding: '8px 16px', background: '#5d7a5d', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? '검색중...' : '검색'}
              </button>
              <button onClick={resetSearch}
                style={{ padding: '8px 12px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 결과 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {!searched ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>
              검색 조건을 입력하고 검색 버튼을 클릭하세요
            </div>
          ) : loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>검색 중...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>검색 결과가 없습니다</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#666' }}>출고일</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#666' }}>가맹점</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#666' }}>브랜드</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#666' }}>상품명</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#666' }}>SPH</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#666' }}>CYL</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#666' }}>수량</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#666' }}>금액</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 12px', color: '#666' }}>
                      {new Date(r.shippedAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.storeName}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 6px', background: '#eef4ee', borderRadius: 3, fontSize: 12, color: '#5d7a5d' }}>{r.brandName}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{r.productName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace' }}>{r.sph || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace' }}>{r.cyl || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{r.quantity}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>{r.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        {searched && results.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: 13, color: '#666' }}>
            총 {results.length}건 · 합계 {results.reduce((s, r) => s + r.totalPrice, 0).toLocaleString()}원
          </div>
        )}
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [transLoading, setTransLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [showSettings, setShowSettings] = useState(false)
  const [visibleFields, setVisibleFields] = useState<string[]>(DEFAULT_VISIBLE_FIELDS)
  const [showShipmentSearch, setShowShipmentSearch] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 엑셀 내보내기
  const handleExportExcel = () => {
    if (!selectedStore || filteredTransactions.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }
    
    const exportData = filteredTransactions.map(t => ({
      date: new Date(t.processedAt).toLocaleDateString('ko-KR'),
      orderNo: t.orderNo || '',
      type: TYPE_LABELS[t.type]?.label || t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      memo: t.memo || '',
      items: t.items?.map(i => `${i.brand} ${i.product} ${i.sph||''} ${i.cyl||''} x${i.qty}`).join(' / ') || ''
    }))
    
    const columns = [
      { key: 'date', label: '일자' },
      { key: 'orderNo', label: '주문번호' },
      { key: 'type', label: '유형' },
      { key: 'amount', label: '금액' },
      { key: 'balanceAfter', label: '잔액' },
      { key: 'items', label: '품목' },
      { key: 'memo', label: '메모' },
    ]
    
    exportToCSV(exportData, columns, `거래내역_${selectedStore.name}`)
  }

  // 품목 삭제
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('이 품목을 삭제하시겠습니까?')) return
    
    try {
      const res = await fetch(`/api/orders/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      
      // 거래내역 새로고침
      if (selectedStore) {
        const transRes = await fetch(`/api/transactions?storeId=${selectedStore.id}&limit=100`)
        const transData = await transRes.json()
        setTransactions(transData.transactions || [])
        
        // 선택된 거래내역도 업데이트
        if (selectedTransaction) {
          const updated = (transData.transactions || []).find((t: Transaction) => t.id === selectedTransaction.id)
          setSelectedTransaction(updated || null)
        }
      }
    } catch (error) {
      alert('삭제 실패')
    }
  }

  // 거래내역 삭제
  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('정말로 이 거래내역을 삭제하시겠습니까?\n삭제 시 잔액이 조정됩니다.')) return
    
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || '삭제 실패')
      
      // 거래내역 목록 새로고침
      if (selectedStore) {
        const transRes = await fetch(`/api/transactions?storeId=${selectedStore.id}&limit=100`)
        const transData = await transRes.json()
        setTransactions(transData.transactions || [])
        
        // 가맹점 정보도 새로고침 (잔액 업데이트)
        const storeRes = await fetch(`/api/stores/${selectedStore.id}`)
        const storeData = await storeRes.json()
        if (storeData) {
          setSelectedStore(prev => prev ? { ...prev, balance: storeData.outstandingAmount || 0 } : null)
          setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, balance: storeData.outstandingAmount || 0 } : s))
        }
      }
      
      setSelectedTransaction(null)
      alert('삭제되었습니다.')
    } catch (error: any) {
      alert(error.message || '삭제 실패')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
    const saved = localStorage.getItem('transactionPageFields')
    if (saved) { try { setVisibleFields(JSON.parse(saved)) } catch {} }
  }, [])

  useEffect(() => {
    localStorage.setItem('transactionPageFields', JSON.stringify(visibleFields))
  }, [visibleFields])

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores?limit=1000')
      const data = await res.json()
      const storeList = (data.stores || []).map((s: any) => ({
        id: s.id, code: s.code || '', name: s.name, region: s.region || '',
        ownerName: s.ownerName || '', phone: s.phone || '', address: s.address || '',
        balance: s.outstandingAmount || s.balance || 0,
        salesStaffName: s.salesStaff?.name || s.salesStaffName || '',
        deliveryStaffName: s.deliveryStaff?.name || s.deliveryStaffName || '',
        groupName: s.group?.name || s.groupName || '',
        email: s.email || '', businessRegNo: s.businessRegNo || '',
        businessType: s.businessType || '', businessCategory: s.businessCategory || '',
        deliveryContact: s.deliveryContact || '', deliveryPhone: s.deliveryPhone || '',
        deliveryAddress: s.deliveryAddress || '', deliveryMemo: s.deliveryMemo || '',
        creditLimit: s.creditLimit || 0, paymentTermDays: s.paymentTermDays || 30,
        billingDay: s.billingDay || null, lastPaymentAt: s.lastPaymentAt || null,
        discountRate: s.discountRate || 0, status: s.status || 'active', memo: s.memo || '',
      }))
      setStores(storeList)
      setFilteredStores(storeList)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredStores(stores); setHighlightIndex(-1); return }
    const q = searchQuery.toLowerCase().replace(/-/g, '')
    const filtered = stores.filter(s => {
      const phoneClean = (s.phone || '').replace(/-/g, '').toLowerCase()
      return s.name.toLowerCase().includes(q) || phoneClean.includes(q)
    })
    setFilteredStores(filtered)
    setHighlightIndex(filtered.length > 0 ? 0 : -1)
  }, [searchQuery, stores])

  const handleSelectStore = useCallback(async (store: Store) => {
    setSelectedStore(store)
    setSelectedTransaction(null)
    setTransLoading(true)
    try {
      const res = await fetch(`/api/transactions?storeId=${store.id}&limit=100`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (e) {
      console.error(e)
      setTransactions([])
    } finally { setTransLoading(false) }
  }, [])

  const sortedStores = [...filteredStores].sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (sortedStores.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(prev => Math.min(prev + 1, sortedStores.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(prev => Math.max(prev - 1, 0)) }
    else if (e.key === 'Enter' && highlightIndex >= 0) { e.preventDefault(); handleSelectStore(sortedStores[highlightIndex]) }
  }, [highlightIndex, handleSelectStore, sortedStores])

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-store-item]')
      if (items[highlightIndex]) items[highlightIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  const filteredTransactions = transactions.filter(t => typeFilter === 'all' || t.type === typeFilter)
  const toggleField = (key: string) => setVisibleFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key])
  const isVisible = (key: string) => visibleFields.includes(key)

  const getItemSummary = (t: Transaction) => {
    if (!t.items || t.items.length === 0) {
      if (t.type === 'deposit') return '-'
      return t.memo || '-'
    }
    const first = t.items[0]
    if (t.items.length === 1) return `${first.brand} ${first.product}`
    return `${first.brand} ${first.product} 외 ${t.items.length - 1}건`
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>가맹점 거래내역</h2>
        <button onClick={() => setShowShipmentSearch(true)}
          style={{ padding: '8px 16px', background: '#5d7a5d', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔍 전체 출고 검색
        </button>
      </div>

      {/* 전체 출고 검색 모달 */}
      <ShipmentSearchModal isOpen={showShipmentSearch} onClose={() => setShowShipmentSearch(false)} />

      {/* 3컬럼 레이아웃: 좁게:1:1 */}
      <div style={{ display: 'flex', gap: '10px', height: 'calc(100vh - 130px)', minHeight: '500px' }}>
        
        {/* 좌측: 검색/목록 + 거래처 정보 */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* 검색/목록 */}
          <div style={{ 
            height: '240px', flexShrink: 0,
            background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #e9ecef' }}>
              <input
                ref={searchInputRef} type="text" placeholder="상호/전화번호..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div ref={listRef} style={{ flex: 1, overflow: 'auto' }}>
              {loading ? <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>로딩...</div>
              : sortedStores.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>없음</div>
              : sortedStores.map((store, idx) => (
                <div key={store.id} data-store-item onClick={() => handleSelectStore(store)}
                  style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '14px',
                    background: selectedStore?.id === store.id ? '#e3f2fd' : highlightIndex === idx ? '#fff3cd' : 'transparent',
                    borderBottom: '1px solid #f5f5f5', fontWeight: selectedStore?.id === store.id ? 600 : 400 }}
                  onMouseEnter={e => { if (selectedStore?.id !== store.id && highlightIndex !== idx) e.currentTarget.style.background = '#f8f9fa' }}
                  onMouseLeave={e => { if (selectedStore?.id !== store.id && highlightIndex !== idx) e.currentTarget.style.background = 'transparent' }}
                >{store.name}</div>
              ))}
            </div>
            <div style={{ padding: '6px 10px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '12px', color: '#888', textAlign: 'center' }}>
              {filteredStores.length}개
            </div>
          </div>

          {/* 거래처 정보 */}
          <div style={{ flex: 1, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '14px', overflow: 'auto', position: 'relative' }}>
            <button onClick={() => setShowSettings(!showSettings)}
              style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px',
                background: showSettings ? '#007aff' : '#f5f5f7', color: showSettings ? '#fff' : '#666',
                border: 'none', borderRadius: '4px', cursor: 'pointer' }}>⚙️</button>

            {showSettings && (
              <div style={{ position: 'absolute', top: '32px', right: '8px', background: '#fff', border: '1px solid #e9ecef',
                borderRadius: '8px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, width: '160px' }}>
                {DISPLAY_FIELDS.map(field => (
                  <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}>
                    <input type="checkbox" checked={isVisible(field.key)} onChange={() => toggleField(field.key)} style={{ margin: 0, width: 14, height: 14 }} />
                    {field.label}
                  </label>
                ))}
              </div>
            )}

            {!selectedStore ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '14px' }}>
                거래처 선택
              </div>
            ) : (
              <div style={{ fontSize: '13px' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 6px' }}>{selectedStore.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: selectedStore.status !== 'active' ? '#d32f2f' : '#86868b' }}>
                      {selectedStore.status === 'suspended' ? '⚠️거래정지' : selectedStore.status === 'caution' ? '⚠️주의' : ''}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#86868b' }}>미결제</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: selectedStore.balance > 0 ? '#d32f2f' : '#2e7d32' }}>
                        {selectedStore.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {isVisible('ownerName') && <div><span style={{ color: '#999' }}>대표:</span> {selectedStore.ownerName || '-'}</div>}
                  {isVisible('phone') && <div><span style={{ color: '#999' }}>연락처:</span> {selectedStore.phone || '-'}</div>}
                  {isVisible('email') && <div><span style={{ color: '#999' }}>이메일:</span> {selectedStore.email || '-'}</div>}
                  {isVisible('salesStaffName') && <div><span style={{ color: '#999' }}>👔영업:</span> <span style={{ color: '#1565c0' }}>{selectedStore.salesStaffName || '-'}</span></div>}
                  {isVisible('deliveryStaffName') && <div><span style={{ color: '#999' }}>🚚배송:</span> <span style={{ color: '#2e7d32' }}>{selectedStore.deliveryStaffName || '-'}</span></div>}
                  {isVisible('groupName') && <div><span style={{ color: '#999' }}>그룹:</span> {selectedStore.groupName || '-'}</div>}
                  {isVisible('discountRate') && <div><span style={{ color: '#999' }}>할인:</span> <span style={{ color: '#e65100' }}>{selectedStore.discountRate}%</span></div>}
                  {isVisible('creditLimit') && selectedStore.creditLimit > 0 && <div><span style={{ color: '#999' }}>한도:</span> {selectedStore.creditLimit.toLocaleString()}</div>}
                  {isVisible('address') && selectedStore.address && <div style={{ marginTop: '6px' }}><span style={{ color: '#999' }}>📍</span> {selectedStore.address}</div>}
                  {isVisible('memo') && selectedStore.memo && <div style={{ marginTop: '6px', padding: '6px 8px', background: '#fff9e6', borderRadius: '4px', color: '#856404' }}>📝 {selectedStore.memo}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 거래내역 목록 */}
        <div style={{ flex: 1.2, minWidth: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>📋 거래내역</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[{ value: 'all', label: '전체' }, { value: 'sale', label: '매출' }, { value: 'deposit', label: '입금' }, { value: 'return', label: '반품' }, { value: 'adjustment', label: '할인' }].map(f => (
                  <button key={f.value} onClick={() => setTypeFilter(f.value)} style={{
                    padding: '4px 10px', borderRadius: '4px', border: 'none', fontSize: '12px', cursor: 'pointer',
                    background: typeFilter === f.value ? '#007aff' : '#f5f5f7', color: typeFilter === f.value ? '#fff' : '#666'
                  }}>{f.label}</button>
                ))}
              </div>
              {selectedStore && filteredTransactions.length > 0 && (
                <button onClick={handleExportExcel} style={{
                  padding: '4px 10px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '12px',
                  cursor: 'pointer', background: '#fff', color: '#10b981'
                }}>📥 엑셀</button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!selectedStore ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>거래처 선택</div>
            ) : transLoading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>로딩...</div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>내역 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, color: '#666', width: '90px' }}>일시</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, color: '#666' }}>품목</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#666', width: '50px' }}>유형</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#666', width: '80px' }}>금액</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#666', width: '80px' }}>잔액</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#666', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => {
                    const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.adjustment
                    const dt = new Date(t.processedAt)
                    return (
                      <tr key={t.id} onClick={() => setSelectedTransaction(t)}
                        style={{ cursor: 'pointer', background: selectedTransaction?.id === t.id ? '#e3f2fd' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={e => { if (selectedTransaction?.id !== t.id) e.currentTarget.style.background = '#f8f9fa' }}
                        onMouseLeave={e => { if (selectedTransaction?.id !== t.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '8px 6px', color: '#666', fontSize: '12px' }}>
                          {dt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                          <span style={{ color: '#999', marginLeft: '4px' }}>{dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td style={{ padding: '8px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                          {getItemSummary(t)}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '11px', color: typeInfo.color, background: typeInfo.bg }}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: t.type === 'deposit' ? '#2e7d32' : t.type === 'return' ? '#e65100' : '#1d1d1f' }}>
                          {t.type === 'deposit' ? '+' : ''}{t.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#666', fontSize: '12px' }}>{t.balanceAfter.toLocaleString()}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(t.id) }}
                            disabled={deleteLoading}
                            style={{ padding: '2px 6px', fontSize: '11px', background: 'transparent', color: '#999', border: 'none', cursor: 'pointer', borderRadius: '3px' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                            onMouseLeave={e => e.currentTarget.style.color = '#999'}
                          >🗑️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedStore && filteredTransactions.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '12px', color: '#666' }}>
              {filteredTransactions.length}건 · 
              매출 {filteredTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0).toLocaleString()} · 
              입금 {filteredTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          )}
        </div>

        {/* 우측: 세부내역 */}
        <div style={{ flex: 0.9, minWidth: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '14px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>📄 세부내역</span>
            {selectedTransaction && (
              <button
                onClick={() => handleDeleteTransaction(selectedTransaction.id)}
                disabled={deleteLoading}
                style={{
                  padding: '4px 10px', fontSize: '12px', background: '#fff', color: '#d32f2f',
                  border: '1px solid #d32f2f', borderRadius: '4px', cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.6 : 1
                }}
              >
                {deleteLoading ? '삭제중...' : '🗑️ 삭제'}
              </button>
            )}
          </div>
          
          {!selectedTransaction ? (
            <div style={{ padding: '50px 10px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>거래내역 선택</div>
          ) : (
            <div style={{ fontSize: '13px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 600,
                  color: TYPE_LABELS[selectedTransaction.type]?.color, background: TYPE_LABELS[selectedTransaction.type]?.bg }}>
                  {TYPE_LABELS[selectedTransaction.type]?.label}
                </span>
                <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '8px',
                  color: selectedTransaction.type === 'deposit' ? '#2e7d32' : selectedTransaction.type === 'return' ? '#e65100' : '#1d1d1f' }}>
                  {selectedTransaction.type === 'deposit' ? '+' : ''}{selectedTransaction.amount.toLocaleString()}원
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '6px' }}>
                  {new Date(selectedTransaction.processedAt).toLocaleString('ko-KR')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {selectedTransaction.orderNo && (
                  <div><span style={{ color: '#86868b' }}>주문번호:</span> <span style={{ color: '#1565c0', fontWeight: 500 }}>{selectedTransaction.orderNo}</span></div>
                )}
                <div><span style={{ color: '#86868b' }}>거래후 잔액:</span> <span style={{ fontWeight: 500 }}>{selectedTransaction.balanceAfter.toLocaleString()}원</span></div>
                {selectedTransaction.paymentMethod && (
                  <div><span style={{ color: '#86868b' }}>결제방법:</span> {selectedTransaction.paymentMethod}</div>
                )}
                {selectedTransaction.memo && (
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>📝 {selectedTransaction.memo}</div>
                )}
              </div>

              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>📦 품목 ({selectedTransaction.items.length}건)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedTransaction.items.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', background: '#f8f9fa', borderRadius: '4px', fontSize: '12px'
                      }}>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#5d7a5d' }}>{item.brand}</span>
                          <span style={{ color: '#666', margin: '0 4px' }}>{item.product}</span>
                          {item.sph && <span style={{ color: '#999' }}>{item.sph}</span>}
                          {item.cyl && <span style={{ color: '#999' }}>/{item.cyl}</span>}
                          <span style={{ color: '#999', marginLeft: '4px' }}>×{item.qty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontWeight: 600, color: '#1565c0' }}>{item.price.toLocaleString()}</span>
                          {item.id && (
                            <button
                              onClick={() => handleDeleteItem(item.id!)}
                              style={{ padding: '2px 4px', fontSize: '10px', background: 'transparent', color: '#ccc', border: 'none', cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                              onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                            >✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
