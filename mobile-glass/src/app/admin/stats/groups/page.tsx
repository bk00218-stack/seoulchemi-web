'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface GroupStats {
  id: number
  group: string
  storeCount: number
  totalOrders: number
  totalAmount: number
  avgPerStore: number
  topProduct: string
  growth: number
}

const sampleData: GroupStats[] = [
  { id: 1, group: 'A그룹', storeCount: 15, totalOrders: 892, totalAmount: 72500000, avgPerStore: 4833333, topProduct: '크리잘 사파이어', growth: 12.5 },
  { id: 2, group: 'B그룹', storeCount: 28, totalOrders: 1245, totalAmount: 58300000, avgPerStore: 2082143, topProduct: '블루컨트롤', growth: 8.3 },
  { id: 3, group: 'C그룹', storeCount: 45, totalOrders: 987, totalAmount: 42100000, avgPerStore: 935556, topProduct: '씨맥스', growth: -1.2 },
  { id: 4, group: 'D그룹', storeCount: 12, totalOrders: 234, totalAmount: 12800000, avgPerStore: 1066667, topProduct: '크리잘 블루컷', growth: 25.7 },
]

export default function GroupStatsPage() {
  const totalAmount = sampleData.reduce((sum, d) => sum + d.totalAmount, 0)
  const totalStores = sampleData.reduce((sum, d) => sum + d.storeCount, 0)
  const totalOrders = sampleData.reduce((sum, d) => sum + d.totalOrders, 0)

  const columns: Column<GroupStats>[] = [
    { key: 'group', label: '그룹', render: (v) => (
      <span style={{ 
        fontWeight: 600,
        color: '#007aff',
        fontSize: '15px'
      }}>
        {v as string}
      </span>
    )},
    { key: 'storeCount', label: '가맹점수', align: 'center', render: (v) => (
      <span style={{ 
        background: '#e3f2fd',
        color: '#007aff',
        padding: '3px 10px', 
        borderRadius: '12px', 
        fontSize: '13px',
        fontWeight: 500
      }}>
        {v as number}개
      </span>
    )},
    { key: 'totalOrders', label: '총 주문', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}건</span>
    )},
    { key: 'totalAmount', label: '총 매출', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{((v as number) / 10000).toLocaleString()}만원</span>
    )},
    { key: 'avgPerStore', label: '가맹점당 평균', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{((v as number) / 10000).toLocaleString()}만원</span>
    )},
    { key: 'topProduct', label: '인기상품', render: (v) => (
      <span style={{ 
        background: '#f5f5f7',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        color: '#666'
      }}>
        {v as string}
      </span>
    )},
    { key: 'growth', label: '성장률', align: 'center', render: (v) => {
      const growth = v as number
      return (
        <span style={{ 
          color: growth > 0 ? '#34c759' : '#ff3b30',
          fontWeight: 500
        }}>
          {growth > 0 ? '↑' : '↓'} {Math.abs(growth)}%
        </span>
      )
    }},
  ]

  // 그룹별 매출 비율
  const maxAmount = Math.max(...sampleData.map(d => d.totalAmount))

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 상품 통계
      </h2>

      <StatCardGrid>
        <StatCard label="전체 가맹점" value={totalStores} unit="개" icon="🏪" />
        <StatCard label="총 주문" value={totalOrders.toLocaleString()} unit="건" />
        <StatCard label="총 매출" value={(totalAmount / 10000).toLocaleString()} unit="만원" />
        <StatCard label="그룹 수" value={sampleData.length} unit="개" />
      </StatCardGrid>

      {/* 그룹별 비교 차트 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>그룹별 매출 비교</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sampleData.map((data, idx) => {
            const percentage = (data.totalAmount / totalAmount * 100).toFixed(1)
            const colors = ['#007aff', '#34c759', '#ff9500', '#af52de']
            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 600, color: colors[idx % colors.length] }}>{data.group}</span>
                    <span style={{ fontSize: '12px', color: '#86868b' }}>{data.storeCount}개 가맹점</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{(data.totalAmount / 10000).toLocaleString()}만원</span>
                    <span style={{ fontSize: '12px', color: '#86868b' }}>({percentage}%)</span>
                  </div>
                </div>
                <div style={{ 
                  height: '24px', 
                  background: '#f5f5f7', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(data.totalAmount / maxAmount) * 100}%`, 
                    background: colors[idx % colors.length],
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '12px',
                    minWidth: '60px'
                  }}>
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>{data.totalOrders}건</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <SearchFilter
        placeholder="그룹명 검색"
        dateRange
        actions={
          <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="그룹 통계가 없습니다"
      />
    </AdminLayout>
  )
}
