'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton, PrimaryButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'
import { downloadExcel, ExcelColumn } from '@/lib/excel'

interface Purchase {
  id: number
  purchaseNo: string
  date: string
  supplier: string
  supplierId: number
  brand: string
  product: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
}

interface Supplier {
  id: number
  name: string
}

interface Stats {
  monthlyCount: number
  pendingCount: number
  totalAmount: number
  supplierCount: number
}

const statusMap = {
  pending: { bg: '#fff3e0', color: '#ff9500', label: '입고대기' },
  completed: { bg: '#e8f5e9', color: '#34c759', label: '입고완료' },
  cancelled: { bg: '#ffebee', color: '#ff3b30', label: '취소' },
}

export default function PurchasePage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [data, setData] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<Stats>({ monthlyCount: 0, pendingCount: 0, totalAmount: 0, supplierCount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/purchases?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.purchases)
      setSuppliers(json.suppliers)
      setStats(json.stats)
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    }
    setLoading(false)
  }, [filter, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData()

  const handleExcelDownload = () => {
    const excelColumns: ExcelColumn[] = [
      { key: 'purchaseNo', label: '매입번호' },
      { key: 'date', label: '일자' },
      { key: 'supplier', label: '매입처' },
      { key: 'brand', label: '브랜드' },
      { key: 'product', label: '상품명' },
      { key: 'quantity', label: '수량' },
      { key: 'unitPrice', label: '단가', format: (v) => v.toLocaleString() },
      { key: 'totalAmount', label: '합계', format: (v) => v.toLocaleString() },
      { key: 'status', label: '상태', format: (v) => statusMap[v as keyof typeof statusMap]?.label || v },
    ]
    
    const exportData = selectedIds.size > 0 
      ? data.filter(d => selectedIds.has(d.id))
      : data
    
    downloadExcel(exportData, excelColumns, `매입내역_${new Date().toISOString().split('T')[0]}`)
    alert(`${exportData.length}건이 다운로드되었습니다.`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('매입을 선택해주세요.')
      return
    }
    
    const label = statusMap[newStatus as keyof typeof statusMap]?.label || newStatus
    if (!confirm(`${selectedIds.size}건을 '${label}'(으)로 변경하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseIds: Array.from(selectedIds), status: newStatus }),
      })
      
      if (res.ok) {
        alert(`${selectedIds.size}건의 상태가 변경되었습니다.`)
        setSelectedIds(new Set())
        fetchData()
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.')
    }
  }

  const columns: Column<Purchase>[] = [
    { key: 'purchaseNo', label: '매입번호', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'date', label: '일자', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'supplier', label: '매입처', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명' },
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ background: '#f5f5f7', padding: '2px 10px', borderRadius: '4px', fontWeight: 500 }}>
        {(v as number).toLocaleString()}
      </span>
    )},
    { key: 'unitPrice', label: '단가', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'totalAmount', label: '합계', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} statusMap={statusMap} /> },
  ]

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입내역
      </h2>

      <StatCardGrid>
        <StatCard label="이번 달 매입" value={stats.monthlyCount} unit="건" icon="📦" />
        <StatCard label="입고 대기" value={stats.pendingCount} unit="건" highlight />
        <StatCard label="총 매입금액" value={stats.totalAmount} unit="만원" />
        <StatCard label="매입처" value={stats.supplierCount} unit="곳" />
      </StatCardGrid>

      <SearchFilter
        placeholder="매입번호, 상품명 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        dateRange
        filters={[
          { 
            label: '매입처', 
            key: 'supplier', 
            options: suppliers.map(s => ({ label: s.name, value: String(s.id) }))
          },
        ]}
        actions={
          <>
            <OutlineButton onClick={handleExcelDownload}>📥 엑셀</OutlineButton>
            <PrimaryButton onClick={() => alert('매입 등록 - 준비 중')}>+ 매입등록</PrimaryButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: '입고대기', value: 'pending' },
            { label: '입고완료', value: 'completed' },
            { label: '취소', value: 'cancelled' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>로딩 중...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="매입 내역이 없습니다"
        />
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#fff', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#86868b' }}>총 {data.length}건</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#007aff' }}>
          합계: {data.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}원
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ 
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px', 
          background: '#fff', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 100,
        }}>
          <span style={{ color: '#007aff', fontWeight: 500 }}>{selectedIds.size}건 선택됨</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleStatusChange('completed')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>입고완료</button>
            <button onClick={() => handleStatusChange('cancelled')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff3b30', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>취소처리</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
