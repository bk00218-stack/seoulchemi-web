'use client'

import { useState } from 'react'
import Layout from '../../components/Layout'
import { STATS_SIDEBAR } from '../../constants/sidebar'

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <Layout sidebarMenus={STATS_SIDEBAR} activeNav="통계">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>일별 리포트</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          일자별 매출 및 주문 현황을 확인합니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            fontSize: '14px'
          }}
        />
        <button style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#007aff',
          color: '#fff',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          조회
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>총 주문</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>0건</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>총 매출</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>0원</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>신규 거래처</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>0개</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>입금액</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>0원</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>시간대별 주문</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          해당 일자의 데이터가 없습니다
        </div>
      </div>
    </Layout>
  )
}
