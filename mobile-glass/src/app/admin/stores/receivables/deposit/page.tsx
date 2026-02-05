'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../../components/Navigation'

interface Store {
  id: number
  code: string
  name: string
  outstandingAmount: number
}

export default function DepositPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [search, setSearch] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('transfer')
  const [depositor, setDepositor] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [recentDeposits, setRecentDeposits] = useState<any[]>([])

  // 미수금 있는 가맹점 조회
  useEffect(() => {
    fetch('/api/receivables?filter=hasDebt&limit=1000')
      .then(res => res.json())
      .then(json => {
        if (json.stores) {
          setStores(json.stores.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            outstandingAmount: s.outstandingAmount
          })))
        }
      })
      .catch(console.error)
  }, [])

  // 최근 입금 내역 조회
  useEffect(() => {
    fetch('/api/receivables/transactions?type=deposit&limit=10')
      .then(res => res.json())
      .then(json => {
        if (json.transactions) {
          setRecentDeposits(json.transactions)
        }
      })
      .catch(console.error)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleDeposit = async () => {
    if (!selectedStore || !depositAmount) {
      alert('가맹점과 입금액을 입력해주세요.')
      return
    }

    const amount = parseInt(depositAmount.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) {
      alert('유효한 금액을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/receivables/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.id,
          amount,
          paymentMethod: depositMethod,
          depositor,
          memo
        })
      })

      const json = await res.json()

      if (json.error) {
        alert(json.error)
        return
      }

      alert(`${formatCurrency(amount)}원 입금 처리되었습니다.\n잔액: ${formatCurrency(json.transaction.newBalance)}원`)
      
      // 폼 리셋
      setSelectedStore(null)
      setDepositAmount('')
      setDepositor('')
      setMemo('')
      
      // 목록 새로고침
      const storesRes = await fetch('/api/receivables?filter=hasDebt&limit=1000')
      const storesJson = await storesRes.json()
      if (storesJson.stores) {
        setStores(storesJson.stores.map((s: any) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          outstandingAmount: s.outstandingAmount
        })))
      }

      // 최근 내역 새로고침
      const txRes = await fetch('/api/receivables/transactions?type=deposit&limit=10')
      const txJson = await txRes.json()
      if (txJson.transactions) {
        setRecentDeposits(txJson.transactions)
      }
    } catch (error) {
      alert('입금 처리에 실패했습니다.')
    }
    setSaving(false)
  }

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        입금 처리
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 입금 폼 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>입금 등록</h3>

          {/* 가맹점 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              가맹점 선택 <span style={{ color: '#ff3b30' }}>*</span>
            </label>
            
            {selectedStore ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f5f5f7',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedStore.name}</div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>{selectedStore.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>미수금</div>
                  <div style={{ fontWeight: 600, color: '#ff3b30' }}>
                    {formatCurrency(selectedStore.outstandingAmount)}원
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStore(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#fff',
                    border: '1px solid #e5e5e5',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  변경
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="가맹점명 또는 코드 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px'
                }}>
                  {filteredStores.slice(0, 20).map(store => (
                    <div
                      key={store.id}
                      onClick={() => { setSelectedStore(store); setSearch(''); }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f7'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{store.name}</span>
                        <span style={{ fontSize: '12px', color: '#86868b', marginLeft: '8px' }}>{store.code}</span>
                      </div>
                      <span style={{ color: '#ff3b30', fontWeight: 500 }}>
                        {formatCurrency(store.outstandingAmount)}원
                      </span>
                    </div>
                  ))}
                  {filteredStores.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#86868b' }}>
                      미수금이 있는 가맹점이 없습니다
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 입금액 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              입금액 <span style={{ color: '#ff3b30' }}>*</span>
            </label>
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setDepositAmount(val ? formatCurrency(parseInt(val)) : '')
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '20px',
                fontWeight: 600,
                textAlign: 'right'
              }}
            />
          </div>

          {/* 입금 방법 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              입금 방법
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { value: 'transfer', label: '계좌이체' },
                { value: 'cash', label: '현금' },
                { value: 'card', label: '카드' },
                { value: 'check', label: '어음' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDepositMethod(opt.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: depositMethod === opt.value ? '2px solid #007aff' : '1px solid #e5e5e5',
                    background: depositMethod === opt.value ? '#e3f2fd' : '#fff',
                    color: depositMethod === opt.value ? '#007aff' : '#1d1d1f',
                    fontSize: '13px',
                    fontWeight: depositMethod === opt.value ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 입금자명 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              입금자명
            </label>
            <input
              type="text"
              value={depositor}
              onChange={(e) => setDepositor(e.target.value)}
              placeholder="입금자명"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '14px'
              }}
            />
          </div>

          {/* 메모 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              메모
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="참고사항"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={handleDeposit}
            disabled={saving || !selectedStore || !depositAmount}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              background: saving || !selectedStore || !depositAmount ? '#86868b' : '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: saving || !selectedStore || !depositAmount ? 'default' : 'pointer'
            }}
          >
            {saving ? '처리 중...' : '입금 처리'}
          </button>
        </div>

        {/* 최근 입금 내역 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>최근 입금 내역</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDeposits.map(tx => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f5f7',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>{tx.storeName}</div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>
                    {new Date(tx.processedAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {tx.depositor && ` · ${tx.depositor}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: '#34c759' }}>
                    +{formatCurrency(tx.amount)}원
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868b' }}>
                    잔액 {formatCurrency(tx.balanceAfter)}원
                  </div>
                </div>
              </div>
            ))}
            
            {recentDeposits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
                최근 입금 내역이 없습니다
              </div>
            )}
          </div>
          
          <button
            onClick={() => window.location.href = '/admin/stores/receivables/transactions?type=deposit'}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '10px',
              borderRadius: '6px',
              background: '#f5f5f7',
              color: '#007aff',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            전체 내역 보기
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
