'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: 'ê´€ë¦?,
    items: [
      { label: 'ê°€ë§¹ì  ê´€ë¦?, href: '/stores' },
      { label: '?´ë‹¹??ê´€ë¦?, href: '/stores/delivery-staff' },
      { label: 'ê°€ë§¹ì  ê³µì??¬í•­', href: '/stores/notices' },
    ]
  },
  {
    title: 'ê·¸ë£¹ê´€ë¦?,
    items: [
      { label: 'ê·¸ë£¹ë³?ê°€ë§¹ì  ?°ê²°', href: '/stores/groups' },
      { label: 'ê·¸ë£¹ë³?? ì¸???¤ì •', href: '/stores/groups/discounts' },
      { label: 'ê·¸ë£¹ë³??€???¤ì •', href: '/stores/groups/types' },
    ]
  }
]

type TabType = 'ê°€ë§¹ì ëª©ë¡' | 'ë¯¸ê²°?œí˜„?? | '?…ê¸ˆ?´ì—­' | 'ê±°ë˜?´ì—­'

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
  type: 'ì£¼ë¬¸' | '?…ê¸ˆ' | 'ë°˜í’ˆ'
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

const STORE_TYPES = ['?Œë§¤', '?„ë§¤', 'VIP', 'ì§ì˜']
const STATUS_OPTIONS = [
  { value: 'active', label: '?•ìƒ', color: '#4caf50' },
  { value: 'caution', label: 'ì£¼ì˜', color: '#ff9800' },
  { value: 'suspended', label: '?•ì?', color: '#f44336' },
]

export default function StoresPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('ê°€ë§¹ì ëª©ë¡')
  const [stores, setStores] = useState<Store[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  
  // ì»¬ëŸ¼ë³?ê²€???„í„°
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [filterPhone, setFilterPhone] = useState('')
  
  // ?˜ì´ì§€?¤ì´??
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  // ?„í„°
  const [filterGroup, setFilterGroup] = useState('')
  const [filterArea, setFilterArea] = useState('')
  
  // ê·¸ë£¹ ë°??´ë‹¹??ëª©ë¡
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [deliveryStaffList, setDeliveryStaffList] = useState<DeliveryStaff[]>([])
  const [salesStaffList, setSalesStaffList] = useState<SalesStaff[]>([])
  
  // ì§€??ëª©ë¡ (areaCode?ì„œ ì¶”ì¶œ)
  const areaList = [...new Set(stores.map(s => s.areaCode).filter(Boolean))] as string[]
  
  // ?µê³„
  const [stats, setStats] = useState({
    total: 0,
    outstandingStoresCount: 0,
    totalOutstanding: 0,
    totalDepositsThisMonth: 0,
  })
  
  // ? ê·œ?±ë¡ ëª¨ë‹¬
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // ?¼ê´„?±ë¡/?˜ì • ëª¨ë‹¬
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
    // ? ê·œ ?„ë“œ
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
      
      // ?µê³„ ?€??
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
    // ?°ëª¨ ê±°ë˜ ?´ì—­
    const demoTransactions: Transaction[] = [
      { id: 1, storeId: 22, storeName: 'ê¸€?¼ìŠ¤ ë§ìš°??, storeCode: '8107', type: 'ì£¼ë¬¸', amount: 85000, date: '2026-02-09 09:00', description: '[ì¼€ë¯??¼ë°˜] ì¤???2ê±? },
      { id: 2, storeId: 23, storeName: 'ê¸€?¼ìŠ¤?¤í† ë¦?ë¯¸ì‚¬??, storeCode: '8128', type: 'ì£¼ë¬¸', amount: 125000, date: '2026-02-09 09:15', description: '[ì¼€ë¯??¼í™?? ê³ ë¹„ ??3ê±? },
      { id: 3, storeId: 22, storeName: 'ê¸€?¼ìŠ¤ ë§ìš°??, storeCode: '8107', type: '?…ê¸ˆ', amount: 200000, date: '2026-02-08 14:00', description: 'ê³„ì¢Œ?´ì²´' },
      { id: 4, storeId: 42, storeName: '?ˆí¸?œì•ˆê²½ì›', storeCode: '7753', type: 'ì£¼ë¬¸', amount: 42000, date: '2026-02-09 10:30', description: 'ì°©ìƒ‰ 1.60 ë¸Œë¼????1ê±? },
      { id: 5, storeId: 19, storeName: 'ê·¸ë‘?„ë¦¬ ?±ìˆ˜??, storeCode: '4143', type: 'ë°˜í’ˆ', amount: -15000, date: '2026-02-08 16:00', description: 'ë¶ˆëŸ‰ ë°˜í’ˆ' },
      { id: 6, storeId: 47, storeName: '?”ë°?€?ˆê²½ êµ¬ë¦¬', storeCode: '9697', type: '?…ê¸ˆ', amount: 500000, date: '2026-02-07 11:00', description: '?„ê¸ˆ' },
      { id: 7, storeId: 54, storeName: 'ë¡œì´???±ì‹ ?¬ë?', storeCode: '9701', type: 'ì£¼ë¬¸', amount: 95000, date: '2026-02-09 11:00', description: 'RX ?„ì§„ 1.67' },
      { id: 8, storeId: 40, storeName: '?ˆì´?¼ê¸°', storeCode: '11485', type: 'ì£¼ë¬¸', amount: 230000, date: '2026-02-09 11:30', description: 'RX ?‘ë©´ë¹„êµ¬ë©?1.74 ??1ê±? },
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
      // ? ê·œ ?„ë“œ
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
      newErrors.name = 'ê±°ë˜ì²˜ëª…?€ ?„ìˆ˜?…ë‹ˆ??'
    }
    
    if (form.phone && !/^[\d-]+$/.test(form.phone)) {
      newErrors.phone = '?¬ë°”ë¥??„í™”ë²ˆí˜¸ ?•ì‹???„ë‹™?ˆë‹¤.'
    }
    
    if (form.discountRate < 0 || form.discountRate > 100) {
      newErrors.discountRate = '? ì¸?¨ì? 0~100 ?¬ì´?¬ì•¼ ?©ë‹ˆ??'
    }
    
    if (form.paymentTermDays < 0) {
      newErrors.paymentTermDays = 'ê²°ì œ ê¸°í•œ?€ 0 ?´ìƒ?´ì–´???©ë‹ˆ??'
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.'
    }
    
    if (form.businessRegNo && !/^[\d-]+$/.test(form.businessRegNo)) {
      newErrors.businessRegNo = '?¬ë°”ë¥??¬ì—…?ë“±ë¡ë²ˆ???•ì‹???„ë‹™?ˆë‹¤.'
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
        alert(data.error || '?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
        return
      }
      
      alert('ê±°ë˜ì²˜ê? ?±ë¡?˜ì—ˆ?µë‹ˆ??')
      setShowModal(false)
      resetForm()
      fetchStores()
    } catch (e) {
      console.error(e)
      alert('?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    } finally {
      setSaving(false)
    }
  }

  function handleRowClick(store: Store) {
    router.push(`/stores/${store.id}`)
  }

  // ?„í„°ë§?ë¡œì§ (ê²€??+ ê·¸ë£¹ + ì§€??+ ì»¬ëŸ¼ë³?
  const filtered = stores.filter(s => {
    // ê²€?‰ì–´ ?„í„° (?µí•©)
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.code.includes(search) || 
      (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase()))
    
    // ê·¸ë£¹ ?„í„°
    const matchGroup = !filterGroup || s.groupName === filterGroup
    
    // ì§€???„í„°
    const matchArea = !filterArea || s.areaCode === filterArea
    
    // ì»¬ëŸ¼ë³??„í„°
    const matchCode = !filterCode || s.code.toLowerCase().includes(filterCode.toLowerCase())
    const matchName = !filterName || s.name.toLowerCase().includes(filterName.toLowerCase())
    const matchOwner = !filterOwner || (s.ownerName && s.ownerName.toLowerCase().includes(filterOwner.toLowerCase()))
    const matchPhone = !filterPhone || (s.phone && s.phone.includes(filterPhone))
    
    return matchSearch && matchGroup && matchArea && matchCode && matchName && matchOwner && matchPhone
  })

  // ?˜ì´ì§€?¤ì´??ê³„ì‚°
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedStores = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ?˜ì´ì§€ ë³€ê²???1?˜ì´ì§€ë¡?ë¦¬ì…‹
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterGroup, filterArea, filterCode, filterName, filterOwner, filterPhone])

  // ë¯¸ê²°??ê°€ë§¹ì ë§??„í„°
  const outstandingStores = stores.filter(s => (s.outstandingAmount || 0) > 0)
    .sort((a, b) => (b.outstandingAmount || 0) - (a.outstandingAmount || 0))

  // ì´?ë¯¸ê²°??ê¸ˆì•¡
  const totalOutstanding = outstandingStores.reduce((sum, s) => sum + (s.outstandingAmount || 0), 0)

  // ?…ê¸ˆ ?´ì—­ë§?
  const deposits = transactions.filter(t => t.type === '?…ê¸ˆ')

  // ê±°ë˜ ?´ì—­ (ì£¼ë¬¸ + ë°˜í’ˆ)
  const orders = transactions.filter(t => t.type === 'ì£¼ë¬¸' || t.type === 'ë°˜í’ˆ')

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
    <Layout sidebarMenus={SIDEBAR} activeNav="ê°€ë§¹ì ">
      {/* ?¤ë” */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>ê±°ë˜ì²?ê´€ë¦?/h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + ? ê·œ?±ë¡
          </button>
          <button 
            style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff' }}
            onClick={() => { setBulkResult(null); setShowBulkModal(true); }}
          >
            ?“¤ ?¼ê´„?±ë¡
          </button>
          <button style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}>
            ?“¥ ?‘ì??¤ìš´
          </button>
        </div>
      </div>

      {/* ?ë‹¨ ?”ì•½ ì¹´ë“œ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12,
        marginBottom: 15
      }}>
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #5d7a5d'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>?„ì²´ ê°€ë§¹ì </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{stats.total.toLocaleString()}</div>
        </div>
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>ë¯¸ê²°??ê°€ë§¹ì </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{stats.outstandingStoresCount.toLocaleString()}</div>
        </div>
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>ì´?ë¯¸ê²°?œì•¡</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{stats.totalOutstanding.toLocaleString()}??/div>
        </div>
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>?´ë²ˆ ???…ê¸ˆ</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>
            {stats.totalDepositsThisMonth.toLocaleString()}??
          </div>
        </div>
      </div>

      {/* ??*/}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #5d7a5d',
        background: 'var(--bg-secondary)',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden'
      }}>
        {(['ê°€ë§¹ì ëª©ë¡', 'ë¯¸ê²°?œí˜„??, '?…ê¸ˆ?´ì—­', 'ê±°ë˜?´ì—­'] as TabType[]).map(tab => (
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
            {tab === 'ë¯¸ê²°?œí˜„?? && outstandingStores.length > 0 && (
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

      {/* ì½˜í…ì¸??ì—­ */}
      <div style={{ 
        ...cardStyle, 
        borderRadius: '0 0 8px 8px',
        borderTop: 'none',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* ê°€ë§¹ì  ëª©ë¡ ??*/}
        {activeTab === 'ê°€ë§¹ì ëª©ë¡' && (
          <>
            {/* ê²€???„í„° */}
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select 
                style={selectStyle}
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
              >
                <option value="">ê·¸ë£¹ ?„ì²´</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
              <select 
                style={selectStyle}
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
              >
                <option value="">ì§€???„ì²´</option>
                {areaList.sort().map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="ê°€ë§¹ì ëª? ì½”ë“œ, ?€?œì ê²€??.." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, minWidth: 250 }} 
              />
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
                ê²€?‰ê²°ê³? <strong>{filtered.length.toLocaleString()}</strong>ê°?
              </div>
            </div>
            
            {/* ?Œì´ë¸?*/}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ì½”ë“œ</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ê°€ë§¹ì ëª?/th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?€?œì</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?°ë½ì²?/th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ë¯¸ê²°?œì•¡</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ì£¼ë¬¸??/th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ìµœê·¼ì£¼ë¬¸</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?íƒœ</th>
                  </tr>
                  <tr style={{ background: '#eef4ee' }}>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="ì½”ë“œ"
                        value={filterCode}
                        onChange={e => setFilterCode(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="ê°€ë§¹ì ëª?
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="?€?œì"
                        value={filterOwner}
                        onChange={e => setFilterOwner(e.target.value)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: 11 }}
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="?°ë½ì²?
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
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</td>
                    </tr>
                  ) : paginatedStores.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ê²€??ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤</td>
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
                          {(store.outstandingAmount || 0) > 0 ? (store.outstandingAmount || 0).toLocaleString() + '?? : '-'}
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
                            {store.isActive ? '?œì„±' : 'ë¹„í™œ??}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* ?˜ì´ì§€?¤ì´??*/}
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
                    background: 'var(--bg-primary)',
                    borderRadius: 4,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ??
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: 'var(--bg-primary)',
                    borderRadius: 4,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ï¼?
                </button>
                
                {/* ?˜ì´ì§€ ë²ˆí˜¸??*/}
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
                        padding: '6px 12px', border: '1px solid #ddd', background: 'var(--bg-primary)',
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
                        padding: '6px 12px', border: '1px solid #ddd', background: 'var(--bg-primary)',
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
                    background: 'var(--bg-primary)',
                    borderRadius: 4,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ï¼?
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: 'var(--bg-primary)',
                    borderRadius: 4,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: 12
                  }}
                >
                  ??
                </button>
                
                <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>
                  {currentPage} / {totalPages} ?˜ì´ì§€
                </span>
              </div>
            )}
          </>
        )}

        {/* ë¯¸ê²°???„í™© ??*/}
        {activeTab === 'ë¯¸ê²°?œí˜„?? && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {outstandingStores.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>??/div>
                ë¯¸ê²°??ê°€ë§¹ì ???†ìŠµ?ˆë‹¤
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff3e0' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>?œìœ„</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>ì½”ë“œ</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>ê°€ë§¹ì ëª?/th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>?€?œì</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>?°ë½ì²?/th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>ë¯¸ê²°?œì•¡</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ff9800' }}>?¡ì…˜</th>
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
                        {(store.outstandingAmount || 0).toLocaleString()}??
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
                          ?…ê¸ˆ?±ë¡
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ?…ê¸ˆ ?´ì—­ ??*/}
        {activeTab === '?…ê¸ˆ?´ì—­' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#e8f5e9' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>?¼ì‹œ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>ì½”ë“œ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>ê°€ë§¹ì ëª?/th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>?…ê¸ˆ??/th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #4caf50' }}>ë¹„ê³ </th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>?…ê¸ˆ ?´ì—­???†ìŠµ?ˆë‹¤</td>
                  </tr>
                ) : (
                  deposits.map((tx, index) => (
                    <tr key={tx.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.date}</td>
                      <td style={{ padding: '12px', fontSize: 12, fontFamily: 'monospace' }}>{tx.storeCode}</td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{tx.storeName}</td>
                      <td style={{ padding: '12px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#4caf50' }}>
                        +{tx.amount.toLocaleString()}??
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{tx.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ê±°ë˜ ?´ì—­ ??*/}
        {activeTab === 'ê±°ë˜?´ì—­' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#eef4ee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>?¼ì‹œ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>ì½”ë“œ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>ê°€ë§¹ì ëª?/th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>? í˜•</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>ê¸ˆì•¡</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #5d7a5d' }}>?´ìš©</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ê±°ë˜ ?´ì—­???†ìŠµ?ˆë‹¤</td>
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
                          background: tx.type === 'ì£¼ë¬¸' ? '#eef4ee' : '#ffebee',
                          color: tx.type === 'ì£¼ë¬¸' ? '#5d7a5d' : '#f44336'
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
                        {tx.amount < 0 ? tx.amount.toLocaleString() : '+' + tx.amount.toLocaleString()}??
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

      {/* ? ê·œ?±ë¡ ëª¨ë‹¬ */}
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
            {/* ëª¨ë‹¬ ?¤ë” */}
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
                  <span style={{ fontSize: 28 }}>?ª</span> ? ê·œ ê±°ë˜ì²??±ë¡
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '6px 0 0' }}>?ˆë¡œ??ê±°ë˜ì²??•ë³´ë¥??…ë ¥?´ì£¼?¸ìš”</p>
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
                ??
              </button>
            </div>
            
            {/* ëª¨ë‹¬ ë°”ë”” */}
            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                {/* ?¼ìª½: ê¸°ë³¸ ?•ë³´ */}
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
                    <span style={{ fontSize: 18 }}>?“‹</span> ê¸°ë³¸ ?•ë³´
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ê±°ë˜ì²˜ëª… *</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="?? ê¸€?¼ìŠ¤?ˆê²½"
                      />
                      {errors.name && <div style={errorStyle}>{errors.name}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ì½”ë“œ (?ë™?ì„±)</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: '#f9f9f9' }}
                        value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value })}
                        placeholder="ë¹„ì›Œ?ë©´ ?ë™?ì„±"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?€?œìëª?/label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.ownerName}
                        onChange={e => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="?ê¸¸??
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?±ë¡??/label>
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
                      <label style={labelStyle}>?“ ?°ë½ì²?/label>
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
                      <label style={labelStyle}>?“± ?¸ë“œ??/label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        placeholder="010-1234-5678"
                      />
                    </div>
                  </div>
                  
                  {/* ?¬ì—…???•ë³´ (? ê·œ) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?¬ì—…?ë“±ë¡ë²ˆ??/label>
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
                      <label style={labelStyle}>?…íƒœ</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.businessType}
                        onChange={e => setForm({ ...form, businessType: e.target.value })}
                        placeholder="?Œë§¤??
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?…ì¢…</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.businessCategory}
                        onChange={e => setForm({ ...form, businessCategory: e.target.value })}
                        placeholder="?ˆê²½"
                      />
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>ì£¼ì†Œ</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="?œìš¸??ê°•ë‚¨êµ?.."
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ê±°ë˜ì²?? í˜•</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.storeType}
                        onChange={e => setForm({ ...form, storeType: e.target.value })}
                      >
                        <option value="">? íƒ</option>
                        {STORE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ê·¸ë£¹</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.groupId}
                        onChange={e => setForm({ ...form, groupId: e.target.value })}
                      >
                        <option value="">? íƒ ?ˆí•¨</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ë°°ì†¡?´ë‹¹</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.deliveryStaffId}
                        onChange={e => setForm({ ...form, deliveryStaffId: e.target.value })}
                      >
                        <option value="">? íƒ ?ˆí•¨</option>
                        {deliveryStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}{staff.areaCode ? ` (${staff.areaCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ë°°ì†¡?´ë‹¹???°ë½ì²?/label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: 'var(--bg-secondary)' }}
                        value={deliveryStaffList.find(s => String(s.id) === form.deliveryStaffId)?.phone || ''}
                        readOnly
                        placeholder="ë°°ì†¡?´ë‹¹ ? íƒ???ë™?œì‹œ"
                      />
                    </div>
                  </div>
                  
                </div>
                
                {/* ?¤ë¥¸ìª? ê²°ì œ?•ë³´ ë°??´ë‹¹??*/}
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
                    <span style={{ fontSize: 18 }}>?’°</span> ê²°ì œ ?•ë³´
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ê²°ì œ ê¸°í•œ (??</label>
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
                      <label style={labelStyle}>ì²?µ¬??(ë§¤ì›”)</label>
                      <input 
                        type="number"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.billingDay}
                        onChange={e => setForm({ ...form, billingDay: e.target.value })}
                        min={1}
                        max={31}
                        placeholder="?? 15"
                      />
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>ë§¤ì›” ì²?µ¬??/p>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>ê¸°ë³¸ ? ì¸??(%)</label>
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
                    <label style={labelStyle}>ì´ˆê¸° ë¯¸ìˆ˜ê¸?/label>
                    <input 
                      type="number"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.outstandingAmount}
                      onChange={e => setForm({ ...form, outstandingAmount: parseInt(e.target.value) || 0 })}
                      min={0}
                      placeholder="0"
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>ê¸°ì¡´ ë¯¸ìˆ˜ê¸ˆì´ ?ˆëŠ” ê²½ìš° ?…ë ¥</p>
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
                    <span style={{ fontSize: 18 }}>?‘”</span> ?´ë‹¹???•ë³´
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?ì—…?´ë‹¹</label>
                      <select 
                        style={{ ...selectStyle, width: '100%' }}
                        value={form.salesStaffId}
                        onChange={e => setForm({ ...form, salesStaffId: e.target.value })}
                      >
                        <option value="">? íƒ ?ˆí•¨</option>
                        {salesStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}{staff.areaCode ? ` (${staff.areaCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>?ì—…?´ë‹¹???°ë½ì²?/label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', background: 'var(--bg-secondary)' }}
                        value={salesStaffList.find(s => String(s.id) === form.salesStaffId)?.phone || ''}
                        readOnly
                        placeholder="?ì—…?´ë‹¹ ? íƒ???ë™?œì‹œ"
                      />
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>ë©”ì¼ì£¼ì†Œ</label>
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
                    <label style={labelStyle}>ê±°ë˜?íƒœ</label>
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
                    <span style={{ fontSize: 18 }}>?“</span> ê¸°í?
                  </h3>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>ê¸°í??¬í•­</label>
                    <textarea 
                      style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical' }}
                      value={form.memo}
                      onChange={e => setForm({ ...form, memo: e.target.value })}
                      placeholder="?¹ì´?¬í•­, ë©”ëª¨ ??.."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* ëª¨ë‹¬ ?¸í„° */}
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
                  background: 'var(--bg-primary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setShowModal(false)}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#999' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ccc' }}
              >
                ì·¨ì†Œ
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
                {saving ? '?±ë¡ ì¤?..' : '???±ë¡?˜ê¸°'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ?¼ê´„?±ë¡ ëª¨ë‹¬ */}
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
              background: 'var(--bg-primary)',
              borderRadius: 16,
              width: '90%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* ëª¨ë‹¬ ?¤ë” */}
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>
                  ?“¤ ê±°ë˜ì²??¼ê´„ {bulkMode === 'register' ? '?±ë¡' : '?˜ì •'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '6px 0 0' }}>
                  CSV ?Œì¼ë¡??¬ëŸ¬ ê±°ë˜ì²˜ë? ?œë²ˆ??{bulkMode === 'register' ? '?±ë¡' : '?˜ì •'}
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
                ??
              </button>
            </div>
            
            {/* ëª¨ë“œ ??*/}
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
                ??? ê·œ ?±ë¡
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
                ?ï¸ ?¼ê´„ ?˜ì •
              </button>
            </div>
            
            {/* ëª¨ë‹¬ ë°”ë”” */}
            <div style={{ padding: 28 }}>
              {/* ?‘ì‹ ?¤ìš´ë¡œë“œ */}
              <div style={{ 
                background: bulkMode === 'register' ? '#eef4ee' : '#fff3e0', 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: bulkMode === 'register' ? '#5d7a5d' : '#ff9800' }}>
                  1ï¸âƒ£ {bulkMode === 'register' ? '?‘ì‹ ?¤ìš´ë¡œë“œ' : '?„ì¬ ?°ì´???¤ìš´ë¡œë“œ'}
                </h3>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                  {bulkMode === 'register' 
                    ? '?„ë˜ ?‘ì‹???¤ìš´ë¡œë“œ?˜ì—¬ ê±°ë˜ì²??•ë³´ë¥??…ë ¥?˜ì„¸??'
                    : '?„ì¬ ê±°ë˜ì²?ëª©ë¡???¤ìš´ë¡œë“œ?˜ì—¬ ?˜ì • ???…ë¡œ?œí•˜?¸ìš”. (ì½”ë“œ ê¸°ì??¼ë¡œ ë§¤ì¹­)'}
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
                    const headers = ['ì½”ë“œ', 'ê±°ë˜ì²˜ëª…', '?€?œì', '?°ë½ì²?, 'ì£¼ì†Œ', '?¬ì—…?ë“±ë¡ë²ˆ??, '?…íƒœ', '?…ì¢…', '?´ë©”??, 'ì²?µ¬??, 'ì§€??½”??, 'ê±°ë˜ì²˜ìœ ??, 'ë¯¸ê²°?œì•¡', '?íƒœ']
                    
                    if (bulkMode === 'register') {
                      // ë¹??‘ì‹ ?¤ìš´ë¡œë“œ
                      const sample = ['1001', '?˜í”Œ?ˆê²½??, '?ê¸¸??, '02-1234-5678', '?œìš¸??ê°•ë‚¨êµ?, '123-45-67890', '?Œë§¤??, '?ˆê²½', 'sample@email.com', '25', 'ê°•ë‚¨', '?Œë§¤', '0', 'active']
                      const csvContent = '\uFEFF' + headers.join(',') + '\n' + sample.join(',')
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'ê±°ë˜ì²??±ë¡_?‘ì‹.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    } else {
                      // ?„ì¬ ?°ì´???¤ìš´ë¡œë“œ
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
                      a.download = `ê±°ë˜ì²?ëª©ë¡_${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }}
                >
                  ?“¥ {bulkMode === 'register' ? '?‘ì‹ ?¤ìš´ë¡œë“œ' : '?„ì¬ ?°ì´???¤ìš´ë¡œë“œ'} (CSV)
                </button>
              </div>
              
              {/* ?Œì¼ ?…ë¡œ??*/}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#333' }}>
                  2ï¸âƒ£ ?Œì¼ ?…ë¡œ??
                </h3>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                  {bulkMode === 'register' 
                    ? '?‘ì„±??CSV ?Œì¼??? íƒ?˜ì„¸?? (ì²??‰ì? ?¤ë”)'
                    : '?˜ì •??CSV ?Œì¼??? íƒ?˜ì„¸?? ì½”ë“œ ê¸°ì??¼ë¡œ ê¸°ì¡´ ?°ì´?°ë? ?…ë°?´íŠ¸?©ë‹ˆ??'}
                </p>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  style={{ marginBottom: 12 }}
                />
                {bulkFile && (
                  <div style={{ fontSize: 13, color: '#4caf50' }}>
                    ??? íƒ???Œì¼: {bulkFile.name}
                  </div>
                )}
              </div>
              
              {/* ?…ë¡œ??ê²°ê³¼ */}
              {bulkResult && (
                <div style={{ 
                  background: bulkResult.success ? '#e8f5e9' : '#ffebee', 
                  padding: 20, 
                  borderRadius: 12,
                  marginBottom: 24
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: bulkResult.success ? '#4caf50' : '#f44336' }}>
                    {bulkResult.success ? `??${bulkMode === 'register' ? '?±ë¡' : '?˜ì •'} ?„ë£Œ!` : `??${bulkMode === 'register' ? '?±ë¡' : '?˜ì •'} ?¤íŒ¨`}
                  </h3>
                  {bulkResult.success ? (
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                      <li>?…ë ¥ ?°ì´?? {bulkResult.totalInput}ê±?/li>
                      {bulkMode === 'register' ? (
                        <>
                          <li>?±ë¡ ?±ê³µ: {bulkResult.insertedCount}ê±?/li>
                          <li>?¤í‚µ: {bulkResult.skippedCount}ê±?/li>
                        </>
                      ) : (
                        <>
                          <li>?˜ì • ?±ê³µ: {bulkResult.updatedCount}ê±?/li>
                          <li>?¤í‚µ: {bulkResult.skippedCount}ê±?/li>
                          {bulkResult.notFoundCount > 0 && (
                            <li style={{ color: '#ff9800' }}>ë¯¸ë°œê²? {bulkResult.notFoundCount}ê±?/li>
                          )}
                        </>
                      )}
                      {bulkResult.errors?.length > 0 && (
                        <li style={{ color: '#f44336' }}>?¤ë¥˜: {bulkResult.errors.slice(0,3).join(', ')}</li>
                      )}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: '#f44336' }}>{bulkResult.error}</p>
                  )}
                </div>
              )}
              
              {/* ?…ë¡œ??ë²„íŠ¼ */}
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
                    
                    // ?¤ë” ë§¤í•‘
                    const headerMap: Record<string, string> = {
                      'ì½”ë“œ': 'code',
                      'ê±°ë˜ì²˜ëª…': 'name',
                      '?€?œì': 'ownerName',
                      '?°ë½ì²?: 'phone',
                      'ì£¼ì†Œ': 'address',
                      '?¬ì—…?ë“±ë¡ë²ˆ??: 'businessRegNo',
                      '?…íƒœ': 'businessType',
                      '?…ì¢…': 'businessCategory',
                      '?´ë©”??: 'email',
                      'ì²?µ¬??: 'billingDay',
                      'ì§€??½”??: 'areaCode',
                      'ê±°ë˜ì²˜ìœ ??: 'storeType'
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
                      fetchStores() // ëª©ë¡ ?ˆë¡œê³ ì¹¨
                    }
                  } catch (e: any) {
                    setBulkResult({ success: false, error: e.message })
                  } finally {
                    setBulkUploading(false)
                  }
                }}
              >
                {bulkUploading ? 'ì²˜ë¦¬ ì¤?..' : `?? ?¼ê´„ ${bulkMode === 'register' ? '?±ë¡' : '?˜ì •'}?˜ê¸°`}
              </button>
              
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12, textAlign: 'center' }}>
                {bulkMode === 'register' 
                  ? '??ê¸°ì¡´ ê±°ë˜ì²˜ëŠ” ? ì??˜ë©°, ??ê±°ë˜ì²˜ë§Œ ì¶”ê??©ë‹ˆ??'
                  : '??ì½”ë“œê°€ ?¼ì¹˜?˜ëŠ” ê±°ë˜ì²˜ì˜ ?•ë³´ê°€ ?…ë°?´íŠ¸?©ë‹ˆ??'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
