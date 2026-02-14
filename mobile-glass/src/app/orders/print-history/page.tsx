'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../components/Layout'
import { ORDER_SIDEBAR } from '../../constants/sidebar'

interface PrintRecord {
  id: number
  orderId: number
  orderNo: string
  storeName: string
  printType: string
  printedBy: string
  pageCount: number
  printedAt: string
}

interface Stats {
  todayCount: number
  weekCount: number
  monthCount: number
  totalPages: number
}

const printTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  shipping: { label: '출고지시서', icon: '📦', color: '#2563eb' },
  label: { label: '라벨', icon: '🏷️', color: '#7c3aed' },
  invoice: { label: '거래명세서', icon: '📄', color: '#059669' },
  receipt: { label: '영수증', icon: '🧾', color: '#ea580c' },
}

export default function PrintHistoryPage() {
  const [history, setHistory] = useState<PrintRecord[]>([])
  const [stats, setStats] = useState<Stats>({ todayCount: 0, weekCount: 0, monthCount: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [printType, setPrintType] = useState('')
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    fetchHistory()
    checkPrinterStatus()
  }, [])

  async function fetchHistory() {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (printType) params.append('printType', printType)
      
      const res = await fetch(`/api/print-history?${params}`)
      const data = await res.json()
      setHistory(data.history || [])
      setStats(data.stats || { todayCount: 0, weekCount: 0, monthCount: 0, totalPages: 0 })
    } catch (error) {
      console.error('Failed to fetch print history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkPrinterStatus() {
    try {
      const res = await fetch('/api/print')
      const data = await res.json()
      setPrinterStatus(data.connected ? 'connected' : 'disconnected')
    } catch {
      setPrinterStatus('disconnected')
    }
  }

  async function handleReprint(record: PrintRecord) {
    if (!confirm(`${record.orderNo} 주문을 다시 출력하시겠습니까?`)) return
    
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: record.orderId, type: record.printType })
      })
      
      if (res.ok) {
        alert('출력 요청이 완료되었습니다')
        fetchHistory()
      } else {
        const error = await res.json()
        alert(error.error || '출력 실패')
      }
    } catch {
      alert('출력 요청 중 오류가 발생했습니다')
    }
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>🖨️ 출력 이력</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            출력 기록 관리 및 재출력
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 프린터 상태 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            background: printerStatus === 'connected' ? '#d1fae5' : printerStatus === 'disconnected' ? '#fee2e2' : '#f3f4f6',
            fontSize: 13,
            fontWeight: 500,
            color: printerStatus === 'connected' ? '#059669' : printerStatus === 'disconnected' ? '#dc2626' : '#6b7280'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: printerStatus === 'connected' ? '#059669' : printerStatus === 'disconnected' ? '#dc2626' : '#9ca3af'
            }} />
            {printerStatus === 'connected' ? '프린터 연결됨' : printerStatus === 'disconnected' ? '프린터 오프라인' : '확인 중...'}
          </div>
          <button onClick={checkPrinterStatus} style={btnStyle}>🔄 상태 확인</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: '오늘 출력', value: stats.todayCount, unit: '건', icon: '📅', bg: '#dbeafe', color: '#2563eb' },
          { label: '이번 주', value: stats.weekCount, unit: '건', icon: '📊', bg: '#d1fae5', color: '#059669' },
          { label: '이번 달', value: stats.monthCount, unit: '건', icon: '📈', bg: '#fef3c7', color: '#d97706' },
          { label: '총 페이지', value: stats.totalPages, unit: '장', icon: '📄', bg: '#f3e8ff', color: '#7c3aed' },
        ].map((stat, i) => (
          <div key={i} style={{
            ...cardStyle,
            padding: 20,
            background: stat.bg
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                  {stat.value.toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{stat.unit}</span>
                </div>
              </div>
              <span style={{ fontSize: 24 }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="주문번호, 거래처명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 250 }}
        />
        <select 
          value={printType} 
          onChange={e => setPrintType(e.target.value)}
          style={selectStyle}
        >
          <option value="">출력타입 전체</option>
          <option value="shipping">출고지시서</option>
          <option value="label">라벨</option>
          <option value="invoice">거래명세서</option>
          <option value="receipt">영수증</option>
        </select>
        <button onClick={fetchHistory} style={{ ...btnStyle, background: '#5d7a5d', color: '#fff', border: 'none' }}>
          검색
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          총 {history.length}건
        </span>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>출력일시</th>
                <th style={thStyle}>주문번호</th>
                <th style={thStyle}>거래처</th>
                <th style={thStyle}>출력타입</th>
                <th style={thStyle}>페이지</th>
                <th style={thStyle}>출력자</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🖨️</div>
                    출력 이력이 없습니다
                  </td>
                </tr>
              ) : (
                history.map((record, idx) => {
                  const typeInfo = printTypeLabels[record.printType] || { label: record.printType, icon: '📄', color: '#6b7280' }
                  return (
                    <tr key={record.id}>
                      <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>{idx + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 14 }}>
                          {new Date(record.printedAt).toLocaleDateString('ko-KR')}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {new Date(record.printedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#5d7a5d', fontWeight: 500 }}>{record.orderNo}</span>
                      </td>
                      <td style={tdStyle}>{record.storeName}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: `${typeInfo.color}15`,
                          color: typeInfo.color
                        }}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{record.pageCount}</td>
                      <td style={tdStyle}>{record.printedBy}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleReprint(record)}
                          disabled={printerStatus !== 'connected'}
                          style={{
                            ...btnStyle,
                            padding: '6px 12px',
                            fontSize: 12,
                            opacity: printerStatus !== 'connected' ? 0.5 : 1,
                            cursor: printerStatus !== 'connected' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          🖨️ 재출력
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Print Section */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>⚡ 빠른 출력</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { type: 'shipping', label: '출고지시서', icon: '📦', desc: '주문 상품 목록' },
            { type: 'label', label: '상품 라벨', icon: '🏷️', desc: '개별 상품 라벨' },
            { type: 'invoice', label: '거래명세서', icon: '📄', desc: '거래처 정산용' },
            { type: 'receipt', label: '영수증', icon: '🧾', desc: '현금영수증' },
          ].map(item => (
            <a
              key={item.type}
              href={`/orders?print=${item.type}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                borderRadius: 12,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                textDecoration: 'none',
                color: '#1f2937',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 32 }}>{item.icon}</span>
              <span style={{ fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  )
}
