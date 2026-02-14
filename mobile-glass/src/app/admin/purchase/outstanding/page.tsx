'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Supplier {
  id: number
  name: string
  code: string
  phone: string | null
  bankInfo: string | null
  outstandingAmount: number
  creditLimit: number
  lastPaymentAt: string | null
  _count: { purchases: number }
}

export default function OutstandingPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOutstanding, setTotalOutstanding] = useState(0)

  // 결제 모달
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'transfer',
    bankName: '',
    memo: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/purchase/suppliers')
      if (res.ok) {
        const data = await res.json()
        // 미납�??�는 ?�체�??�터�?
        const withOutstanding = data.suppliers.filter((s: Supplier) => s.outstandingAmount > 0)
        setSuppliers(withOutstanding)
        setTotalOutstanding(data.stats.totalOutstanding)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openPaymentModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setPaymentForm({
      amount: supplier.outstandingAmount,
      paymentMethod: 'transfer',
      bankName: '',
      memo: ''
    })
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!selectedSupplier || paymentForm.amount <= 0) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/purchase/suppliers/${selectedSupplier.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })

      if (res.ok) {
        setShowPaymentModal(false)
        fetchSuppliers()
      } else {
        const error = await res.json()
        alert(error.error || '결제 처리???�패?�습?�다')
      }
    } catch (error) {
      console.error('Failed to process payment:', error)
      alert('결제 처리???�패?�습?�다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>매입�?미납�?관�?/h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          미납금이 ?�는 ?�체: {suppliers.length}�?
        </p>
      </div>

      {/* ?�약 카드 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>�?미납�?/div>
        <div style={{ fontSize: '36px', fontWeight: 700 }}>{totalOutstanding.toLocaleString()}??/div>
      </div>

      {/* 목록 */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>매입�?/th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>?�락�?/th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>계좌?�보</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>미납�?/th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>?�용?�도</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>최근결제</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>처리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  로딩 �?..
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  미납금이 ?�는 매입처�? ?�습?�다 ?��
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => {
                const overLimit = supplier.creditLimit > 0 && supplier.outstandingAmount > supplier.creditLimit
                return (
                  <tr key={supplier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{supplier.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{supplier.code}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                      {supplier.phone || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                      {supplier.bankInfo || '-'}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#dc2626'
                    }}>
                      {supplier.outstandingAmount.toLocaleString()}??
                      {overLimit && (
                        <div style={{ fontSize: '11px', color: '#dc2626' }}>?�️ ?�도초과</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#666' }}>
                      {supplier.creditLimit > 0 ? `${supplier.creditLimit.toLocaleString()}?? : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                      {supplier.lastPaymentAt 
                        ? new Date(supplier.lastPaymentAt).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => openPaymentModal(supplier)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#007aff',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        결제
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 결제 모달 */}
      {showPaymentModal && selectedSupplier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>결제 처리</h2>

            <div style={{ 
              background: '#f9fafb', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{selectedSupplier.name}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                미납�? <span style={{ color: '#dc2626', fontWeight: 600 }}>
                  {selectedSupplier.outstandingAmount.toLocaleString()}??
                </span>
              </div>
              {selectedSupplier.bankInfo && (
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  계좌: {selectedSupplier.bankInfo}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  결제 금액 *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: selectedSupplier.outstandingAmount })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ?�액
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: Math.floor(selectedSupplier.outstandingAmount / 2) })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    50%
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  결제 방법
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="transfer">계좌?�체</option>
                  <option value="cash">?�금</option>
                  <option value="card">카드</option>
                  <option value="check">?�음</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  메모
                </label>
                <input
                  type="text"
                  value={paymentForm.memo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, memo: e.target.value })}
                  placeholder="?? 2??매입?��?결제"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handlePayment}
                disabled={submitting || paymentForm.amount <= 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: submitting || paymentForm.amount <= 0 ? '#e5e5e5' : '#007aff',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: submitting || paymentForm.amount <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? '처리 �?..' : '결제 ?�료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
