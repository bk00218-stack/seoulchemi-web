'use client'

import { useState } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { Column } from '../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface SalesData {
  id: number
  store: string
  group: string
  orderCount: number
  totalAmount: number
  avgOrderAmount: number
  growth: number
}

const sampleData: SalesData[] = [
  { id: 1, store: '강남안경', group: 'A그룹', orderCount: 156, totalAmount: 12500000, avgOrderAmount: 80128, growth: 12.5 },
  { id: 2, store: '역삼안경원', group: 'A그룹', orderCount: 134, totalAmount: 10800000, avgOrderAmount: 80597, growth: 8.3 },
  { id: 3, store: '신사안경', group: 'B그룹', orderCount: 98, totalAmount: 7200000, avgOrderAmount: 73469, growth: -2.1 },
  { id: 4, store: '압구정광학', group: 'A그룹', orderCount: 112, totalAmount: 9500000, avgOrderAmount: 84821, growth: 15.7 },
  { id: 5, store: '청담안경', group: 'C그룹', orderCount: 67, totalAmount: 5100000, avgOrderAmount: 76119, growth: 4.2 },
]

const monthlyData = [
  { month: '1월', amount: 45000000 },
  { month: '2월', amount: 42000000 },
  { month: '3월', amount: 48000000 },
  { month: '4월', amount: 51000000 },
  { month: '5월', amount: 55000000 },
  { month: '6월', amount: 52000000 },
]

export default function StatsPage() {
  const totalAmount = sampleData.reduce((sum, d) => sum + d.totalAmount, 0)
  const totalOrders = sampleData.reduce((sum, d) => sum + d.orderCount, 0)
  const maxAmount = Math.max(...monthlyData.map(d => d.amount))

  const columns: Column<SalesData>[] = [
    { key: 'store', label: '가맹점', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'group', label: '그룹', render: (v) => (
      <span style={{ 
        background: '#e3f2fd',
        color: '#007aff',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px' 
      }}>
        {v as string}
      </span>
    )},
    { key: 'orderCount', label: '주문수', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}건</span>
    )},
    { key: 'totalAmount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{((v as number) / 10000).toLocaleString()}만원</span>
    )},
    { key: 'avgOrderAmount', label: '평균주문가', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'growth', label: '성장률', align: 'center', render: (v) => {
      const growth = v as number
      return (
        <span style={{ 
          color: growth > 0 ? '#34c759' : '#ff3b30',
          fontWeight: 500
        }}>
          {growth > 0 ? '+' : ''}{growth}%
        </span>
      )
    }},
  ]

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 매출 통계
      </h2>

      <StatCardGrid>
        <StatCard 
          label="이번 달 매출" 
          value={(totalAmount / 10000).toLocaleString()} 
          unit="만원" 
          icon="💰"
          trend={{ value: 8.5, isPositive: true }}
        />
        <StatCard label="총 주문수" value={totalOrders} unit="건" />
        <StatCard label="평균 주문가" value={Math.round(totalAmount / totalOrders).toLocaleString()} unit="원" />
        <StatCard label="활성 가맹점" value={sampleData.length} unit="개" />
      </StatCardGrid>

      {/* 차트 영역 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>월별 매출 추이</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px' }}>
          {monthlyData.map((data, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '100%',
                  background: idx === monthlyData.length - 1 ? '#007aff' : '#e3f2fd',
                  borderRadius: '8px 8px 0 0',
                  height: `${(data.amount / maxAmount) * 160}px`,
                  transition: 'height 0.3s ease'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#86868b' }}>{data.month}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: idx === monthlyData.length - 1 ? '#007aff' : '#666' }}>
                {(data.amount / 10000).toLocaleString()}만
              </div>
            </div>
          ))}
        </div>
      </div>

      <SearchFilter
        placeholder="가맹점명 검색"
        dateRange
        filters={[
          { label: '그룹', key: 'group', options: [
            { label: 'A그룹', value: 'A' },
            { label: 'B그룹', value: 'B' },
            { label: 'C그룹', value: 'C' },
          ]}
        ]}
        actions={
          <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="매출 데이터가 없습니다"
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '16px 20px', 
        background: '#fff', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#86868b' }}>
          총 {sampleData.length}개 가맹점
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#007aff' }}>
          총 매출: {(totalAmount / 10000).toLocaleString()}만원
        </span>
      </div>
    </AdminLayout>
  )
}
