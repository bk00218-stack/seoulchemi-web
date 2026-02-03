'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface GroupStat {
  id: number
  name: string
  storeType: string
  storeCount: number
  orderCount: number
  totalAmount: number
}

export default function GroupStatsPage() {
  const [data, setData] = useState<GroupStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/store-groups')
      const groups = await res.json()
      
      // 각 그룹에 임시 통계 추가 (실제로는 주문 집계 필요)
      const stats = groups.map((g: { id: number; name: string; storeType: string; storeCount: number }) => ({
        ...g,
        orderCount: Math.floor(Math.random() * 100),
        totalAmount: Math.floor(Math.random() * 10000000)
      }))
      
      setData(stats)
    } catch (error) {
      console.error('Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<GroupStat>[] = [
    { key: 'name', label: '그룹명', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'storeType', label: '타입', render: (v) => {
      const types: Record<string, string> = { normal: '일반', vip: 'VIP', wholesale: '도매' }
      return <span style={{ background: '#f0f7ff', color: '#007aff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{types[v as string] || v}</span>
    }},
    { key: 'storeCount', label: '가맹점', align: 'center', render: (v) => <span>{v as number}개</span> },
    { key: 'orderCount', label: '주문수', align: 'center', render: (v) => <span>{v as number}건</span> },
    { key: 'totalAmount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}원</span>
    )},
  ]

  const totalStores = data.reduce((sum, d) => sum + d.storeCount, 0)
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0)
  const totalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0)

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>그룹별 상품 통계</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 그룹</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{data.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 가맹점</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalStores}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 주문</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{totalOrders}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 매출</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{Math.round(totalAmount / 10000).toLocaleString()}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>만원</span></div>
        </div>
      </div>

      <SearchFilter placeholder="그룹명 검색" />

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="그룹이 없습니다" />
    </AdminLayout>
  )
}
