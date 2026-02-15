'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../components/Layout'
import { STORES_SIDEBAR } from '../constants/sidebar'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import TableSkeleton from '../components/TableSkeleton'

interface Store {
  id: number
  code: string
  name: string
  ownerName: string
  phone: string
  address: string
  isActive: boolean
  orderCount: number
  lastOrderDate: string | null
  createdAt: string
  groupName: string | null
  salesRepName: string | null
  deliveryContact: string | null
  deliveryStaffName: string | null
}

interface Stats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
}

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
  createdAt: string
  initialReceivables: number
}

const initialFormData: FormData = {
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
  createdAt: '',
  initialReceivables: 0,
}

export default function StoresPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [data, setData] = useState<Store[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, newThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchOwner, setSearchOwner] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [searchSalesRep, setSearchSalesRep] = useState('')
  const [searchDelivery, setSearchDelivery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [salesStaffList, setSalesStaffList] = useState<Staff[]>([])
  const [deliveryStaffList, setDeliveryStaffList] = useState<Staff[]>([])
  const [bulkGroupId, setBulkGroupId] = useState<number | null>(null)
  
  // 삭제 모달 관련 state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; store?: Store }>({ type: 'bulk' })
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // 일괄 등록 모달
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  // 컬럼 너비 조절 기능
  const defaultColWidths = [40, 60, 160, 60, 100, 250, 80, 80, 200]
  const colNames = ['checkbox', 'group', 'name', 'owner', 'phone', 'address', 'salesRep', 'delivery', 'actions']
  const [colWidths, setColWidths] = useState<number[]>(defaultColWidths)
  const resizingCol = useRef<number | null>(null)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  // localStorage에서 컬럼 너비 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('storesTableColWidths')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === defaultColWidths.length) {
          setColWidths(parsed)
        }
      } catch (e) { /* ignore */ }
    }
  }, [])

  // 컬럼 너비 저장
  const saveColWidths = (widths: number[]) => {
    localStorage.setItem('storesTableColWidths', JSON.stringify(widths))
  }

  // 리사이즈 시작
  const handleResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    resizingCol.current = colIndex
    startX.current = e.clientX
    startWidth.current = colWidths[colIndex]
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  // 리사이즈 중
  const handleResizeMove = (e: MouseEvent) => {
    if (resizingCol.current === null) return
    const diff = e.clientX - startX.current
    const newWidth = Math.max(40, startWidth.current + diff)
    setColWidths(prev => {
      const updated = [...prev]
      updated[resizingCol.current!] = newWidth
      return updated
    })
  }

  // 리사이즈 종료
  const handleResizeEnd = () => {
    if (resizingCol.current !== null) {
      setColWidths(prev => {
        saveColWidths(prev)
        return prev
      })
    }
    resizingCol.current = null
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }

  // 컬럼 너비 초기화
  const resetColWidths = () => {
    setColWidths(defaultColWidths)
    localStorage.removeItem('storesTableColWidths')
  }

  useEffect(() => {
    fetch('/api/store-groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGroups(data)
      })
      .catch(err => console.error('Failed to fetch groups:', err))
    
    fetch('/api/sales-staff')
      .then(res => res.json())
      .then(data => {
        if (data.salesStaff && Array.isArray(data.salesStaff)) setSalesStaffList(data.salesStaff)
      })
      .catch(err => console.error('Failed to fetch sales staff:', err))
    
    fetch('/api/delivery-staff')
      .then(res => res.json())
      .then(data => {
        if (data.deliveryStaff && Array.isArray(data.deliveryStaff)) setDeliveryStaffList(data.deliveryStaff)
      })
      .catch(err => console.error('Failed to fetch delivery staff:', err))
  }, [])

  // 검색 파라미터를 ref로 관리 (타이핑할 때마다 API 호출 방지)
  const searchRef = useRef({ code: '', name: '', owner: '', phone: '', address: '', salesRep: '', delivery: '' })
  const [searchTrigger, setSearchTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '100')
      if (filter !== 'all') params.set('status', filter)
      if (searchRef.current.code) params.set('groupName', searchRef.current.code)
      if (searchRef.current.name) params.set('name', searchRef.current.name)
      if (searchRef.current.owner) params.set('ownerName', searchRef.current.owner)
      if (searchRef.current.phone) params.set('phone', searchRef.current.phone)
      if (searchRef.current.address) params.set('address', searchRef.current.address)
      if (searchRef.current.salesRep) params.set('salesRepName', searchRef.current.salesRep)
      if (searchRef.current.delivery) params.set('deliveryContact', searchRef.current.delivery)
      
      const res = await fetch(`/api/stores?${params}`)
      const json = await res.json()
      
      if (json.error) { console.error(json.error); return }
      
      setData(json.stores)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
      setTotalCount(json.pagination.total)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
    setLoading(false)
  }, [filter, page, searchTrigger])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => {
    searchRef.current = { 
      code: searchCode, name: searchName, owner: searchOwner, 
      phone: searchPhone, address: searchAddress, 
      salesRep: searchSalesRep, delivery: searchDelivery 
    }
    setPage(1)
    setSearchTrigger(t => t + 1)
  }

  const openModal = (store: any | null = null) => {
    if (store) {
      setEditingStore(store)
      setFormData({
        code: store.code,
        name: store.name,
        ownerName: store.ownerName === '-' ? '' : store.ownerName,
        phone: store.phone === '-' ? '' : store.phone,
        mobile: store.mobile || '',
        address: store.address === '-' ? '' : store.address,
        storeType: store.storeType || '소매',
        businessType: store.businessType || '',
        businessCategory: store.businessCategory || '',
        businessNumber: store.businessNumber || store.businessRegNo || '',
        email: store.email || '',
        billingDay: store.billingDay || null,
        groupId: store.groupId || null,
        salesStaffId: store.salesStaffId || null,
        deliveryStaffId: store.deliveryStaffId || null,
        isActive: store.isActive,
        createdAt: store.createdAt || '',
        initialReceivables: store.initialReceivables || 0,
      })
    } else {
      setEditingStore(null)
      setFormData({ ...initialFormData, createdAt: new Date().toISOString().split('T')[0] })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('안경원명을 입력해주세요.'); return }
    setSaving(true)
    try {
      const url = editingStore ? `/api/stores/${editingStore.id}` : '/api/stores'
      const res = await fetch(url, {
        method: editingStore ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.error) { alert(json.error); return }
      alert(editingStore ? '수정되었습니다.' : '등록되었습니다.')
      setShowModal(false)
      fetchData()
    } catch (error) { alert('저장에 실패했습니다.') }
    setSaving(false)
  }

  const handleDeleteClick = (store: Store) => {
    setDeleteTarget({ type: 'single', store })
    setDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      if (deleteTarget.type === 'single' && deleteTarget.store) {
        const res = await fetch(`/api/stores/${deleteTarget.store.id}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.error) { alert(json.error); return }
        alert(json.message || '삭제되었습니다.')
      } else {
        // 일괄 삭제
        const res = await fetch('/api/stores/bulk-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
        })
        const json = await res.json()
        if (json.error) { alert(json.error); return }
        alert(json.message || '삭제되었습니다.')
        setSelectedIds(new Set())
      }
      setDeleteModalOpen(false)
      fetchData()
    } catch (error) {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // 일괄 작업 함수들
  const handleBulkAction = async (action: string, value?: any) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { alert('선택된 가맹점이 없습니다.'); return }
    
    try {
      const res = await fetch('/api/stores/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, value }),
      })
      const json = await res.json()
      if (json.error) { alert(json.error); return }
      alert(json.message)
      setSelectedIds(new Set())
      fetchData()
    } catch (error) { alert('일괄 작업에 실패했습니다.') }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) { alert('선택된 가맹점이 없습니다.'); return }
    setDeleteTarget({ type: 'bulk' })
    setDeleteModalOpen(true)
  }

  const handleBulkSetGroup = () => {
    setBulkGroupId(null)
    setShowGroupModal(true)
  }

  const confirmBulkSetGroup = () => {
    handleBulkAction('setGroup', bulkGroupId)
    setShowGroupModal(false)
  }

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(data.map(d => d.id)))
  }

  // CSV 파일 파싱
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const rows = []
    
    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }
    return rows
  }

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkUploadFile(file)
    setBulkUploadResult(null)
    
    const text = await file.text()
    const parsed = parseCSV(text)
    setBulkUploadPreview(parsed.slice(0, 5)) // 미리보기 5개만
  }

  // 일괄 등록 실행
  const handleBulkUpload = async () => {
    if (!bulkUploadFile) return
    
    setBulkUploading(true)
    setBulkUploadResult(null)
    
    try {
      const text = await bulkUploadFile.text()
      const rows = parseCSV(text)
      
      const res = await fetch('/api/stores/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stores: rows })
      })
      
      const result = await res.json()
      setBulkUploadResult(result)
      
      if (result.success > 0) {
        fetchData() // 목록 새로고침
      }
    } catch (error) {
      setBulkUploadResult({ success: 0, failed: 0, errors: ['파일 처리 중 오류가 발생했습니다.'] })
    } finally {
      setBulkUploading(false)
    }
  }

  // 샘플 CSV 다운로드
  const downloadSampleCSV = () => {
    const headers = ['안경원명', '대표자', '전화', '주소', '사업자등록번호', '업태', '업종', '이메일', '그룹명', '거래처유형']
    const sample = [
      ['테스트안경원', '홍길동', '02-1234-5678', '서울시 강남구 테헤란로 123', '123-45-67890', '도소매', '안경', 'test@example.com', '', '소매']
    ]
    
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sample.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '가맹점_일괄등록_양식.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 엑셀 다운로드 (전체 정보)
  const handleExcelDownload = async () => {
    try {
      // 현재 필터 조건으로 전체 데이터 가져오기
      const params = new URLSearchParams()
      params.set('limit', '10000') // 전체
      params.set('export', 'true') // 전체 필드 요청
      if (filter !== 'all') params.set('status', filter)
      if (searchRef.current.code) params.set('groupName', searchRef.current.code)
      if (searchRef.current.name) params.set('name', searchRef.current.name)
      if (searchRef.current.owner) params.set('ownerName', searchRef.current.owner)
      if (searchRef.current.phone) params.set('phone', searchRef.current.phone)
      if (searchRef.current.address) params.set('address', searchRef.current.address)
      if (searchRef.current.salesRep) params.set('salesRepName', searchRef.current.salesRep)
      if (searchRef.current.delivery) params.set('deliveryContact', searchRef.current.delivery)
      
      const res = await fetch(`/api/stores?${params}`)
      const json = await res.json()
      
      console.log('Download response:', json)
      
      if (json.error) {
        alert('다운로드 오류: ' + json.error)
        return
      }
      
      if (!json.stores || json.stores.length === 0) {
        alert('다운로드할 데이터가 없습니다. (총 ' + (json.pagination?.total || 0) + '건)')
        return
      }

      // CSV 생성 (모든 정보 포함)
      const headers = [
        '코드', '그룹', '안경원명', '거래처유형', '대표자', 
        '전화', '배송연락처', '이메일',
        '주소', '배송주소',
        '사업자등록번호', '업태', '업종',
        '영업담당', '배송담당', 
        '기본할인율(%)', '결제기한(일)', '청구일',
        '초기미수금', '미수금잔액',
        '상태', '등록일'
      ]
      const rows = json.stores.map((store: any) => [
        store.code || '',
        store.groupName || '',
        store.name || '',
        store.storeType || '',
        store.ownerName || '',
        store.phone || '',
        store.deliveryPhone || store.deliveryContact || '',
        store.email || '',
        store.address || '',
        store.deliveryAddress || '',
        store.businessRegNo || '',
        store.businessType || '',
        store.businessCategory || '',
        store.salesRepName || store.salesStaffName || '',
        store.deliveryStaffName || '',
        store.discountRate || 0,
        store.paymentTermDays || 30,
        store.billingDay || '',
        store.initialReceivables || 0,
        store.outstandingAmount || 0,
        store.isActive ? '활성' : '비활성',
        store.createdAt ? store.createdAt.split('T')[0] : ''
      ])

      // BOM + CSV
      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map((row: (string|number)[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `가맹점_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드에 실패했습니다.')
    }
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 + 통계 + 필터 통합 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>가맹점</h2>
          {/* 인라인 통계 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
            <span>🏪 전체 <strong style={{ color: '#1d1d1f' }}>{stats.total.toLocaleString()}</strong></span>
            <span>✅ 활성 <strong style={{ color: '#34c759' }}>{stats.active.toLocaleString()}</strong></span>
            <span>⏸️ 비활성 <strong style={{ color: '#ff9500' }}>{stats.inactive.toLocaleString()}</strong></span>
            <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontSize: '12px' }}>✨ 신규 {stats.newThisMonth}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* 필터 버튼 */}
          {[
            { label: '전체', value: 'all' },
            { label: '활성', value: 'active' },
            { label: '비활성', value: 'inactive' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: filter === opt.value ? '#007aff' : '#f5f5f7',
                color: filter === opt.value ? '#fff' : '#666'
              }}
            >
              {opt.label}
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', background: '#e0e0e0', margin: '0 4px' }} />
          <button onClick={resetColWidths} style={{ padding: '6px 12px', fontSize: '12px', color: '#86868b', background: '#f5f5f7', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="컬럼 너비 초기화">
            ↺ <span>초기화</span>
          </button>
          <button onClick={handleExcelDownload} style={{ padding: '6px 12px', fontSize: '12px', color: '#2e7d32', background: '#e8f5e9', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
            <span style={{ fontSize: '14px' }}>⬇</span> 다운로드
          </button>
          <button onClick={() => setShowBulkUploadModal(true)} style={{ padding: '6px 12px', fontSize: '12px', color: '#1565c0', background: '#e3f2fd', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
            <span style={{ fontSize: '14px' }}>⬆</span> 일괄등록
          </button>
          <button onClick={() => openModal(null)} style={{ padding: '6px 14px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            + 등록
          </button>
        </div>
      </div>

      {/* 일괄 작업 바 - 선택된 항목이 있을 때만 표시 */}
      {selectedIds.size > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px', 
          background: '#e3f2fd', 
          borderRadius: '6px', 
          marginBottom: '8px',
          border: '1px solid #90caf9'
        }}>
          <span style={{ fontWeight: 600, color: '#1976d2', fontSize: '13px' }}>
            ✓ {selectedIds.size}개
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleBulkSetGroup} style={{ padding: '5px 10px', borderRadius: '4px', background: '#fff', color: '#1976d2', border: '1px solid #1976d2', fontSize: '12px', cursor: 'pointer' }}>📁 그룹</button>
          <button onClick={() => handleBulkAction('setActive')} style={{ padding: '5px 10px', borderRadius: '4px', background: '#fff', color: '#2e7d32', border: '1px solid #2e7d32', fontSize: '12px', cursor: 'pointer' }}>✅</button>
          <button onClick={() => handleBulkAction('setInactive')} style={{ padding: '5px 10px', borderRadius: '4px', background: '#fff', color: '#e65100', border: '1px solid #e65100', fontSize: '12px', cursor: 'pointer' }}>⏸️</button>
          <button onClick={handleBulkDelete} style={{ padding: '5px 10px', borderRadius: '4px', background: '#c62828', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
          <button onClick={() => setSelectedIds(new Set())} style={{ padding: '5px 10px', borderRadius: '4px', background: '#f5f5f7', color: '#666', border: 'none', fontSize: '12px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ background: '#fff', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: `${w}px` }} />
            ))}
          </colgroup>
          <thead>
            {/* 헤더 + 검색 필터 통합 */}
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} />
              </th>
              {[
                { label: '그룹', placeholder: '그룹', value: searchCode, onChange: setSearchCode },
                { label: '안경원명', placeholder: '이름', value: searchName, onChange: setSearchName },
                { label: '대표자', placeholder: '대표자', value: searchOwner, onChange: setSearchOwner },
                { label: '연락처', placeholder: '전화', value: searchPhone, onChange: setSearchPhone },
                { label: '주소', placeholder: '주소', value: searchAddress, onChange: setSearchAddress },
                { label: '영업', placeholder: '영업', value: searchSalesRep, onChange: setSearchSalesRep },
                { label: '배송', placeholder: '배송', value: searchDelivery, onChange: setSearchDelivery },
              ].map((field, i) => (
                <th key={field.label} style={{ 
                  padding: '8px 4px', 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  whiteSpace: 'nowrap', 
                  position: 'relative',
                  verticalAlign: 'middle',
                  userSelect: 'none' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <span style={{ color: '#1d1d1f', fontWeight: 600, fontSize: '14px' }}>{field.label}</span>
                    <input 
                      type="text" 
                      placeholder={field.placeholder}
                      value={field.value} 
                      onChange={(e) => field.onChange(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #c5d9f1', fontSize: '11px', fontWeight: 400, textAlign: 'center', background: '#f8faff' }} 
                    />
                  </div>
                  {i < 7 && (
                    <div
                      onMouseDown={(e) => handleResizeStart(e, i + 1)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '15%',
                        height: '70%',
                        width: '5px',
                        cursor: 'col-resize',
                        borderRight: '2px solid #e0e0e0',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#86b7fe')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                    />
                  )}
                </th>
              ))}
              <th style={{ padding: '8px 8px', textAlign: 'center', position: 'sticky', right: 0, background: '#f8f9fa', boxShadow: '-2px 0 4px rgba(0,0,0,0.08)', zIndex: 10, verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  <span style={{ color: '#1d1d1f', fontWeight: 600, fontSize: '14px' }}>관리</span>
                  <button onClick={handleSearch} style={{ padding: '4px 10px', borderRadius: '4px', background: '#007aff', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer' }}>🔍</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // 스켈레톤 로딩
              Array.from({ length: 15 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {Array.from({ length: 9 }).map((_, colIdx) => (
                    <td key={colIdx} style={{ padding: '8px 4px' }}>
                      <div style={{
                        height: '12px',
                        background: 'linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        borderRadius: '4px',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>등록된 가맹점이 없습니다</td></tr>
            ) : data.map(store => (
              <tr key={store.id} style={{ borderBottom: '1px solid #f0f0f0', background: selectedIds.has(store.id) ? '#e3f2fd' : '#fff' }} onMouseEnter={(e) => { if (!selectedIds.has(store.id)) e.currentTarget.style.background = '#fafafa' }} onMouseLeave={(e) => { if (!selectedIds.has(store.id)) e.currentTarget.style.background = '#fff' }}>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <input type="checkbox" checked={selectedIds.has(store.id)} onChange={() => toggleSelect(store.id)} />
                </td>
                <td style={{ padding: '6px 4px', fontSize: '11px', color: '#666' }}>{store.groupName || '-'}</td>
                <td style={{ padding: '6px 4px', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => openModal(store)}>
                  {store.name}
                </td>
                <td style={{ padding: '6px 4px', fontSize: '12px' }}>{store.ownerName}</td>
                <td style={{ padding: '6px 4px', fontSize: '11px', fontFamily: 'monospace' }}>{store.phone}</td>
                <td style={{ padding: '6px 4px', fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.address}</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '11px', color: store.salesRepName ? '#333' : '#ccc', whiteSpace: 'nowrap' }}>{store.salesRepName || '-'}</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '11px', color: store.deliveryContact || store.deliveryStaffName ? '#333' : '#ccc', whiteSpace: 'nowrap' }}>{store.deliveryStaffName || store.deliveryContact || '-'}</td>
                <td style={{ padding: '6px 4px', position: 'sticky', right: 0, background: selectedIds.has(store.id) ? '#e3f2fd' : '#fff', boxShadow: '-2px 0 4px rgba(0,0,0,0.08)', zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: store.isActive ? '#e8f5e9' : '#fff3e0', color: store.isActive ? '#2e7d32' : '#e65100' }}>
                      {store.isActive ? '활성' : '비활'}
                    </span>
                    <button onClick={() => router.push(`/stores/${store.id}/discounts`)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#fff3e0', color: '#e65100', border: 'none', fontSize: '11px', cursor: 'pointer' }}>할인</button>
                    <button onClick={() => openModal(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#e3f2fd', color: '#1976d2', border: 'none', fontSize: '11px', cursor: 'pointer' }}>수정</button>
                    <button onClick={() => handleDeleteClick(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#ffebee', color: '#c62828', border: 'none', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#86868b', marginRight: '8px' }}>
            {totalCount.toLocaleString()}건 • {page}/{totalPages}
          </span>
          <button onClick={() => setPage(1)} disabled={page === 1}
            style={{ padding: '4px 8px', borderRadius: '4px', background: page === 1 ? '#f5f5f7' : '#fff', color: page === 1 ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === 1 ? 'default' : 'pointer', fontSize: '11px' }}>⟪</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '4px 8px', borderRadius: '4px', background: page === 1 ? '#f5f5f7' : '#fff', color: page === 1 ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === 1 ? 'default' : 'pointer', fontSize: '11px' }}>◂</button>
          {(() => {
            const pages = []
            let start = Math.max(1, page - 2)
            let end = Math.min(totalPages, page + 2)
            if (page <= 3) end = Math.min(5, totalPages)
            if (page >= totalPages - 2) start = Math.max(1, totalPages - 4)
            for (let i = start; i <= end; i++) {
              pages.push(
                <button key={i} onClick={() => setPage(i)}
                  style={{ padding: '4px 10px', borderRadius: '4px', background: i === page ? '#007aff' : '#fff', color: i === page ? '#fff' : '#333', border: '1px solid #e9ecef', cursor: 'pointer', fontSize: '11px', fontWeight: i === page ? 600 : 400, minWidth: '30px' }}>{i}</button>
              )
            }
            return pages
          })()}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '4px 8px', borderRadius: '4px', background: page === totalPages ? '#f5f5f7' : '#fff', color: page === totalPages ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '11px' }}>▸</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            style={{ padding: '4px 8px', borderRadius: '4px', background: page === totalPages ? '#f5f5f7' : '#fff', color: page === totalPages ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '11px' }}>⟫</button>
        </div>
      )}

      {/* 그룹 설정 모달 */}
      {showGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>📁 그룹 일괄 설정</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>선택한 {selectedIds.size}개 가맹점의 그룹을 변경합니다.</p>
            
            <select 
              value={bulkGroupId || ''} 
              onChange={(e) => setBulkGroupId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px', marginBottom: '20px' }}
            >
              <option value="">그룹 없음</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGroupModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={confirmBulkSetGroup} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>적용</button>
            </div>
          </div>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '680px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{editingStore ? '가맹점 수정' : '가맹점 등록'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            
            {/* 기본 정보 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#007aff', marginBottom: '10px', padding: '6px 0', borderBottom: '2px solid #007aff' }}>📋 기본 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>코드</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="자동" disabled={!!editingStore}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px', background: editingStore ? '#f5f5f7' : '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>안경원명 <span style={{ color: '#ff3b30' }}>*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>거래처 유형</label>
                  <select value={formData.storeType} onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
                    <option value="소매">소매</option>
                    <option value="도매">도매</option>
                    <option value="공장">공장</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>대표자</label>
                  <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>전화</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="02-000-0000"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>핸드폰</label>
                  <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="010-0000-0000"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>이메일</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff9500', marginBottom: '10px', padding: '6px 0', borderBottom: '2px solid #ff9500' }}>🏢 사업자 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>사업자등록번호</label>
                  <input type="text" value={formData.businessNumber} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} placeholder="000-00-00000"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>업태</label>
                  <input type="text" value={formData.businessCategory} onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })} placeholder="도소매"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>업종</label>
                  <input type="text" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} placeholder="안경"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>주소</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
              </div>
            </div>

            {/* 거래 정보 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34c759', marginBottom: '10px', padding: '6px 0', borderBottom: '2px solid #34c759' }}>🤝 거래 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>그룹</label>
                  <select value={formData.groupId || ''} onChange={(e) => setFormData({ ...formData, groupId: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
                    <option value="">선택</option>
                    {groups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>영업담당</label>
                  <select value={formData.salesStaffId || ''} onChange={(e) => setFormData({ ...formData, salesStaffId: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
                    <option value="">선택</option>
                    {salesStaffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>배송담당</label>
                  <select value={formData.deliveryStaffId || ''} onChange={(e) => setFormData({ ...formData, deliveryStaffId: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
                    <option value="">선택</option>
                    {deliveryStaffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>청구일</label>
                  <input type="number" min="1" max="31" value={formData.billingDay || ''} onChange={(e) => setFormData({ ...formData, billingDay: e.target.value ? parseInt(e.target.value) : null })} placeholder="일"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>초기 미수금</label>
                  <input type="number" min="0" value={formData.initialReceivables || ''} onChange={(e) => setFormData({ ...formData, initialReceivables: e.target.value ? parseInt(e.target.value) : 0 })} placeholder="0"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>상태</label>
                  <select value={formData.isActive ? 'active' : 'inactive'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>
              {formData.createdAt && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#86868b' }}>
                  등록일: {formData.createdAt.split('T')[0]}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #e9ecef', paddingTop: '12px' }}>
              <button onClick={() => setShowModal(false)} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: '6px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '13px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '6px', background: saving ? '#86868b' : '#007aff', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget.type === 'single' ? '가맹점 삭제' : '일괄 삭제'}
        message={
          deleteTarget.type === 'single'
            ? `'${deleteTarget.store?.name}'을(를) 삭제하시겠습니까?\n해당 가맹점의 주문 내역이 있으면 삭제할 수 없습니다.`
            : `선택한 ${selectedIds.size}개 가맹점을 삭제하시겠습니까?\n주문 내역이 있는 가맹점은 삭제할 수 없습니다.`
        }
        confirmText="삭제"
        loading={deleteLoading}
      />

      {/* 일괄 등록 모달 */}
      {showBulkUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>📤 가맹점 일괄 등록</h3>
              <button onClick={() => { setShowBulkUploadModal(false); setBulkUploadFile(null); setBulkUploadPreview([]); setBulkUploadResult(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            
            {/* 안내 */}
            <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1976d2' }}>
              <p style={{ margin: '0 0 8px' }}>📋 <strong>CSV 파일로 가맹점을 일괄 등록합니다.</strong></p>
              <p style={{ margin: 0, color: '#666' }}>필수 컬럼: 안경원명 | 선택: 대표자, 전화, 주소, 사업자등록번호, 업태, 업종, 이메일, 그룹명, 거래처유형</p>
            </div>
            
            {/* 샘플 다운로드 */}
            <button onClick={downloadSampleCSV} style={{ padding: '8px 16px', borderRadius: '6px', background: '#e8f5e9', color: '#2e7d32', border: 'none', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>
              📥 샘플 양식 다운로드
            </button>
            
            {/* 파일 선택 */}
            <div style={{ border: '2px dashed #e0e0e0', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px', background: '#fafafa' }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="bulk-upload-input"
              />
              <label htmlFor="bulk-upload-input" style={{ cursor: 'pointer' }}>
                {bulkUploadFile ? (
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f', margin: '0 0 4px' }}>📄 {bulkUploadFile.name}</p>
                    <p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>클릭하여 다른 파일 선택</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📁</p>
                    <p style={{ fontSize: '14px', color: '#86868b', margin: 0 }}>CSV 파일을 선택하세요</p>
                  </div>
                )}
              </label>
            </div>
            
            {/* 미리보기 */}
            {bulkUploadPreview.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>미리보기 (처음 5개)</p>
                <div style={{ overflow: 'auto', maxHeight: '150px', border: '1px solid #e9ecef', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f7' }}>
                        {Object.keys(bulkUploadPreview[0]).slice(0, 5).map(key => (
                          <th key={key} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkUploadPreview.map((row, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #e9ecef' }}>
                          {Object.values(row).slice(0, 5).map((val, i) => (
                            <td key={i} style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 결과 */}
            {bulkUploadResult && (
              <div style={{ 
                background: bulkUploadResult.success > 0 ? '#e8f5e9' : '#ffebee', 
                borderRadius: '8px', 
                padding: '12px 16px', 
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 500 }}>
                  {bulkUploadResult.success > 0 ? '✅' : '❌'} 등록 완료: {bulkUploadResult.success}건 성공, {bulkUploadResult.failed}건 실패
                </p>
                {bulkUploadResult.errors.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: '#c62828' }}>
                    {bulkUploadResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {bulkUploadResult.errors.length > 5 && (
                      <li>...외 {bulkUploadResult.errors.length - 5}건</li>
                    )}
                  </ul>
                )}
              </div>
            )}
            
            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowBulkUploadModal(false); setBulkUploadFile(null); setBulkUploadPreview([]); setBulkUploadResult(null); }} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
                닫기
              </button>
              <button 
                onClick={handleBulkUpload} 
                disabled={!bulkUploadFile || bulkUploading}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  background: bulkUploadFile && !bulkUploading ? '#007aff' : '#ccc', 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  cursor: bulkUploadFile && !bulkUploading ? 'pointer' : 'not-allowed' 
                }}
              >
                {bulkUploading ? '등록 중...' : '일괄 등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스켈레톤 애니메이션 */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Layout>
  )
}
