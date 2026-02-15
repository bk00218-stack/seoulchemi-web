'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface StoreStat {
  id: number
  code: string
  name: string
  ownerName: string
  groupName: string | null
  orderCount: number
  totalAmount: number
  avgOrderAmount: number
  lastOrderDate: string | null
  rankChange: number
}

interface Summary {
  totalStores: number
  totalAmount: number
  totalOrders: number
  avgPerStore: number
}

export default function StoreStatsPage() {
  const [stores, setStores] = useState<StoreStat[]>([])
  const [summary, setSummary] = useState<Summary>({ totalStores: 0, totalAmount: 0, totalOrders: 0, avgPerStore: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [groupFilter, setGroupFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      // 기간 계산
      const now = new Date()
      let startDate: Date
      
      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const res = await fetch(`/api/stats?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        const storeStats = (data.storeStats || []).map((s: any, idx: number) => ({
          ...s,
          rankChange: Math.floor(Math.random() * 5) - 2 // Mock rank change
        }))
        setStores(storeStats)
        
        // Calculate summary
        const totalAmount = storeStats.reduce((sum: number, s: StoreStat) => sum + s.totalAmount, 0)
        const totalOrders = storeStats.reduce((sum: number, s: StoreStat) => sum + s.orderCount, 0)
        setSummary({
          totalStores: storeStats.length,
          totalAmount,
          totalOrders,
          avgPerStore: storeStats.length > 0 ? Math.round(totalAmount / storeStats.length) : 0
        })
      }
    } catch (error) {
      console.error('Failed to load store stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<StoreStat>[] = [
    { key: 'id', label: '순위', width: '70px', align: 'center', render: (_, __, idx) => {
      const rank = (idx || 0) + 1
      const rankChange = stores[idx || 0]?.rankChange || 0
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '16px',
            color: rank <= 3 ? '#007aff' : '#1d1d1f'
          }}>
            {rank}
          </span>
          {rankChange !== 0 && (
            <span style={{ 
              fontSize: '10px', 
              color: rankChange > 0 ? '#34c759' : '#ff3b30'
            }}>
              {rankChange > 0 ? '▲' : '▼'}{Math.abs(rankChange)}
            </span>
          )}
        </div>
      )
    }},
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '가맹점명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'groupName', label: '그룹', render: (v) => (
      v ? (
        <span style={{ 
          background: '#f0f7ff', 
          color: '#007aff', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '12px' 
        }}>
          {v as string}
        </span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>-</span>
      )
    )},
    { key: 'orderCount', label: '주문수', align: 'center', render: (v) => (
      <span>{(v as number).toLocaleString()}건</span>
    )},
    { key: 'totalAmount', label: '매출액', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600 }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'avgOrderAmount', label: '평균주문액', align: 'right', render: (v) => (
      <span style={{ color: '#666' }}>{Math.round(v as number).toLocaleString()}원</span>
    )},
    { key: 'lastOrderDate', label: '최근주문', align: 'center', render: (v) => (
      v ? (
        <span style={{ fontSize: '12px' }}>
          {new Date(v as string).toLocaleDateString('ko-KR')}
        </span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>-</span>
      )
    )},
  ]

  const filteredStores = stores.filter(s => {
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    const matchGroup = !groupFilter || s.groupName === groupFilter
    return matchSearch && matchGroup
  })

  const groupNames = [...new Set(stores.filter(s => s.groupName).map(s => s.groupName as string))]
  const maxAmount = Math.max(...stores.map(s => s.totalAmount), 1)

  return (
    <AdminLayout activeMenu="stats">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>가맹점별 통계</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>가맹점별 매출 순위 및 현황을 분석합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'week', label: '이번 주' },
            { value: 'month', label: '이번 달' },
            { value: 'year', label: '올해' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: period === opt.value ? '#007aff' : '#f3f4f6',
                color: period === opt.value ? '#fff' : '#1d1d1f',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>총 매출</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{(summary.totalAmount / 10000).toFixed(0)}만원</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>거래 가맹점</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{summary.totalStores}개</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>총 주문</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{summary.totalOrders.toLocaleString()}건</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#86868b', marginBottom: '8px' }}>가맹점당 평균</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{(summary.avgPerStore / 10000).toFixed(1)}만원</div>
        </div>
      </div>

      {/* TOP 5 시각화 */}
      {stores.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>🏆 매출 TOP 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stores.slice(0, 5).map((store, idx) => (
              <div key={store.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px',
                  background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#f5f5f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: idx < 3 ? '#fff' : '#86868b'
                }}>
                  {idx + 1}
                </div>
                <div style={{ width: '120px', fontWeight: 500, fontSize: '14px' }}>{store.name}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '24px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(store.totalAmount / maxAmount) * 100}%`,
                      background: idx === 0 ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : '#007aff',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px'
                    }}>
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                        {store.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', color: '#86868b' }}>
                  {store.orderCount}건
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SearchFilter
        placeholder="가맹점명, 코드 검색"
        value={search}
        onChange={setSearch}
        filters={[
          {
            key: 'group',
            label: '그룹',
            options: [
              { label: '전체 그룹', value: '' },
              ...groupNames.map(g => ({ label: g, value: g }))
            ],
            value: groupFilter,
            onChange: setGroupFilter
          }
        ]}
        actions={
          <button
            onClick={() => window.open(`/api/stats/export?type=store&period=${period}`, '_blank')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff',
              color: '#1d1d1f',
              border: '1px solid #e9ecef',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📥 엑셀
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredStores}
        loading={loading}
        emptyMessage="매출 데이터가 없습니다"
      />
    </AdminLayout>
  )
}
