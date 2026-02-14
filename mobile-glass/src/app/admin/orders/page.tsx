'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton, PrimaryButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'
import { downloadExcel, ExcelColumn } from '@/lib/excel'

interface OrderItem {
  id: number
  orderNo: string
  store: string
  brand: string
  product: string
  quantity: number
  totalAmount: number
  status: string
  orderedAt: string
  items: {
    productName: string
    brandName: string
    quantity: number
    sph?: string
    cyl?: string
  }[]
}

interface Stats {
  todayOrders: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  todayTotal: number
}

interface Brand {
  id: number
  name: string
}

const statusLabels: Record<string, string> = {
  pending: '?€ê¸?,
  confirmed: '?•ì¸',
  shipped: 'ì¶œê³ ',
  delivered: '?„ë£Œ',
  cancelled: 'ì·¨ì†Œ',
}

export default function OrdersPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [data, setData] = useState<OrderItem[]>([])
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, todayTotal: 0 })
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '30')
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      if (selectedBrand) params.set('brandId', selectedBrand)
      
      const res = await fetch(`/api/orders?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.orders)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
      if (json.brands) setBrands(json.brands)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
    setLoading(false)
  }, [filter, search, page, selectedBrand])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert('ì£¼ë¬¸??? íƒ?´ì£¼?¸ìš”.')
      return
    }
    
    const label = statusLabels[newStatus] || newStatus
    if (!confirm(`${selectedIds.size}ê±´ì˜ ?íƒœë¥?'${label}'(??ë¡?ë³€ê²½í•˜?œê² ?µë‹ˆê¹?`)) {
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          status: newStatus,
        }),
      })
      
      if (res.ok) {
        alert(`${selectedIds.size}ê±´ì˜ ?íƒœê°€ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.`)
        setSelectedIds(new Set())
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || '?íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
      }
    } catch (error) {
      alert('?íƒœ ë³€ê²?ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.')
    }
  }

  const handleExcelDownload = () => {
    const excelColumns: ExcelColumn[] = [
      { key: 'orderNo', label: 'ì£¼ë¬¸ë²ˆí˜¸' },
      { key: 'orderedAt', label: 'ì£¼ë¬¸?¼ì‹œ' },
      { key: 'store', label: 'ê°€ë§¹ì ' },
      { key: 'brand', label: 'ë¸Œëœ?? },
      { key: 'product', label: '?í’ˆëª? },
      { key: 'quantity', label: '?˜ëŸ‰' },
      { key: 'totalAmount', label: 'ê¸ˆì•¡', format: (v) => v.toLocaleString() },
      { key: 'status', label: '?íƒœ', format: (v) => statusLabels[v] || v },
    ]
    
    const exportData = selectedIds.size > 0 
      ? data.filter(d => selectedIds.has(d.id))
      : data
    
    downloadExcel(exportData, excelColumns, `ì£¼ë¬¸?´ì—­_${new Date().toISOString().split('T')[0]}`)
    alert(`${exportData.length}ê±´ì´ ?¤ìš´ë¡œë“œ?˜ì—ˆ?µë‹ˆ??`)
  }

  const columns: Column<OrderItem>[] = [
    { key: 'orderNo', label: 'ì£¼ë¬¸ë²ˆí˜¸', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'store', label: 'ê°€ë§¹ì ', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'brand', label: 'ë¸Œëœ??, render: (v) => (
      <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '?í’ˆëª?, width: '180px' },
    { key: 'quantity', label: '?˜ëŸ‰', align: 'center', render: (v) => (
      <span style={{ background: '#eef4ee', color: '#007aff', padding: '2px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
        {v as number}
      </span>
    )},
    { key: 'totalAmount', label: 'ê¸ˆì•¡', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}??/span>
    )},
    { key: 'status', label: '?íƒœ', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'orderedAt', label: 'ì£¼ë¬¸?¼ì‹œ', render: (v) => (
      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{v as string}</span>
    )},
  ]

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      alert('ì¶œë ¥??ì£¼ë¬¸??? íƒ?´ì£¼?¸ìš”.')
      return
    }
    window.print()
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
          ?„ì²´ ì£¼ë¬¸?´ì—­
        </h2>
        <Link href="/admin/orders/new">
          <PrimaryButton>+ ì£¼ë¬¸ ?±ë¡</PrimaryButton>
        </Link>
      </div>

      <StatCardGrid>
        <StatCard label="?¤ëŠ˜ ì£¼ë¬¸" value={stats.todayOrders} unit="ê±? icon="?“¦" />
        <StatCard label="?€ê¸°ì¤‘" value={stats.pending} unit="ê±? highlight />
        <StatCard label="ì¶œê³ ?„ë£Œ" value={stats.shipped + stats.delivered} unit="ê±? />
        <StatCard label="?¤ëŠ˜ ë§¤ì¶œ" value={stats.todayTotal.toLocaleString()} unit="?? />
      </StatCardGrid>

      <SearchFilter
        placeholder="ì£¼ë¬¸ë²ˆí˜¸, ê°€ë§¹ì ëª?ê²€??
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        dateRange
        filters={[
          {
            label: 'ë¸Œëœ??,
            key: 'brand',
            value: selectedBrand,
            onChange: (v) => { setSelectedBrand(v); setPage(1); },
            options: brands.map(b => ({ label: b.name, value: String(b.id) }))
          }
        ]}
        actions={
          <>
            <OutlineButton onClick={handlePrint}>?–¨ï¸?ì¶œë ¥</OutlineButton>
            <OutlineButton onClick={handleExcelDownload}>?“¥ ?‘ì?</OutlineButton>
          </>
        }
      />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '?„ì²´', value: 'all' },
            { label: `?€ê¸?(${stats.pending})`, value: 'pending' },
            { label: `?•ì¸ (${stats.confirmed})`, value: 'confirmed' },
            { label: `ì¶œê³  (${stats.shipped})`, value: 'shipped' },
            { label: `?„ë£Œ (${stats.delivered})`, value: 'delivered' },
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          ë¡œë”© ì¤?..
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="ì£¼ë¬¸ ?´ì—­???†ìŠµ?ˆë‹¤"
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
                ?´ì „
              </button>
              <span style={{ padding: '8px 16px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
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
                ?¤ìŒ
              </button>
            </div>
          )}
        </>
      )}

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
          <span style={{ color: '#007aff', fontWeight: 500 }}>{selectedIds.size}ê±?? íƒ??/span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleStatusChange('pending')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              ?€ê¸°ì²˜ë¦?
            </button>
            <button 
              onClick={() => handleStatusChange('confirmed')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              ?•ì¸ì²˜ë¦¬
            </button>
            <button 
              onClick={() => handleStatusChange('shipped')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#5856d6', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              ì¶œê³ ì²˜ë¦¬
            </button>
            <button 
              onClick={() => handleStatusChange('delivered')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              ?„ë£Œì²˜ë¦¬
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
