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
  pending: '대기',
  confirmed: '확인',
  shipped: '출고',
  delivered: '완료',
  cancelled: '취소',
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
      alert('주문을 선택해주세요.')
      return
    }
    
    const label = statusLabels[newStatus] || newStatus
    if (!confirm(`${selectedIds.size}건의 상태를 '${label}'(으)로 변경하시겠습니까?`)) {
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
        alert(`${selectedIds.size}건의 상태가 변경되었습니다.`)
        setSelectedIds(new Set())
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleExcelDownload = () => {
    const excelColumns: ExcelColumn[] = [
      { key: 'orderNo', label: '주문번호' },
      { key: 'orderedAt', label: '주문일시' },
      { key: 'store', label: '가맹점' },
      { key: 'brand', label: '브랜드' },
      { key: 'product', label: '상품명' },
      { key: 'quantity', label: '수량' },
      { key: 'totalAmount', label: '금액', format: (v) => v.toLocaleString() },
      { key: 'status', label: '상태', format: (v) => statusLabels[v] || v },
    ]
    
    const exportData = selectedIds.size > 0 
      ? data.filter(d => selectedIds.has(d.id))
      : data
    
    downloadExcel(exportData, excelColumns, `주문내역_${new Date().toISOString().split('T')[0]}`)
    alert(`${exportData.length}건이 다운로드되었습니다.`)
  }

  const columns: Column<OrderItem>[] = [
    { key: 'orderNo', label: '주문번호', render: (v) => (
      <span style={{ fontWeight: 500, color: '#007aff' }}>{v as string}</span>
    )},
    { key: 'store', label: '가맹점', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
      <span style={{ background: '#f5f5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#86868b' }}>
        {v as string}
      </span>
    )},
    { key: 'product', label: '상품명', width: '180px' },
    { key: 'quantity', label: '수량', align: 'center', render: (v) => (
      <span style={{ background: '#eef4ee', color: '#007aff', padding: '2px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
        {v as number}
      </span>
    )},
    { key: 'totalAmount', label: '금액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'orderedAt', label: '주문일시', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
  ]

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      alert('출력할 주문을 선택해주세요.')
      return
    }
    window.print()
  }

  return (
    <AdminLayout activeMenu="order">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
          전체 주문내역
        </h2>
        <Link href="/admin/orders/new">
          <PrimaryButton>+ 주문 등록</PrimaryButton>
        </Link>
      </div>

      <StatCardGrid>
        <StatCard label="오늘 주문" value={stats.todayOrders} unit="건" icon="📦" />
        <StatCard label="대기중" value={stats.pending} unit="건" highlight />
        <StatCard label="출고완료" value={stats.shipped + stats.delivered} unit="건" />
        <StatCard label="오늘 매출" value={stats.todayTotal.toLocaleString()} unit="원" />
      </StatCardGrid>

      <SearchFilter
        placeholder="주문번호, 가맹점명 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        dateRange
        filters={[
          {
            label: '브랜드',
            key: 'brand',
            value: selectedBrand,
            onChange: (v) => { setSelectedBrand(v); setPage(1); },
            options: brands.map(b => ({ label: b.name, value: String(b.id) }))
          }
        ]}
        actions={
          <>
            <OutlineButton onClick={handlePrint}>🖨️ 출력</OutlineButton>
            <OutlineButton onClick={handleExcelDownload}>📥 엑셀</OutlineButton>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '전체', value: 'all' },
            { label: `대기 (${stats.pending})`, value: 'pending' },
            { label: `확인 (${stats.confirmed})`, value: 'confirmed' },
            { label: `출고 (${stats.shipped})`, value: 'shipped' },
            { label: `완료 (${stats.delivered})`, value: 'delivered' },
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
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="주문 내역이 없습니다"
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
                  border: '1px solid #e9ecef',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                이전
              </button>
              <span style={{ padding: '8px 16px', color: '#86868b', display: 'flex', alignItems: 'center' }}>
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
                  border: '1px solid #e9ecef',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                다음
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
            <button 
              onClick={() => handleStatusChange('pending')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#ff9500', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              대기처리
            </button>
            <button 
              onClick={() => handleStatusChange('confirmed')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              확인처리
            </button>
            <button 
              onClick={() => handleStatusChange('shipped')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#5856d6', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              출고처리
            </button>
            <button 
              onClick={() => handleStatusChange('delivered')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: '#34c759', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              완료처리
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
