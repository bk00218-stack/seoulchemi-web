'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

interface StoreRanking {
  rank: number
  storeId: number
  storeName: string
  storeCode: string
  orderCount: number
  totalAmount: number
  avgAmount: number
}

interface BrandRanking {
  rank: number
  brandName: string
  salesCount: number
  totalAmount: number
}

interface DailyData {
  date: string
  amount: number
  count: number
}

interface Summary {
  totalAmount: number
  totalOrders: number
  avgOrderAmount: number
  growthRate: number
  activeStores: number
}

export default function StatsPage() {
  const [summary, setSummary] = useState<Summary>({
    totalAmount: 0, totalOrders: 0, avgOrderAmount: 0, growthRate: 0, activeStores: 0
  })
  const [storeRanking, setStoreRanking] = useState<StoreRanking[]>([])
  const [brandRanking, setBrandRanking] = useState<BrandRanking[]>([])
  const [dailyTrend, setDailyTrend] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [view, setView] = useState<'store' | 'brand'>('store')

  useEffect(() => {
    fetchStats()
  }, [period])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?period=${period}`)
      const data = await res.json()
      
      if (data.error) {
        console.error(data.error)
        return
      }
      
      setSummary(data.summary)
      setStoreRanking(data.storeRanking)
      setBrandRanking(data.brandRanking)
      setDailyTrend(data.dailyTrend)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    setLoading(false)
  }

  const maxDailyAmount = Math.max(...dailyTrend.map(d => d.amount), 1)

  const storeColumns: Column<StoreRanking>[] = [
    { key: 'rank', label: '순위', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: (v as number) <= 3 ? '#ff9500' : '#86868b',
        fontSize: (v as number) <= 3 ? '14px' : '13px'
      }}>
        {v as number}
      </span>
    )},
    { key: 'storeName', label: '가맹점', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'storeCode', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'orderCount', label: '주문수', align: 'center', render: (v) => (
      <span style={{ fontWeight: 500 }}>{(v as number).toLocaleString()}건</span>
    )},
    { key: 'totalAmount', label: '총 매출', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'avgAmount', label: '평균 주문가', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{(v as number).toLocaleString()}원</span>
    )},
  ]

  const brandColumns: Column<BrandRanking>[] = [
    { key: 'rank', label: '순위', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: (v as number) <= 3 ? '#ff9500' : '#86868b'
      }}>
        {v as number}
      </span>
    )},
    { key: 'brandName', label: '브랜드', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'salesCount', label: '판매수량', align: 'center', render: (v) => (
      <span style={{ 
        background: '#e3f2fd', 
        color: '#007aff', 
        padding: '2px 10px', 
        borderRadius: '4px',
        fontWeight: 500 
      }}>
        {(v as number).toLocaleString()}개
      </span>
    )},
    { key: 'totalAmount', label: '총 매출', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{(v as number).toLocaleString()}원</span>
    )},
  ]

  if (loading) {
    return (
      <AdminLayout activeMenu="stats">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매출 통계
      </h2>

      {/* 기간 선택 */}
      <div style={{ marginBottom: '24px' }}>
        <FilterButtonGroup
          options={[
            { label: '오늘', value: 'day' },
            { label: '최근 7일', value: 'week' },
            { label: '최근 30일', value: 'month' },
            { label: '최근 1년', value: 'year' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <StatCardGrid>
        <StatCard 
          label="총 매출" 
          value={summary.totalAmount.toLocaleString()} 
          unit="원" 
          icon="💰"
          trend={summary.growthRate !== 0 ? { 
            value: Math.abs(summary.growthRate), 
            isPositive: summary.growthRate > 0 
          } : undefined}
        />
        <StatCard label="총 주문수" value={summary.totalOrders} unit="건" icon="📦" />
        <StatCard label="평균 주문가" value={summary.avgOrderAmount.toLocaleString()} unit="원" />
        <StatCard label="활성 가맹점" value={summary.activeStores} unit="개" icon="🏪" />
      </StatCardGrid>

      {/* 일별 매출 차트 */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>일별 매출 추이 (최근 14일)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', overflowX: 'auto' }}>
          {dailyTrend.map((data, idx) => (
            <div key={idx} style={{ minWidth: '50px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#007aff', marginBottom: '4px' }}>
                {data.count > 0 ? `${data.count}건` : ''}
              </div>
              <div 
                style={{ 
                  width: '100%',
                  maxWidth: '40px',
                  background: idx === dailyTrend.length - 1 ? '#007aff' : '#e3f2fd',
                  borderRadius: '6px 6px 0 0',
                  height: data.amount > 0 ? `${Math.max((data.amount / maxDailyAmount) * 120, 4)}px` : '4px',
                  transition: 'height 0.3s ease'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#86868b' }}>{data.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 뷰 전환 */}
      <div style={{ marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: '가맹점별 매출', value: 'store' },
            { label: '브랜드별 매출', value: 'brand' },
          ]}
          value={view}
          onChange={(v) => setView(v as 'store' | 'brand')}
        />
      </div>

      {view === 'store' ? (
        <>
          <DataTable
            columns={storeColumns}
            data={storeRanking}
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
              상위 {storeRanking.length}개 가맹점
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#007aff' }}>
              총 매출: {storeRanking.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}원
            </span>
          </div>
        </>
      ) : (
        <>
          <DataTable
            columns={brandColumns}
            data={brandRanking}
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
              상위 {brandRanking.length}개 브랜드
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#007aff' }}>
              총 판매: {brandRanking.reduce((sum, b) => sum + b.salesCount, 0).toLocaleString()}개
            </span>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
