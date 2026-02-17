'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, thStyle, tdStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

interface Supplier {
  id: number
  name: string
  code: string
  contactName: string | null
  phone: string | null
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  lastPaymentAt: string | null
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function OutstandingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Supplier[]>([])
  const [stats, setStats] = useState({ totalSuppliers: 0, totalOutstanding: 0 })

  // Payment modal
  const [paymentTarget, setPaymentTarget] = useState<Supplier | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [paymentMemo, setPaymentMemo] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    fetch('/api/purchase/suppliers?status=active&limit=200')
      .then(res => res.json())
      .then(d => {
        const allSuppliers = d.suppliers || []
        const withOutstanding = allSuppliers.filter((s: Supplier) => s.outstandingAmount > 0)
          .sort((a: Supplier, b: Supplier) => b.outstandingAmount - a.outstandingAmount)
        setData(withOutstanding)
        setStats(d.stats || { totalSuppliers: 0, totalOutstanding: 0 })
        setLoading(false)
      })
      .catch(() => {
        toast.error('데이터를 불러오는데 실패했습니다.')
        setLoading(false)
      })
  }

  useEffect(() => { fetchData() }, [])

  const totalOutstanding = data.reduce((sum, s) => sum + s.outstandingAmount, 0)

  // Open payment modal
  const openPayment = (supplier: Supplier) => {
    setPaymentTarget(supplier)
    setPaymentAmount(String(supplier.outstandingAmount))
    setPaymentMethod('transfer')
    setPaymentMemo('')
  }

  // Process payment
  const handlePayment = async () => {
    if (!paymentTarget) return
    const amount = parseInt(paymentAmount.replace(/,/g, ''))
    if (!amount || amount <= 0) {
      toast.error('결제 금액을 입력해주세요.')
      return
    }
    if (amount > paymentTarget.outstandingAmount) {
      toast.error('미납금보다 큰 금액은 결제할 수 없습니다.')
      return
    }

    setPaymentSaving(true)
    try {
      const res = await fetch(`/api/purchase/suppliers/${paymentTarget.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
          memo: paymentMemo,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success(`${paymentTarget.name} 결제 완료 (${amount.toLocaleString()}원)`)
      setPaymentTarget(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || '결제 처리에 실패했습니다.')
    } finally {
      setPaymentSaving(false)
    }
  }

  const formatPaymentAmount = (val: string) => {
    const num = parseInt(val.replace(/,/g, ''))
    if (isNaN(num)) return ''
    return num.toLocaleString()
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>미납금 관리</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>매입처별 미납금 현황을 확인하고 결제합니다</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>미납 업체 수</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#dc2626' }}>{data.length}개</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>총 미납금</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#dc2626' }}>{totalOutstanding.toLocaleString()}원</p>
        </div>
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 8px' }}>전체 매입처</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--gray-700)' }}>{stats.totalSuppliers}개</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>매입처명</th>
              <th style={thStyle}>담당자</th>
              <th style={thStyle}>연락처</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>미납금</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>신용한도</th>
              <th style={thStyle}>최근 결제일</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>로딩 중...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>미납금이 없습니다</td></tr>
            ) : (
              data.map((s, idx) => {
                const overLimit = s.creditLimit > 0 && s.outstandingAmount > s.creditLimit
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ ...tdStyle, color: 'var(--gray-400)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {s.name}
                      <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 4 }}>({s.code})</span>
                      {overLimit && (
                        <span style={{
                          marginLeft: 6, padding: '2px 6px', borderRadius: 4,
                          fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#ef4444',
                        }}>
                          한도초과
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{s.contactName || '-'}</td>
                    <td style={tdStyle}>{s.phone || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                      {s.outstandingAmount.toLocaleString()}원
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--gray-500)' }}>
                      {s.creditLimit > 0 ? `${s.creditLimit.toLocaleString()}원` : '-'}
                    </td>
                    <td style={tdStyle}>{formatDate(s.lastPaymentAt)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => openPayment(s)}
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          border: 'none', background: '#667eea', color: '#fff',
                          fontSize: 13, cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        결제 등록
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {paymentTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={() => setPaymentTarget(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, width: '90%', maxWidth: 480,
              padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
              결제 등록
            </h2>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
              {paymentTarget.name} · 미납금 {paymentTarget.outstandingAmount.toLocaleString()}원
            </p>

            {/* 금액 입력 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                결제 금액 *
              </label>
              <input
                type="text"
                value={paymentAmount}
                onChange={e => setPaymentAmount(formatPaymentAmount(e.target.value))}
                style={{ ...inputStyle, width: '100%', fontSize: 18, fontWeight: 700, textAlign: 'right' }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[
                  { label: '전액', value: paymentTarget.outstandingAmount },
                  { label: '100만', value: 1000000 },
                  { label: '50만', value: 500000 },
                  { label: '10만', value: 100000 },
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={() => setPaymentAmount(Math.min(btn.value, paymentTarget.outstandingAmount).toLocaleString())}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid var(--gray-200)', background: '#fff',
                      fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 결제방법 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                결제 방법
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'transfer', label: '계좌이체' },
                  { value: 'cash', label: '현금' },
                  { value: 'check', label: '수표' },
                  { value: 'card', label: '카드' },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      border: paymentMethod === m.value ? '2px solid #667eea' : '1px solid var(--gray-200)',
                      background: paymentMethod === m.value ? '#f0f0ff' : '#fff',
                      color: paymentMethod === m.value ? '#667eea' : 'var(--gray-600)',
                      fontSize: 13, fontWeight: paymentMethod === m.value ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                메모
              </label>
              <input
                type="text"
                placeholder="메모를 입력하세요"
                value={paymentMemo}
                onChange={e => setPaymentMemo(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>

            {/* 잔액 미리보기 */}
            <div style={{
              padding: 14, background: 'var(--gray-50)', borderRadius: 8,
              display: 'flex', justifyContent: 'space-between', marginBottom: 20,
            }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>결제 후 잔액</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                {Math.max(0, paymentTarget.outstandingAmount - (parseInt(paymentAmount.replace(/,/g, '')) || 0)).toLocaleString()}원
              </span>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPaymentTarget(null)}
                style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-600)', border: 'none' }}
              >
                취소
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentSaving}
                style={{
                  ...btnStyle, background: '#667eea', color: '#fff', border: 'none',
                  fontWeight: 600, opacity: paymentSaving ? 0.6 : 1,
                }}
              >
                {paymentSaving ? '처리 중...' : '결제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
