'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface ShippingStats {
  id: number
  date: string
  totalOrders: number
  shippedOrders: number
  pendingOrders: number
  avgShippingTime: number
  onTimeRate: number
}

const sampleData: ShippingStats[] = [
  { id: 1, date: '2024-01-15', totalOrders: 45, shippedOrders: 42, pendingOrders: 3, avgShippingTime: 1.2, onTimeRate: 95.5 },
  { id: 2, date: '2024-01-14', totalOrders: 38, shippedOrders: 38, pendingOrders: 0, avgShippingTime: 1.1, onTimeRate: 97.4 },
  { id: 3, date: '2024-01-13', totalOrders: 52, shippedOrders: 50, pendingOrders: 2, avgShippingTime: 1.4, onTimeRate: 92.3 },
  { id: 4, date: '2024-01-12', totalOrders: 41, shippedOrders: 41, pendingOrders: 0, avgShippingTime: 1.0, onTimeRate: 98.0 },
  { id: 5, date: '2024-01-11', totalOrders: 36, shippedOrders: 35, pendingOrders: 1, avgShippingTime: 1.3, onTimeRate: 94.3 },
  { id: 6, date: '2024-01-10', totalOrders: 48, shippedOrders: 48, pendingOrders: 0, avgShippingTime: 1.1, onTimeRate: 97.9 },
]

export default function ShippingStatsPage() {
  const totalOrders = sampleData.reduce((sum, d) => sum + d.totalOrders, 0)
  const totalShipped = sampleData.reduce((sum, d) => sum + d.shippedOrders, 0)
  const avgOnTimeRate = (sampleData.reduce((sum, d) => sum + d.onTimeRate, 0) / sampleData.length).toFixed(1)
  const avgShippingTime = (sampleData.reduce((sum, d) => sum + d.avgShippingTime, 0) / sampleData.length).toFixed(1)

  const columns: Column<ShippingStats>[] = [
    { key: 'date', label: '날짜', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'totalOrders', label: '총 주문', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as number}건</span>
    )},
    { key: 'shippedOrders', label: '출고 완료', align: 'center', render: (v) => (
      <span style={{ color: '#34c759', fontWeight: 500 }}>{v as number}건</span>
    )},
    { key: 'pendingOrders', label: '대기', align: 'center', render: (v) => (
      <span style={{ 
        color: v as number > 0 ? '#ff9500' : '#86868b',
        fontWeight: v as number > 0 ? 500 : 400
      }}>
        {v as number}건
      </span>
    )},
    { key: 'avgShippingTime', label: '평균 출고시간', align: 'center', render: (v) => (
      <span style={{ color: '#666' }}>{v}일</span>
    )},
    { key: 'onTimeRate', label: '정시출고율', align: 'center', render: (v) => {
      const rate = v as number
      return (
        <span style={{ 
          color: rate >= 95 ? '#34c759' : rate >= 90 ? '#ff9500' : '#ff3b30',
          fontWeight: 500
        }}>
          {rate}%
        </span>
      )
    }},
  ]

  // 일별 출고 현황 바 차트
  const maxOrders = Math.max(...sampleData.map(d => d.totalOrders))

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 출고 통계
      </h2>

      <StatCardGrid>
        <StatCard label="총 주문" value={totalOrders} unit="건" icon="📦" />
        <StatCard label="출고 완료" value={totalShipped} unit="건" />
        <StatCard label="평균 출고시간" value={avgShippingTime} unit="일" />
        <StatCard label="정시출고율" value={avgOnTimeRate} unit="%" highlight />
      </StatCardGrid>

      {/* 일별 출고 현황 차트 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>일별 출고 현황</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px' }}>
          {sampleData.slice().reverse().map((data, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div 
                  style={{ 
                    width: '100%',
                    background: '#ff950040',
                    borderRadius: '4px 4px 0 0',
                    height: `${(data.pendingOrders / maxOrders) * 140}px`,
                  }}
                />
                <div 
                  style={{ 
                    width: '100%',
                    background: '#34c759',
                    borderRadius: data.pendingOrders > 0 ? '0' : '4px 4px 0 0',
                    height: `${(data.shippedOrders / maxOrders) * 140}px`,
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#86868b' }}>
                {data.date.split('-').slice(1).join('/')}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#34c759' }} />
            <span style={{ fontSize: '12px', color: '#666' }}>출고완료</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ff950040' }} />
            <span style={{ fontSize: '12px', color: '#666' }}>대기중</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="날짜 검색"
        dateRange
        actions={
          <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="출고 통계가 없습니다"
      />
    </AdminLayout>
  )
}
