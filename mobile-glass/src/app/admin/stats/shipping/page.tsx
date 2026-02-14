'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface ShippingStat {
  date: string
  totalOrders: number
  shipped: number
  delivered: number
  pending: number
  avgTime: number
}

export default function ShippingStatsPage() {
  const [data, setData] = useState<ShippingStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      // 주문 데이터에서 출고 통계 집계
      const res = await fetch('/api/orders?limit=1000')
      const result = await res.json()
      const orders = result.orders || []
      
      // 날짜별 집계
      const byDate = new Map<string, { total: number; shipped: number; delivered: number; pending: number }>()
      
      orders.forEach((order: { orderedAt: string; status: string }) => {
        const date = new Date(order.orderedAt).toISOString().split('T')[0]
        if (!byDate.has(date)) {
          byDate.set(date, { total: 0, shipped: 0, delivered: 0, pending: 0 })
        }
        const stat = byDate.get(date)!
        stat.total++
        if (order.status === 'shipped') stat.shipped++
        else if (order.status === 'delivered') stat.delivered++
        else if (order.status === 'pending') stat.pending++
      })
      
      const stats = Array.from(byDate.entries())
        .map(([date, stat]) => ({
          date,
          totalOrders: stat.total,
          shipped: stat.shipped,
          delivered: stat.delivered,
          pending: stat.pending,
          avgTime: 1.5 // 임시 평균 배송시간
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14)
      
      setData(stats)
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<ShippingStat>[] = [
    { key: 'date', label: '날짜', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'totalOrders', label: '총 주문', align: 'center', render: (v) => <span>{v as number}건</span> },
    { key: 'shipped', label: '출고', align: 'center', render: (v) => <span style={{ color: '#007aff' }}>{v as number}건</span> },
    { key: 'delivered', label: '배송완료', align: 'center', render: (v) => <span style={{ color: '#34c759' }}>{v as number}건</span> },
    { key: 'pending', label: '대기', align: 'center', render: (v) => <span style={{ color: '#ff9500' }}>{v as number}건</span> },
    { key: 'avgTime', label: '평균 배송시간', align: 'center', render: (v) => <span style={{ color: '#86868b' }}>{v as number}일</span> },
  ]

  const totalOrders = data.reduce((sum, d) => sum + d.totalOrders, 0)
  const totalShipped = data.reduce((sum, d) => sum + d.shipped + d.delivered, 0)

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>가맹점 출고 통계</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 주문</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{totalOrders}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>출고완료</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{totalShipped}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>출고율</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalOrders ? Math.round(totalShipped / totalOrders * 100) : 0}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>%</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>평균 배송시간</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>1.5<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>일</span></div>
        </div>
      </div>

      <SearchFilter placeholder="날짜 검색" />

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="출고 데이터가 없습니다" />
    </AdminLayout>
  )
}
