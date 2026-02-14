'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

export default function StoreStatsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/stores?limit=20')
      .then(res => res.json())
      .then(d => {
        setData(d.stores || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>가맹점별 통계</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          가맹점별 매출 및 주문 현황을 확인합니다.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>가맹점명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>코드</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>총 주문</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>총 매출</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>미수금</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>데이터가 없습니다</td></tr>
            ) : (
              data.map((store: any) => (
                <tr key={store.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{store.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>{store.code}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                    {(store._count?.orders || 0)}건
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                    -
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: store.outstandingAmount > 0 ? '#dc2626' : '#666' }}>
                    {(store.outstandingAmount || 0).toLocaleString()}원
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
