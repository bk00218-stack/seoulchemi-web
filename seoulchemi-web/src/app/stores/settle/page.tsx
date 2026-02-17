'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

interface StoreReceivable {
  id: number
  code: string
  name: string
  ownerName: string
  phone: string
  areaCode: string
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  lastPaymentAt: string | null
  lastOrderAt: string | null
  orderCount: number
  totalSales: number
}

interface Stats {
  totalStores: number
  storesWithDebt: number
  totalOutstanding: number
  overdueAmount: number
  thisMonthReceived: number
}

interface Transaction {
  id: number
  storeId: number
  storeCode: string
  storeName: string
  type: string
  amount: number
  balanceAfter: number
  orderId: number | null
  orderNo: string | null
  paymentMethod: string | null
  bankName: string | null
  depositor: string | null
  memo: string | null
  processedBy: string
  processedAt: string
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

function formatCurrency(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${Math.round(n / 10000).toLocaleString()}만`
  return formatNum(n)
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function formatDateTime(s: string): string {
  const d = new Date(s)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const TX_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#ef4444', bg: '#fef2f2' },
  deposit: { label: '입금', color: '#16a34a', bg: '#f0fdf4' },
  return: { label: '반품', color: '#e65100', bg: '#fff3e0' },
  adjustment: { label: '할인', color: '#7c3aed', bg: '#f5f3ff' },
}

export default function SettlePage() {
  const { toast } = useToast()

  // State
  const [stores, setStores] = useState<StoreReceivable[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hasDebt' | 'overLimit' | 'overdue'>('hasDebt')
  const [search, setSearch] = useState('')

  // 입금 모달
  const [depositModal, setDepositModal] = useState<StoreReceivable | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('transfer')
  const [depositMemo, setDepositMemo] = useState('')
  const [depositor, setDepositor] = useState('')
  const [depositing, setDepositing] = useState(false)

  // 할인 모달
  const [discountModal, setDiscountModal] = useState<StoreReceivable | null>(null)
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountMemo, setDiscountMemo] = useState('')
  const [discounting, setDiscounting] = useState(false)

  // 거래내역 모달
  const [txModal, setTxModal] = useState<{ storeId: number; storeName: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)

  // 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ filter, search, limit: '100' })
      const res = await fetch(`/api/receivables?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStores(data.stores)
      setStats(data.stats)
    } catch {
      toast.error('미수금 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filter, search, toast])

  useEffect(() => { fetchData() }, [fetchData])

  // 입금 처리
  const handleDeposit = async () => {
    if (!depositModal) return
    const amount = parseInt(depositAmount.replace(/,/g, ''))
    if (!amount || amount <= 0) {
      toast.warning('유효한 금액을 입력해주세요.')
      return
    }

    setDepositing(true)
    try {
      const res = await fetch('/api/receivables/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: depositModal.id,
          amount,
          paymentMethod: depositMethod,
          memo: depositMemo || null,
          depositor: depositor || null,
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '입금 처리 실패'); return }

      toast.success(`${depositModal.name}에 ${formatNum(amount)}원 입금 처리 완료`)
      setDepositModal(null)
      setDepositAmount('')
      setDepositMemo('')
      setDepositor('')
      fetchData()
    } catch {
      toast.error('입금 처리에 실패했습니다.')
    } finally {
      setDepositing(false)
    }
  }

  // 할인 처리
  const handleDiscount = async () => {
    if (!discountModal) return
    const amount = parseInt(discountAmount.replace(/,/g, ''))
    if (!amount || amount <= 0) {
      toast.warning('유효한 금액을 입력해주세요.')
      return
    }
    if (!discountMemo.trim()) {
      toast.warning('할인 사유를 입력해주세요.')
      return
    }

    setDiscounting(true)
    try {
      const res = await fetch('/api/receivables/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: discountModal.id,
          amount,
          memo: discountMemo,
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '할인 처리 실패'); return }

      toast.success(`${discountModal.name}에 ${formatNum(amount)}원 할인 처리 완료`)
      setDiscountModal(null)
      setDiscountAmount('')
      setDiscountMemo('')
      fetchData()
    } catch {
      toast.error('할인 처리에 실패했습니다.')
    } finally {
      setDiscounting(false)
    }
  }

  // 거래내역 조회
  const openTransactions = async (storeId: number, storeName: string) => {
    setTxModal({ storeId, storeName })
    setTxLoading(true)
    try {
      const res = await fetch(`/api/receivables/transactions?storeId=${storeId}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
      }
    } catch {
      toast.error('거래내역을 불러오지 못했습니다.')
    } finally {
      setTxLoading(false)
    }
  }

  // 금액 입력 포맷터
  const handleDepositAmountInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    if (num) {
      setDepositAmount(parseInt(num).toLocaleString())
    } else {
      setDepositAmount('')
    }
  }

  const handleDiscountAmountInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    if (num) {
      setDiscountAmount(parseInt(num).toLocaleString())
    } else {
      setDiscountAmount('')
    }
  }

  const FILTERS = [
    { key: 'hasDebt', label: '미수금 있음' },
    { key: 'all', label: '전체' },
    { key: 'overLimit', label: '한도 초과' },
    { key: 'overdue', label: '연체' },
  ] as const

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>가맹점 정산관리</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>미수금 조회, 입금/할인 처리, 거래내역 관리</p>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>총 미수금</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{formatCurrency(stats.totalOutstanding)}원</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{stats.storesWithDebt}개 거래처</div>
          </div>
          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>연체 금액</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(stats.overdueAmount)}원</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>결제기한 초과</div>
          </div>
          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>이번 달 수금</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{formatCurrency(stats.thisMonthReceived)}원</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>입금 합계</div>
          </div>
          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>활성 거래처</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#667eea' }}>{stats.totalStores}개</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>전체 가맹점</div>
          </div>
        </div>
      )}

      {/* 필터 + 검색 */}
      <div style={{ ...cardStyle, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                ...btnStyle,
                padding: '6px 14px',
                fontSize: 13,
                background: filter === f.key ? '#667eea' : '#fff',
                color: filter === f.key ? '#fff' : 'var(--gray-600)',
                border: filter === f.key ? '1px solid #667eea' : '1px solid var(--gray-200)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="가맹점명, 코드 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 220, padding: '8px 12px', fontSize: 13 }}
        />
      </div>

      {/* 미수금 목록 */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>불러오는 중...</div>
        ) : stores.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p>해당 조건의 가맹점이 없습니다.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' }}>
                  <th style={thStyle}>코드</th>
                  <th style={thStyle}>가맹점명</th>
                  <th style={thStyle}>대표자</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>미수금</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>신용한도</th>
                  <th style={thStyle}>한도율</th>
                  <th style={thStyle}>최근입금</th>
                  <th style={thStyle}>최근주문</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => {
                  const limitRate = store.creditLimit > 0
                    ? Math.round((store.outstandingAmount / store.creditLimit) * 100)
                    : 0
                  const isOverLimit = store.creditLimit > 0 && store.outstandingAmount > store.creditLimit

                  return (
                    <tr key={store.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-500)' }}>{store.code}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600 }}>{store.name}</span>
                      </td>
                      <td style={tdStyle}>{store.ownerName}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: store.outstandingAmount > 0 ? '#ef4444' : 'var(--gray-500)' }}>
                        {formatNum(store.outstandingAmount)}원
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--gray-500)' }}>
                        {store.creditLimit > 0 ? `${formatNum(store.creditLimit)}원` : '-'}
                      </td>
                      <td style={tdStyle}>
                        {store.creditLimit > 0 ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isOverLimit ? '#fef2f2' : limitRate >= 80 ? '#fffbeb' : '#f0fdf4',
                            color: isOverLimit ? '#ef4444' : limitRate >= 80 ? '#d97706' : '#16a34a',
                          }}>
                            {limitRate}%
                          </span>
                        ) : '-'}
                      </td>
                      <td style={tdStyle}>{formatDate(store.lastPaymentAt)}</td>
                      <td style={tdStyle}>{formatDate(store.lastOrderAt)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setDepositModal(store)
                              setDepositAmount('')
                              setDepositMemo('')
                              setDepositor('')
                            }}
                            style={{
                              ...btnStyle,
                              padding: '4px 10px',
                              fontSize: 12,
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            입금
                          </button>
                          <button
                            onClick={() => {
                              setDiscountModal(store)
                              setDiscountAmount('')
                              setDiscountMemo('')
                            }}
                            style={{
                              ...btnStyle,
                              padding: '4px 10px',
                              fontSize: 12,
                              background: '#7c3aed',
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            할인
                          </button>
                          <button
                            onClick={() => openTransactions(store.id, store.name)}
                            style={{
                              ...btnStyle,
                              padding: '4px 10px',
                              fontSize: 12,
                            }}
                          >
                            내역
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 입금 모달 */}
      {depositModal && (
        <div style={overlayStyle} onClick={() => setDepositModal(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>입금 처리</h2>
              <button onClick={() => setDepositModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}>×</button>
            </div>

            {/* 가맹점 정보 */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{depositModal.name}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{depositModal.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>현재 미수금</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>{formatNum(depositModal.outstandingAmount)}원</span>
              </div>
              {depositModal.creditLimit > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>신용한도</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatNum(depositModal.creditLimit)}원</span>
                </div>
              )}
            </div>

            {/* 입금 폼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>입금액 *</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => handleDepositAmountInput(e.target.value)}
                  placeholder="금액 입력"
                  style={{ ...inputStyle, width: '100%', fontSize: 16, fontWeight: 600 }}
                  autoFocus
                />
                {/* 빠른 금액 버튼 */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[depositModal.outstandingAmount, 1000000, 500000, 100000].filter(v => v > 0).map((amount, i) => (
                    <button
                      key={i}
                      onClick={() => setDepositAmount(amount.toLocaleString())}
                      style={{ ...btnStyle, padding: '4px 8px', fontSize: 11, flex: i === 0 ? 'none' : 1 }}
                    >
                      {i === 0 ? '전액' : formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>결제 방법</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { key: 'transfer', label: '계좌이체' },
                    { key: 'cash', label: '현금' },
                    { key: 'card', label: '카드' },
                    { key: 'check', label: '수표' },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setDepositMethod(m.key)}
                      style={{
                        ...btnStyle,
                        padding: '6px 12px',
                        fontSize: 12,
                        flex: 1,
                        background: depositMethod === m.key ? '#667eea' : '#fff',
                        color: depositMethod === m.key ? '#fff' : 'var(--gray-600)',
                        border: depositMethod === m.key ? '1px solid #667eea' : '1px solid var(--gray-200)',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>입금자명</label>
                <input
                  type="text"
                  value={depositor}
                  onChange={e => setDepositor(e.target.value)}
                  placeholder="입금자명 (선택)"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={labelStyle}>메모</label>
                <input
                  type="text"
                  value={depositMemo}
                  onChange={e => setDepositMemo(e.target.value)}
                  placeholder="메모 (선택)"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>

            {/* 입금 후 잔액 미리보기 */}
            {depositAmount && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#16a34a' }}>입금 후 잔액</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>
                    {formatNum(Math.max(0, depositModal.outstandingAmount - parseInt(depositAmount.replace(/,/g, '') || '0')))}원
                  </span>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setDepositModal(null)} style={{ ...btnStyle, padding: '10px 20px' }}>취소</button>
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                style={{
                  ...btnStyle,
                  padding: '10px 24px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  opacity: depositing || !depositAmount ? 0.6 : 1,
                }}
              >
                {depositing ? '처리 중...' : '입금 처리'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 할인 모달 */}
      {discountModal && (
        <div style={overlayStyle} onClick={() => setDiscountModal(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>할인 처리</h2>
              <button onClick={() => setDiscountModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}>×</button>
            </div>

            {/* 가맹점 정보 */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{discountModal.name}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{discountModal.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>현재 미수금</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>{formatNum(discountModal.outstandingAmount)}원</span>
              </div>
            </div>

            {/* 할인 폼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>할인 금액 *</label>
                <input
                  type="text"
                  value={discountAmount}
                  onChange={e => handleDiscountAmountInput(e.target.value)}
                  placeholder="할인 금액 입력"
                  style={{ ...inputStyle, width: '100%', fontSize: 16, fontWeight: 600 }}
                  autoFocus
                />
                {/* 빠른 금액 버튼 */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[discountModal.outstandingAmount, 500000, 100000, 50000].filter(v => v > 0).map((amount, i) => (
                    <button
                      key={i}
                      onClick={() => setDiscountAmount(amount.toLocaleString())}
                      style={{ ...btnStyle, padding: '4px 8px', fontSize: 11, flex: i === 0 ? 'none' : 1 }}
                    >
                      {i === 0 ? '전액' : formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>할인 사유 *</label>
                <input
                  type="text"
                  value={discountMemo}
                  onChange={e => setDiscountMemo(e.target.value)}
                  placeholder="할인 사유 입력 (필수)"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>

            {/* 할인 후 잔액 미리보기 */}
            {discountAmount && (
              <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#7c3aed' }}>할인 후 잔액</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>
                    {formatNum(Math.max(0, discountModal.outstandingAmount - parseInt(discountAmount.replace(/,/g, '') || '0')))}원
                  </span>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setDiscountModal(null)} style={{ ...btnStyle, padding: '10px 20px' }}>취소</button>
              <button
                onClick={handleDiscount}
                disabled={discounting || !discountAmount || !discountMemo.trim()}
                style={{
                  ...btnStyle,
                  padding: '10px 24px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  opacity: discounting || !discountAmount || !discountMemo.trim() ? 0.6 : 1,
                }}
              >
                {discounting ? '처리 중...' : '할인 처리'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거래내역 모달 */}
      {txModal && (
        <div style={overlayStyle} onClick={() => setTxModal(null)}>
          <div style={{ ...modalStyle, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{txModal.storeName} 거래내역</h2>
              <button onClick={() => setTxModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}>×</button>
            </div>

            {txLoading ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>불러오는 중...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>거래내역이 없습니다.</div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', position: 'sticky', top: 0 }}>
                      <th style={thStyle}>일시</th>
                      <th style={thStyle}>구분</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>잔액</th>
                      <th style={thStyle}>결제방법</th>
                      <th style={thStyle}>메모</th>
                      <th style={thStyle}>처리자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const typeInfo = TX_TYPE_MAP[tx.type] || { label: tx.type, color: '#666', bg: '#f5f5f5' }
                      const isDecrease = tx.type === 'deposit' || tx.type === 'return' || tx.type === 'adjustment'
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={tdStyle}>{formatDateTime(tx.processedAt)}</td>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 600,
                              background: typeInfo.bg,
                              color: typeInfo.color,
                            }}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td style={{
                            ...tdStyle,
                            textAlign: 'right',
                            fontWeight: 600,
                            color: isDecrease ? '#16a34a' : '#ef4444',
                          }}>
                            {isDecrease ? '-' : '+'}{formatNum(tx.amount)}원
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--gray-500)' }}>
                            {formatNum(tx.balanceAfter)}원
                          </td>
                          <td style={tdStyle}>
                            {tx.paymentMethod === 'transfer' ? '계좌이체' :
                             tx.paymentMethod === 'cash' ? '현금' :
                             tx.paymentMethod === 'card' ? '카드' :
                             tx.paymentMethod === 'check' ? '수표' :
                             tx.paymentMethod || '-'}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--gray-500)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.memo || tx.orderNo || '-'}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--gray-400)', fontSize: 12 }}>{tx.processedBy}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

// 스타일
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--gray-500)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  whiteSpace: 'nowrap',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--gray-700)',
  marginBottom: 6,
}
