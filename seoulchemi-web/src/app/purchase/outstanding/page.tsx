'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

export default function OutstandingPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/purchase/suppliers')
      .then(res => res.json())
      .then(d => {
        const withOutstanding = (d.suppliers || []).filter((s: any) => s.outstandingAmount > 0)
        setData(withOutstanding)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalOutstanding = data.reduce((sum, s) => sum + s.outstandingAmount, 0)

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>미납금 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          매입처별 미납금 현황을 확인합니다.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>미납 업체 수</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0, color: '#dc2626' }}>{data.length}개</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>총 미납금</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: 0, color: '#dc2626' }}>{totalOutstanding.toLocaleString()}원</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>매입처명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>담당자</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>미납금</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>미납금이 없습니다 🎉</td></tr>
            ) : (
              data.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.contactName || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.phone || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                    {s.outstandingAmount.toLocaleString()}원
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#007aff',
                      color: '#fff',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      결제 등록
                    </button>
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
