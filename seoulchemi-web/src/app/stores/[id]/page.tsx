'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import Link from 'next/link'

interface StoreGroup {
  id: number
  name: string
}

interface Staff {
  id: number
  name: string
}

interface FormData {
  code: string
  name: string
  ownerName: string
  phone: string
  mobile: string
  address: string
  storeType: string
  businessType: string
  businessCategory: string
  businessNumber: string
  email: string
  billingDay: number | null
  groupId: number | null
  salesStaffId: number | null
  deliveryStaffId: number | null
  isActive: boolean
  initialReceivables: number
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
}

export default function StoreDetailPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [salesStaffList, setSalesStaffList] = useState<Staff[]>([])
  const [deliveryStaffList, setDeliveryStaffList] = useState<Staff[]>([])
  
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    ownerName: '',
    phone: '',
    mobile: '',
    address: '',
    storeType: '소매',
    businessType: '',
    businessCategory: '',
    businessNumber: '',
    email: '',
    billingDay: null,
    groupId: null,
    salesStaffId: null,
    deliveryStaffId: null,
    isActive: true,
    initialReceivables: 0,
    outstandingAmount: 0,
    creditLimit: 0,
    paymentTermDays: 30,
  })
  
  const [originalData, setOriginalData] = useState<FormData | null>(null)
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0, lastOrderAt: null as string | null })

  useEffect(() => {
    if (storeId) {
      fetchStore()
      fetchDropdowns()
    }
  }, [storeId])

  const fetchDropdowns = async () => {
    try {
      const [groupsRes, salesRes, deliveryRes] = await Promise.all([
        fetch('/api/store-groups'),
        fetch('/api/sales-staff'),
        fetch('/api/delivery-staff'),
      ])
      
      const groupsData = await groupsRes.json()
      const salesData = await salesRes.json()
      const deliveryData = await deliveryRes.json()
      
      if (Array.isArray(groupsData)) setGroups(groupsData)
      if (salesData.salesStaff) setSalesStaffList(salesData.salesStaff)
      if (deliveryData.deliveryStaff) setDeliveryStaffList(deliveryData.deliveryStaff)
    } catch (e) {
      console.error('Failed to fetch dropdowns:', e)
    }
  }

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}`)
      if (res.ok) {
        const data = await res.json()
        const store = data.store || data
        
        const newFormData: FormData = {
          code: store.code || '',
          name: store.name || '',
          ownerName: store.ownerName || '',
          phone: store.phone || '',
          mobile: store.deliveryPhone || '',
          address: store.address || '',
          storeType: store.storeType || '소매',
          businessType: store.businessType || '',
          businessCategory: store.businessCategory || '',
          businessNumber: store.businessRegNo || '',
          email: store.email || '',
          billingDay: store.billingDay || null,
          groupId: store.groupId || null,
          salesStaffId: store.salesStaffId || null,
          deliveryStaffId: store.deliveryStaffId || null,
          isActive: store.isActive ?? true,
          initialReceivables: store.initialReceivables || 0,
          outstandingAmount: store.outstandingAmount || 0,
          creditLimit: store.creditLimit || 0,
          paymentTermDays: store.paymentTermDays || 30,
        }
        
        setFormData(newFormData)
        setOriginalData(newFormData)
        setStats({
          totalOrders: store._count?.orders || 0,
          totalSales: store.totalSales || 0,
          lastOrderAt: store.lastOrderAt || null,
        })
      } else {
        router.push('/stores')
      }
    } catch (error) {
      console.error('Failed to fetch store:', error)
      router.push('/stores')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning('안경원명을 입력해주세요.')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success('저장되었습니다.')
        setOriginalData(formData)
        setIsEditing(false)
      } else {
        const data = await res.json()
        toast.error(data.error || '저장에 실패했습니다.')
      }
    } catch (e) {
      console.error(e)
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData)
    }
    setIsEditing(false)
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount)

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '13px',
    background: isEditing ? '#fff' : '#f8f9fa',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#86868b',
    marginBottom: '4px',
  }

  if (loading) {
    return (
      <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/stores')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ← 목록
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {formData.name || '거래처 상세'}
          </h1>
          <span style={{ 
            padding: '4px 10px', 
            background: '#f5f5f7', 
            borderRadius: '6px', 
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#86868b'
          }}>
            {formData.code}
          </span>
          <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            background: formData.isActive ? '#e8f5e9' : '#f5f5f7',
            color: formData.isActive ? '#34c759' : '#86868b'
          }}>
            {formData.isActive ? '활성' : '비활성'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href={`/stores/${storeId}/discounts`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: '#fff',
              fontSize: '13px',
              textDecoration: 'none',
              color: '#1d1d1f'
            }}
          >
            💰 할인 설정
          </Link>
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  background: '#f5f5f7',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: saving ? '#86868b' : '#34c759',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: saving ? 'default' : 'pointer'
                }}
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#007aff',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              ✏️ 수정
            </button>
          )}
        </div>
      </div>

      {/* 통계 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px 20px', borderLeft: '4px solid #007aff' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>총 주문</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#007aff' }}>{stats.totalOrders}건</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px 20px', borderLeft: '4px solid #34c759' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>총 매출</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#34c759' }}>{formatCurrency(stats.totalSales)}원</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px 20px', borderLeft: '4px solid #ff9500' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>미수금</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff9500' }}>{formatCurrency(formData.outstandingAmount)}원</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px 20px', borderLeft: '4px solid #9c27b0' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>신용한도</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#9c27b0' }}>{formatCurrency(formData.creditLimit)}원</div>
        </div>
      </div>

      {/* 폼 영역 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
        
        {/* 기본 정보 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#007aff', marginBottom: '12px', padding: '8px 0', borderBottom: '2px solid #007aff' }}>
            📋 기본 정보
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>코드</label>
              <input type="text" value={formData.code} disabled
                style={{ ...inputStyle, background: '#f5f5f7' }} />
            </div>
            <div>
              <label style={labelStyle}>안경원명 <span style={{ color: '#ff3b30' }}>*</span></label>
              <input type="text" value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>거래처 유형</label>
              <select value={formData.storeType} 
                onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                disabled={!isEditing}
                style={inputStyle}>
                <option value="소매">소매</option>
                <option value="도매">도매</option>
                <option value="공장">공장</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>대표자</label>
              <input type="text" value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                disabled={!isEditing}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>전화</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="02-000-0000"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>핸드폰</label>
              <input type="tel" value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                disabled={!isEditing}
                placeholder="010-0000-0000"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                placeholder="email@example.com"
                style={inputStyle} />
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff9500', marginBottom: '12px', padding: '8px 0', borderBottom: '2px solid #ff9500' }}>
            🏢 사업자 정보
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>사업자등록번호</label>
              <input type="text" value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                disabled={!isEditing}
                placeholder="000-00-00000"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>업태</label>
              <input type="text" value={formData.businessCategory}
                onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                disabled={!isEditing}
                placeholder="도소매"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>업종</label>
              <input type="text" value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                disabled={!isEditing}
                placeholder="안경"
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>주소</label>
            <input type="text" value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              style={inputStyle} />
          </div>
        </div>

        {/* 거래 정보 */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#34c759', marginBottom: '12px', padding: '8px 0', borderBottom: '2px solid #34c759' }}>
            🤝 거래 정보
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>그룹</label>
              <select value={formData.groupId || ''} 
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!isEditing}
                style={inputStyle}>
                <option value="">선택</option>
                {groups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>영업담당</label>
              <select value={formData.salesStaffId || ''} 
                onChange={(e) => setFormData({ ...formData, salesStaffId: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!isEditing}
                style={inputStyle}>
                <option value="">선택</option>
                {salesStaffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>배송담당</label>
              <select value={formData.deliveryStaffId || ''} 
                onChange={(e) => setFormData({ ...formData, deliveryStaffId: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!isEditing}
                style={inputStyle}>
                <option value="">선택</option>
                {deliveryStaffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>청구일</label>
              <input type="number" min="1" max="31" value={formData.billingDay || ''}
                onChange={(e) => setFormData({ ...formData, billingDay: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!isEditing}
                placeholder="일"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>결제기한</label>
              <input type="number" min="0" value={formData.paymentTermDays}
                onChange={(e) => setFormData({ ...formData, paymentTermDays: parseInt(e.target.value) || 0 })}
                disabled={!isEditing}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>상태</label>
              <select value={formData.isActive ? 'active' : 'inactive'} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                disabled={!isEditing}
                style={inputStyle}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
