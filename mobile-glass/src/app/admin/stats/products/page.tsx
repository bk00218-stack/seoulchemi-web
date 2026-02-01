'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface ProductStats {
  id: number
  rank: number
  brand: string
  product: string
  category: string
  salesCount: number
  totalAmount: number
  avgPrice: number
  growth: number
}

const sampleData: ProductStats[] = [
  { id: 1, rank: 1, brand: '에실로', product: '크리잘 사파이어 1.60', category: '단초점', salesCount: 456, totalAmount: 38760000, avgPrice: 85000, growth: 15.2 },
  { id: 2, rank: 2, brand: '호야', product: '블루컨트롤 1.60', category: '단초점', salesCount: 389, totalAmount: 26452000, avgPrice: 68000, growth: 8.7 },
  { id: 3, rank: 3, brand: '에실로', product: '크리잘 블루컷 1.60', category: '단초점', salesCount: 342, totalAmount: 25650000, avgPrice: 75000, growth: 12.3 },
  { id: 4, rank: 4, brand: '에실로', product: '바리락스 X 1.60', category: '누진다초점', salesCount: 98, totalAmount: 34300000, avgPrice: 350000, growth: 22.1 },
  { id: 5, rank: 5, brand: '칼자이스', product: '드라이브세이프 1.67', category: '단초점', salesCount: 67, totalAmount: 21440000, avgPrice: 320000, growth: -3.5 },
]

export default function ProductStatsPage() {
  const totalAmount = sampleData.reduce((sum, d) => sum + d.totalAmount, 0)
  const totalCount = sampleData.reduce((sum, d) => sum + d.salesCount, 0)

  const columns: Column<ProductStats>[] = [
    { key: 'rank', label: '순위', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600,
        color: v === 1 ? '#ff9500' : v === 2 ? '#86868b' : v === 3 ? '#cd7f32' : '#1d1d1f',
        fontSize: v as number <= 3 ? '16px' : '14px'
      }}>
        {v as number <= 3 ? ['🥇', '🥈', '🥉'][v as number - 1] : v}
      </span>
    )},
    { key: 'brand', label: '브랜드', render: (v) => (
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
    { key: 'product', label: '상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'category', label: '카테고리', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'salesCount', label: '판매수', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}개</span>
    )},
    { key: 'totalAmount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{((v as number) / 10000).toLocaleString()}만원</span>
    )},
    { key: 'avgPrice', label: '평균단가', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
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

  // 브랜드별 매출 비율
  const brandStats = sampleData.reduce((acc, d) => {
    acc[d.brand] = (acc[d.brand] || 0) + d.totalAmount
    return acc
  }, {} as Record<string, number>)

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 상품 통계
      </h2>

      <StatCardGrid>
        <StatCard label="총 판매 상품" value={totalCount} unit="개" icon="📦" />
        <StatCard label="총 매출액" value={(totalAmount / 10000).toLocaleString()} unit="만원" />
        <StatCard label="평균 단가" value={Math.round(totalAmount / totalCount).toLocaleString()} unit="원" />
        <StatCard label="상품 종류" value={sampleData.length} unit="종" />
      </StatCardGrid>

      {/* 브랜드별 비율 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>브랜드별 매출 비율</h3>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            {Object.entries(brandStats).sort((a, b) => b[1] - a[1]).map(([brand, amount], idx) => {
              const percentage = (amount / totalAmount * 100).toFixed(1)
              const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30']
              return (
                <div key={brand} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{brand}</span>
                    <span style={{ fontSize: '14px', color: '#86868b' }}>{percentage}%</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: '#f5f5f7', 
                    borderRadius: '4px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      background: colors[idx % colors.length],
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(brandStats).sort((a, b) => b[1] - a[1]).map(([brand, amount], idx) => {
              const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30']
              return (
                <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: colors[idx % colors.length] }} />
                  <span style={{ fontSize: '12px', color: '#666' }}>{brand}: {(amount / 10000).toLocaleString()}만원</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="상품명 검색"
        dateRange
        filters={[
          { label: '브랜드', key: 'brand', options: [
            { label: '에실로', value: 'essilor' },
            { label: '호야', value: 'hoya' },
            { label: '칼자이스', value: 'zeiss' },
          ]},
          { label: '카테고리', key: 'category', options: [
            { label: '단초점', value: 'single' },
            { label: '누진다초점', value: 'progressive' },
          ]}
        ]}
        actions={
          <OutlineButton onClick={() => alert('엑셀 다운로드')}>📥 엑셀</OutlineButton>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="상품 통계가 없습니다"
      />
    </AdminLayout>
  )
}
