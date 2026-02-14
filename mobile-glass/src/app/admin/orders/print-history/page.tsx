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
    // 재출력 기록 추가
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
      alert(`${item.orderNo} 재출력이 기록되었습니다.`)
    } catch (error) {
      alert('재출력 기록에 실패했습니다.')
    }
  }

  const columns: Column<PrintHistory>[] = [
    { key: 'printedAt', label: '출력일시', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>
        {new Date(v as string).toLocaleString('ko-KR')}
      </span>
    )},
    { key: 'orderNo', label: '주문번호', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'storeName', label: '가맹점' },
    { key: 'printType', label: '출력유형', render: (v) => {
      const types: Record<string, { bg: string; color: string }> = {
        '거래명세서': { bg: '#eef4ee', color: '#4a6b4a' },
        '출고명세서': { bg: '#e8f5e9', color: '#2e7d32' },
        '납품확인서': { bg: '#fff3e0', color: '#ef6c00' }
      }
      const style = types[v as string] || { bg: '#f5f5f5', color: '#666' }
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
    { key: 'printedBy', label: '출력자' },
    { key: 'pageCount', label: '페이지', align: 'center', render: (v) => (
      <span>{v as number}장</span>
    )},
    { key: 'id', label: '재출력', align: 'center', render: (_, row) => (
      <button
        onClick={() => handleReprint(row)}
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
        🖨️ 재출력
      </button>
    )},
  ]

  // 출력자 목록 추출
  const printers = [...new Set(history.map(h => h.printedBy))]

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        명세표 출력이력
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>오늘 출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
            🖨️ {stats.todayCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>건</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>이번 주 출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {stats.weekCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>건</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>이번 달 출력</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {stats.monthCount}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>건</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 페이지</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {stats.totalPages.toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>장</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        filters={[
          {
            key: 'printType',
            label: '출력유형',
            options: [
              { label: '출력유형', value: '' },
              { label: '거래명세서', value: '거래명세서' },
              { label: '출고명세서', value: '출고명세서' },
              { label: '납품확인서', value: '납품확인서' }
            ],
            value: printType,
            onChange: setPrintType
          },
          {
            key: 'printedBy',
            label: '출력자',
            options: [
              { label: '출력자', value: '' },
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
              background: '#fff',
              color: '#1d1d1f',
              border: '1px solid #e9ecef',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📥 내보내기
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={history}
        loading={loading}
        emptyMessage="출력 이력이 없습니다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: '#fff', 
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666'
      }}>
        총 {history.length}건의 출력 이력
      </div>
    </AdminLayout>
  )
}
