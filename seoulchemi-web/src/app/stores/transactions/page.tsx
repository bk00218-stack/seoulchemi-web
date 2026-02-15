'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

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

const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 1, storeId: 0, type: 'sale', amount: 1250000, balanceAfter: 5504502, 
    orderNo: '025', paymentMethod: null, memo: null, processedAt: '2025-02-15T10:30:00',
    items: [
      { brand: '에실로', product: '바리락스 XR', qty: 2, sph: '-3.00', cyl: '-0.75', axis: '180', add: '+2.00', price: 450000 },
      { brand: '호야', product: '누진 라이프스타일3', qty: 2, sph: '-2.50', cyl: '-0.50', axis: '90', add: '+1.75', price: 380000 },
      { brand: '케미', product: '단초점 1.60', qty: 4, sph: '-1.00', price: 120000 },
      { brand: '케미', product: '단초점 1.67', qty: 2, sph: '-4.50', cyl: '-1.25', axis: '170', price: 180000 },
      { brand: '니콘', product: '씨맥스 코팅', qty: 2, price: 120000 },
    ]
  },
  { 
    id: 2, storeId: 0, type: 'deposit', amount: 500000, balanceAfter: 5004502, 
    orderNo: null, paymentMethod: '계좌이체', memo: '2월 중간정산', processedAt: '2025-02-10T14:20:00'
  },
  { 
    id: 3, storeId: 0, type: 'sale', amount: 890000, balanceAfter: 5504502, 
    orderNo: '018', paymentMethod: null, memo: null, processedAt: '2025-02-08T11:45:00',
    items: [
      { brand: '에실로', product: '바리락스 피지오', qty: 2, sph: '-2.00', add: '+2.25', price: 520000 },
      { brand: '호야', product: '블루컷 코팅', qty: 2, sph: '-1.50', cyl: '-0.25', axis: '180', price: 370000 },
    ]
  },
  { 
    id: 4, storeId: 0, type: 'return', amount: 150000, balanceAfter: 4614502, 
    orderNo: '012', paymentMethod: null, memo: '불량 교환', processedAt: '2025-02-05T16:00:00',
    items: [
      { brand: '케미', product: '단초점 1.60', qty: 2, sph: '-2.00', price: 150000 },
    ]
  },
  { 
    id: 5, storeId: 0, type: 'deposit', amount: 1000000, balanceAfter: 4764502, 
    orderNo: null, paymentMethod: '현금', memo: '1월 말 정산', processedAt: '2025-01-31T17:30:00'
  },
  { 
    id: 6, storeId: 0, type: 'sale', amount: 2340000, balanceAfter: 5764502, 
    orderNo: '156', paymentMethod: null, memo: null, processedAt: '2025-01-28T09:15:00',
    items: [
      { brand: '호야', product: '누진 아이디', qty: 4, sph: '-3.50', add: '+2.00', price: 980000 },
      { brand: '에실로', product: '아이젠 360', qty: 2, sph: '-1.75', cyl: '-0.50', axis: '90', price: 420000 },
      { brand: '케미', product: '단초점 1.56', qty: 6, sph: '-0.75', price: 240000 },
      { brand: '케미', product: '포토크로믹', qty: 4, sph: '-2.25', price: 380000 },
      { brand: '니콘', product: '롱라이프 코팅', qty: 4, price: 320000 },
    ]
  },
  { 
    id: 7, storeId: 0, type: 'sale', amount: 670000, balanceAfter: 3424502, 
    orderNo: '142', paymentMethod: null, memo: null, processedAt: '2025-01-20T13:40:00',
    items: [
      { brand: '케미', product: 'UV코팅 1.60', qty: 4, sph: '-1.25', price: 280000 },
      { brand: '호야', product: '블루컷', qty: 2, sph: '-0.50', price: 220000 },
      { brand: '니콘', product: '하드코팅', qty: 2, price: 170000 },
    ]
  },
  { 
    id: 8, storeId: 0, type: 'deposit', amount: 2000000, balanceAfter: 2754502, 
    orderNo: null, paymentMethod: '계좌이체', memo: '12월 정산', processedAt: '2025-01-15T10:00:00'
  },
]

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
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
      const realTransactions = data.transactions || []
      setTransactions(realTransactions.length === 0 ? MOCK_TRANSACTIONS.map(t => ({ ...t, storeId: store.id })) : realTransactions)
    } catch (e) {
      console.error(e)
      setTransactions(MOCK_TRANSACTIONS.map(t => ({ ...t, storeId: store.id })))
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

  // 품목 요약 텍스트
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
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>가맹점 거래내역</h2>
      </div>

      {/* 3컬럼 레이아웃: 좁게:1:1 */}
      <div style={{ display: 'flex', gap: '10px', height: 'calc(100vh - 130px)', minHeight: '500px' }}>
        
        {/* 좌측: 검색/목록 + 거래처 정보 */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* 검색/목록 */}
          <div style={{ 
            height: '160px', flexShrink: 0,
            background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '8px', borderBottom: '1px solid #e9ecef' }}>
              <input
                ref={searchInputRef} type="text" placeholder="상호/전화번호..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '5px', border: '1px solid #e9ecef', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div ref={listRef} style={{ flex: 1, overflow: 'auto' }}>
              {loading ? <div style={{ padding: '15px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>로딩...</div>
              : sortedStores.length === 0 ? <div style={{ padding: '15px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>없음</div>
              : sortedStores.map((store, idx) => (
                <div key={store.id} data-store-item onClick={() => handleSelectStore(store)}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '12px',
                    background: selectedStore?.id === store.id ? '#e3f2fd' : highlightIndex === idx ? '#fff3cd' : 'transparent',
                    borderBottom: '1px solid #f5f5f5', fontWeight: selectedStore?.id === store.id ? 600 : 400 }}
                  onMouseEnter={e => { if (selectedStore?.id !== store.id && highlightIndex !== idx) e.currentTarget.style.background = '#f8f9fa' }}
                  onMouseLeave={e => { if (selectedStore?.id !== store.id && highlightIndex !== idx) e.currentTarget.style.background = 'transparent' }}
                >{store.name}</div>
              ))}
            </div>
            <div style={{ padding: '4px 8px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '10px', color: '#888', textAlign: 'center' }}>
              {filteredStores.length}개
            </div>
          </div>

          {/* 거래처 정보 */}
          <div style={{ flex: 1, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '10px 12px', overflow: 'auto', position: 'relative' }}>
            <button onClick={() => setShowSettings(!showSettings)}
              style={{ position: 'absolute', top: '6px', right: '6px', padding: '2px 5px', fontSize: '9px',
                background: showSettings ? '#007aff' : '#f5f5f7', color: showSettings ? '#fff' : '#666',
                border: 'none', borderRadius: '3px', cursor: 'pointer' }}>⚙️</button>

            {showSettings && (
              <div style={{ position: 'absolute', top: '24px', right: '6px', background: '#fff', border: '1px solid #e9ecef',
                borderRadius: '6px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, width: '140px' }}>
                {DISPLAY_FIELDS.map(field => (
                  <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', cursor: 'pointer', padding: '2px 0' }}>
                    <input type="checkbox" checked={isVisible(field.key)} onChange={() => toggleField(field.key)} style={{ margin: 0, width: 12, height: 12 }} />
                    {field.label}
                  </label>
                ))}
              </div>
            )}

            {!selectedStore ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '11px' }}>
                거래처 선택
              </div>
            ) : (
              <div style={{ fontSize: '10px' }}>
                <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>{selectedStore.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: selectedStore.status !== 'active' ? '#d32f2f' : '#86868b' }}>
                      {selectedStore.status === 'suspended' ? '⚠️거래정지' : selectedStore.status === 'caution' ? '⚠️주의' : ''}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '8px', color: '#86868b' }}>미결제</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: selectedStore.balance > 0 ? '#d32f2f' : '#2e7d32' }}>
                        {selectedStore.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {isVisible('ownerName') && <div><span style={{ color: '#999' }}>대표:</span> {selectedStore.ownerName || '-'}</div>}
                  {isVisible('phone') && <div><span style={{ color: '#999' }}>연락처:</span> {selectedStore.phone || '-'}</div>}
                  {isVisible('email') && <div><span style={{ color: '#999' }}>이메일:</span> {selectedStore.email || '-'}</div>}
                  {isVisible('salesStaffName') && <div><span style={{ color: '#999' }}>👔영업:</span> <span style={{ color: '#1565c0' }}>{selectedStore.salesStaffName || '-'}</span></div>}
                  {isVisible('deliveryStaffName') && <div><span style={{ color: '#999' }}>🚚배송:</span> <span style={{ color: '#2e7d32' }}>{selectedStore.deliveryStaffName || '-'}</span></div>}
                  {isVisible('groupName') && <div><span style={{ color: '#999' }}>그룹:</span> {selectedStore.groupName || '-'}</div>}
                  {isVisible('discountRate') && <div><span style={{ color: '#999' }}>할인:</span> <span style={{ color: '#e65100' }}>{selectedStore.discountRate}%</span></div>}
                  {isVisible('creditLimit') && selectedStore.creditLimit > 0 && <div><span style={{ color: '#999' }}>한도:</span> {selectedStore.creditLimit.toLocaleString()}</div>}
                  {isVisible('address') && selectedStore.address && <div style={{ marginTop: '4px' }}><span style={{ color: '#999' }}>📍</span> {selectedStore.address}</div>}
                  {isVisible('memo') && selectedStore.memo && <div style={{ marginTop: '4px', padding: '4px', background: '#fff9e6', borderRadius: '3px', color: '#856404' }}>📝 {selectedStore.memo}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 거래내역 목록 (테이블 형태) */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>📋 거래내역</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[{ value: 'all', label: '전체' }, { value: 'sale', label: '매출' }, { value: 'deposit', label: '입금' }, { value: 'return', label: '반품' }].map(f => (
                <button key={f.value} onClick={() => setTypeFilter(f.value)} style={{
                  padding: '2px 6px', borderRadius: '3px', border: 'none', fontSize: '10px', cursor: 'pointer',
                  background: typeFilter === f.value ? '#007aff' : '#f5f5f7', color: typeFilter === f.value ? '#fff' : '#666'
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!selectedStore ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>거래처 선택</div>
            ) : transLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>로딩...</div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>내역 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', width: '60px' }}>일자</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', width: '100px' }}>주문번호</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666' }}>품목</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', width: '90px' }}>금액</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', width: '90px' }}>잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => {
                    const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.adjustment
                    return (
                      <tr key={t.id} onClick={() => setSelectedTransaction(t)}
                        style={{ cursor: 'pointer', background: selectedTransaction?.id === t.id ? '#e3f2fd' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={e => { if (selectedTransaction?.id !== t.id) e.currentTarget.style.background = '#f8f9fa' }}
                        onMouseLeave={e => { if (selectedTransaction?.id !== t.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '8px', color: '#666' }}>
                          {new Date(t.processedAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '1px 4px', borderRadius: '2px', fontSize: '9px', color: typeInfo.color, background: typeInfo.bg, marginRight: '4px' }}>
                            {typeInfo.label}
                          </span>
                          {t.orderNo || '-'}
                        </td>
                        <td style={{ padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                          {getItemSummary(t)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: t.type === 'deposit' ? '#2e7d32' : t.type === 'return' ? '#e65100' : '#1d1d1f' }}>
                          {t.type === 'deposit' ? '+' : ''}{t.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>
                          {t.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedStore && filteredTransactions.length > 0 && (
            <div style={{ padding: '6px 10px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '10px', color: '#666' }}>
              {filteredTransactions.length}건 · 
              매출 {filteredTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0).toLocaleString()} · 
              입금 {filteredTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          )}
        </div>

        {/* 우측: 세부내역 */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '12px', overflow: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>📄 세부내역</div>
          
          {!selectedTransaction ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: '#86868b', fontSize: '11px' }}>
              거래내역 선택
            </div>
          ) : (
            <div style={{ fontSize: '11px' }}>
              {/* 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  color: TYPE_LABELS[selectedTransaction.type]?.color, background: TYPE_LABELS[selectedTransaction.type]?.bg }}>
                  {TYPE_LABELS[selectedTransaction.type]?.label}
                </span>
                <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px',
                  color: selectedTransaction.type === 'deposit' ? '#2e7d32' : selectedTransaction.type === 'return' ? '#e65100' : '#1d1d1f' }}>
                  {selectedTransaction.type === 'deposit' ? '+' : ''}{selectedTransaction.amount.toLocaleString()}원
                </div>
                <div style={{ fontSize: '10px', color: '#86868b', marginTop: '4px' }}>
                  {new Date(selectedTransaction.processedAt).toLocaleString('ko-KR')}
                </div>
              </div>

              {/* 기본 정보 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {selectedTransaction.orderNo && (
                  <div><span style={{ color: '#86868b' }}>주문번호:</span> <span style={{ color: '#1565c0', fontWeight: 500 }}>{selectedTransaction.orderNo}</span></div>
                )}
                <div><span style={{ color: '#86868b' }}>거래후 잔액:</span> <span style={{ fontWeight: 500 }}>{selectedTransaction.balanceAfter.toLocaleString()}원</span></div>
                {selectedTransaction.paymentMethod && (
                  <div><span style={{ color: '#86868b' }}>결제방법:</span> {selectedTransaction.paymentMethod}</div>
                )}
                {selectedTransaction.memo && (
                  <div style={{ padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>📝 {selectedTransaction.memo}</div>
                )}
              </div>

              {/* 품목 상세 */}
              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>📦 품목 상세 ({selectedTransaction.items.length}건)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTransaction.items.map((item, idx) => (
                      <div key={idx} style={{ padding: '8px', background: '#f8f9fa', borderRadius: '6px', borderLeft: '3px solid #007aff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{item.brand}</span>
                          <span style={{ fontWeight: 600, color: '#1565c0' }}>{item.price.toLocaleString()}원</span>
                        </div>
                        <div style={{ color: '#666', marginBottom: '4px' }}>{item.product} × {item.qty}</div>
                        {(item.sph || item.cyl || item.add) && (
                          <div style={{ fontSize: '10px', color: '#86868b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {item.sph && <span>SPH: {item.sph}</span>}
                            {item.cyl && <span>CYL: {item.cyl}</span>}
                            {item.axis && <span>AXIS: {item.axis}</span>}
                            {item.add && <span>ADD: {item.add}</span>}
                          </div>
                        )}
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
