'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface TaxInvoice {
  id: number
  invoiceNo: string
  storeId: number
  buyerName: string
  buyerBizNo: string
  supplyAmount: number
  taxAmount: number
  totalAmount: number
  issueDate: string
  supplyDate: string
  status: string
  items: {
    id: number
    itemName: string
    quantity: number
    unitPrice: number
    supplyAmount: number
    taxAmount: number
  }[]
}

interface Store {
  id: number
  name: string
  code: string
  bizNo?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  issued: { label: '발행', color: '#3b82f6', bg: '#dbeafe' },
  sent: { label: '전송완료', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: '취소', color: '#ef4444', bg: '#fee2e2' }
}

export default function TaxInvoicesPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null)
  const [stats, setStats] = useState({ issued: 0, sent: 0, cancelled: 0, totalAmount: 0 })

  // 새 세금계산서 폼
  const [formData, setFormData] = useState({
    storeId: '',
    supplyDate: new Date().toISOString().slice(0, 10),
    items: [{ itemName: '안경렌즈', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
  })

  useEffect(() => {
    fetchInvoices()
    fetchStores()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/tax-invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores?limit=500')
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // 공급가액 자동 계산
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].supplyAmount = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.storeId) {
      alert('가맹점을 선택해주세요.')
      return
    }

    if (formData.items.some(item => !item.itemName || item.supplyAmount <= 0)) {
      alert('품목 정보를 올바르게 입력해주세요.')
      return
    }

    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: parseInt(formData.storeId),
          supplyDate: formData.supplyDate,
          items: formData.items
        })
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({
          storeId: '',
          supplyDate: new Date().toISOString().slice(0, 10),
          items: [{ itemName: '안경렌즈', specification: '', quantity: 1, unitPrice: 0, supplyAmount: 0 }]
        })
        fetchInvoices()
      } else {
        const data = await res.json()
        alert(data.error || '발행에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  const totalSupply = formData.items.reduce((sum, item) => sum + item.supplyAmount, 0)
  const totalTax = Math.round(totalSupply * 0.1)

  return (
    <AdminLayout activeMenu="stores">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>세금계산서</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>세금계산서 발행 및 관리</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + 세금계산서 발행
        </button>
      </div>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '4px' }}>발행</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.issued}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#10b981', marginBottom: '4px' }}>전송완료</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.sent}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>취소</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.cancelled}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>총 발행액</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.totalAmount.toLocaleString()}원</div>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>세금계산서가 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>계산서번호</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>거래처</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>사업자번호</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>공급가액</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>세액</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>합계</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>발행일</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.issued
                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{invoice.invoiceNo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{invoice.buyerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{invoice.buyerBizNo || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right' }}>{invoice.supplyAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right' }}>{invoice.taxAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{invoice.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: statusConfig.bg,
                        color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(invoice.issueDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e5e5',
                          background: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 발행 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>세금계산서 발행</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>거래처 *</label>
                  <select
                    value={formData.storeId}
                    onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '14px' }}
                  >
                    <option value="">선택</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>공급일자 *</label>
                  <input
                    type="date"
                    value={formData.supplyDate}
                    onChange={e => setFormData({ ...formData, supplyDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* 품목 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>품목</label>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #007aff', background: '#fff', color: '#007aff', fontSize: '13px', cursor: 'pointer' }}
                  >
                    + 품목 추가
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>품명</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500, width: '100px' }}>규격</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '80px' }}>수량</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '100px' }}>단가</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500, width: '120px' }}>공급가액</th>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={e => updateItem(idx, 'itemName', e.target.value)}
                            placeholder="품명"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e5e5e5', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            value={item.specification}
                            onChange={e => updateItem(idx, 'specification', e.target.value)}
                            placeholder="규격"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e5e5e5', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                            min={1}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e5e5e5', fontSize: '13px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                            min={0}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e5e5e5', fontSize: '13px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'right', fontWeight: 500 }}>
                          {item.supplyAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              style={{ padding: '4px 8px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 합계 */}
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>공급가액</span>
                  <span>{totalSupply.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>세액 (10%)</span>
                  <span>{totalTax.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '16px', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                  <span>합계</span>
                  <span>{(totalSupply + totalTax).toLocaleString()} 원</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                >
                  발행
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{selectedInvoice.invoiceNo}</h2>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: STATUS_CONFIG[selectedInvoice.status]?.bg,
                color: STATUS_CONFIG[selectedInvoice.status]?.color
              }}>
                {STATUS_CONFIG[selectedInvoice.status]?.label}
              </span>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>거래처:</strong> {selectedInvoice.buyerName}</div>
              <div style={{ marginBottom: '8px' }}><strong>사업자번호:</strong> {selectedInvoice.buyerBizNo || '-'}</div>
              <div style={{ marginBottom: '8px' }}><strong>발행일:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString('ko-KR')}</div>
              <div><strong>공급일:</strong> {new Date(selectedInvoice.supplyDate).toLocaleDateString('ko-KR')}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>품명</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>수량</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>단가</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>공급가액</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>세액</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>{item.itemName}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.supplyAmount.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.taxAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 600, borderTop: '2px solid #e5e5e5' }}>
                  <td colSpan={3} style={{ padding: '12px 8px' }}>합계</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedInvoice.supplyAmount.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{selectedInvoice.taxAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ background: '#007aff', color: '#fff', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>총 합계</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{selectedInvoice.totalAmount.toLocaleString()} 원</div>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
