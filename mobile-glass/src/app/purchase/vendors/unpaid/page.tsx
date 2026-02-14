'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../../../components/Layout'

const SIDEBAR = [
  { title: 'Îß§ÏûÖÍ¥ÄÎ¶?, items: [
    { label: 'Îß§ÏûÖ?¥Ïó≠', href: '/purchase' },
    { label: 'Îß§ÏûÖ?±Î°ù', href: '/purchase/new' },
  ]},
  { title: 'Îß§ÏûÖÏ≤?Í¥ÄÎ¶?, items: [
    { label: 'Îß§ÏûÖÏ≤?Í¥ÄÎ¶?, href: '/purchase/vendors' },
    { label: 'Îß§ÏûÖÏ≤?ÎØ∏ÎÇ©Í∏?Í¥ÄÎ¶?, href: '/purchase/vendors/unpaid' },
  ]},
  { title: '?ïÏÇ∞', items: [
    { label: '?ïÏÇ∞?¥Ïó≠', href: '/purchase/settlement' },
    { label: '?ïÏÇ∞?¥Î†•', href: '/purchase/settlement/history' },
  ]}
]

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
  type: 'Îß§ÏûÖ' | 'Í≤∞Ï†ú'
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
  
  // Í≤∞Ï†ú Î™®Îã¨
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
      // ?òÌîå ?∞Ïù¥??
      setVendors([
        {
          id: 1,
          vendorId: 1,
          vendorName: '(Ï£??úÏö∏?åÏ¶à',
          vendorCode: 'V001',
          ownerName: 'ÍπÄ?Ä??,
          phone: '02-1234-5678',
          totalPurchases: 125000000,
          unpaidAmount: 15000000,
          lastPaymentDate: '2026-01-25',
          lastPaymentAmount: 10000000,
          daysSinceLastPayment: 15,
          paymentTermDays: 30,
          isOverdue: false,
          transactions: [
            { id: 1, date: '2026-02-08', type: 'Îß§ÏûÖ', description: '?åÏ¶à 200box', amount: 5000000, balance: 15000000 },
            { id: 2, date: '2026-02-01', type: 'Îß§ÏûÖ', description: '?åÏ¶à 150box', amount: 3500000, balance: 10000000 },
            { id: 3, date: '2026-01-25', type: 'Í≤∞Ï†ú', description: 'Í≥ÑÏ¢å?¥Ï≤¥', amount: -10000000, balance: 6500000 },
            { id: 4, date: '2026-01-20', type: 'Îß§ÏûÖ', description: '?åÏ¶à 250box', amount: 6500000, balance: 16500000 },
          ]
        },
        {
          id: 2,
          vendorId: 2,
          vendorName: '?Ä?úÏòµ?±Ïä§',
          vendorCode: 'V002',
          ownerName: '?¥ÏÇ¨??,
          phone: '031-987-6543',
          totalPurchases: 85000000,
          unpaidAmount: 8500000,
          lastPaymentDate: '2026-01-10',
          lastPaymentAmount: 5000000,
          daysSinceLastPayment: 30,
          paymentTermDays: 45,
          isOverdue: false,
          transactions: [
            { id: 5, date: '2026-02-05', type: 'Îß§ÏûÖ', description: '?ÑÎ†à??50Í∞?, amount: 3500000, balance: 8500000 },
            { id: 6, date: '2026-01-28', type: 'Îß§ÏûÖ', description: '?åÏ¶à 100box', amount: 2500000, balance: 5000000 },
            { id: 7, date: '2026-01-10', type: 'Í≤∞Ï†ú', description: '?ÑÍ∏à', amount: -5000000, balance: 2500000 },
          ]
        },
        {
          id: 3,
          vendorId: 4,
          vendorName: '?úÎ?Í¥ëÌïô',
          vendorCode: 'V004',
          ownerName: 'Î∞ïÌïúÎØ?,
          phone: '02-7777-8888',
          totalPurchases: 32000000,
          unpaidAmount: 12000000,
          lastPaymentDate: '2025-12-15',
          lastPaymentAmount: 3000000,
          daysSinceLastPayment: 56,
          paymentTermDays: 30,
          isOverdue: true,
          transactions: [
            { id: 8, date: '2026-02-01', type: 'Îß§ÏûÖ', description: '?åÏ¶à 80box', amount: 4000000, balance: 12000000 },
            { id: 9, date: '2026-01-15', type: 'Îß§ÏûÖ', description: '?åÏ¶à 100box', amount: 5000000, balance: 8000000 },
            { id: 10, date: '2025-12-15', type: 'Í≤∞Ï†ú', description: 'Í≥ÑÏ¢å?¥Ï≤¥', amount: -3000000, balance: 3000000 },
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
      alert('Í≤∞Ï†ú Í∏àÏï°???ÖÎ†•?¥Ï£º?∏Ïöî.')
      return
    }

    try {
      setSaving(true)
      // API ?∞Îèô ??
      // await fetch('/api/vendors/payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(paymentForm),
      // })
      
      alert(`${paymentForm.vendorName}??${paymentForm.amount.toLocaleString()}??Í≤∞Ï†úÍ∞Ä ?±Î°ù?òÏóà?µÎãà??`)
      setShowPaymentModal(false)
      fetchUnpaidVendors()
    } catch (e) {
      console.error(e)
      alert('Í≤∞Ï†ú ?±Î°ù???§Ìå®?àÏäµ?àÎã§.')
    } finally {
      setSaving(false)
    }
  }

  // ?ïÎ†¨
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

  // ?ÑÌÑ∞Îß?
  const filteredVendors = sortedVendors.filter(v => {
    if (search) {
      const q = search.toLowerCase()
      return v.vendorName.toLowerCase().includes(q) || 
             v.vendorCode.toLowerCase().includes(q) ||
             (v.ownerName && v.ownerName.toLowerCase().includes(q))
    }
    return true
  })

  // ?µÍ≥Ñ
  const stats = {
    totalVendors: vendors.length,
    totalUnpaid: vendors.reduce((sum, v) => sum + v.unpaidAmount, 0),
    overdueVendors: vendors.filter(v => v.isOverdue).length,
    overdueAmount: vendors.filter(v => v.isOverdue).reduce((sum, v) => sum + v.unpaidAmount, 0),
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="Îß§ÏûÖ">
      {/* ?§Îçî */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Îß§ÏûÖÏ≤?ÎØ∏ÎÇ©Í∏?Í¥ÄÎ¶?/h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Îß§ÏûÖÏ≤òÎ≥Ñ ÎØ∏Í≤∞???ÑÌô©??Ï°∞Ìöå?òÍ≥† Í≤∞Ï†úÎ•??±Î°ù?©Îãà??/p>
        </div>
        <button style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}>
          ?ì• ?ëÏ??§Ïö¥
        </button>
      </div>

      {/* ?µÍ≥Ñ Ïπ¥Îìú */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 15 }}>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
          <div style={{ fontSize: 12, color: '#666' }}>ÎØ∏Í≤∞??Îß§ÏûÖÏ≤?/div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{stats.totalVendors}Í∞?/div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #f44336' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Ï¥?ÎØ∏Í≤∞?úÍ∏à</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{(stats.totalUnpaid / 10000).toLocaleString()}Îß?/div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
          <div style={{ fontSize: 12, color: '#666' }}>?∞Ï≤¥ Îß§ÏûÖÏ≤?/div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{stats.overdueVendors}Í∞?/div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #9c27b0' }}>
          <div style={{ fontSize: 12, color: '#666' }}>?∞Ï≤¥ Í∏àÏï°</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9c27b0' }}>{(stats.overdueAmount / 10000).toLocaleString()}Îß?/div>
        </div>
      </div>

      {/* Í≤Ä???ÑÌÑ∞ */}
      <div style={{ ...cardStyle, padding: 12, marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          style={selectStyle}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'unpaid' | 'days' | 'name')}
        >
          <option value="unpaid">ÎØ∏Í≤∞???íÏ???/option>
          <option value="days">?∞Ï≤¥???íÏ???/option>
          <option value="name">?¥Î¶Ñ??/option>
        </select>
        <input 
          type="text" 
          placeholder="Îß§ÏûÖÏ≤òÎ™Ö, ÏΩîÎìú, ?Ä?úÏûê Í≤Ä??.." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 250 }} 
        />
        <button style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff' }}>Í≤Ä??/button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          Í≤Ä?âÍ≤∞Í≥? <strong>{filteredVendors.length}</strong>Í∞?
        </div>
      </div>

      {/* ?åÏù¥Î∏?*/}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr>
                <th style={{ ...thStyle, width: 30 }}></th>
                <th style={thStyle}>?úÏúÑ</th>
                <th style={thStyle}>ÏΩîÎìú</th>
                <th style={thStyle}>Îß§ÏûÖÏ≤òÎ™Ö</th>
                <th style={thStyle}>?Ä?úÏûê</th>
                <th style={thStyle}>?∞ÎùΩÏ≤?/th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ÎØ∏Í≤∞?úÍ∏à</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Í≤∞Ï†úÏ°∞Í±¥</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ÎßàÏ?Îß?Í≤∞Ï†ú</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Í≤ΩÍ≥º??/th>
                <th style={{ ...thStyle, textAlign: 'center' }}>?ÅÌÉú</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Í≤∞Ï†ú?±Î°ù</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ ...tdStyle, padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Î°úÎî© Ï§?..
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ ...tdStyle, padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>??/div>
                    ÎØ∏Í≤∞??Îß§ÏûÖÏ≤òÍ? ?ÜÏäµ?àÎã§
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
                          ??
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
                          <span style={{ color: 'var(--text-tertiary)' }}>{index + 1}</span>
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
                        {vendor.unpaidAmount.toLocaleString()}??
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: '#eef4ee',
                          color: '#5d7a5d',
                        }}>
                          {vendor.paymentTermDays}??
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12 }}>
                        {vendor.lastPaymentDate || '-'}
                        {vendor.lastPaymentAmount > 0 && (
                          <div style={{ fontSize: 11, color: '#4caf50' }}>
                            ({(vendor.lastPaymentAmount / 10000).toLocaleString()}Îß?
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
                          {vendor.daysSinceLastPayment}??
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
                          {vendor.isOverdue ? '?∞Ï≤¥' : '?ïÏÉÅ'}
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
                          ?í≥ Í≤∞Ï†ú
                        </button>
                      </td>
                    </tr>
                    
                    {/* Í±∞Îûò ?¥Ïó≠ ?ïÏû• ??*/}
                    {expandedId === vendor.id && (
                      <tr>
                        <td colSpan={12} style={{ background: 'var(--bg-secondary)', padding: 0 }}>
                          <div style={{ padding: '16px 40px' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#333' }}>
                              ?ìã ÏµúÍ∑º Í±∞Îûò ?¥Ïó≠
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-primary)', borderRadius: 8, overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: '#eef4ee' }}>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>?ºÏûê</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>?†Ìòï</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>?¥Ïö©</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>Í∏àÏï°</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>?îÏï°</th>
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
                                        background: tx.type === 'Îß§ÏûÖ' ? '#eef4ee' : '#e8f5e9',
                                        color: tx.type === 'Îß§ÏûÖ' ? '#5d7a5d' : '#4caf50',
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
                                      {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}??
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                                      {tx.balance.toLocaleString()}??
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

      {/* Í≤∞Ï†ú ?±Î°ù Î™®Îã¨ */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowPaymentModal(false)}>
          <div 
            style={{ 
              background: 'var(--bg-primary)', 
              borderRadius: 16, 
              width: '90%', 
              maxWidth: 450,
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Î™®Îã¨ ?§Îçî */}
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
                  ?í≥ Í≤∞Ï†ú ?±Î°ù
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
                  {paymentForm.vendorName}
                </p>
              </div>
              <button 
                style={{ border: 'none', background: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', color: '#fff', padding: '8px 12px', borderRadius: 8 }} 
                onClick={() => setShowPaymentModal(false)}
              >
                ??
              </button>
            </div>
            
            {/* Î™®Îã¨ Î∞îÎîî */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Í≤∞Ï†ú Í∏àÏï° *
                </label>
                <input 
                  type="number"
                  style={{ ...inputStyle, width: '100%', fontSize: 18, fontWeight: 600, padding: '14px 16px' }}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  ÎØ∏Í≤∞???îÏï°: <strong style={{ color: '#f44336' }}>{paymentForm.amount.toLocaleString()}??/strong>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Í≤∞Ï†ú ?òÎã®
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'transfer', label: 'Í≥ÑÏ¢å?¥Ï≤¥' },
                    { value: 'cash', label: '?ÑÍ∏à' },
                    { value: 'check', label: '?òÌëú' },
                    { value: 'card', label: 'Ïπ¥Îìú' },
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
                  Î©îÎ™®
                </label>
                <textarea 
                  style={{ ...inputStyle, width: '100%', minHeight: 60, resize: 'vertical' }}
                  value={paymentForm.memo}
                  onChange={e => setPaymentForm({ ...paymentForm, memo: e.target.value })}
                  placeholder="Í≤∞Ï†ú Í¥Ä??Î©îÎ™®..."
                />
              </div>
            </div>
            
            {/* Î™®Îã¨ ?∏ÌÑ∞ */}
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
                Ï∑®ÏÜå
              </button>
              <button 
                style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none', minWidth: 120 }} 
                onClick={handlePaymentSubmit}
                disabled={saving}
              >
                {saving ? 'Ï≤òÎ¶¨ Ï§?..' : 'Í≤∞Ï†ú ?±Î°ù'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
