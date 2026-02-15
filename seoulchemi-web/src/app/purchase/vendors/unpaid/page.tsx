'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../../constants/sidebar'

interface VendorUnpaid {
  id: number
  vendorId: number
  vendorName: string
  vendorCode: string
  ownerName: string | null
  phone: string | null
  totalPurchases: number
  unpaidAmount: number
  lastPaymentDate: string | null
  lastPaymentAmount: number
  daysSinceLastPayment: number
  paymentTermDays: number
  isOverdue: boolean
  transactions: Transaction[]
}

interface Transaction {
  id: number
  date: string
  type: '매입' | '결제'
  description: string
  amount: number
  balance: number
}

interface PaymentForm {
  vendorId: number
  vendorName: string
  amount: number
  paymentMethod: string
  memo: string
}

export default function VendorsUnpaidPage() {
  const [vendors, setVendors] = useState<VendorUnpaid[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'unpaid' | 'days' | 'name'>('unpaid')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  
  // 결제 모달
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    vendorId: 0,
    vendorName: '',
    amount: 0,
    paymentMethod: 'transfer',
    memo: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUnpaidVendors()
  }, [])

  async function fetchUnpaidVendors() {
    try {
      const res = await fetch('/api/vendors/unpaid')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (e) {
      console.error('Failed to fetch unpaid vendors:', e)
      // 샘플 데이터
      setVendors([
        {
          id: 1,
          vendorId: 1,
          vendorName: '(주)서울렌즈',
          vendorCode: 'V001',
          ownerName: '김대표',
          phone: '02-1234-5678',
          totalPurchases: 125000000,
          unpaidAmount: 15000000,
          lastPaymentDate: '2026-01-25',
          lastPaymentAmount: 10000000,
          daysSinceLastPayment: 15,
          paymentTermDays: 30,
          isOverdue: false,
          transactions: [
            { id: 1, date: '2026-02-08', type: '매입', description: '렌즈 200box', amount: 5000000, balance: 15000000 },
            { id: 2, date: '2026-02-01', type: '매입', description: '렌즈 150box', amount: 3500000, balance: 10000000 },
            { id: 3, date: '2026-01-25', type: '결제', description: '계좌이체', amount: -10000000, balance: 6500000 },
            { id: 4, date: '2026-01-20', type: '매입', description: '렌즈 250box', amount: 6500000, balance: 16500000 },
          ]
        },
        {
          id: 2,
          vendorId: 2,
          vendorName: '대한옵틱스',
          vendorCode: 'V002',
          ownerName: '이사장',
          phone: '031-987-6543',
          totalPurchases: 85000000,
          unpaidAmount: 8500000,
          lastPaymentDate: '2026-01-10',
          lastPaymentAmount: 5000000,
          daysSinceLastPayment: 30,
          paymentTermDays: 45,
          isOverdue: false,
          transactions: [
            { id: 5, date: '2026-02-05', type: '매입', description: '프레임 50개', amount: 3500000, balance: 8500000 },
            { id: 6, date: '2026-01-28', type: '매입', description: '렌즈 100box', amount: 2500000, balance: 5000000 },
            { id: 7, date: '2026-01-10', type: '결제', description: '현금', amount: -5000000, balance: 2500000 },
          ]
        },
        {
          id: 3,
          vendorId: 4,
          vendorName: '한미광학',
          vendorCode: 'V004',
          ownerName: '박한미',
          phone: '02-7777-8888',
          totalPurchases: 32000000,
          unpaidAmount: 12000000,
          lastPaymentDate: '2025-12-15',
          lastPaymentAmount: 3000000,
          daysSinceLastPayment: 56,
          paymentTermDays: 30,
          isOverdue: true,
          transactions: [
            { id: 8, date: '2026-02-01', type: '매입', description: '렌즈 80box', amount: 4000000, balance: 12000000 },
            { id: 9, date: '2026-01-15', type: '매입', description: '렌즈 100box', amount: 5000000, balance: 8000000 },
            { id: 10, date: '2025-12-15', type: '결제', description: '계좌이체', amount: -3000000, balance: 3000000 },
          ]
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleOpenPayment(vendor: VendorUnpaid) {
    setPaymentForm({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      amount: vendor.unpaidAmount,
      paymentMethod: 'transfer',
      memo: '',
    })
    setShowPaymentModal(true)
  }

  async function handlePaymentSubmit() {
    if (paymentForm.amount <= 0) {
      alert('결제 금액을 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      // API 연동 시
      // await fetch('/api/vendors/payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(paymentForm),
      // })
      
      alert(`${paymentForm.vendorName}에 ${paymentForm.amount.toLocaleString()}원 결제가 등록되었습니다.`)
      setShowPaymentModal(false)
      fetchUnpaidVendors()
    } catch (e) {
      console.error(e)
      alert('결제 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 정렬
  const sortedVendors = [...vendors].sort((a, b) => {
    switch (sortBy) {
      case 'unpaid':
        return b.unpaidAmount - a.unpaidAmount
      case 'days':
        return b.daysSinceLastPayment - a.daysSinceLastPayment
      case 'name':
        return a.vendorName.localeCompare(b.vendorName)
      default:
        return 0
    }
  })

  // 필터링
  const filteredVendors = sortedVendors.filter(v => {
    if (search) {
      const q = search.toLowerCase()
      return v.vendorName.toLowerCase().includes(q) || 
             v.vendorCode.toLowerCase().includes(q) ||
             (v.ownerName && v.ownerName.toLowerCase().includes(q))
    }
    return true
  })

  // 통계
  const stats = {
    totalVendors: vendors.length,
    totalUnpaid: vendors.reduce((sum, v) => sum + v.unpaidAmount, 0),
    overdueVendors: vendors.filter(v => v.isOverdue).length,
    overdueAmount: vendors.filter(v => v.isOverdue).reduce((sum, v) => sum + v.unpaidAmount, 0),
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>매입처 미납금 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>매입처별 미결제 현황을 조회하고 결제를 등록합니다</p>
        </div>
        <button style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}>
          📥 엑셀다운
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 15 }}>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
          <div style={{ fontSize: 12, color: '#666' }}>미결제 매입처</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{stats.totalVendors}개</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #f44336' }}>
          <div style={{ fontSize: 12, color: '#666' }}>총 미결제금</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{(stats.totalUnpaid / 10000).toLocaleString()}만</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
          <div style={{ fontSize: 12, color: '#666' }}>연체 매입처</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{stats.overdueVendors}개</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #9c27b0' }}>
          <div style={{ fontSize: 12, color: '#666' }}>연체 금액</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9c27b0' }}>{(stats.overdueAmount / 10000).toLocaleString()}만</div>
        </div>
      </div>

      {/* 검색 필터 */}
      <div style={{ ...cardStyle, padding: 12, marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          style={selectStyle}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'unpaid' | 'days' | 'name')}
        >
          <option value="unpaid">미결제 높은순</option>
          <option value="days">연체일 높은순</option>
          <option value="name">이름순</option>
        </select>
        <input 
          type="text" 
          placeholder="매입처명, 코드, 대표자 검색..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 250 }} 
        />
        <button style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff' }}>검색</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          검색결과: <strong>{filteredVendors.length}</strong>개
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>
              <tr>
                <th style={{ ...thStyle, width: 30 }}></th>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>코드</th>
                <th style={thStyle}>매입처명</th>
                <th style={thStyle}>대표자</th>
                <th style={thStyle}>연락처</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>미결제금</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>결제조건</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>마지막 결제</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>경과일</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>상태</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>결제등록</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ ...tdStyle, padding: 40, textAlign: 'center', color: '#868e96' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ ...tdStyle, padding: 60, textAlign: 'center', color: '#868e96' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
                    미결제 매입처가 없습니다
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <>
                    <tr 
                      key={vendor.id} 
                      style={{ 
                        background: vendor.isOverdue ? '#ffebee' : (index % 2 === 0 ? '#fff' : '#fafafa'),
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
                    >
                      <td style={{ ...tdStyle, width: 30, textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          transform: expandedId === vendor.id ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>
                          ▶
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {index < 3 ? (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: index === 0 ? '#f44336' : index === 1 ? '#ff9800' : '#ffc107',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            {index + 1}
                          </span>
                        ) : (
                          <span style={{ color: '#868e96' }}>{index + 1}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#666' }}>{vendor.vendorCode}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{vendor.vendorName}</td>
                      <td style={tdStyle}>{vendor.ownerName || '-'}</td>
                      <td style={tdStyle}>{vendor.phone || '-'}</td>
                      <td style={{ 
                        ...tdStyle, 
                        textAlign: 'right', 
                        fontWeight: 700,
                        color: '#f44336',
                        fontSize: 14
                      }}>
                        {vendor.unpaidAmount.toLocaleString()}원
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: '#eef4ee',
                          color: '#5d7a5d',
                        }}>
                          {vendor.paymentTermDays}일
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12 }}>
                        {vendor.lastPaymentDate || '-'}
                        {vendor.lastPaymentAmount > 0 && (
                          <div style={{ fontSize: 11, color: '#4caf50' }}>
                            ({(vendor.lastPaymentAmount / 10000).toLocaleString()}만)
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: vendor.daysSinceLastPayment > vendor.paymentTermDays ? '#ffebee' : 
                                     vendor.daysSinceLastPayment > vendor.paymentTermDays * 0.8 ? '#fff3e0' : '#e8f5e9',
                          color: vendor.daysSinceLastPayment > vendor.paymentTermDays ? '#f44336' :
                                vendor.daysSinceLastPayment > vendor.paymentTermDays * 0.8 ? '#ff9800' : '#4caf50'
                        }}>
                          {vendor.daysSinceLastPayment}일
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background: vendor.isOverdue ? '#f44336' : '#4caf50',
                          color: '#fff'
                        }}>
                          {vendor.isOverdue ? '연체' : '정상'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button 
                          style={{ 
                            ...btnStyle, 
                            padding: '6px 14px', 
                            fontSize: 12,
                            background: '#4caf50',
                            color: '#fff',
                            border: 'none'
                          }}
                          onClick={() => handleOpenPayment(vendor)}
                        >
                          💳 결제
                        </button>
                      </td>
                    </tr>
                    
                    {/* 거래 내역 확장 행 */}
                    {expandedId === vendor.id && (
                      <tr>
                        <td colSpan={12} style={{ background: '#f8f9fa', padding: 0 }}>
                          <div style={{ padding: '16px 40px' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#333' }}>
                              📋 최근 거래 내역
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: '#eef4ee' }}>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>일자</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>유형</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>내용</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>금액</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>잔액</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vendor.transactions.map(tx => (
                                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 12px', fontSize: 12 }}>{tx.date}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        background: tx.type === '매입' ? '#eef4ee' : '#e8f5e9',
                                        color: tx.type === '매입' ? '#5d7a5d' : '#4caf50',
                                        fontWeight: 500
                                      }}>
                                        {tx.type}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#666' }}>{tx.description}</td>
                                    <td style={{ 
                                      padding: '8px 12px', 
                                      textAlign: 'right', 
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: tx.amount < 0 ? '#4caf50' : '#333'
                                    }}>
                                      {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}원
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                                      {tx.balance.toLocaleString()}원
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 결제 등록 모달 */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowPaymentModal(false)}>
          <div 
            style={{ 
              background: '#fff', 
              borderRadius: 16, 
              width: '90%', 
              maxWidth: 450,
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ 
              padding: '20px 24px', 
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              borderRadius: '16px 16px 0 0',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#fff' }}>
                  💳 결제 등록
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
                  {paymentForm.vendorName}
                </p>
              </div>
              <button 
                style={{ border: 'none', background: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', color: '#fff', padding: '8px 12px', borderRadius: 8 }} 
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  결제 금액 *
                </label>
                <input 
                  type="number"
                  style={{ ...inputStyle, width: '100%', fontSize: 18, fontWeight: 600, padding: '14px 16px' }}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  미결제 잔액: <strong style={{ color: '#f44336' }}>{paymentForm.amount.toLocaleString()}원</strong>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  결제 수단
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'transfer', label: '계좌이체' },
                    { value: 'cash', label: '현금' },
                    { value: 'check', label: '수표' },
                    { value: 'card', label: '카드' },
                  ].map(method => (
                    <label 
                      key={method.value}
                      style={{ 
                        flex: 1,
                        padding: '10px 12px',
                        border: `2px solid ${paymentForm.paymentMethod === method.value ? '#4caf50' : '#e0e0e0'}`,
                        borderRadius: 8,
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        background: paymentForm.paymentMethod === method.value ? '#e8f5e9' : '#fff',
                        color: paymentForm.paymentMethod === method.value ? '#4caf50' : '#666',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.value}
                        checked={paymentForm.paymentMethod === method.value}
                        onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        style={{ display: 'none' }}
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  메모
                </label>
                <textarea 
                  style={{ ...inputStyle, width: '100%', minHeight: 60, resize: 'vertical' }}
                  value={paymentForm.memo}
                  onChange={e => setPaymentForm({ ...paymentForm, memo: e.target.value })}
                  placeholder="결제 관련 메모..."
                />
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 10,
              background: '#fafafa',
              borderRadius: '0 0 16px 16px'
            }}>
              <button 
                style={{ ...btnStyle, minWidth: 100 }} 
                onClick={() => setShowPaymentModal(false)}
              >
                취소
              </button>
              <button 
                style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none', minWidth: 120 }} 
                onClick={handlePaymentSubmit}
                disabled={saving}
              >
                {saving ? '처리 중...' : '결제 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
