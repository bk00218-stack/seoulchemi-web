'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'
import { downloadExcel, ExcelColumn } from '@/lib/excel'

interface RxOrder {
  id: number
  orderNo: string
  store: string
  brand: string
  product: string
  rightSph: string
  rightCyl: string
  rightAxis: string
  leftSph: string
  leftCyl: string
  leftAxis: string
  pd: string
  add: string
  quantity: number
  amount: number
  status: string
  orderedAt: string
}

interface Stats {
  monthlyOrders: number
  pending: number
  totalAmount: number
  avgAmount: number
}

export default function RxOrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [data, setData] = useState<RxOrder[]>([])
  const [stats, setStats] = useState<Stats>({ monthlyOrders: 0, pending: 0, totalAmount: 0, avgAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/orders/rx?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.orders)
      setStats(json.stats)
    } catch (error) {
      console.error('Failed to fetch RX orders:', error)
    }
    setLoading(false)
  }, [filter, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData()

  const handleExcelDownload = () => {
    const excelColumns: ExcelColumn[] = [
      { key: 'orderNo', label: 'ì£¼ë¬¸ë²ˆí˜¸' },
      { key: 'orderedAt', label: 'ì£¼ë¬¸?¼ì‹œ' },
      { key: 'store', label: 'ê°€ë§¹ì ' },
      { key: 'brand', label: 'ë¸Œëœ?? },
      { key: 'product', label: '?í’ˆëª? },
      { key: 'rightSph', label: 'R SPH' },
      { key: 'rightCyl', label: 'R CYL' },
      { key: 'rightAxis', label: 'R AXIS' },
      { key: 'leftSph', label: 'L SPH' },
      { key: 'leftCyl', label: 'L CYL' },
      { key: 'leftAxis', label: 'L AXIS' },
      { key: 'pd', label: 'PD' },
      { key: 'add', label: 'ADD' },
      { key: 'amount', label: 'ê¸ˆì•¡', format: (v) => v.toLocaleString() },
      { key: 'status', label: '?íƒœ', format: (v) => ({ pending: '?€ê¸?, confirmed: '?œì‘ì¤?, shipped: 'ì¶œê³ ', delivered: '?„ë£Œ' }[v] || v) },
    ]
    
    const exportData = selectedIds.size > 0 
      ? data.filter(d => selectedIds.has(d.id))
      : data
    
    downloadExcel(exportData, excelColumns, `RXì£¼ë¬¸_${new Date().toISOString().split('T')[0]}`)
    alert(`${exportData.length}ê±´ì´ ?¤ìš´ë¡œë“œ?˜ì—ˆ?µë‹ˆ??`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('ì£¼ë¬¸??? íƒ?´ì£¼?¸ìš”.')
      return
    }
    
    const labels: Record<string, string> = {
      pending: '?€ê¸?,
      confirmed: '?œì‘ì¤?,
      shipped: 'ì¶œê³ ',
      delivered: '?„ë£Œ'
    }
    
    if (!confirm(`${selectedIds.size}ê±´ì„ '${labels[newStatus] || newStatus}'(??ë¡?ë³€ê²½í•˜?œê² ?µë‹ˆê¹?`)) {
      return
    }

    try {
      const res = await fetch('/api/orders/rx', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), status: newStatus }),
      })
      
      if (res.ok) {
        alert(`${selectedIds.size}ê±´ì˜ ?íƒœê°€ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.`)
        setSelectedIds(new Set())
        fetchData()
      }
    } catch (error) {
      alert('?íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    }
  }

  const columns: Column<RxOrder>[] = [
    { key: 'orderNo', label: 'ì£¼ë¬¸ë²ˆí˜¸', render: (v) => <span style={{ fontWeight: 500, color: '#af52de' }}>{v as string}</span> },
    { key: 'store', label: 'ê°€ë§¹ì ' },
    { key: 'brand', label: 'ë¸Œëœ??, render: (v) => (
      <span style={{ background: '#f3e5f5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#af52de' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '?í’ˆëª?, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'rightSph', label: 'R (SPH/CYL/AXIS)', width: '140px', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
        {row.rightSph}/{row.rightCyl}/{row.rightAxis}Â°
      </span>
    )},
    { key: 'leftSph', label: 'L (SPH/CYL/AXIS)', width: '140px', render: (_, row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
        {row.leftSph}/{row.leftCyl}/{row.leftAxis}Â°
      </span>
    )},
    { key: 'pd', label: 'PD', align: 'center' },
    { key: 'add', label: 'ADD', align: 'center', render: (v) => (
      <span style={{ color: '#007aff', fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'amount', label: 'ê¸ˆì•¡', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'status', label: '?íƒœ', render: (v) => <StatusBadge status={v as string} /> },
  ]

  const filteredData = filter === 'all' ? data : data.filter(o => o.status === filter)

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        RX ì£¼ë¬¸?´ì—­
      </h2>

      <StatCardGrid>
        <StatCard label="?´ë²ˆ ??RX ì£¼ë¬¸" value={stats.monthlyOrders} unit="ê±? icon="?‘“" />
        <StatCard label="?œì‘ ?€ê¸? value={stats.pending} unit="ê±? highlight />
        <StatCard label="ì´?ì£¼ë¬¸ê¸ˆì•¡" value={stats.totalAmount.toLocaleString()} unit="?? />
        <StatCard label="?‰ê·  ?¨ê?" value={stats.avgAmount.toLocaleString()} unit="?? />
      </StatCardGrid>

      <SearchFilter
        placeholder="ì£¼ë¬¸ë²ˆí˜¸, ê°€ë§¹ì ëª?ê²€??
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        dateRange
        actions={
          <>
            <OutlineButton onClick={() => window.print()}>?–¨ï¸?ì¶œë ¥</OutlineButton>
            <OutlineButton onClick={handleExcelDownload}>?“¥ ?‘ì?</OutlineButton>
          </>
        }
      />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '?„ì²´', value: 'all' },
            { label: '?€ê¸?, value: 'pending' },
            { label: '?œì‘ì¤?, value: 'confirmed' },
            { label: 'ì¶œê³ ', value: 'shipped' },
            { label: '?„ë£Œ', value: 'delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="RX ì£¼ë¬¸ ?´ì—­???†ìŠµ?ˆë‹¤"
        />
      )}

      {/* RX ?ì„¸ ?•ë³´ ?ˆë‚´ */}
      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#f0f7ff', 
        borderRadius: '12px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ fontSize: '13px', color: '#007aff', fontWeight: 500, marginBottom: '8px' }}>
          ?’¡ RX ì£¼ë¬¸ ?ˆë‚´
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          RX ì£¼ë¬¸?€ ê°œì¸ ë§ì¶¤ ?œì‘ ?í’ˆ?¼ë¡œ, ì£¼ë¬¸ ?•ì¸ ???œì‘???œì‘?©ë‹ˆ?? 
          ?œì‘ ê¸°ê°„?€ ë¸Œëœ??ë°??Œì¦ˆ ?€?…ì— ?°ë¼ 3~7???Œìš”?©ë‹ˆ??
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ 
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px', 
          background: 'var(--bg-primary)', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 100,
        }}>
          <span style={{ color: '#af52de', fontWeight: 500 }}>{selectedIds.size}ê±?? íƒ??/span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleStatusChange('pending')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>?€ê¸°ì²˜ë¦?/button>
            <button onClick={() => handleStatusChange('confirmed')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#af52de', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>?œì‘?œì‘</button>
            <button onClick={() => handleStatusChange('shipped')} style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>ë°œì†¡?„ë£Œ</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
