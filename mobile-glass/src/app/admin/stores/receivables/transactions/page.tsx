'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '../../../../components/Navigation'
import DataTable, { Column } from '../../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../../components/SearchFilter'

interface Transaction {
  id: number
  storeId: number
  storeName: string
  storeCode: string
  type: string
  amount: number
  balanceAfter: number
  orderNo: string | null
  paymentMethod: string | null
  depositor: string | null
  memo: string | null
  processedBy: string | null
  processedAt: string
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#ff3b30', bg: '#ffebee' },
  deposit: { label: '?�금', color: '#34c759', bg: '#e8f5e9' },
  return: { label: '반품', color: '#ff9500', bg: '#fff3e0' },
  adjustment: { label: '조정', color: '#007aff', bg: '#eef4ee' },
}

const METHOD_LABELS: Record<string, string> = {
  transfer: '계좌?�체',
  cash: '?�금',
  card: '카드',
  check: '?�음',
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('storeId')
  
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter !== 'all') params.set('type', filter)
      if (search) params.set('search', search)
      if (storeIdParam) params.set('storeId', storeIdParam)
      if (dateRange.start) params.set('startDate', dateRange.start)
      if (dateRange.end) params.set('endDate', dateRange.end)
      
      const res = await fetch(`/api/receivables/transactions?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.transactions)
      setTotalPages(json.pagination?.totalPages || 1)
      if (json.storeName) setStoreName(json.storeName)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
    setLoading(false)
  }, [filter, search, page, storeIdParam, dateRange])

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

  const columns: Column<Transaction>[] = [
    { key: 'processedAt', label: '?�시', width: '140px', render: (v) => (
      <span style={{ fontSize: '13px' }}>
        {new Date(v as string).toLocaleString('ko-KR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    )},
    { key: 'storeCode', label: '코드', width: '80px', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>{v as string}</span>
    )},
    { key: 'storeName', label: '가맹점�?, render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'type', label: '구분', width: '80px', render: (v) => {
      const typeInfo = TYPE_LABELS[v as string] || { label: v, color: '#666', bg: '#f5f5f7' }
      return (
        <span style={{
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          color: typeInfo.color,
          background: typeInfo.bg,
        }}>
          {typeInfo.label}
        </span>
      )
    }},
    { key: 'amount', label: '금액', align: 'right', render: (v, row) => {
      const isDeposit = row.type === 'deposit'
      const isReturn = row.type === 'return'
      const sign = isDeposit ? '+' : isReturn ? '-' : ''
      return (
        <span style={{ 
          fontWeight: 600, 
          fontFamily: 'monospace',
          color: isDeposit ? '#34c759' : '#ff3b30'
        }}>
          {sign}{formatCurrency(v as number)}??
        </span>
      )
    }},
    { key: 'balanceAfter', label: '?�액', align: 'right', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
        {formatCurrency(v as number)}??
      </span>
    )},
    { key: 'paymentMethod', label: '결제방법', width: '90px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>
        {v ? METHOD_LABELS[v as string] || v : '-'}
      </span>
    )},
    { key: 'orderNo', label: '주문번호', width: '100px', render: (v) => (
      v ? (
        <a 
          href={`/admin/orders?orderNo=${v}`} 
          style={{ color: '#007aff', fontSize: '12px', fontFamily: 'monospace' }}
        >
          {v as string}
        </a>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>-</span>
      )
    )},
    { key: 'memo', label: '메모', render: (v, row) => (
      <span style={{ fontSize: '12px', color: '#666' }}>
        {row.depositor && `${row.depositor} `}
        {v || '-'}
      </span>
    )},
    { key: 'processedBy', label: '처리??, width: '80px', render: (v) => (
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{(v as string) || '-'}</span>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ?�출�??�역
        {storeName && (
          <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '12px' }}>
            - {storeName}
          </span>
        )}
      </h2>

      <SearchFilter
        placeholder="가맹점�? 코드, 주문번호, 메모 검??
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        actions={
          <>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}
              />
              <span style={{ color: 'var(--text-tertiary)' }}>~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}
              />
            </div>
            <OutlineButton onClick={() => alert('?��? ?�운로드 - 준�?�?)}>
              ?�� ?��?
            </OutlineButton>
          </>
        }
      />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '?�체', value: 'all' },
            { label: '매출', value: 'sale' },
            { label: '?�금', value: 'deposit' },
            { label: '반품', value: 'return' },
            { label: '조정', value: 'adjustment' },
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          로딩 �?..
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            emptyMessage="?�출�??�역???�습?�다"
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
                  border: '1px solid var(--border-color)',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                ?�전
              </button>
              <span style={{ 
                padding: '8px 16px', 
                color: 'var(--text-tertiary)',
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
                  border: '1px solid var(--border-color)',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                ?�음
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
