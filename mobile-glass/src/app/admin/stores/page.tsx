'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../components/Navigation'
import { OutlineButton } from '../../components/SearchFilter'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

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

interface FormData {
  code: string
  name: string
  ownerName: string
  phone: string
  mobile: string
  address: string
  paymentTermDays: number
  billingDay: number | null
  groupId: number | null
  salesRepName: string
  deliveryContact: string
  isActive: boolean
}

const initialFormData: FormData = {
  code: '',
  name: '',
  ownerName: '',
  phone: '',
  mobile: '',
  address: '',
  paymentTermDays: 30,
  billingDay: null,
  groupId: null,
  salesRepName: '',
  deliveryContact: '',
  isActive: true,
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
  const [bulkGroupId, setBulkGroupId] = useState<number | null>(null)
  
  // 삭제 모달 관련 state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; store?: Store }>({ type: 'bulk' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetch('/api/store-groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGroups(data)
      })
      .catch(err => console.error('Failed to fetch groups:', err))
  }, [])

  // 검색 파라미터를 ref로 관리 (타이핑할 때마다 API 호출 방지)
  const searchRef = useRef({ code: '', name: '', owner: '', phone: '', address: '', salesRep: '', delivery: '' })
  const [searchTrigger, setSearchTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
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
        paymentTermDays: store.paymentTermDays || 30,
        billingDay: store.billingDay || null,
        groupId: store.groupId || null,
        salesRepName: store.salesRepName || '',
        deliveryContact: store.deliveryContact || '',
        isActive: store.isActive,
      })
    } else {
      setEditingStore(null)
      setFormData(initialFormData)
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

  return (
    <AdminLayout activeMenu="stores">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>가맹점 관리</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OutlineButton onClick={() => alert('엑셀 다운로드 - 준비 중')}>📥 엑셀</OutlineButton>
          <button onClick={() => openModal(null)} style={{ padding: '10px 16px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            + 가맹점 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🏪</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>전체</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.total.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>✅</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>활성</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34c759' }}>{stats.active.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>⏸️</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>비활성</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff9500' }}>{stats.inactive.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>✨</span>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>이번달 신규</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{stats.newThisMonth.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: `전체 (${stats.total})`, value: 'all' },
          { label: `활성 (${stats.active})`, value: 'active' },
          { label: `비활성 (${stats.inactive})`, value: 'inactive' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setPage(1); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: filter === opt.value ? '#007aff' : '#f5f5f7',
              color: filter === opt.value ? '#fff' : '#666'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 일괄 작업 바 - 선택된 항목이 있을 때만 표시 */}
      {selectedIds.size > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          background: '#e3f2fd', 
          borderRadius: '8px', 
          marginBottom: '12px',
          border: '1px solid #90caf9'
        }}>
          <span style={{ fontWeight: 600, color: '#1976d2' }}>
            ✓ {selectedIds.size}개 선택됨
          </span>
          <div style={{ flex: 1 }} />
          <button 
            onClick={handleBulkSetGroup}
            style={{ padding: '6px 12px', borderRadius: '6px', background: '#fff', color: '#1976d2', border: '1px solid #1976d2', fontSize: '13px', cursor: 'pointer' }}
          >
            📁 그룹 설정
          </button>
          <button 
            onClick={() => handleBulkAction('setActive')}
            style={{ padding: '6px 12px', borderRadius: '6px', background: '#fff', color: '#2e7d32', border: '1px solid #2e7d32', fontSize: '13px', cursor: 'pointer' }}
          >
            ✅ 활성화
          </button>
          <button 
            onClick={() => handleBulkAction('setInactive')}
            style={{ padding: '6px 12px', borderRadius: '6px', background: '#fff', color: '#e65100', border: '1px solid #e65100', fontSize: '13px', cursor: 'pointer' }}
          >
            ⏸️ 비활성화
          </button>
          <button 
            onClick={handleBulkDelete}
            style={{ padding: '6px 12px', borderRadius: '6px', background: '#c62828', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer' }}
          >
            🗑️ 삭제
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())}
            style={{ padding: '6px 12px', borderRadius: '6px', background: '#f5f5f7', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}
          >
            선택 해제
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '60px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '60px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '180px' }} />
          </colgroup>
          <thead>
            {/* 헤더 */}
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>그룹</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap', width: '140px' }}>안경원명</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>대표자</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>연락처</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap', width: '120px' }}>주소</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap', width: '80px' }}>영업담당</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap', width: '80px' }}>배송담당</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>관리</th>
            </tr>
            {/* 검색 필터 */}
            <tr style={{ background: '#f1f3f4', borderBottom: '1px solid #e9ecef' }}>
              <td style={{ padding: '6px 4px' }}></td>
              <td style={{ padding: '6px 4px' }}>
                <input type="text" placeholder="그룹" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px', width: '140px' }}>
                <input type="text" placeholder="안경원명" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px' }}>
                <input type="text" placeholder="대표자" value={searchOwner} onChange={(e) => setSearchOwner(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px' }}>
                <input type="text" placeholder="연락처" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px', width: '120px' }}>
                <input type="text" placeholder="주소" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px', width: '80px' }}>
                <input type="text" placeholder="영업" value={searchSalesRep} onChange={(e) => setSearchSalesRep(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px', width: '80px' }}>
                <input type="text" placeholder="배송" value={searchDelivery} onChange={(e) => setSearchDelivery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <button onClick={handleSearch} style={{ padding: '5px 10px', borderRadius: '4px', background: '#007aff', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer' }}>검색</button>
              </td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>로딩 중...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>등록된 가맹점이 없습니다</td></tr>
            ) : data.map(store => (
              <tr key={store.id} style={{ borderBottom: '1px solid #f0f0f0', background: selectedIds.has(store.id) ? '#e3f2fd' : '#fff' }} onMouseEnter={(e) => { if (!selectedIds.has(store.id)) e.currentTarget.style.background = '#fafafa' }} onMouseLeave={(e) => { if (!selectedIds.has(store.id)) e.currentTarget.style.background = '#fff' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <input type="checkbox" checked={selectedIds.has(store.id)} onChange={() => toggleSelect(store.id)} />
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: '#666' }}>{store.groupName || '-'}</td>
                <td style={{ padding: '10px 8px', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '140px', maxWidth: '140px' }}>{store.name}</td>
                <td style={{ padding: '10px 8px', fontSize: '12px' }}>{store.ownerName}</td>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace' }}>{store.phone}</td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '120px', maxWidth: '120px' }}>{store.address}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', color: store.salesRepName ? '#333' : '#ccc', whiteSpace: 'nowrap', width: '80px' }}>{store.salesRepName || '-'}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', color: store.deliveryContact || store.deliveryStaffName ? '#333' : '#ccc', whiteSpace: 'nowrap', width: '80px' }}>{store.deliveryStaffName || store.deliveryContact || '-'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 500, background: store.isActive ? '#e8f5e9' : '#fff3e0', color: store.isActive ? '#2e7d32' : '#e65100', whiteSpace: 'nowrap' }}>
                      {store.isActive ? '활성' : '비활성'}
                    </span>
                    <button onClick={() => router.push(`/admin/stores/${store.id}/discounts`)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#fff3e0', color: '#e65100', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>할인</button>
                    <button onClick={() => openModal(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#e3f2fd', color: '#1976d2', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>수정</button>
                    <button onClick={() => handleDeleteClick(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#ffebee', color: '#c62828', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#86868b', marginRight: '12px' }}>
            총 {totalCount.toLocaleString()}건 ({page}/{totalPages} 페이지)
          </span>
          <button onClick={() => setPage(1)} disabled={page === 1}
            style={{ padding: '6px 10px', borderRadius: '6px', background: page === 1 ? '#f5f5f7' : '#fff', color: page === 1 ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === 1 ? 'default' : 'pointer', fontSize: '12px' }}>
            ⟪
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 10px', borderRadius: '6px', background: page === 1 ? '#f5f5f7' : '#fff', color: page === 1 ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === 1 ? 'default' : 'pointer', fontSize: '12px' }}>
            ◂
          </button>
          {(() => {
            const pages = []
            let start = Math.max(1, page - 2)
            let end = Math.min(totalPages, page + 2)
            if (page <= 3) end = Math.min(5, totalPages)
            if (page >= totalPages - 2) start = Math.max(1, totalPages - 4)
            for (let i = start; i <= end; i++) {
              pages.push(
                <button key={i} onClick={() => setPage(i)}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: i === page ? '#007aff' : '#fff', color: i === page ? '#fff' : '#333', border: '1px solid #e9ecef', cursor: 'pointer', fontSize: '12px', fontWeight: i === page ? 600 : 400, minWidth: '36px' }}>
                  {i}
                </button>
              )
            }
            return pages
          })()}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 10px', borderRadius: '6px', background: page === totalPages ? '#f5f5f7' : '#fff', color: page === totalPages ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '12px' }}>
            ▸
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            style={{ padding: '6px 10px', borderRadius: '6px', background: page === totalPages ? '#f5f5f7' : '#fff', color: page === totalPages ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '12px' }}>
            ⟫
          </button>
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
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '520px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>{editingStore ? '가맹점 수정' : '가맹점 등록'}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#86868b' }}>가맹점 코드</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="자동생성" disabled={!!editingStore}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px', background: editingStore ? '#f5f5f7' : '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>안경원명 <span style={{ color: '#ff3b30' }}>*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>대표자</label>
                <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>전화</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="02-000-0000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>핸드폰</label>
                <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="010-0000-0000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹</label>
                <select value={formData.groupId || ''} onChange={(e) => setFormData({ ...formData, groupId: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}>
                  <option value="">선택 안함</option>
                  {groups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>주소</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
              <select value={formData.isActive ? 'active' : 'inactive'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: '8px', background: saving ? '#86868b' : '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: saving ? 'default' : 'pointer' }}>
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
    </AdminLayout>
  )
}
