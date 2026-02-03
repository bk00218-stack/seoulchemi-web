'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../components/DataTable'
import SearchFilter, { FilterButtonGroup, OutlineButton } from '../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../components/StatCard'

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

interface FormData {
  code: string
  name: string
  ownerName: string
  phone: string
  address: string
  isActive: boolean
}

const initialFormData: FormData = {
  code: '',
  name: '',
  ownerName: '',
  phone: '',
  address: '',
  isActive: true,
}

export default function StoresPage() {
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [data, setData] = useState<Store[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, newThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/stores?${params}`)
      const json = await res.json()
      
      if (json.error) {
        console.error(json.error)
        return
      }
      
      setData(json.stores)
      setStats(json.stats)
      setTotalPages(json.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
    setLoading(false)
  }, [filter, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const openModal = (store: Store | null = null) => {
    if (store) {
      setEditingStore(store)
      setFormData({
        code: store.code,
        name: store.name,
        ownerName: store.ownerName === '-' ? '' : store.ownerName,
        phone: store.phone === '-' ? '' : store.phone,
        address: store.address === '-' ? '' : store.address,
        isActive: store.isActive,
      })
    } else {
      setEditingStore(null)
      setFormData(initialFormData)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('안경원명을 입력해주세요.')
      return
    }
    
    setSaving(true)
    try {
      const url = editingStore 
        ? `/api/stores/${editingStore.id}` 
        : '/api/stores'
      
      const res = await fetch(url, {
        method: editingStore ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const json = await res.json()
      
      if (json.error) {
        alert(json.error)
        return
      }
      
      alert(editingStore ? '수정되었습니다.' : '등록되었습니다.')
      setShowModal(false)
      fetchData()
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const handleDelete = async (store: Store) => {
    if (!confirm(`'${store.name}'을(를) 삭제하시겠습니까?`)) return
    
    try {
      const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' })
      const json = await res.json()
      
      if (json.error) {
        alert(json.error)
        return
      }
      
      alert(json.message)
      fetchData()
    } catch (error) {
      alert('삭제에 실패했습니다.')
    }
  }

  const columns: Column<Store>[] = [
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '안경원명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'ownerName', label: '대표자' },
    { key: 'phone', label: '연락처', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'address', label: '주소', width: '200px', render: (v) => (
      <span style={{ fontSize: '12px', color: '#666' }}>{v as string}</span>
    )},
    { key: 'orderCount', label: '주문수', align: 'center', render: (v) => (
      <span style={{ 
        background: (v as number) > 0 ? '#e3f2fd' : '#f5f5f7', 
        color: (v as number) > 0 ? '#007aff' : '#86868b',
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v as number}건
      </span>
    )},
    { key: 'lastOrderDate', label: '최근주문', render: (v) => (
      v ? (
        <span style={{ color: '#1d1d1f', fontSize: '12px' }}>{v as string}</span>
      ) : (
        <span style={{ color: '#c5c5c7', fontSize: '12px' }}>없음</span>
      )
    )},
    { key: 'isActive', label: '상태', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => openModal(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#f5f5f7',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          수정
        </button>
        <button
          onClick={() => handleDelete(row)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#fff',
            color: '#ff3b30',
            border: '1px solid #ff3b30',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          삭제
        </button>
      </div>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 관리
      </h2>

      <StatCardGrid>
        <StatCard label="총 가맹점" value={stats.total} unit="개" icon="🏪" />
        <StatCard label="활성" value={stats.active} unit="개" />
        <StatCard label="비활성" value={stats.inactive} unit="개" />
        <StatCard label="이번 달 신규" value={stats.newThisMonth} unit="개" highlight />
      </StatCardGrid>

      <SearchFilter
        placeholder="가맹점명, 코드, 연락처, 대표자 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        actions={
          <>
            <OutlineButton onClick={() => alert('엑셀 다운로드 - 준비 중')}>📥 엑셀</OutlineButton>
            <button
              onClick={() => openModal(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              + 가맹점 등록
            </button>
          </>
        }
      />

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <FilterButtonGroup
          options={[
            { label: `전체 (${stats.total})`, value: 'all' },
            { label: `활성 (${stats.active})`, value: 'active' },
            { label: `비활성 (${stats.inactive})`, value: 'inactive' },
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="등록된 가맹점이 없습니다"
          />
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px', 
              marginTop: '20px' 
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === 1 ? '#f5f5f7' : '#fff',
                  color: page === 1 ? '#c5c5c7' : '#007aff',
                  border: '1px solid #e5e5e5',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                이전
              </button>
              <span style={{ 
                padding: '8px 16px', 
                color: '#86868b',
                display: 'flex',
                alignItems: 'center'
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: page === totalPages ? '#f5f5f7' : '#fff',
                  color: page === totalPages ? '#c5c5c7' : '#007aff',
                  border: '1px solid #e5e5e5',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '520px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingStore ? '가맹점 수정' : '가맹점 등록'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#86868b' }}>
                  가맹점 코드
                </label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="자동생성"
                  disabled={!!editingStore}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e5e5', 
                    fontSize: '14px',
                    background: editingStore ? '#f5f5f7' : '#fff'
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  안경원명 <span style={{ color: '#ff3b30' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e5e5', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>대표자</label>
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e5e5', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e5e5', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>주소</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e5e5', 
                  fontSize: '14px' 
                }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
              <select 
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e5e5', 
                  fontSize: '14px' 
                }}
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={saving}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  background: '#f5f5f7', 
                  color: '#1d1d1f', 
                  border: 'none', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  background: saving ? '#86868b' : '#007aff', 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  cursor: saving ? 'default' : 'pointer' 
                }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
