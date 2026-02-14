'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface PrintHistory {
  id: number
  orderId: number | null
  orderNo: string
  storeName: string
  printType: string
  printedBy: string
  pageCount: number
  printedAt: string
}

interface Stats {
  todayCount: number
  weekCount: number
  monthCount: number
  totalPages: number
}

export default function PrintHistoryPage() {
  const [history, setHistory] = useState<PrintHistory[]>([])
  const [stats, setStats] = useState<Stats>({ todayCount: 0, weekCount: 0, monthCount: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [printType, setPrintType] = useState('')
  const [printedBy, setPrintedBy] = useState('')

  useEffect(() => {
    loadData()
  }, [printType, printedBy])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (printType) params.append('printType', printType)
      if (printedBy) params.append('printedBy', printedBy)
      
      const res = await fetch(`/api/print-history?${params}`)
      const data = await res.json()
      setHistory(data.history || [])
      setStats(data.stats || { todayCount: 0, weekCount: 0, monthCount: 0, totalPages: 0 })
    } catch (error) {
      console.error('Failed to load print history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReprint = async (item: PrintHistory) => {
    // ?�출??기록 추�?
    try {
      await fetch('/api/print-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: item.orderId,
          orderNo: item.orderNo,
          storeName: item.storeName,
          printType: item.printType,
          printedBy: '관리자',
          pageCount: item.pageCount
        })
      })
      loadData()
      alert(`${item.orderNo} ?�출?�이 기록?�었?�니??`)
    } catch (error) {
      alert('?�출??기록???�패?�습?�다.')
    }
  }

  const columns: Column<PrintHistory>[] = [
    { key: 'printedAt', label: '출력?�시', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>
        {new Date(v as string).toLocaleString('ko-KR')}
      </span>
    )},
    { key: 'orderNo', label: '주문번호', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'storeName', label: '가맹점' },
    { key: 'printType', label: '출력?�형', render: (v) => {
      const types: Record<string, { bg: string; color: string }> = {
        '거래명세??: { bg: '#eef4ee', color: '#4a6b4a' },
        '출고명세??: { bg: '#e8f5e9', color: '#2e7d32' },
        '?�품?�인??: { bg: '#fff3e0', color: '#ef6c00' }
      }
      const style = types[v as string] || { bg: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }
      return (
        <span style={{ 
          background: style.bg, 
          color: style.color, 
          padding: '3px 8px', 
          borderRadius: '4px', 
          fontSize: '12px' 
        }}>
          {v as string}
        </span>
      )
    }},
    { key: 'printedBy', label: '출력?? },
    { key: 'pageCount', label: '?�이지', align: 'center', render: (v) => (
      <span>{v as number}??/span>
    )},
    { key: 'id', label: '?�출??, align: 'center', render: (_, row) => (
      <button
        onClick={() => handleReprint(row)}
        style={{
          padding: '4px 10px',
          borderRadius: '4px',
          background: 'var(--bg-secondary)',
          color: '#007aff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        ?���??�출??
      </button>
    )},
  ]

  // 출력??목록 추출
  const printers = [...new Set(history.map(h => h.printedBy))]

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        명세??출력?�력
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?�늘 출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>
            ?���?{stats.todayCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?�번 �?출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {stats.weekCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?�번 ??출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {stats.monthCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>�?/span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>�??�이지</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {stats.totalPages.toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>??/span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="주문번호, 가맹점�?검??
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        filters={[
          {
            key: 'printType',
            label: '출력?�형',
            options: [
              { label: '출력?�형', value: '' },
              { label: '거래명세??, value: '거래명세?? },
              { label: '출고명세??, value: '출고명세?? },
              { label: '?�품?�인??, value: '?�품?�인?? }
            ],
            value: printType,
            onChange: setPrintType
          },
          {
            key: 'printedBy',
            label: '출력??,
            options: [
              { label: '출력??, value: '' },
              ...printers.map(p => ({ label: p, value: p }))
            ],
            value: printedBy,
            onChange: setPrintedBy
          }
        ]}
        actions={
          <button
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ?�� ?�보?�기
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={history}
        loading={loading}
        emptyMessage="출력 ?�력???�습?�다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: 'var(--bg-primary)', 
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666'
      }}>
        �?{history.length}건의 출력 ?�력
      </div>
    </AdminLayout>
  )
}
