'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle, thStyle, tdStyle } from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

interface Store {
  id: number
  code: string
  name: string
  ownerName: string | null
  businessRegNo: string | null
  phone: string | null
  address: string | null
}

interface OrderItem {
  date: string
  orderNo: string
  orderType: string
  brandName: string
  productName: string
  sph: string
  cyl: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface DepositItem {
  date: string
  amount: number
  paymentMethod: string
  depositor: string
  memo: string
}

interface Summary {
  carriedForward: number
  totalSales: number
  totalDeposits: number
  balance: number
  orderCount: number
  itemCount: number
}

function formatDate(s: string): string {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatFullDate(s: string): string {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function StatementsPage() {
  const { toast } = useToast()
  const [stores, setStores] = useState<{ id: number; name: string; code: string }[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [storeSearch, setStoreSearch] = useState('')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [loading, setLoading] = useState(false)
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Load stores
  useEffect(() => {
    fetch('/api/stores?limit=500&status=active')
      .then(r => r.json())
      .then(d => setStores(d.stores || []))
      .catch(() => {})
  }, [])

  // Filtered stores
  const filteredStores = storeSearch
    ? stores.filter(s => s.name.includes(storeSearch) || s.code.includes(storeSearch))
    : stores

  // Fetch statement
  const fetchStatement = async () => {
    if (!selectedStoreId) {
      toast.error('가맹점을 선택해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/statements?storeId=${selectedStoreId}&year=${year}&month=${month}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStore(data.store)
      setOrders(data.orders || [])
      setDeposits(data.deposits || [])
      setSummary(data.summary)
      setShowPreview(true)
    } catch {
      toast.error('거래명세서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  const monthLabel = `${year}년 ${month}월`

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* Screen-only controls */}
      <div className="no-print">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>거래명세서</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점별 월별 거래명세서를 조회하고 출력합니다</p>
        </div>

        {/* Selector */}
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                가맹점
              </label>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="">가맹점 선택</option>
                {filteredStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                연도
              </label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                style={{ ...selectStyle, width: '100%' }}
              >
                {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div style={{ width: 100 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>
                월
              </label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                style={{ ...selectStyle, width: '100%' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchStatement}
              disabled={loading}
              style={{
                ...btnStyle, background: '#667eea', color: '#fff', border: 'none',
                fontWeight: 600, opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '조회 중...' : '조회'}
            </button>
            {showPreview && (
              <button
                onClick={handlePrint}
                style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-700)', border: 'none' }}
              >
                🖨️ 인쇄
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statement Preview / Print Area */}
      {showPreview && store && summary && (
        <div
          id="statement-print-area"
          style={{
            background: '#fff', borderRadius: 12, padding: 32,
            border: '1px solid var(--gray-200)', maxWidth: 900, margin: '0 auto',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '3px double var(--gray-900)', paddingBottom: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: 8, margin: 0 }}>
              거 래 명 세 서
            </h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 8 }}>
              {monthLabel}
            </p>
          </div>

          {/* Store Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 10, borderBottom: '1px solid var(--gray-100)', paddingBottom: 6 }}>
                거래처 정보
              </h3>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>상호</td>
                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>코드</td>
                    <td>{store.code}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>대표자</td>
                    <td>{store.ownerName || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>사업자번호</td>
                    <td>{store.businessRegNo || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16 }}>연락처</td>
                    <td>{store.phone || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 10, borderBottom: '1px solid var(--gray-100)', paddingBottom: 6 }}>
                공급자 정보
              </h3>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>상호</td>
                    <td style={{ fontWeight: 600 }}>서울케미</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>대표자</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>사업자번호</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16, paddingBottom: 4 }}>연락처</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gray-500)', paddingRight: 16 }}>주소</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
            marginBottom: 24, border: '2px solid var(--gray-900)', borderRadius: 4, overflow: 'hidden',
          }}>
            {[
              { label: '전월이월', value: summary.carriedForward, color: 'var(--gray-700)' },
              { label: '매출합계', value: summary.totalSales, color: '#667eea' },
              { label: '입금합계', value: summary.totalDeposits, color: '#10b981' },
              { label: '잔액', value: summary.balance, color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '12px 8px',
                background: i === 0 ? 'var(--gray-50)' : '#fff',
                borderRight: i < 3 ? '1px solid var(--gray-200)' : 'none',
              }}>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>
                  {item.value.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          {/* Order Items Table */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
            매출 내역 ({summary.orderCount}건 / {summary.itemCount}품목)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: 'var(--gray-900)' }}>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>날짜</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>주문번호</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>브랜드</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>상품명</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'center' }}>수량</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'right' }}>단가</th>
                <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'right' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    해당 기간의 매출 내역이 없습니다
                  </td>
                </tr>
              ) : (
                orders.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 10px', fontSize: 13 }}>{formatDate(item.date)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: '#667eea', fontWeight: 500 }}>{item.orderNo}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.brandName}</td>
                    <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500 }}>
                      {item.productName}
                      {(item.sph || item.cyl) && (
                        <span style={{ color: 'var(--gray-400)', fontSize: 11, marginLeft: 4 }}>
                          ({item.sph}{item.cyl ? ` / ${item.cyl}` : ''})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 13, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px', fontSize: 13, textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))
              )}
              {/* 소계 */}
              {orders.length > 0 && (
                <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--gray-300)' }}>
                  <td colSpan={4} style={{ padding: '10px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
                    매출 소계
                  </td>
                  <td style={{ padding: '10px', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
                    {orders.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td></td>
                  <td style={{ padding: '10px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: '#667eea' }}>
                    {summary.totalSales.toLocaleString()}원
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Deposits Table */}
          {deposits.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
                입금 내역
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#10b981' }}>
                    <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>날짜</th>
                    <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>결제방법</th>
                    <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>입금자</th>
                    <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'right' }}>금액</th>
                    <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'left' }}>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '8px 10px', fontSize: 13 }}>{formatDate(d.date)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>
                        {{ transfer: '계좌이체', cash: '현금', card: '카드', check: '수표' }[d.paymentMethod] || d.paymentMethod}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 13 }}>{d.depositor || '-'}</td>
                      <td style={{ padding: '8px 10px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        {d.amount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--gray-500)' }}>{d.memo || '-'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0fdf4', borderTop: '2px solid #10b981' }}>
                    <td colSpan={3} style={{ padding: '10px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
                      입금 소계
                    </td>
                    <td style={{ padding: '10px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                      {summary.totalDeposits.toLocaleString()}원
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Footer */}
          <div style={{
            borderTop: '2px solid var(--gray-900)', paddingTop: 16, marginTop: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              발행일: {new Date().toLocaleDateString('ko-KR')} · 서울케미 렌즈초이스
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>미수금 잔액</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: summary.balance > 0 ? '#ef4444' : '#10b981' }}>
                {summary.balance.toLocaleString()}원
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {!showPreview && !loading && (
        <div style={{
          ...cardStyle, padding: 60, textAlign: 'center', color: 'var(--gray-400)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>가맹점과 기간을 선택하고 조회해주세요</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>거래명세서를 인쇄하거나 PDF로 저장할 수 있습니다</p>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print, nav, aside, header, footer { display: none !important; }
          body { background: #fff !important; }
          #statement-print-area {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </Layout>
  )
}
