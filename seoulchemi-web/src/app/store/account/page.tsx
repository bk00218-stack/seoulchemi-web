'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface StoreInfo {
  id: number
  name: string
  code: string
  phone: string | null
  ownerName: string | null
  outstandingAmount: number
  creditLimit: number
  billingDay: number | null
}

interface Transaction {
  id: number
  type: string
  amount: number
  balanceAfter: number
  orderNo: string | null
  memo: string | null
  processedAt: string
}

const TX_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#007aff', bg: '#f0f7ff' },
  deposit: { label: '입금', color: '#34c759', bg: '#f0fff4' },
  return: { label: '반품', color: '#ff9500', bg: '#fff8f0' },
  adjustment: { label: '조정', color: '#af52de', bg: '#faf0ff' },
}

export default function StoreAccountPage() {
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('3m')
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/store/account')
      const data = await res.json()
      if (data.store) {
        setStore(data.store)
        setTransactions(data.transactions || [])
      }
    } catch (e) {
      console.error('Failed to fetch account:', e)
    } finally {
      setLoading(false)
    }
  }

  // 기간 필터
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.processedAt)
    const now = new Date()
    const monthsMap = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }
    const months = monthsMap[period]
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    return txDate >= cutoff
  })

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>
        로딩 중...
      </div>
    )
  }

  if (!store) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#86868b' }}>
        가맹점 정보를 불러올 수 없습니다.
      </div>
    )
  }

  const balance = store.outstandingAmount
  const creditLimit = store.creditLimit
  const usedPercent = creditLimit > 0 ? (balance / creditLimit) * 100 : 0

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          잔액 조회
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          미수금 및 거래내역을 확인하세요
        </p>
      </div>

      {/* Balance Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 8 : 16,
        marginBottom: isMobile ? 16 : 24,
      }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ff3b30', padding: isMobile ? 14 : 24 }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>현재 미수금</div>
          <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#ff3b30', marginTop: 4 }}>
            {balance.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #007aff', padding: isMobile ? 14 : 24 }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>신용 한도</div>
          <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#007aff', marginTop: 4 }}>
            {creditLimit.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #34c759', padding: isMobile ? 14 : 24 }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>주문 가능 금액</div>
          <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#34c759', marginTop: 4 }}>
            {Math.max(0, creditLimit - balance).toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
      </div>

      {/* Credit Usage Bar */}
      {creditLimit > 0 && (
        <div style={{ ...cardStyle, marginBottom: isMobile ? 16 : 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>신용 한도 사용률</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: usedPercent > 80 ? '#ff3b30' : '#34c759' }}>
              {usedPercent.toFixed(1)}%
            </span>
          </div>
          <div style={{
            height: 12, background: '#f5f5f7', borderRadius: 6, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(usedPercent, 100)}%`,
              background: usedPercent > 80
                ? 'linear-gradient(90deg, #ff9500, #ff3b30)'
                : 'linear-gradient(90deg, #34c759, #30d158)',
              borderRadius: 6, transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#86868b' }}>사용: {balance.toLocaleString()}원</span>
            <span style={{ fontSize: 12, color: '#86868b' }}>잔여: {Math.max(0, creditLimit - balance).toLocaleString()}원</span>
          </div>
        </div>
      )}

      {/* Store Info + Transactions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
        gap: isMobile ? 16 : 24,
      }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: '0 0 16px' }}>
            가맹점 정보
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>가맹점명</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>{store.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>가맹점 코드</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>{store.code}</div>
            </div>
            {store.ownerName && (
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>대표자</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>{store.ownerName}</div>
              </div>
            )}
            {store.phone && (
              <div>
                <div style={{ fontSize: 12, color: '#86868b' }}>전화번호</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>{store.phone}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>정산일</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>
                {store.billingDay ? `매월 ${store.billingDay}일` : '매월 말일'}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>
              거래 내역
            </h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {([['1m', '1개월'], ['3m', '3개월'], ['6m', '6개월'], ['1y', '1년']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, border: 'none',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: period === key ? '#007aff' : '#f5f5f7',
                    color: period === key ? 'white' : '#1d1d1f',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>
              거래 내역이 없습니다
            </div>
          ) : isMobile ? (
            /* Mobile: Card layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTransactions.map(tx => {
                const typeInfo = TX_TYPE_MAP[tx.type] || { label: tx.type, color: '#666', bg: '#f5f5f5' }
                const isDebit = tx.type === 'sale'
                return (
                  <div key={tx.id} style={{
                    padding: 12, borderRadius: 10,
                    border: '1px solid #f0f0f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4,
                          fontSize: 11, fontWeight: 600,
                          background: typeInfo.bg, color: typeInfo.color,
                        }}>{typeInfo.label}</span>
                        <span style={{ fontSize: 12, color: '#86868b' }}>
                          {new Date(tx.processedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 14, fontWeight: 600,
                        color: isDebit ? '#1d1d1f' : '#34c759',
                      }}>
                        {isDebit ? '+' : '-'}{tx.amount.toLocaleString()}원
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#86868b' }}>
                        {tx.orderNo ? `주문 ${tx.orderNo}` : tx.memo || '-'}
                      </span>
                      <span style={{ fontSize: 12, color: '#86868b' }}>잔액 {tx.balanceAfter.toLocaleString()}원</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Desktop: Table layout */
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>일자</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>구분</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>내용</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#86868b' }}>금액</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#86868b' }}>잔액</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => {
                  const typeInfo = TX_TYPE_MAP[tx.type] || { label: tx.type, color: '#666', bg: '#f5f5f5' }
                  const isDebit = tx.type === 'sale'
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                      <td style={{ padding: '12px 8px', fontSize: 13, color: '#86868b' }}>
                        {new Date(tx.processedAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                          fontSize: 11, fontWeight: 600, background: typeInfo.bg, color: typeInfo.color,
                        }}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 13, color: '#1d1d1f' }}>
                        {tx.orderNo ? `주문 ${tx.orderNo}` : tx.memo || '-'}
                      </td>
                      <td style={{
                        padding: '12px 8px', fontSize: 13, fontWeight: 600, textAlign: 'right',
                        color: isDebit ? '#1d1d1f' : '#34c759',
                      }}>
                        {isDebit ? '+' : '-'}{tx.amount.toLocaleString()}원
                      </td>
                      <td style={{
                        padding: '12px 8px', fontSize: 13, fontWeight: 500, textAlign: 'right', color: '#1d1d1f',
                      }}>
                        {tx.balanceAfter.toLocaleString()}원
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
