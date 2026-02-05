'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface StoreReceivable {
  id: number
  code: string
  name: string
  ownerName: string
  phone: string
  areaCode: string | null
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

export default function ReceivablesPage() {
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState<StoreReceivable[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStores: 0,
    storesWithDebt: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    thisMonthReceived: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStore, setSelectedStore] = useState<StoreReceivable | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMemo, setDepositMemo] = useState('')
  const [depositMethod, setDepositMethod] = useState('transfer')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter !== 'all') params.set('filter', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/receivables?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.stores)
      setStats(json.stats)
      setTotalPages(json.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch receivables:', error)
    }
    setLoading(false)
  }, [filter, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const openDepositModal = (store: StoreReceivable) => {
    setSelectedStore(store)
    setDepositAmount('')
    setDepositMemo('')
    setDepositMethod('transfer')
    setShowDepositModal(true)
  }

  const handleDeposit = async () => {
    if (!selectedStore || !depositAmount) {
      alert('입금액을 입력해주세요.')
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
          memo: depositMemo
        })
      })

      const json = await res.json()

      if (json.error) {
        alert(json.error)
        return
      }

      alert(`${formatCurrency(amount)}원 입금 처리되었습니다.`)
      setShowDepositModal(false)
      fetchData()
    } catch (error) {
      alert('입금 처리에 실패했습니다.')
    }
    setSaving(false)
  }

  const getDaysOverdue = (lastPaymentAt: string | null, paymentTermDays: number) => {
    if (!lastPaymentAt) return null
    const lastPayment = new Date(lastPaymentAt)
    const dueDate = new Date(lastPayment)
    dueDate.setDate(dueDate.getDate() + paymentTermDays)
    const today = new Date()
    const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  }

  const columns: Column<StoreReceivable>[] = [
    { key: 'code', label: '코드', width: '80px', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '가맹점명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'areaCode', label: '지역', width: '80px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{(v as string) || '-'}</span>
    )},
    { key: 'outstandingAmount', label: '미수금', align: 'right', render: (v) => {
      const amount = v as number
      const isHigh = amount > 1000000
      return (
        <span style={{ 
          fontWeight: 600, 
          color: amount > 0 ? (isHigh ? '#ff3b30' : '#ff9500') : '#34c759',
          fontFamily: 'monospace'
        }}>
          {formatCurrency(amount)}원
        </span>
      )
    }},
    { key: 'creditLimit', label: '신용한도', align: 'right', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#86868b' }}>
        {formatCurrency(v as number)}원
      </span>
    )},
    { key: 'totalSales', label: '총매출', align: 'right', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
        {formatCurrency(v as number)}원
      </span>
    )},
    { key: 'lastPaymentAt', label: '최근입금', width: '100px', render: (v, row) => {
      const daysOverdue = getDaysOverdue(v as string | null, row.paymentTermDays)
      return (
        <div>
          <div style={{ fontSize: '12px' }}>
            {v ? new Date(v as string).toLocaleDateString('ko-KR') : '-'}
          </div>
          {daysOverdue && (
            <div style={{ fontSize: '11px', color: '#ff3b30' }}>
              {daysOverdue}일 연체
            </div>
          )}
        </div>
      )
    }},
    { key: 'orderCount', label: '주문수', align: 'center', width: '70px', render: (v) => (
      <span style={{ 
        background: '#f5f5f7', 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as number}건
      </span>
    )},
    { key: 'id', label: '관리', align: 'center', width: '140px', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => openDepositModal(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#007aff',
            color: '#fff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          입금
        </button>
        <button
          onClick={() => window.location.href = `/admin/stores/receivables/transactions?storeId=${row.id}`}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#f5f5f7',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          내역
        </button>
      </div>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        미수금 현황
      </h2>

      <StatCardGrid>
        <StatCard 
          label="총 미수금" 
          value={formatCurrency(stats.totalOutstanding)} 
          unit="원" 
          icon="💰" 
          highlight 
        />
        <StatCard 
          label="미수 거래처" 
          value={stats.storesWithDebt} 
          unit="개" 
          subValue={`전체 ${stats.totalStores}개 중`}
        />
        <StatCard 
          label="연체 금액" 
          value={formatCurrency(stats.overdueAmount)} 
          unit="원" 
          icon="⚠️"
        />
        <StatCard 
          label="이번 달 입금" 
          value={formatCurrency(stats.thisMonthReceived)} 
          unit="원" 
          icon="✅"
        />
      </StatCardGrid>

      <SearchFilter
        placeholder="가맹점명, 코드, 지역 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        actions={
          <>
            <OutlineButton onClick={() => window.location.href = '/admin/stores/receivables/transactions'}>
              📋 입출금 내역
            </OutlineButton>
            <OutlineButton onClick={() => alert('엑셀 다운로드 - 준비 중')}>
              📥 엑셀
            </OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: `전체 (${stats.totalStores})`, value: 'all' },
            { label: `미수 있음 (${stats.storesWithDebt})`, value: 'hasDebt' },
            { label: '연체', value: 'overdue' },
            { label: '한도 초과', value: 'overLimit' },
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            emptyMessage="미수금 데이터가 없습니다"
          />
          
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px', 
              marginTop: '20px' 
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === 1 ? '#f5f5f7' : '#fff',
                  color: page === 1 ? '#c5c5c7' : '#007aff',
                  border: '1px solid #e5e5e5',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                이전
              </button>
              <span style={{ 
                padding: '8px 16px', 
                color: '#86868b',
                display: 'flex',
                alignItems: 'center'
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === totalPages ? '#f5f5f7' : '#fff',
                  color: page === totalPages ? '#c5c5c7' : '#007aff',
                  border: '1px solid #e5e5e5',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 입금 모달 */}
      {showDepositModal && selectedStore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '440px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              입금 처리
            </h3>
            
            <div style={{ 
              background: '#f5f5f7', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '4px' }}>
                {selectedStore.code} · {selectedStore.name}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#ff3b30' }}>
                미수금: {formatCurrency(selectedStore.outstandingAmount)}원
              </div>
            </div>

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
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e5e5', 
                  fontSize: '18px',
                  fontWeight: 600,
                  textAlign: 'right'
                }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                입금 방법
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                      flex: 1,
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                메모
              </label>
              <input 
                type="text" 
                value={depositMemo}
                onChange={(e) => setDepositMemo(e.target.value)}
                placeholder="입금자명, 참고사항 등"
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e5e5', 
                  fontSize: '14px' 
                }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDepositModal(false)} 
                disabled={saving}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  background: '#f5f5f7', 
                  color: '#1d1d1f', 
                  border: 'none', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                취소
              </button>
              <button 
                onClick={handleDeposit}
                disabled={saving || !depositAmount}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  background: saving || !depositAmount ? '#86868b' : '#007aff', 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  cursor: saving || !depositAmount ? 'default' : 'pointer' 
                }}
              >
                {saving ? '처리 중...' : '입금 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
