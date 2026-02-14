'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

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
  status?: string
  groupName?: string | null
  deliveryStaffName?: string | null
  areaCode?: string | null
  storeType?: string | null
  businessRegNo?: string | null
  businessType?: string | null
  businessCategory?: string | null
  email?: string | null
  billingDay?: number | null
  memo?: string | null
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

interface StoreGroup {
  id: number
  name: string
}

interface DeliveryStaff {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
}

interface SalesStaff {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
}

const STORE_TYPES = ['소매', '도매', 'VIP', '직영']
const STATUS_OPTIONS = [
  { value: 'active', label: '정상', color: '#4caf50' },
  { value: 'caution', label: '주의', color: '#ff9800' },
  { value: 'suspended', label: '정지', color: '#f44336' },
]

export default function StoresPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('가맹점목록')
  const [stores, setStores] = useState<Store[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  
  // 컬럼별 검색 필터
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [filterPhone, setFilterPhone] = useState('')
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  // 필터
  const [filterGroup, setFilterGroup] = useState('')
  const [filterArea, setFilterArea] = useState('')
  
  // 그룹 및 담당자 목록
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [deliveryStaffList, setDeliveryStaffList] = useState<DeliveryStaff[]>([])
  const [salesStaffList, setSalesStaffList] = useState<SalesStaff[]>([])
  
  // 지역 목록 (areaCode에서 추출)
  const areaList = [...new Set(stores.map(s => s.areaCode).filter(Boolean))] as string[]
  
  // 통계
  const [stats, setStats] = useState({
    total: 0,
    outstandingStoresCount: 0,
    totalOutstanding: 0,
    totalDepositsThisMonth: 0,
  })
  
  // 신규등록 모달
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 일괄등록/수정 모달
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkMode, setBulkMode] = useState<'register' | 'update'>('register')
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    code: '',
    ownerName: '',
    phone: '',
    mobile: '',
    address: '',
    salesRepName: '',
    paymentTermDays: 30,
    billingDay: '' as string | number,
    discountRate: 0,
    storeType: '',
    // 신규 필드
    businessType: '',
    businessCategory: '',
    businessRegNo: '',
    groupId: '',
    email: '',
    memo: '',
    status: 'active',
    deliveryStaffId: '',
    salesStaffId: '',
    outstandingAmount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchStores()
    fetchTransactions()
    fetchGroups()
    fetchDeliveryStaff()
    fetchSalesStaff()
  }, [])
  
  async function fetchGroups() {
    try {
      const res = await fetch('/api/store-groups')
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    }
  }
  
  async function fetchDeliveryStaff() {
    try {
      const res = await fetch('/api/delivery-staff')
      const data = await res.json()
      setDeliveryStaffList(data.deliveryStaff || [])
    } catch (e) {
      console.error('Failed to fetch delivery staff:', e)
    }
  }
  
  async function fetchSalesStaff() {
    try {
      const res = await fetch('/api/sales-staff')
      const data = await res.json()
      setSalesStaffList(data.salesStaff || [])
    } catch (e) {
      console.error('Failed to fetch sales staff:', e)
    }
  }

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores?limit=2000')
      const data = await res.json()
      setStores(data.stores || [])
      
      // 통계 저장
      if (data.stats) {
        setStats({
          total: data.stats.total || 0,
          outstandingStoresCount: data.stats.outstandingStoresCount || 0,
          totalOutstanding: data.stats.totalOutstanding || 0,
          totalDepositsThisMonth: data.stats.totalDepositsThisMonth || 0,
        })
      }
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

  function resetForm() {
    setForm({
      name: '',
      code: '',
      ownerName: '',
      phone: '',
      mobile: '',
      address: '',
      salesRepName: '',
      paymentTermDays: 30,
      billingDay: '',
      discountRate: 0,
      storeType: '',
      // 신규 필드
      businessType: '',
      businessCategory: '',
      businessRegNo: '',
      groupId: '',
      email: '',
      memo: '',
      status: 'active',
      deliveryStaffId: '',
      salesStaffId: '',
      outstandingAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    })
    setErrors({})
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}
    
    if (!form.name.trim()) {
      newErrors.name = '거래처명은 필수입니다.'
    }
    
    if (form.phone && !/^[\d-]+$/.test(form.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.'
    }
    
    if (form.discountRate < 0 || form.discountRate > 100) {
      newErrors.discountRate = '할인율은 0~100 사이여야 합니다.'
    }
    
    if (form.paymentTermDays < 0) {
      newErrors.paymentTermDays = '결제 기한은 0 이상이어야 합니다.'
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }
    
    if (form.businessRegNo && !/^[\d-]+$/.test(form.businessRegNo)) {
      newErrors.businessRegNo = '올바른 사업자등록번호 형식이 아닙니다.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return
    
    try {
      setSaving(true)
      const submitData = {
        ...form,
        groupId: form.groupId ? parseInt(form.groupId as string) : null,
        billingDay: form.billingDay ? parseInt(form.billingDay as string) : null,
        deliveryStaffId: form.deliveryStaffId ? parseInt(form.deliveryStaffId) : null,
        salesStaffId: form.salesStaffId ? parseInt(form.salesStaffId) : null,
      }
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || '등록에 실패했습니다.')
        return
      }
      
      alert('거래처가 등록되었습니다.')
      setShowModal(false)
      resetForm()
      fetchStores()
    } catch (e) {
      console.error(e)
      alert('등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleRowClick(store: Store) {
    router.push(`/stores/${store.id}`)
  }

  // 필터링 로직 (검색 + 그룹 + 지역 + 컬럼별)
  const filtered = stores.filter(s => {
    // 검색어 필터 (통합)
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.code.includes(search) || 
      (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase()))
    
    // 그룹 필터
    const matchGroup = !filterGroup || s.groupName === filterGroup
    
    // 지역 필터
    const matchArea = !filterArea || s.areaCode === filterArea
    
    // 컬럼별 필터
    const matchCode = !filterCode || s.code.toLowerCase().includes(filterCode.toLowerCase())
    const matchName = !filterName || s.name.toLowerCase().includes(filterName.toLowerCase())
    const matchOwner = !filterOwner || (s.ownerName && s.ownerName.toLowerCase().includes(filterOwner.toLowerCase()))
    const matchPhone = !filterPhone || (s.phone && s.phone.includes(filterPhone))
    
    return matchSearch && matchGroup && matchArea && matchCode && matchName && matchOwner && matchPhone
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedStores = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 페이지 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterGroup, filterArea, filterCode, filterName, filterOwner, filterPhone])

  // 미결제 가맹점만 필터
  const outstandingStores = stores.filter(s => (s.outstandingAmount || 0) > 0)
    .sort((a, b) => (b.outstandingAmount || 0) - (a.outstandingAmount || 0))

  // 총 미결제 금액
  const totalOutstanding = outstandingStores.reduce((sum, s) => sum + (s.outstandingAmount || 0), 0)

  // 입금 내역만
  const deposits = transactions.filter(t => t.type === '입금')

  // 거래 내역 (주문 + 반품)
  const orders = transactions.filter(t => t.type === '주문' || t.type === '반품')

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#333',
    marginBottom: 6,
    display: 'block',
  }

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#f44336',
    marginTop: 4,
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
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
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>거래처 관리</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + 신규등록
          </button>
          <button 
            style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff' }}
            onClick={() => { setBulkResult(null); setShowBulkModal(true); }}
          >
            📤 일괄등록
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
          borderLeft: '4px solid #5d7a5d'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>전체 가맹점</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{stats.total.toLocaleString()}</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>미결제 가맹점</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{stats.outstandingStoresCount.toLocaleString()}</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>총 미결제액</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{stats.totalOutstanding.toLocaleString()}원</div>
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
            {stats.totalDepositsThisMonth.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #5d7a5d',
        background: '#f8f9fa',
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
              background: activeTab === tab ? '#5d7a5d' : 'transparent',
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
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select 
                style={selectStyle}
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
              >
                <option value="">그룹 전체</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
              <select 
                style={selectStyle}
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
              >
                <option value="">지역 전체</option>
                {areaList.sort().map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="가맹점명, 코드, 대표자 검색..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, minWidth: 250 }} 
              />
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
                검색결과: <strong>{filtered.length.toLocaleString()}</strong>개
              </div>
            </div>
            
            {/* 테이블 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
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
                  <tr style={{ background: '#eef4ee' }}>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="코드"
                        value={filterCode}
                        onChange={e => setFilterCode(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="가맹점명"
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="대표자"
                        value={filterOwner}
                        onChange={e => setFilterOwner(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="연락처"
                        value={filterPhone}
                        onChange={e => setFilterPhone(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}></th>
                    <th style={{ padding: '6px 8px' }}></th>
                    <th style={{ padding: '6px 8px' }}></th>
                    <th style={{ padding: '6px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>로딩 중...</td>
                    </tr>
                  ) : paginatedStores.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>검색 결과가 없습니다</td>
                    </tr>
                  ) : (
                    paginatedStores.map((store, index) => (
                      <tr 
                        key={store.id}
                        style={{ 
                          background: index % 2 === 0 ? '#fff' : '#fafafa',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRowClick(store)}
                        onMouseEnter={e => e.currentTarget.style.background = '#eef4ee'}
                        onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafafa'}
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
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid #eee', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 4,
                background: '#fafafa'
              }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: 4,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ≪
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: 4,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ＜
                </button>
                
                {/* 페이지 번호들 */}
                {(() => {
                  const pages = []
                  const maxVisible = 5
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                  let end = Math.min(totalPages, start + maxVisible - 1)
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1)
                  }
                  
                  if (start > 1) {
                    pages.push(
                      <button key={1} onClick={() => setCurrentPage(1)} style={{
                        padding: '6px 12px', border: '1px solid #ddd', background: '#fff',
                        borderRadius: 4, cursor: 'pointer', fontSize: 12
                      }}>1</button>
                    )
                    if (start > 2) pages.push(<span key="dots1" style={{ padding: '0 4px' }}>...</span>)
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          background: currentPage === i ? '#5d7a5d' : '#fff',
                          color: currentPage === i ? '#fff' : '#333',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: currentPage === i ? 600 : 400,
                          fontSize: 12
                        }}
                      >
                        {i}
                      </button>
                    )
                  }
                  
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="dots2" style={{ padding: '0 4px' }}>...</span>)
                    pages.push(
                      <button key={totalPages} onClick={() => setCurrentPage(totalPages)} style={{
                        padding: '6px 12px', border: '1px solid #ddd', background: '#fff',
                        borderRadius: 4, cursor: 'pointer', fontSize: 12
                      }}>{totalPages}</button>
                    )
                  }
                  
                  return pages
                })()}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: 4,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ＞
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: 4,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ≫
                </button>
                
                <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>
                  {currentPage} / {totalPages} 페이지
                </span>
              </div>
            )}
          </>
        )}

        {/* 미결제 현황 탭 */}
        {activeTab === '미결제현황' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {outstandingStores.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
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
                        background: index < 3 ? '#ffebee' : (index % 2 === 0 ? '#fff' : '#fafafa'),
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRowClick(store)}
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
                          <span style={{ color: 'var(--text-tertiary)' }}>{index + 1}</span>
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
                      <td style={{ padding: '12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
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
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>입금 내역이 없습니다</td>
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
              <thead style={{ position: 'sticky', top: 0, background: '#eef4ee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>일시</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>코드</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>가맹점명</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>유형</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>금액</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>내용</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>거래 내역이 없습니다</td>
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
                          background: tx.type === '주문' ? '#eef4ee' : '#ffebee',
                          color: tx.type === '주문' ? '#5d7a5d' : '#f44336'
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

      {/* 신규등록 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowModal(false)}>
          <div 
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 16,
              width: '90%',
              maxWidth: 900,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🏪</span> 신규 거래처 등록
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '6px 0 0' }}>새로운 거래처 정보를 입력해주세요</p>
              </div>
              <button 
                style={{ 
                  border: 'none', 
                  background: 'rgba(255,255,255,0.2)', 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  transition: 'background 0.2s'
                }}
                onClick={() => setShowModal(false)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✕
              </button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                {/* 왼쪽: 기본 정보 */}
                <div>
                  <h3 style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginBottom: 20, 
                    color: '#5d7a5d', 
                    borderBottom: '2px solid #5d7a5d', 
                    paddingBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 18 }}>📋</span> 기본 정보
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>거래처명 *</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="예: 글라스안경"
                      />
                      {errors.name && <div style={errorStyle}>{errors.name}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>코드 (자동생성)</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: '#f9f9f9' }}
                        value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value })}
                        placeholder="비워두면 자동생성"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>대표자명</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.ownerName}
                        onChange={e => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="홍길동"
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>등록일</label>
                      <input 
                        type="date"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.createdAt}
                        onChange={e => setForm({ ...form, createdAt: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>📞 연락처</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.phone ? '#f44336' : undefined }}
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="02-1234-5678"
                      />
                      {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>📱 핸드폰</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        placeholder="010-1234-5678"
                      />
                    </div>
                  </div>
                  
                  {/* 사업자 정보 (신규) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>사업자등록번호</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.businessRegNo ? '#f44336' : undefined }}
                        value={form.businessRegNo}
                        onChange={e => setForm({ ...form, businessRegNo: e.target.value })}
                        placeholder="000-00-00000"
                      />
                      {errors.businessRegNo && <div style={errorStyle}>{errors.businessRegNo}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>업태</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.businessType}
                        onChange={e => setForm({ ...form, businessType: e.target.value })}
                        placeholder="소매업"
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>업종</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.businessCategory}
                        onChange={e => setForm({ ...form, businessCategory: e.target.value })}
                        placeholder="안경"
                      />
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>주소</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="서울시 강남구..."
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>거래처 유형</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.storeType}
                        onChange={e => setForm({ ...form, storeType: e.target.value })}
                      >
                        <option value="">선택</option>
                        {STORE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>그룹</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.groupId}
                        onChange={e => setForm({ ...form, groupId: e.target.value })}
                      >
                        <option value="">선택 안함</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>배송담당</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.deliveryStaffId}
                        onChange={e => setForm({ ...form, deliveryStaffId: e.target.value })}
                      >
                        <option value="">선택 안함</option>
                        {deliveryStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}{staff.areaCode ? ` (${staff.areaCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>배송담당자 연락처</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: '#f8f9fa' }}
                        value={deliveryStaffList.find(s => String(s.id) === form.deliveryStaffId)?.phone || ''}
                        readOnly
                        placeholder="배송담당 선택시 자동표시"
                      />
                    </div>
                  </div>
                  
                </div>
                
                {/* 오른쪽: 결제정보 및 담당자 */}
                <div>
                  <h3 style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginBottom: 20, 
                    color: '#4caf50', 
                    borderBottom: '2px solid #4caf50', 
                    paddingBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 18 }}>💰</span> 결제 정보
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>결제 기한 (일)</label>
                      <input 
                        type="number"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.paymentTermDays ? '#f44336' : undefined }}
                        value={form.paymentTermDays}
                        onChange={e => setForm({ ...form, paymentTermDays: parseInt(e.target.value) || 30 })}
                        min={0}
                      />
                      {errors.paymentTermDays && <div style={errorStyle}>{errors.paymentTermDays}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>청구일 (매월)</label>
                      <input 
                        type="number"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.billingDay}
                        onChange={e => setForm({ ...form, billingDay: e.target.value })}
                        min={1}
                        max={31}
                        placeholder="예: 15"
                      />
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>매월 청구일</p>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>기본 할인율 (%)</label>
                      <input 
                        type="number"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.discountRate ? '#f44336' : undefined }}
                        value={form.discountRate}
                        onChange={e => setForm({ ...form, discountRate: parseFloat(e.target.value) || 0 })}
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      {errors.discountRate && <div style={errorStyle}>{errors.discountRate}</div>}
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>초기 미수금</label>
                    <input 
                      type="number"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.outstandingAmount}
                      onChange={e => setForm({ ...form, outstandingAmount: parseInt(e.target.value) || 0 })}
                      min={0}
                      placeholder="0"
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>기존 미수금이 있는 경우 입력</p>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginBottom: 20, 
                    marginTop: 24,
                    color: '#9c27b0', 
                    borderBottom: '2px solid #9c27b0', 
                    paddingBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 18 }}>👔</span> 담당자 정보
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>영업담당</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.salesStaffId}
                        onChange={e => setForm({ ...form, salesStaffId: e.target.value })}
                      >
                        <option value="">선택 안함</option>
                        {salesStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}{staff.areaCode ? ` (${staff.areaCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>영업담당자 연락처</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: '#f8f9fa' }}
                        value={salesStaffList.find(s => String(s.id) === form.salesStaffId)?.phone || ''}
                        readOnly
                        placeholder="영업담당 선택시 자동표시"
                      />
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>메일주소</label>
                    <input 
                      type="email"
                      style={{ ...inputStyle, width: '100%', borderColor: errors.email ? '#f44336' : undefined }}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                    {errors.email && <div style={errorStyle}>{errors.email}</div>}
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>거래상태</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {STATUS_OPTIONS.map(option => (
                        <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input 
                            type="radio"
                            name="status"
                            value={option.value}
                            checked={form.status === option.value}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                          />
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            background: `${option.color}20`, 
                            color: option.color,
                            fontSize: 12,
                            fontWeight: 500
                          }}>
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginBottom: 20, 
                    marginTop: 28, 
                    color: '#ff9800', 
                    borderBottom: '2px solid #ff9800', 
                    paddingBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 18 }}>📝</span> 기타
                  </h3>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>기타사항</label>
                    <textarea 
                      style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical' }}
                      value={form.memo}
                      onChange={e => setForm({ ...form, memo: e.target.value })}
                      placeholder="특이사항, 메모 등..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div style={{
              padding: '20px 28px',
              borderTop: '2px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              position: 'sticky',
              bottom: 0,
              background: 'linear-gradient(to top, #f5f5f5 0%, #fff 100%)'
            }}>
              <button 
                style={{ 
                  ...btnStyle, 
                  minWidth: 100,
                  padding: '12px 24px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '2px solid #ccc',
                  background: '#fff',
                  transition: 'all 0.2s'
                }}
                onClick={() => setShowModal(false)}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#999' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ccc' }}
              >
                취소
              </button>
              <button 
                style={{ 
                  ...btnStyle, 
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #4caf50 0%, #43a047 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  minWidth: 140,
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  boxShadow: saving ? 'none' : '0 4px 15px rgba(76, 175, 80, 0.4)',
                  transition: 'all 0.2s',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '등록 중...' : '✓ 등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄등록 모달 */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowBulkModal(false)}>
          <div 
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '90%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>
                  📤 거래처 일괄 {bulkMode === 'register' ? '등록' : '수정'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '6px 0 0' }}>
                  CSV 파일로 여러 거래처를 한번에 {bulkMode === 'register' ? '등록' : '수정'}
                </p>
              </div>
              <button 
                style={{ 
                  border: 'none', 
                  background: 'rgba(255,255,255,0.2)', 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8
                }}
                onClick={() => setShowBulkModal(false)}
              >
                ✕
              </button>
            </div>
            
            {/* 모드 탭 */}
            <div style={{ display: 'flex', borderBottom: '2px solid #5d7a5d' }}>
              <button
                onClick={() => { setBulkMode('register'); setBulkResult(null); setBulkFile(null); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: bulkMode === 'register' ? '#5d7a5d' : '#f5f5f5',
                  color: bulkMode === 'register' ? '#fff' : '#333',
                  fontWeight: bulkMode === 'register' ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                ➕ 신규 등록
              </button>
              <button
                onClick={() => { setBulkMode('update'); setBulkResult(null); setBulkFile(null); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: bulkMode === 'update' ? '#ff9800' : '#f5f5f5',
                  color: bulkMode === 'update' ? '#fff' : '#333',
                  fontWeight: bulkMode === 'update' ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                ✏️ 일괄 수정
              </button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 28 }}>
              {/* 양식 다운로드 */}
              <div style={{ 
                background: bulkMode === 'register' ? '#eef4ee' : '#fff3e0', 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: bulkMode === 'register' ? '#5d7a5d' : '#ff9800' }}>
                  1️⃣ {bulkMode === 'register' ? '양식 다운로드' : '현재 데이터 다운로드'}
                </h3>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                  {bulkMode === 'register' 
                    ? '아래 양식을 다운로드하여 거래처 정보를 입력하세요.'
                    : '현재 거래처 목록을 다운로드하여 수정 후 업로드하세요. (코드 기준으로 매칭)'}
                </p>
                <button 
                  style={{ 
                    ...btnStyle, 
                    background: bulkMode === 'register' ? '#5d7a5d' : '#ff9800', 
                    color: '#fff', 
                    border: 'none',
                    padding: '10px 20px'
                  }}
                  onClick={() => {
                    const headers = ['코드', '거래처명', '대표자', '연락처', '주소', '사업자등록번호', '업태', '업종', '이메일', '청구일', '지역코드', '거래처유형', '미결제액', '상태']
                    
                    if (bulkMode === 'register') {
                      // 빈 양식 다운로드
                      const sample = ['1001', '샘플안경원', '홍길동', '02-1234-5678', '서울시 강남구', '123-45-67890', '소매업', '안경', 'sample@email.com', '25', '강남', '소매', '0', 'active']
                      const csvContent = '\uFEFF' + headers.join(',') + '\n' + sample.join(',')
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = '거래처_등록_양식.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    } else {
                      // 현재 데이터 다운로드
                      const rows = stores.map(s => [
                        s.code,
                        s.name,
                        s.ownerName || '',
                        s.phone || '',
                        s.address || '',
                        s.businessRegNo || '',
                        s.businessType || '',
                        s.businessCategory || '',
                        s.email || '',
                        s.billingDay || '',
                        s.areaCode || '',
                        s.storeType || '',
                        s.outstandingAmount || 0,
                        s.status || 'active'
                      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
                      
                      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `거래처_목록_${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }}
                >
                  📥 {bulkMode === 'register' ? '양식 다운로드' : '현재 데이터 다운로드'} (CSV)
                </button>
              </div>
              
              {/* 파일 업로드 */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#333' }}>
                  2️⃣ 파일 업로드
                </h3>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                  {bulkMode === 'register' 
                    ? '작성한 CSV 파일을 선택하세요. (첫 행은 헤더)'
                    : '수정한 CSV 파일을 선택하세요. 코드 기준으로 기존 데이터를 업데이트합니다.'}
                </p>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  style={{ marginBottom: 12 }}
                />
                {bulkFile && (
                  <div style={{ fontSize: 13, color: '#4caf50' }}>
                    ✓ 선택된 파일: {bulkFile.name}
                  </div>
                )}
              </div>
              
              {/* 업로드 결과 */}
              {bulkResult && (
                <div style={{ 
                  background: bulkResult.success ? '#e8f5e9' : '#ffebee', 
                  padding: 20, 
                  borderRadius: 12,
                  marginBottom: 24
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: bulkResult.success ? '#4caf50' : '#f44336' }}>
                    {bulkResult.success ? `✅ ${bulkMode === 'register' ? '등록' : '수정'} 완료!` : `❌ ${bulkMode === 'register' ? '등록' : '수정'} 실패`}
                  </h3>
                  {bulkResult.success ? (
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                      <li>입력 데이터: {bulkResult.totalInput}건</li>
                      {bulkMode === 'register' ? (
                        <>
                          <li>등록 성공: {bulkResult.insertedCount}건</li>
                          <li>스킵: {bulkResult.skippedCount}건</li>
                        </>
                      ) : (
                        <>
                          <li>수정 성공: {bulkResult.updatedCount}건</li>
                          <li>스킵: {bulkResult.skippedCount}건</li>
                          {bulkResult.notFoundCount > 0 && (
                            <li style={{ color: '#ff9800' }}>미발견: {bulkResult.notFoundCount}건</li>
                          )}
                        </>
                      )}
                      {bulkResult.errors?.length > 0 && (
                        <li style={{ color: '#f44336' }}>오류: {bulkResult.errors.slice(0,3).join(', ')}</li>
                      )}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: '#f44336' }}>{bulkResult.error}</p>
                  )}
                </div>
              )}
              
              {/* 업로드 버튼 */}
              <button 
                style={{ 
                  ...btnStyle, 
                  width: '100%',
                  background: bulkUploading ? '#ccc' : 'linear-gradient(135deg, #4caf50 0%, #43a047 100%)', 
                  color: '#fff', 
                  border: 'none',
                  padding: '14px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: bulkUploading || !bulkFile ? 'not-allowed' : 'pointer',
                  opacity: !bulkFile ? 0.5 : 1
                }}
                disabled={bulkUploading || !bulkFile}
                onClick={async () => {
                  if (!bulkFile) return
                  
                  setBulkUploading(true)
                  setBulkResult(null)
                  
                  try {
                    const text = await bulkFile.text()
                    const lines = text.split('\n').filter(l => l.trim())
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
                    
                    // 헤더 매핑
                    const headerMap: Record<string, string> = {
                      '코드': 'code',
                      '거래처명': 'name',
                      '대표자': 'ownerName',
                      '연락처': 'phone',
                      '주소': 'address',
                      '사업자등록번호': 'businessRegNo',
                      '업태': 'businessType',
                      '업종': 'businessCategory',
                      '이메일': 'email',
                      '청구일': 'billingDay',
                      '지역코드': 'areaCode',
                      '거래처유형': 'storeType'
                    }
                    
                    const stores = []
                    for (let i = 1; i < lines.length; i++) {
                      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
                      const store: Record<string, any> = {}
                      headers.forEach((h, idx) => {
                        const key = headerMap[h] || h
                        if (values[idx]) store[key] = values[idx]
                      })
                      if (store.name) stores.push(store)
                    }
                    
                    const apiUrl = bulkMode === 'register' ? '/api/stores/import' : '/api/stores/bulk-update'
                    const res = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(bulkMode === 'register' ? { stores, deleteExisting: false } : { stores })
                    })
                    
                    const result = await res.json()
                    setBulkResult(result)
                    
                    if (result.success) {
                      fetchStores() // 목록 새로고침
                    }
                  } catch (e: any) {
                    setBulkResult({ success: false, error: e.message })
                  } finally {
                    setBulkUploading(false)
                  }
                }}
              >
                {bulkUploading ? '처리 중...' : `🚀 일괄 ${bulkMode === 'register' ? '등록' : '수정'}하기`}
              </button>
              
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12, textAlign: 'center' }}>
                {bulkMode === 'register' 
                  ? '※ 기존 거래처는 유지되며, 새 거래처만 추가됩니다.'
                  : '※ 코드가 일치하는 거래처의 정보가 업데이트됩니다.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
