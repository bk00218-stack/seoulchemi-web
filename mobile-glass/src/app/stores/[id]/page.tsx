'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'

const SIDEBAR = [
  {
    title: '가맹점 관리',
    items: [
      { label: '가맹점 관리', href: '/stores' },
      { label: '배송담당자 관리', href: '/stores/delivery-staff' },
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

const STATUS_OPTIONS = [
  { value: 'active', label: '정상', color: '#4caf50' },
  { value: 'caution', label: '주의', color: '#ff9800' },
  { value: 'suspended', label: '정지', color: '#f44336' },
]

interface StoreGroup {
  id: number
  name: string
}

interface DeliveryStaffItem {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
}

type TabType = '기본정보' | '할인설정' | '주문내역' | '입금내역'

interface Store {
  id: number
  name: string
  code: string
  ownerName: string | null
  phone: string | null
  address: string | null
  deliveryContact: string | null
  deliveryPhone: string | null
  deliveryAddress: string | null
  salesRepName: string | null
  paymentTermDays: number
  discountRate: number
  areaCode: string | null
  storeType: string | null
  isActive: boolean
  outstandingAmount: number
  creditLimit: number
  deliveryMemo: string | null
  createdAt: string
  orders: Order[]
  transactions: Transaction[]
  brandDiscounts: BrandDiscount[]
  _count: { orders: number; transactions: number }
  // 신규 필드
  businessType: string | null
  businessCategory: string | null
  businessRegNo: string | null
  groupId: number | null
  group: { id: number; name: string } | null
  email: string | null
  memo: string | null
  status: string
  deliveryStaffId: number | null
  deliveryStaff: { id: number; name: string; phone: string | null } | null
}

interface Order {
  id: number
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  orderedAt: string
  memo: string | null
}

interface Transaction {
  id: number
  type: string
  amount: number
  balanceAfter: number
  paymentMethod: string | null
  memo: string | null
  processedAt: string
}

interface BrandDiscount {
  id: number
  brandId: number
  discountRate: number
  brand: { id: number; name: string }
}

const AREA_CODES = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주']
const STORE_TYPES = ['소매', '도매', 'VIP', '직영']

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('기본정보')
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // 그룹 및 배송담당자 목록
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [deliveryStaffList, setDeliveryStaffList] = useState<DeliveryStaffItem[]>([])
  
  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    code: '',
    ownerName: '',
    phone: '',
    address: '',
    deliveryContact: '',
    deliveryPhone: '',
    deliveryAddress: '',
    salesRepName: '',
    paymentTermDays: 30,
    discountRate: 0,
    areaCode: '',
    storeType: '',
    creditLimit: 0,
    isActive: true,
    // 신규 필드
    businessType: '',
    businessCategory: '',
    businessRegNo: '',
    groupId: '',
    email: '',
    memo: '',
    status: 'active',
    deliveryStaffId: '',
    outstandingAmount: 0,
  })

  useEffect(() => {
    fetchStore()
    fetchGroups()
    fetchDeliveryStaff()
  }, [id])
  
  async function fetchGroups() {
    try {
      const res = await fetch('/api/store-groups')
      const data = await res.json()
      setGroups(data.groups || [])
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

  async function fetchStore() {
    try {
      setLoading(true)
      const res = await fetch(`/api/stores/${id}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '거래처를 불러오는데 실패했습니다.')
        return
      }
      
      setStore(data.store)
      setForm({
        name: data.store.name || '',
        code: data.store.code || '',
        ownerName: data.store.ownerName || '',
        phone: data.store.phone || '',
        address: data.store.address || '',
        deliveryContact: data.store.deliveryContact || '',
        deliveryPhone: data.store.deliveryPhone || '',
        deliveryAddress: data.store.deliveryAddress || '',
        salesRepName: data.store.salesRepName || '',
        paymentTermDays: data.store.paymentTermDays || 30,
        discountRate: data.store.discountRate || 0,
        areaCode: data.store.areaCode || '',
        storeType: data.store.storeType || '',
        creditLimit: data.store.creditLimit || 0,
        isActive: data.store.isActive,
        // 신규 필드
        businessType: data.store.businessType || '',
        businessCategory: data.store.businessCategory || '',
        businessRegNo: data.store.businessRegNo || '',
        groupId: data.store.groupId ? String(data.store.groupId) : '',
        email: data.store.email || '',
        memo: data.store.memo || '',
        status: data.store.status || 'active',
        deliveryStaffId: data.store.deliveryStaffId ? String(data.store.deliveryStaffId) : '',
        outstandingAmount: data.store.outstandingAmount || 0,
      })
    } catch (e) {
      console.error(e)
      setError('거래처를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('거래처명은 필수입니다.')
      return
    }
    
    try {
      setSaving(true)
      const submitData = {
        ...form,
        groupId: form.groupId ? parseInt(form.groupId) : null,
        deliveryStaffId: form.deliveryStaffId ? parseInt(form.deliveryStaffId) : null,
      }
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || '저장에 실패했습니다.')
        return
      }
      
      alert('저장되었습니다.')
      fetchStore()
    } catch (e) {
      console.error(e)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!confirm('정말 이 거래처를 비활성화하시겠습니까?')) return
    
    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || '비활성화에 실패했습니다.')
        return
      }
      
      alert('거래처가 비활성화되었습니다.')
      router.push('/stores')
    } catch (e) {
      console.error(e)
      alert('비활성화에 실패했습니다.')
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '대기',
      confirmed: '확인',
      shipped: '출고',
      delivered: '배송완료',
      cancelled: '취소',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      shipped: '#9c27b0',
      delivered: '#4caf50',
      cancelled: '#f44336',
    }
    return colors[status] || '#999'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: '매출',
      deposit: '입금',
      return: '반품',
      adjustment: '조정',
    }
    return labels[type] || type
  }

  const getPaymentLabel = (method: string | null) => {
    if (!method) return '-'
    const labels: Record<string, string> = {
      cash: '현금',
      card: '카드',
      transfer: '계좌이체',
      check: '어음',
    }
    return labels[method] || method
  }

  if (loading) {
    return (
      <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <div style={{ color: '#868e96' }}>로딩 중...</div>
        </div>
      </Layout>
    )
  }

  if (error || !store) {
    return (
      <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
          <div style={{ fontSize: 48 }}>😵</div>
          <div style={{ color: '#666' }}>{error || '거래처를 찾을 수 없습니다.'}</div>
          <button 
            style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff' }}
            onClick={() => router.push('/stores')}
          >
            목록으로 돌아가기
          </button>
        </div>
      </Layout>
    )
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#333',
    marginBottom: 6,
    display: 'block',
  }

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 20,
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            style={{ ...btnStyle, padding: '8px 12px' }}
            onClick={() => router.push('/stores')}
          >
            ← 목록
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {store.name}
              <span style={{
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
                background: store.isActive ? '#e8f5e9' : '#f5f5f5',
                color: store.isActive ? '#4caf50' : '#999'
              }}>
                {store.isActive ? '활성' : '비활성'}
              </span>
            </h1>
            <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
              코드: {store.code} | 생성일: {new Date(store.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {store.isActive && (
            <button 
              style={{ ...btnStyle, background: '#f44336', color: '#fff', border: 'none' }}
              onClick={handleDeactivate}
            >
              비활성화
            </button>
          )}
          <button 
            style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </div>

      {/* 상단 요약 카드 - 컴팩트 */}
      <div style={{ 
        display: 'flex', 
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 6, 
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 11, color: '#666' }}>미결제</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f44336' }}>
            {store.outstandingAmount.toLocaleString()}원
          </span>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 6, 
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 11, color: '#666' }}>신용한도</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#5d7a5d' }}>
            {store.creditLimit.toLocaleString()}원
          </span>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 6, 
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 11, color: '#666' }}>할인율</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#ff9800' }}>
            {store.discountRate}%
          </span>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 6, 
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 11, color: '#666' }}>주문</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
            {store._count.orders}건
          </span>
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
        {(['기본정보', '할인설정', '주문내역', '입금내역'] as TabType[]).map(tab => (
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
            {tab === '주문내역' && store.orders.length > 0 && (
              <span style={{
                marginLeft: 6,
                background: 'rgba(255,255,255,0.3)',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11
              }}>
                {store.orders.length}
              </span>
            )}
            {tab === '입금내역' && store.transactions.filter(t => t.type === 'deposit').length > 0 && (
              <span style={{
                marginLeft: 6,
                background: 'rgba(255,255,255,0.3)',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11
              }}>
                {store.transactions.filter(t => t.type === 'deposit').length}
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
        
        {/* 기본정보 탭 */}
        {activeTab === '기본정보' && (
          <div style={{ padding: 24, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }}>
              {/* 왼쪽: 기본 정보 */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  기본 정보
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>거래처명 *</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>코드</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%', background: '#f8f9fa' }}
                      value={form.code}
                      readOnly
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>대표자명</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.ownerName}
                      onChange={e => setForm({ ...form, ownerName: e.target.value })}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>연락처</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="02-1234-5678"
                    />
                  </div>
                </div>
                
                {/* 사업자 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>사업자등록번호</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.businessRegNo}
                      onChange={e => setForm({ ...form, businessRegNo: e.target.value })}
                      placeholder="000-00-00000"
                    />
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
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>지역</label>
                    <select 
                      style={{ ...selectStyle, width: '100%' }}
                      value={form.areaCode}
                      onChange={e => setForm({ ...form, areaCode: e.target.value })}
                    >
                      <option value="">선택</option>
                      {AREA_CODES.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
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
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>영업 담당</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.salesRepName}
                      onChange={e => setForm({ ...form, salesRepName: e.target.value })}
                    />
                  </div>
                </div>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>메일주소</label>
                  <input 
                    type="email"
                    style={{ ...inputStyle, width: '100%' }}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                
                {/* 거래상태 */}
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
              </div>
              
              {/* 오른쪽: 배송정보 & 결제정보 */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  배송 정보
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>배송담당</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.deliveryContact}
                      onChange={e => setForm({ ...form, deliveryContact: e.target.value })}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>배송 연락처</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.deliveryPhone}
                      onChange={e => setForm({ ...form, deliveryPhone: e.target.value })}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>배송 주소</label>
                  <input 
                    type="text"
                    style={{ ...inputStyle, width: '100%' }}
                    value={form.deliveryAddress}
                    onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                  />
                </div>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>배송 담당 (직원)</label>
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
                
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 32, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  결제 정보
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>결제 기한 (일)</label>
                    <input 
                      type="number"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.paymentTermDays}
                      onChange={e => setForm({ ...form, paymentTermDays: parseInt(e.target.value) || 30 })}
                      min={0}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>신용 한도</label>
                    <input 
                      type="number"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.creditLimit}
                      onChange={e => setForm({ ...form, creditLimit: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>미수금</label>
                  <input 
                    type="number"
                    style={{ ...inputStyle, width: '100%' }}
                    value={form.outstandingAmount}
                    onChange={e => setForm({ ...form, outstandingAmount: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 32, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  기타
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
                
                <div style={fieldGroupStyle}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    />
                    활성 상태
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 할인설정 탭 */}
        {activeTab === '할인설정' && (
          <div style={{ padding: 24, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  기본 할인율
                </h3>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>기본 할인율 (%)</label>
                  <input 
                    type="number"
                    style={{ ...inputStyle, width: 200 }}
                    value={form.discountRate}
                    onChange={e => setForm({ ...form, discountRate: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                    모든 상품에 적용되는 기본 할인율입니다.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  브랜드별 할인율
                </h3>
                {store.brandDiscounts.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#868e96', background: '#f9f9f9', borderRadius: 8 }}>
                    설정된 브랜드별 할인율이 없습니다.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>브랜드</th>
                        <th style={{ padding: 10, textAlign: 'right', fontSize: 12 }}>할인율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.brandDiscounts.map(bd => (
                        <tr key={bd.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 10, fontSize: 13 }}>{bd.brand.name}</td>
                          <td style={{ padding: 10, fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#ff9800' }}>
                            {bd.discountRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 주문내역 탭 */}
        {activeTab === '주문내역' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {store.orders.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#868e96' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>📦</div>
                주문 내역이 없습니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>주문번호</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>유형</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>상태</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>금액</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>메모</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>주문일</th>
                  </tr>
                </thead>
                <tbody>
                  {store.orders.map((order, index) => (
                    <tr 
                      key={order.id}
                      style={{ 
                        background: index % 2 === 0 ? '#fff' : '#fafafa',
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <td style={{ padding: '12px', fontSize: 13, fontFamily: 'monospace', color: '#5d7a5d' }}>
                        {order.orderNo}
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: order.orderType === 'rx' ? '#eef4ee' : '#f5f5f5',
                          color: order.orderType === 'rx' ? '#5d7a5d' : '#666'
                        }}>
                          {order.orderType === 'rx' ? 'RX' : '여벌'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          background: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status),
                          fontWeight: 500
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', fontWeight: 500 }}>
                        {order.totalAmount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.memo || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, textAlign: 'center', color: '#666' }}>
                        {new Date(order.orderedAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 입금내역 탭 */}
        {activeTab === '입금내역' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {store.transactions.filter(t => t.type === 'deposit').length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#868e96' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>💰</div>
                입금 내역이 없습니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#e8f5e9' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>일시</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>유형</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>결제방법</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>금액</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>잔액</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {store.transactions.filter(t => t.type === 'deposit').map((tx, index) => (
                    <tr key={tx.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>
                        {new Date(tx.processedAt).toLocaleString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: '#e8f5e9',
                          color: '#4caf50'
                        }}>
                          {getTypeLabel(tx.type)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, textAlign: 'center' }}>
                        {getPaymentLabel(tx.paymentMethod)}
                      </td>
                      <td style={{ padding: '12px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#4caf50' }}>
                        +{tx.amount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', color: '#666' }}>
                        {tx.balanceAfter.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>
                        {tx.memo || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
