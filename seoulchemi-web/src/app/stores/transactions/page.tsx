'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

interface Transaction {
  id: number
  storeId: number
  storeName: string
  storeCode: string
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchStore, setSearchStore] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/transactions?limit=100')
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false
    if (searchStore && !t.storeName.includes(searchStore) && !t.storeCode.includes(searchStore)) return false
    return true
  })

  const stats = {
    total: transactions.length,
    sales: transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0),
    deposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>가맹점 거래내역</h2>
          <p style={{ fontSize: '13px', color: '#86868b', margin: '4px 0 0' }}>매출, 입금, 반품 등 거래내역을 조회합니다</p>
        </div>
      </div>

      {/* 요약 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>전체</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600 }}>{stats.total}건</span>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>총 매출</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600, color: '#1565c0' }}>{stats.sales.toLocaleString()}원</span>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>총 입금</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600, color: '#2e7d32' }}>{stats.deposits.toLocaleString()}원</span>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all', label: '전체' },
            { value: 'sale', label: '매출' },
            { value: 'deposit', label: '입금' },
            { value: 'return', label: '반품' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
              background: filter === f.value ? '#007aff' : '#f5f5f7', color: filter === f.value ? '#fff' : '#666'
            }}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="가맹점 검색"
          value={searchStore}
          onChange={e => setSearchStore(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '13px', width: '150px' }}
        />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '13px' }} />
        <span style={{ color: '#86868b' }}>~</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '13px' }} />
      </div>

      {/* 테이블 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>거래내역이 없습니다</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>일시</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>가맹점</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>유형</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>금액</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>잔액</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>주문번호</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => {
                const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.adjustment
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(t.processedAt).toLocaleDateString('ko-KR')}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>{t.storeName}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: typeInfo.color, background: typeInfo.bg }}>{typeInfo.label}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: t.type === 'deposit' ? '#2e7d32' : t.type === 'return' ? '#e65100' : '#1d1d1f' }}>
                      {t.type === 'deposit' ? '+' : ''}{t.amount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>{t.balanceAfter.toLocaleString()}원</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{t.orderNo || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#86868b' }}>{t.memo || '-'}</td>
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
