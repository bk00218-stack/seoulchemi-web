'use client'

import { useState, useEffect, useCallback } from 'react'
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
  balance: number  // 미결제액 (미수금)
}

interface Transaction {
  id: number
  storeId: number
  type: string // sale, deposit, return, adjustment
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

export default function TransactionsPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transLoading, setTransLoading] = useState(false)
  
  // 검색/필터
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // 거래처 목록 로드
  useEffect(() => {
    fetchStores()
  }, [])

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
        balance: s.balance || 0,
      }))
      setStores(storeList)
      setFilteredStores(storeList)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // 검색 필터링 (상호 또는 전화번호로 검색)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStores(stores)
      return
    }
    const q = searchQuery.toLowerCase().replace(/-/g, '') // 하이픈 제거하여 전화번호 검색 용이하게
    const filtered = stores.filter(s => {
      const phoneClean = (s.phone || '').replace(/-/g, '').toLowerCase()
      return s.name.toLowerCase().includes(q) || phoneClean.includes(q)
    })
    setFilteredStores(filtered)
  }, [searchQuery, stores])

  // 거래처 선택 시 거래내역 로드
  const handleSelectStore = useCallback(async (store: Store) => {
    setSelectedStore(store)
    setTransLoading(true)
    try {
      const res = await fetch(`/api/transactions?storeId=${store.id}&limit=100`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (e) {
      console.error(e)
      setTransactions([])
    } finally {
      setTransLoading(false)
    }
  }, [])

  // 거래내역 필터
  const filteredTransactions = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  // 거래처 목록 정렬 (지역 → 상호)
  const sortedStores = [...filteredStores].sort((a, b) => {
    return a.region.localeCompare(b.region) || a.name.localeCompare(b.name)
  })

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>가맹점 거래내역</h2>
        <p style={{ fontSize: '13px', color: '#86868b', margin: '4px 0 0' }}>
          거래처를 선택하면 거래내역과 미수금을 조회할 수 있습니다
        </p>
      </div>

      {/* 메인 레이아웃 */}
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
        
        {/* 좌측: 거래처 목록 */}
        <div style={{ 
          width: '320px', 
          flexShrink: 0,
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 검색 영역 */}
          <div style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
            <input
              type="text"
              placeholder="상호 또는 전화번호 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #e9ecef', 
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* 거래처 목록 테이블 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
            ) : sortedStores.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>거래처가 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', width: '70px' }}>지역</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>상호</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStores.map(store => (
                    <tr 
                      key={store.id} 
                      onClick={() => handleSelectStore(store)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedStore?.id === store.id ? '#e3f2fd' : 'transparent',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onMouseEnter={e => {
                        if (selectedStore?.id !== store.id) {
                          e.currentTarget.style.background = '#f5f5f7'
                        }
                      }}
                      onMouseLeave={e => {
                        if (selectedStore?.id !== store.id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666' }}>{store.region || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 500 }}>{store.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* 거래처 수 표시 */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e9ecef', background: '#f8f9fa', fontSize: '12px', color: '#666' }}>
            총 {filteredStores.length}개 거래처
          </div>
        </div>

        {/* 우측: 거래처 정보 + 거래내역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          
          {/* 거래처 상세정보 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '16px 20px'
          }}>
            {!selectedStore ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#86868b' }}>
                좌측에서 거래처를 선택해주세요
              </div>
            ) : (
              <div>
                {/* 상호 + 미결제액 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{selectedStore.name}</h3>
                    <span style={{ fontSize: '12px', color: '#86868b' }}>{selectedStore.code}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>미결제액</div>
                    <div style={{ 
                      fontSize: '22px', 
                      fontWeight: 700, 
                      color: selectedStore.balance > 0 ? '#d32f2f' : '#2e7d32',
                      lineHeight: 1.2
                    }}>
                      {selectedStore.balance.toLocaleString()}원
                    </div>
                  </div>
                </div>
                
                {/* 상세 정보 */}
                <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#666', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: '#86868b' }}>대표자: </span>
                    <span style={{ fontWeight: 500 }}>{selectedStore.ownerName || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#86868b' }}>연락처: </span>
                    <span style={{ fontWeight: 500 }}>{selectedStore.phone || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#86868b' }}>지역: </span>
                    <span style={{ fontWeight: 500 }}>{selectedStore.region || '-'}</span>
                  </div>
                </div>
                {selectedStore.address && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#86868b' }}>
                    📍 {selectedStore.address}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 거래내역 */}
          <div style={{ 
            flex: 1,
            background: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: '300px'
          }}>
            {/* 거래내역 헤더 */}
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>📋 거래내역</span>
              
              {/* 유형 필터 */}
              <div style={{ display: 'flex', gap: '6px' }}>
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

            {/* 거래내역 테이블 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {!selectedStore ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
                  거래처를 선택하면 거래내역이 표시됩니다
                </div>
              ) : transLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
              ) : filteredTransactions.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>거래내역이 없습니다</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>일자</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#666', width: '60px' }}>유형</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666' }}>거래금액</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666' }}>잔액</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>주문번호</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666' }}>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => {
                      const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.adjustment
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                            {new Date(t.processedAt).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 8px', 
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
                            padding: '10px 12px', 
                            textAlign: 'right', 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            color: t.type === 'deposit' ? '#2e7d32' : t.type === 'return' ? '#e65100' : '#1d1d1f' 
                          }}>
                            {t.type === 'deposit' ? '+' : ''}{t.amount.toLocaleString()}원
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                            {t.balanceAfter.toLocaleString()}원
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666' }}>{t.orderNo || '-'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: '#86868b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.memo || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* 거래내역 요약 */}
            {selectedStore && filteredTransactions.length > 0 && (
              <div style={{ 
                padding: '10px 16px', 
                borderTop: '1px solid #e9ecef', 
                background: '#f8f9fa',
                display: 'flex',
                gap: '20px',
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
      </div>
    </Layout>
  )
}
