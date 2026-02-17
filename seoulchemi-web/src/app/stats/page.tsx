'use client'

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { STATS_SIDEBAR } from '../constants/sidebar'
import { exportToCSV } from '../components/ExcelExport'

interface StoreStat {
  storeId: number
  storeName: string
  storeCode: string
  groupName: string
  region: string
  salesStaffName: string
  status: string
  prevBalance: number
  saleAmount: number
  returnAmount: number
  depositAmount: number
  discountAmount: number
  totalOutstanding: number
  netSales: number
}

interface Summary {
  prevBalance: number
  saleAmount: number
  returnAmount: number
  depositAmount: number
  discountAmount: number
  totalOutstanding: number
  netSales: number
}

interface Group {
  id: number
  name: string
}

interface Staff {
  id: number
  name: string
}

export default function StatsPage() {
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [groupId, setGroupId] = useState('')
  const [region, setRegion] = useState('')
  const [salesStaffId, setSalesStaffId] = useState('')
  
  const [stores, setStores] = useState<StoreStat[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  
  const [groups, setGroups] = useState<Group[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  
  // 필터 데이터 로드
  useEffect(() => {
    fetch('/api/groups').then(r => r.json()).then(d => setGroups(d.groups || []))
    fetch('/api/stores?limit=1000').then(r => r.json()).then(d => {
      const uniqueRegions = [...new Set((d.stores || []).map((s: any) => s.region).filter(Boolean))]
      setRegions(uniqueRegions as string[])
    })
    fetch('/api/staff').then(r => r.json()).then(d => setStaffs(d.staff || []))
  }, [])
  
  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (groupId) params.set('groupId', groupId)
      if (region) params.set('region', region)
      if (salesStaffId) params.set('salesStaffId', salesStaffId)
      
      const res = await fetch(`/api/stats/sales?${params.toString()}`)
      const data = await res.json()
      
      setStores(data.stores || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error('Search failed:', error)
      setStores([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }
  
  const handleQuickDate = (type: string) => {
    const now = new Date()
    let from = new Date()
    let to = new Date()
    
    switch (type) {
      case 'yesterday':
        from.setDate(now.getDate() - 1)
        to.setDate(now.getDate() - 1)
        break
      case 'today':
        break
      case 'week':
        from.setDate(now.getDate() - now.getDay())
        break
      case 'month':
        from.setDate(1)
        break
    }
    
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }
  
  const handleExportExcel = () => {
    if (stores.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }
    
    const exportData = stores.map(s => ({
      groupName: s.groupName,
      storeName: s.storeName,
      status: s.status === 'active' ? '정상' : s.status === 'suspended' ? '정지' : s.status,
      region: s.region,
      salesStaffName: s.salesStaffName,
      prevBalance: s.prevBalance,
      saleAmount: s.saleAmount,
      returnAmount: s.returnAmount,
      depositAmount: s.depositAmount,
      discountAmount: s.discountAmount,
      totalOutstanding: s.totalOutstanding,
      netSales: s.netSales,
    }))
    
    const columns = [
      { key: 'groupName', label: '그룹명' },
      { key: 'storeName', label: '가맹점명' },
      { key: 'status', label: '상태' },
      { key: 'region', label: '지역' },
      { key: 'salesStaffName', label: '영업사원' },
      { key: 'prevBalance', label: '전전액' },
      { key: 'saleAmount', label: '주문금액' },
      { key: 'returnAmount', label: '반품금액' },
      { key: 'depositAmount', label: '입금액' },
      { key: 'discountAmount', label: '할인금액' },
      { key: 'totalOutstanding', label: '총미수' },
      { key: 'netSales', label: '실매출액' },
    ]
    
    exportToCSV(exportData, columns, `매출통계_${dateFrom}_${dateTo}`)
  }

  const cardStyle = { background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
  const thStyle = { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, fontSize: 13, color: '#666', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }
  const tdStyle = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
        {/* 헤더 */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#212529', margin: 0 }}>📊 가맹점 매출통계</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>가맹점별 매출 현황을 확인합니다</p>
        </div>

        {/* 필터 */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
              <option value="">그룹 전체</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
              <option value="">지역 전체</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            
            <select value={salesStaffId} onChange={e => setSalesStaffId(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
              <option value="">영업사원 전체</option>
              {staffs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>기간:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
              <span style={{ color: '#999' }}>~</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
            </div>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'yesterday', label: '어제' },
                { key: 'today', label: '오늘' },
                { key: 'week', label: '이번주' },
                { key: 'month', label: '이번달' },
              ].map(btn => (
                <button key={btn.key} onClick={() => handleQuickDate(btn.key)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', fontSize: 12, color: '#666', cursor: 'pointer' }}>
                  {btn.label}
                </button>
              ))}
            </div>
            
            <button onClick={handleSearch} disabled={loading}
              style={{ padding: '8px 20px', background: '#5d7a5d', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? '검색중...' : '검색'}
            </button>
            
            {stores.length > 0 && (
              <button onClick={handleExportExcel}
                style={{ padding: '8px 16px', background: '#fff', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                📥 엑셀
              </button>
            )}
          </div>
        </div>

        {/* 요약 카드 */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: '주문금액', value: summary.saleAmount, color: '#1565c0' },
              { label: '반품금액', value: summary.returnAmount, color: '#d32f2f' },
              { label: '입금액', value: summary.depositAmount, color: '#2e7d32' },
              { label: '할인금액', value: summary.discountAmount, color: '#ed6c02' },
              { label: '총미수', value: summary.totalOutstanding, color: '#424242' },
            ].map((stat, i) => (
              <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* 테이블 */}
        <div style={{ ...cardStyle, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>그룹명</th>
                  <th style={thStyle}>가맹점명</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>지역</th>
                  <th style={thStyle}>영업사원</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>전전액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>주문금액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>반품금액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>입금액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>할인금액</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>총미수</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>실매출액</th>
                </tr>
              </thead>
              <tbody>
                {!searched ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                      검색 조건을 선택하고 검색 버튼을 눌러주세요
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                      검색중...
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  stores.map(store => (
                    <tr key={store.storeId} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>{store.groupName}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{store.storeName}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 11,
                          background: store.status === 'active' ? '#e8f5e9' : '#ffebee',
                          color: store.status === 'active' ? '#2e7d32' : '#d32f2f'
                        }}>
                          {store.status === 'active' ? '정상' : store.status === 'suspended' ? '정지' : store.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{store.region}</td>
                      <td style={tdStyle}>{store.salesStaffName}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{store.prevBalance.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#1565c0', fontWeight: 500 }}>{store.saleAmount.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#d32f2f' }}>{store.returnAmount.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#2e7d32' }}>{store.depositAmount.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ed6c02' }}>{store.discountAmount.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{store.totalOutstanding.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: store.netSales >= 0 ? '#1565c0' : '#d32f2f' }}>
                        {store.netSales.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {summary && stores.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8f9fa', fontWeight: 600 }}>
                    <td style={tdStyle} colSpan={5}>총합계 ({stores.length}개)</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{summary.prevBalance.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#1565c0' }}>{summary.saleAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#d32f2f' }}>{summary.returnAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#2e7d32' }}>{summary.depositAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#ed6c02' }}>{summary.discountAmount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{summary.totalOutstanding.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#1565c0' }}>{summary.netSales.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
