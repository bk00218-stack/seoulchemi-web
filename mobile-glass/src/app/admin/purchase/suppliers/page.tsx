'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton, PrimaryButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

interface Supplier {
  id: number
  name: string
  code: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  bankInfo: string | null
  memo: string | null
  isActive: boolean
  purchaseCount: number
  createdAt: string
}

interface Stats {
  totalCount: number
  activeCount: number
  totalPurchaseAmount: number
}

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([])
  const [stats, setStats] = useState<Stats>({ totalCount: 0, activeCount: 0, totalPurchaseAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankInfo: '',
    memo: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('includeInactive', 'true')
      
      const res = await fetch(`/api/suppliers?${params}`)
      const json = await res.json()
      
      if (!json.error) {
        setData(json.suppliers)
        setStats(json.stats)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData()

  const openNewModal = () => {
    setEditingSupplier(null)
    setFormData({ name: '', code: '', contactName: '', phone: '', email: '', address: '', bankInfo: '', memo: '' })
    setShowModal(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      bankInfo: supplier.bankInfo || '',
      memo: supplier.memo || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      alert('매입처명과 코드는 필수입니다')
      return
    }

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await res.json()
      if (json.success) {
        alert(editingSupplier ? '매입처가 수정되었습니다.' : '매입처가 등록되었습니다.')
        setShowModal(false)
        fetchData()
      } else {
        alert(json.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
  }

  const handleToggleActive = async (supplier: Supplier) => {
    const action = supplier.isActive ? '비활성화' : '활성화'
    if (!confirm(`${supplier.name}을(를) ${action}하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !supplier.isActive }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`${supplier.name}을(를) 삭제하시겠습니까?\n매입 내역이 있으면 삭제할 수 없습니다.`)) return

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (json.success) {
        alert('매입처가 삭제되었습니다.')
        fetchData()
      } else {
        alert(json.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제에 실패했습니다.')
    }
  }

  const columns: Column<Supplier>[] = [
    { key: 'code', label: '코드', width: '100px', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'name', label: '매입처명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'contactName', label: '담당자' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{v as string}</span>
    )},
    { key: 'purchaseCount', label: '매입건수', align: 'center', render: (v) => (
      <span style={{ background: '#e3f2fd', padding: '2px 10px', borderRadius: '4px', color: '#007aff', fontWeight: 500 }}>
        {v as number}
      </span>
    )},
    { key: 'isActive', label: '상태', align: 'center', render: (v) => (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: '4px', 
        fontSize: '12px', 
        fontWeight: 500,
        background: v ? '#e8f5e9' : '#f5f5f7', 
        color: v ? '#34c759' : '#86868b' 
      }}>
        {v ? '사용' : '미사용'}
      </span>
    )},
    { key: 'id', label: '관리', width: '150px', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => openEditModal(row)} style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #007aff', borderRadius: '4px', background: '#fff', color: '#007aff', cursor: 'pointer' }}>수정</button>
        <button onClick={() => handleToggleActive(row)} style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #ff9500', borderRadius: '4px', background: '#fff', color: '#ff9500', cursor: 'pointer' }}>{row.isActive ? '중지' : '활성'}</button>
        <button onClick={() => handleDelete(row)} style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #ff3b30', borderRadius: '4px', background: '#fff', color: '#ff3b30', cursor: 'pointer' }}>삭제</button>
      </div>
    )},
  ]

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  }

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입처 관리
      </h2>

      <StatCardGrid>
        <StatCard label="전체 매입처" value={stats.totalCount} unit="개" icon="🏭" />
        <StatCard label="사용중" value={stats.activeCount} unit="개" highlight />
        <StatCard label="총 매입금액" value={Math.round(stats.totalPurchaseAmount / 10000).toLocaleString()} unit="만원" />
      </StatCardGrid>

      <SearchFilter
        placeholder="매입처명, 코드, 담당자 검색"
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        actions={
          <PrimaryButton onClick={openNewModal}>+ 매입처 등록</PrimaryButton>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>로딩 중...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          emptyMessage="등록된 매입처가 없습니다"
        />
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ 
            background: '#fff', borderRadius: '16px', padding: '24px', 
            width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' 
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              {editingSupplier ? '매입처 수정' : '매입처 등록'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                    매입처명 <span style={{ color: '#ff3b30' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                    코드 <span style={{ color: '#ff3b30' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={!!editingSupplier}
                    style={{ ...inputStyle, background: editingSupplier ? '#f5f5f7' : '#fff' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>담당자</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>주소</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>계좌정보</label>
                <input
                  type="text"
                  value={formData.bankInfo}
                  onChange={(e) => setFormData({ ...formData, bankInfo: e.target.value })}
                  style={inputStyle}
                  placeholder="은행명 계좌번호 예금주"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e1e1e1', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#007aff', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
