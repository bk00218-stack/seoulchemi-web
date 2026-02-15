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
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#1565c0', bg: '#e3f2fd' },
  deposit: { label: '입금', color: '#2e7d32', bg: '#e8f5e9' },
  return: { label: '반품', color: '#e65100', bg: '#fff3e0' },
  adjustment: { label: '조정', color: '#666', bg: '#f5f5f5' },
}

// 표시 가능한 필드 목록
const DISPLAY_FIELDS = [
  { key: 'ownerName', label: '대표자' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'businessRegNo', label: '사업자번호' },
  { key: 'businessType', label: '업태' },
  { key: 'businessCategory', label: '업종' },
  { key: 'salesStaffName', label: '영업담당' },
  { key: 'deliveryStaffName', label: '배송담당' },
  { key: 'groupName', label: '그룹' },
  { key: 'discountRate', label: '할인율' },
  { key: 'paymentTermDays', label: '결제기한' },
  { key: 'billingDay', label: '청구일' },
  { key: 'creditLimit', label: '신용한도' },
  { key: 'address', label: '주소' },
  { key: 'delivery', label: '배송정보' },
  { key: 'lastPaymentAt', label: '최근입금' },
  { key: 'memo', label: '메모' },
] as const

const DEFAULT_VISIBLE_FIELDS = ['ownerName', 'phone', 'salesStaffName', 'deliveryStaffName', 'groupName', 'discountRate', 'address']

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, storeId: 0, type: 'sale', amount: 1250000, balanceAfter: 5504502, orderNo: 'ORD-2025-0215-001', paymentMethod: null, memo: '다초점렌즈 외 5건', processedAt: '2025-02-15T10:30:00' },
  { id: 2, storeId: 0, type: 'deposit', amount: 500000, balanceAfter: 5004502, orderNo: null, paymentMethod: '계좌이체', memo: '2월 중간정산', processedAt: '2025-02-10T14:20:00' },
  { id: 3, storeId: 0, type: 'sale', amount: 890000, balanceAfter: 5504502, orderNo: 'ORD-2025-0208-003', paymentMethod: null, memo: '누진렌즈 2건', processedAt: '2025-02-08T11:45:00' },
  { id: 4, storeId: 0, type: 'return', amount: 150000, balanceAfter: 4614502, orderNo: 'ORD-2025-0205-002', paymentMethod: null, memo: '불량 교환', processedAt: '2025-02-05T16:00:00' },
  { id: 5, storeId: 0, type: 'deposit', amount: 1000000, balanceAfter: 4764502, orderNo: null, paymentMethod: '현금', memo: '1월 말 정산', processedAt: '2025-01-31T17:30:00' },
  { id: 6, storeId: 0, type: 'sale', amount: 2340000, balanceAfter: 5764502, orderNo: 'ORD-2025-0128-005', paymentMethod: null, memo: '단초점 10건, 다초점 3건', processedAt: '2025-01-28T09:15:00' },
  { id: 7, storeId: 0, type: 'sale', amount: 670000, balanceAfter: 3424502, orderNo: 'ORD-2025-0120-001', paymentMethod: null, memo: '코팅렌즈', processedAt: '2025-01-20T13:40:00' },
  { id: 8, storeId: 0, type: 'deposit', amount: 2000000, balanceAfter: 2754502, orderNo: null, paymentMethod: '계좌이체', memo: '12월 정산', processedAt: '2025-01-15T10:00:00' },
]

export default function TransactionsPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
    // localStorage에서 설정 불러오기
    const saved = localStorage.getItem('transactionPageFields')
    if (saved) {
      try {
        setVisibleFields(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // 설정 저장
  useEffect(() => {
    localStorage.setItem('transactionPageFields', JSON.stringify(visibleFields))
  }, [visibleFields])

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores?limit=1000')
      const data = await res.json()
      const storeList = (data.stores || []).map((s: any) => ({
        id: s.id,
        code: s.code || '',
        name: s.name,
        region: s.region || '',
        ownerName: s.ownerName || '',
        phone: s.phone || '',
        address: s.address || '',
        balance: s.outstandingAmount || s.balance || 0,
        salesStaffName: s.salesStaff?.name || s.salesStaffName || '',
        deliveryStaffName: s.deliveryStaff?.name || s.deliveryStaffName || '',
        groupName: s.group?.name || s.groupName || '',
        email: s.email || '',
        businessRegNo: s.businessRegNo || '',
        businessType: s.businessType || '',
        businessCategory: s.businessCategory || '',
        deliveryContact: s.deliveryContact || '',
        deliveryPhone: s.deliveryPhone || '',
        deliveryAddress: s.deliveryAddress || '',
        deliveryMemo: s.deliveryMemo || '',
        creditLimit: s.creditLimit || 0,
        paymentTermDays: s.paymentTermDays || 30,
        billingDay: s.billingDay || null,
        lastPaymentAt: s.lastPaymentAt || null,
        discountRate: s.discountRate || 0,
        status: s.status || 'active',
        memo: s.memo || '',
      }))
      setStores(storeList)
      setFilteredStores(storeList)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStores(stores)
      setHighlightIndex(-1)
      return
    }
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
    setTransLoading(true)
    try {
      const res = await fetch(`/api/transactions?storeId=${store.id}&limit=100`)
      const data = await res.json()
      const realTransactions = data.transactions || []
      if (realTransactions.length === 0) {
        setTransactions(MOCK_TRANSACTIONS.map(t => ({ ...t, storeId: store.id })))
      } else {
        setTransactions(realTransactions)
      }
    } catch (e) {
      console.error(e)
      setTransactions(MOCK_TRANSACTIONS.map(t => ({ ...t, storeId: store.id })))
    } finally {
      setTransLoading(false)
    }
  }, [])

  const sortedStores = [...filteredStores].sort((a, b) => {
    return a.region.localeCompare(b.region) || a.name.localeCompare(b.name)
  })

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (sortedStores.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => Math.min(prev + 1, sortedStores.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelectStore(sortedStores[highlightIndex])
    }
  }, [highlightIndex, handleSelectStore, sortedStores])

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-store-item]')
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightIndex])

  const filteredTransactions = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  const toggleField = (key: string) => {
    setVisibleFields(prev => 
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const isVisible = (key: string) => visibleFields.includes(key)

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>가맹점 거래내역</h2>
      </div>

      {/* 메인 레이아웃 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: 'calc(100vh - 160px)', minHeight: '500px' }}>
        
        {/* 상단: 거래처 검색/목록 + 거래처 정보 */}
        <div style={{ display: 'flex', gap: '12px', height: '260px', flexShrink: 0 }}>
          
          {/* 거래처 검색/목록 */}
          <div style={{ 
            width: '260px', 
            flexShrink: 0,
            background: '#fff', 
            borderRadius: '10px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #e9ecef' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="상호/전화번호 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ 
                  width: '100%', 
                  padding: '7px 10px', 
                  borderRadius: '6px', 
                  border: '1px solid #e9ecef', 
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div ref={listRef} style={{ flex: 1, overflow: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>로딩...</div>
              ) : sortedStores.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>없음</div>
              ) : (
                sortedStores.map((store, idx) => (
                  <div 
                    key={store.id}
                    data-store-item
                    onClick={() => handleSelectStore(store)}
                    style={{ 
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: selectedStore?.id === store.id 
                        ? '#e3f2fd' 
                        : highlightIndex === idx 
                          ? '#fff3cd' 
                          : 'transparent',
                      borderBottom: '1px solid #f5f5f5',
                      fontSize: '13px',
                      fontWeight: selectedStore?.id === store.id ? 600 : 400
                    }}
                    onMouseEnter={e => {
                      if (selectedStore?.id !== store.id && highlightIndex !== idx) {
                        e.currentTarget.style.background = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedStore?.id !== store.id && highlightIndex !== idx) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {store.name}
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '6px 10px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '11px', color: '#888', textAlign: 'center' }}>
              {filteredStores.length}개 · ↑↓ Enter
            </div>
          </div>

          {/* 거래처 정보 */}
          <div style={{ 
            flex: 1,
            background: '#fff', 
            borderRadius: '10px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '12px 16px',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* 설정 버튼 */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                fontSize: '11px',
                background: showSettings ? '#007aff' : '#f5f5f7',
                color: showSettings ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⚙️ 표시항목
            </button>

            {/* 설정 패널 */}
            {showSettings && (
              <div style={{
                position: 'absolute',
                top: '36px',
                right: '10px',
                background: '#fff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                width: '200px'
              }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>표시할 항목 선택</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {DISPLAY_FIELDS.map(field => (
                    <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isVisible(field.key)}
                        onChange={() => toggleField(field.key)}
                        style={{ margin: 0 }}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!selectedStore ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>
                거래처를 선택해주세요
              </div>
            ) : (
              <div style={{ fontSize: '12px' }}>
                {/* 상호 + 미결제액 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{selectedStore.name}</h3>
                    <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>
                      {selectedStore.status === 'suspended' && <span style={{ color: '#d32f2f' }}>⚠️ 거래정지</span>}
                      {selectedStore.status === 'caution' && <span style={{ color: '#e65100' }}>⚠️ 주의</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#86868b' }}>미결제액</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 700, 
                      color: selectedStore.balance > 0 ? '#d32f2f' : '#2e7d32',
                      lineHeight: 1.2
                    }}>
                      {selectedStore.balance.toLocaleString()}원
                    </div>
                    {isVisible('creditLimit') && selectedStore.creditLimit > 0 && (
                      <div style={{ fontSize: '10px', color: '#86868b' }}>한도: {selectedStore.creditLimit.toLocaleString()}원</div>
                    )}
                  </div>
                </div>
                
                {/* 동적 정보 그리드 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {isVisible('ownerName') && <div><span style={{ color: '#999' }}>대표자:</span> <strong>{selectedStore.ownerName || '-'}</strong></div>}
                  {isVisible('phone') && <div><span style={{ color: '#999' }}>연락처:</span> <strong>{selectedStore.phone || '-'}</strong></div>}
                  {isVisible('email') && <div><span style={{ color: '#999' }}>이메일:</span> {selectedStore.email || '-'}</div>}
                  {isVisible('businessRegNo') && <div><span style={{ color: '#999' }}>사업자번호:</span> {selectedStore.businessRegNo || '-'}</div>}
                  {isVisible('businessType') && <div><span style={{ color: '#999' }}>업태:</span> {selectedStore.businessType || '-'}</div>}
                  {isVisible('businessCategory') && <div><span style={{ color: '#999' }}>업종:</span> {selectedStore.businessCategory || '-'}</div>}
                  {isVisible('salesStaffName') && <div><span style={{ color: '#999' }}>👔영업:</span> <strong style={{ color: '#1565c0' }}>{selectedStore.salesStaffName || '-'}</strong></div>}
                  {isVisible('deliveryStaffName') && <div><span style={{ color: '#999' }}>🚚배송:</span> <strong style={{ color: '#2e7d32' }}>{selectedStore.deliveryStaffName || '-'}</strong></div>}
                  {isVisible('groupName') && <div><span style={{ color: '#999' }}>그룹:</span> <strong>{selectedStore.groupName || '-'}</strong></div>}
                  {isVisible('discountRate') && <div><span style={{ color: '#999' }}>할인율:</span> <strong style={{ color: '#e65100' }}>{selectedStore.discountRate}%</strong></div>}
                  {isVisible('paymentTermDays') && <div><span style={{ color: '#999' }}>결제기한:</span> {selectedStore.paymentTermDays}일</div>}
                  {isVisible('billingDay') && <div><span style={{ color: '#999' }}>청구일:</span> {selectedStore.billingDay ? `매월 ${selectedStore.billingDay}일` : '-'}</div>}
                  {isVisible('address') && selectedStore.address && (
                    <div style={{ width: '100%' }}><span style={{ color: '#999' }}>📍주소:</span> {selectedStore.address}</div>
                  )}
                  {isVisible('delivery') && (selectedStore.deliveryContact || selectedStore.deliveryAddress) && (
                    <div style={{ width: '100%' }}>
                      <span style={{ color: '#999' }}>📦배송:</span> {selectedStore.deliveryContact || ''} {selectedStore.deliveryPhone || ''} / {selectedStore.deliveryAddress || '-'}
                      {selectedStore.deliveryMemo && <span style={{ color: '#e65100' }}> ({selectedStore.deliveryMemo})</span>}
                    </div>
                  )}
                  {isVisible('lastPaymentAt') && selectedStore.lastPaymentAt && (
                    <div><span style={{ color: '#999' }}>최근입금:</span> {new Date(selectedStore.lastPaymentAt).toLocaleDateString('ko-KR')}</div>
                  )}
                  {isVisible('memo') && selectedStore.memo && (
                    <div style={{ width: '100%', padding: '4px 8px', background: '#fff9e6', borderRadius: '4px', color: '#856404' }}>
                      📝 {selectedStore.memo}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단: 거래내역 */}
        <div style={{ 
          flex: 1,
          background: '#fff', 
          borderRadius: '10px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: '250px'
        }}>
          <div style={{ 
            padding: '10px 14px', 
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>📋 거래내역</span>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              {[
                { value: 'all', label: '전체' },
                { value: 'sale', label: '매출' },
                { value: 'deposit', label: '입금' },
                { value: 'return', label: '반품' },
              ].map(f => (
                <button 
                  key={f.value} 
                  onClick={() => setTypeFilter(f.value)} 
                  style={{
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    background: typeFilter === f.value ? '#007aff' : '#f5f5f7', 
                    color: typeFilter === f.value ? '#fff' : '#666'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!selectedStore ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b' }}>
                거래처를 선택하면 거래내역이 표시됩니다
              </div>
            ) : transLoading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#86868b' }}>거래내역이 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>일자</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#666', width: '70px' }}>유형</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666' }}>거래금액</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666' }}>잔액</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>주문번호</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>결제방법</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => {
                    const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.adjustment
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                          {new Date(t.processedAt).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '3px 10px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 500, 
                            color: typeInfo.color, 
                            background: typeInfo.bg 
                          }}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '10px 14px', 
                          textAlign: 'right', 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          color: t.type === 'deposit' ? '#2e7d32' : t.type === 'return' ? '#e65100' : '#1d1d1f' 
                        }}>
                          {t.type === 'deposit' ? '+' : ''}{t.amount.toLocaleString()}원
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                          {t.balanceAfter.toLocaleString()}원
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#666' }}>{t.orderNo || '-'}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#666' }}>{t.paymentMethod || '-'}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#86868b' }}>{t.memo || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {selectedStore && filteredTransactions.length > 0 && (
            <div style={{ 
              padding: '10px 14px', 
              borderTop: '1px solid #e9ecef', 
              background: '#f8f9fa',
              display: 'flex',
              gap: '24px',
              fontSize: '12px'
            }}>
              <span style={{ color: '#666' }}>
                전체 <strong>{filteredTransactions.length}</strong>건
              </span>
              <span style={{ color: '#1565c0' }}>
                매출 <strong>{filteredTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</strong>원
              </span>
              <span style={{ color: '#2e7d32' }}>
                입금 <strong>{filteredTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</strong>원
              </span>
              <span style={{ color: '#e65100' }}>
                반품 <strong>{filteredTransactions.filter(t => t.type === 'return').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</strong>원
              </span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
