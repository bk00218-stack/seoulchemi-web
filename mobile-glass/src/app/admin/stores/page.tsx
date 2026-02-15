'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../components/Navigation'
import { OutlineButton } from '../../components/SearchFilter'

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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [groups, setGroups] = useState<StoreGroup[]>([])

  useEffect(() => {
    fetch('/api/store-groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGroups(data)
      })
      .catch(err => console.error('Failed to fetch groups:', err))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter !== 'all') params.set('status', filter)
      const searchTerms = [searchCode, searchName, searchOwner, searchPhone, searchAddress].filter(Boolean).join(' ')
      if (searchTerms) params.set('search', searchTerms)
      
      const res = await fetch(`/api/stores?${params}`)
      const json = await res.json()
      
      if (json.error) { console.error(json.error); return }
      
      setData(json.stores)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
    setLoading(false)
  }, [filter, searchCode, searchName, searchOwner, searchPhone, searchAddress, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => { setPage(1); fetchData() }

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

  const handleDelete = async (store: Store) => {
    if (!confirm(`'${store.name}'을(를) 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) { alert(json.error); return }
      alert(json.message)
      fetchData()
    } catch (error) { alert('삭제에 실패했습니다.') }
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

      {/* 테이블 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '50px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '180px' }} />
          </colgroup>
          <thead>
            {/* 헤더 */}
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>코드</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>안경원명</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>대표자</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>연락처</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>주소</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>주문</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>최근주문</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>관리</th>
            </tr>
            {/* 검색 필터 */}
            <tr style={{ background: '#f1f3f4', borderBottom: '1px solid #e9ecef' }}>
              <td style={{ padding: '6px 4px' }}></td>
              <td style={{ padding: '6px 4px' }}>
                <input type="text" placeholder="코드" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px' }}>
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
              <td style={{ padding: '6px 4px' }}>
                <input type="text" placeholder="주소" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', padding: '5px 6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }} />
              </td>
              <td style={{ padding: '6px 4px' }}></td>
              <td style={{ padding: '6px 4px' }}></td>
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
              <tr key={store.id} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <input type="checkbox" checked={selectedIds.has(store.id)} onChange={() => toggleSelect(store.id)} />
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace', color: '#666' }}>{store.code}</td>
                <td style={{ padding: '10px 8px', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.name}</td>
                <td style={{ padding: '10px 8px', fontSize: '12px' }}>{store.ownerName}</td>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace' }}>{store.phone}</td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.address}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 500, color: store.orderCount > 0 ? '#007aff' : '#ccc' }}>{store.orderCount}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '10px', color: store.lastOrderDate ? '#333' : '#ccc', whiteSpace: 'nowrap' }}>{store.lastOrderDate || '-'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 500, background: store.isActive ? '#e8f5e9' : '#fff3e0', color: store.isActive ? '#2e7d32' : '#e65100', whiteSpace: 'nowrap' }}>
                      {store.isActive ? '활성' : '비활성'}
                    </span>
                    <button onClick={() => router.push(`/admin/stores/${store.id}/discounts`)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#fff3e0', color: '#e65100', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>할인</button>
                    <button onClick={() => openModal(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#e3f2fd', color: '#1976d2', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>수정</button>
                    <button onClick={() => handleDelete(store)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#ffebee', color: '#c62828', border: 'none', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 14px', borderRadius: '6px', background: page === 1 ? '#f5f5f7' : '#fff', color: page === 1 ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}>
            ← 이전
          </button>
          <span style={{ padding: '8px 16px', color: '#666', fontSize: '13px' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 14px', borderRadius: '6px', background: page === totalPages ? '#f5f5f7' : '#fff', color: page === totalPages ? '#c5c5c7' : '#007aff', border: '1px solid #e9ecef', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}>
            다음 →
          </button>
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
    </AdminLayout>
  )
}
