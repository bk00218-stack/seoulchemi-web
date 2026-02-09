'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '가맹점 관리',
    items: [
      { label: '가맹점 관리', href: '/stores' },
      { label: '가맹점 공지사항', href: '/stores/notices' },
    ]
  },
  {
    title: '가맹점그룹 관리',
    items: [
      { label: '그룹별 가맹점 연결', href: '/stores/groups' },
      { label: '그룹별 할인율 설정', href: '/stores/groups/discounts' },
      { label: '그룹별 타입 설정', href: '/stores/groups/types' },
    ]
  }
]

type TabType = '가맹점목록' | '미결제현황' | '입금내역' | '거래내역'

interface Store {
  id: number
  name: string
  code: string
  phone: string | null
  address: string | null
  ownerName: string | null
  isActive: boolean
  outstandingAmount?: number
  totalOrders?: number
  lastOrderDate?: string
}

interface Transaction {
  id: number
  storeId: number
  storeName: string
  storeCode: string
  type: '주문' | '입금' | '반품'
  amount: number
  date: string
  description: string
}

export default function StoresPage() {
  const [activeTab, setActiveTab] = useState<TabType>('가맹점목록')
  const [stores, setStores] = useState<Store[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  useEffect(() => {
    fetchStores()
    fetchTransactions()
  }, [])

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      // 미결제 금액 추가 (데모용)
      const storesWithOutstanding = (data.stores || []).map((store: Store, index: number) => ({
        ...store,
        outstandingAmount: Math.floor(Math.random() * 500000) * (index % 3 === 0 ? 1 : 0),
        totalOrders: Math.floor(Math.random() * 100),
        lastOrderDate: index % 2 === 0 ? '2026-02-09' : '2026-02-08'
      }))
      setStores(storesWithOutstanding)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function fetchTransactions() {
    // 데모 거래 내역
    const demoTransactions: Transaction[] = [
      { id: 1, storeId: 22, storeName: '글라스 망우점', storeCode: '8107', type: '주문', amount: 85000, date: '2026-02-09 09:00', description: '[케미 일반] 중 외 2건' },
      { id: 2, storeId: 23, storeName: '글라스스토리 미사점', storeCode: '8128', type: '주문', amount: 125000, date: '2026-02-09 09:15', description: '[케미 퍼펙트] 고비 외 3건' },
      { id: 3, storeId: 22, storeName: '글라스 망우점', storeCode: '8107', type: '입금', amount: 200000, date: '2026-02-08 14:00', description: '계좌이체' },
      { id: 4, storeId: 42, storeName: '눈편한안경원', storeCode: '7753', type: '주문', amount: 42000, date: '2026-02-09 10:30', description: '착색 1.60 브라운 외 1건' },
      { id: 5, storeId: 19, storeName: '그랑프리 성수점', storeCode: '4143', type: '반품', amount: -15000, date: '2026-02-08 16:00', description: '불량 반품' },
      { id: 6, storeId: 47, storeName: '더밝은안경 구리', storeCode: '9697', type: '입금', amount: 500000, date: '2026-02-07 11:00', description: '현금' },
      { id: 7, storeId: 54, storeName: '로이스 성신여대', storeCode: '9701', type: '주문', amount: 95000, date: '2026-02-09 11:00', description: 'RX 누진 1.67' },
      { id: 8, storeId: 40, storeName: '눈이야기', storeCode: '11485', type: '주문', amount: 230000, date: '2026-02-09 11:30', description: 'RX 양면비구면 1.74 외 1건' },
    ]
    setTransactions(demoTransactions)
  }

  const filtered = stores.filter(s => 
    s.name.includes(search) || s.code.includes(search) || (s.ownerName && s.ownerName.includes(search))
  )

  // 미결제 가맹점만 필터
  const outstandingStores = stores.filter(s => (s.outstandingAmount || 0) > 0)
    .sort((a, b) => (b.outstandingAmount || 0) - (a.outstandingAmount || 0))

  // 총 미결제 금액
  const totalOutstanding = outstandingStores.reduce((sum, s) => sum + (s.outstandingAmount || 0), 0)

  // 입금 내역만
  const deposits = transactions.filter(t => t.type === '입금')

  // 거래 내역 (주문 + 반품)
  const orders = transactions.filter(t => t.type === '주문' || t.type === '반품')

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #333'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>거래처 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            OlwsPro 스타일 가맹점 관리
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}>
            + 신규등록
          </button>
          <button style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}>
            📥 엑셀다운
          </button>
        </div>
      </div>

      {/* 상단 요약 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12,
        marginBottom: 15
      }}>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #1976d2'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>전체 가맹점</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1976d2' }}>{stores.length}</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>미결제 가맹점</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{outstandingStores.length}</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>총 미결제액</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{totalOutstanding.toLocaleString()}원</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>이번 달 입금</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>
            {deposits.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #1976d2',
        background: '#f5f5f5',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden'
      }}>
        {(['가맹점목록', '미결제현황', '입금내역', '거래내역'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab ? '#1976d2' : 'transparent',
              color: activeTab === tab ? '#fff' : '#333',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {tab}
            {tab === '미결제현황' && outstandingStores.length > 0 && (
              <span style={{
                marginLeft: 6,
                background: activeTab === tab ? 'rgba(255,255,255,0.3)' : '#f44336',
                color: activeTab === tab ? '#fff' : '#fff',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11
              }}>
                {outstandingStores.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{ 
        ...cardStyle, 
        borderRadius: '0 0 8px 8px',
        borderTop: 'none',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* 가맹점 목록 탭 */}
        {activeTab === '가맹점목록' && (
          <>
            {/* 검색 필터 */}
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select style={selectStyle}><option>그룹 전체</option></select>
              <select style={selectStyle}><option>지역 전체</option></select>
              <input 
                type="text" 
                placeholder="가맹점명, 코드, 대표자 검색..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, minWidth: 250 }} 
              />
              <button style={{ ...btnStyle, background: '#1976d2', color: '#fff', border: 'none' }}>검색</button>
            </div>
            
            {/* 테이블 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>코드</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>가맹점명</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>대표자</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>연락처</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>미결제액</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>주문수</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>최근주문</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#999' }}>로딩 중...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#999' }}>등록된 가맹점이 없습니다</td>
                    </tr>
                  ) : (
                    filtered.slice(0, 50).map((store, index) => (
                      <tr 
                        key={store.id}
                        style={{ 
                          background: index % 2 === 0 ? '#fff' : '#fafafa',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedStore(store)}
                      >
                        <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#666' }}>{store.code}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 500 }}>{store.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>{store.ownerName || '-'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>{store.phone || '-'}</td>
                        <td style={{ 
                          padding: '10px 12px', 
                          fontSize: 12, 
                          textAlign: 'right',
                          fontWeight: (store.outstandingAmount || 0) > 0 ? 600 : 400,
                          color: (store.outstandingAmount || 0) > 0 ? '#f44336' : '#666'
                        }}>
                          {(store.outstandingAmount || 0) > 0 ? (store.outstandingAmount || 0).toLocaleString() + '원' : '-'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'center' }}>{store.totalOrders || 0}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'center', color: '#666' }}>{store.lastOrderDate || '-'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            background: store.isActive ? '#e8f5e9' : '#f5f5f5',
                            color: store.isActive ? '#4caf50' : '#999'
                          }}>
                            {store.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 미결제 현황 탭 */}
        {activeTab === '미결제현황' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {outstandingStores.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>✅</div>
                미결제 가맹점이 없습니다
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff3e0' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>순위</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>코드</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>가맹점명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>대표자</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>연락처</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>미결제액</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingStores.map((store, index) => (
                    <tr 
                      key={store.id}
                      style={{ 
                        background: index < 3 ? '#ffebee' : (index % 2 === 0 ? '#fff' : '#fafafa')
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 600 }}>
                        {index < 3 ? (
                          <span style={{ 
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            lineHeight: '24px',
                            textAlign: 'center',
                            borderRadius: '50%',
                            background: index === 0 ? '#f44336' : index === 1 ? '#ff9800' : '#ffc107',
                            color: '#fff',
                            fontSize: 12
                          }}>
                            {index + 1}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>{index + 1}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, fontFamily: 'monospace' }}>{store.code}</td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{store.name}</td>
                      <td style={{ padding: '12px', fontSize: 12 }}>{store.ownerName || '-'}</td>
                      <td style={{ padding: '12px', fontSize: 12 }}>{store.phone || '-'}</td>
                      <td style={{ 
                        padding: '12px', 
                        fontSize: 14, 
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#f44336'
                      }}>
                        {(store.outstandingAmount || 0).toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button style={{
                          padding: '5px 12px',
                          border: 'none',
                          background: '#4caf50',
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}>
                          입금등록
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 입금 내역 탭 */}
        {activeTab === '입금내역' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#e8f5e9' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>일시</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>코드</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>가맹점명</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>입금액</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>입금 내역이 없습니다</td>
                  </tr>
                ) : (
                  deposits.map((tx, index) => (
                    <tr key={tx.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.date}</td>
                      <td style={{ padding: '12px', fontSize: 12, fontFamily: 'monospace' }}>{tx.storeCode}</td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{tx.storeName}</td>
                      <td style={{ padding: '12px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#4caf50' }}>
                        +{tx.amount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 거래 내역 탭 */}
        {activeTab === '거래내역' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#e3f2fd' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>일시</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>코드</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>가맹점명</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>유형</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>금액</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #1976d2' }}>내용</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#999' }}>거래 내역이 없습니다</td>
                  </tr>
                ) : (
                  orders.map((tx, index) => (
                    <tr key={tx.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.date}</td>
                      <td style={{ padding: '12px', fontSize: 12, fontFamily: 'monospace' }}>{tx.storeCode}</td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{tx.storeName}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: tx.type === '주문' ? '#e3f2fd' : '#ffebee',
                          color: tx.type === '주문' ? '#1976d2' : '#f44336'
                        }}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        fontSize: 13, 
                        textAlign: 'right',
                        fontWeight: 500,
                        color: tx.amount < 0 ? '#f44336' : '#333'
                      }}>
                        {tx.amount < 0 ? tx.amount.toLocaleString() : '+' + tx.amount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
