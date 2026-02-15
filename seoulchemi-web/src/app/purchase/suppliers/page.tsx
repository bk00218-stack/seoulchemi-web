'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

interface Supplier {
  id: number
  name: string
  code: string
  contactName: string | null
  phone: string | null
  outstandingAmount: number
  isActive: boolean
  _count: { purchases: number }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/purchase/suppliers?search=${search}`)
      .then(res => res.json())
      .then(data => {
        setSuppliers(data.suppliers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search])

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>매입처 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          매입처를 등록하고 관리합니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="매입처명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
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
          + 매입처 등록
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>코드</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>매입처명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>담당자</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>미납금</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>등록된 매입처가 없습니다</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.code}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.contactName || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.phone || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: s.outstandingAmount > 0 ? '#dc2626' : '#666' }}>
                    {s.outstandingAmount.toLocaleString()}원
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: s.isActive ? '#d1fae5' : '#f3f4f6',
                      color: s.isActive ? '#059669' : '#6b7280'
                    }}>
                      {s.isActive ? '사용' : '미사용'}
                    </span>
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
