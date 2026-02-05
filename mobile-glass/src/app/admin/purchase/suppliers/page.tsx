'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

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
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  isActive: boolean
  _count: { purchases: number }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [stats, setStats] = useState({ totalSuppliers: 0, totalOutstanding: 0 })

  const [form, setForm] = useState({
    name: '',
    code: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankInfo: '',
    memo: '',
    creditLimit: 0,
    paymentTermDays: 30,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [search])

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/purchase/suppliers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingSupplier(null)
    setForm({
      name: '',
      code: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      bankInfo: '',
      memo: '',
      creditLimit: 0,
      paymentTermDays: 30,
    })
    setShowModal(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name,
      code: supplier.code,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      bankInfo: supplier.bankInfo || '',
      memo: supplier.memo || '',
      creditLimit: supplier.creditLimit,
      paymentTermDays: supplier.paymentTermDays,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      alert('매입처명과 코드는 필수입니다')
      return
    }

    try {
      const url = editingSupplier 
        ? `/api/purchase/suppliers/${editingSupplier.id}`
        : '/api/purchase/suppliers'
      
      const res = await fetch(url, {
        method: editingSupplier ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        fetchSuppliers()
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to save supplier:', error)
      alert('저장에 실패했습니다')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`"${supplier.name}" 매입처를 삭제하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/purchase/suppliers/${supplier.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error)
    }
  }

  return (
    <AdminLayout activeMenu="purchase">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>매입처 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          총 {stats.totalSuppliers}개 업체 · 미납금 합계 {stats.totalOutstanding.toLocaleString()}원
        </p>
      </div>

      {/* 검색/필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="매입처명, 코드, 담당자 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            fontSize: '14px'
          }}
        />
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + 매입처 등록
        </button>
      </div>

      {/* 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>코드</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>매입처명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>담당자</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>미납금</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>매입건수</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                  로딩 중...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                  등록된 매입처가 없습니다
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                    {supplier.code}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                    {supplier.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {supplier.contactName || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {supplier.phone || '-'}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    textAlign: 'right',
                    fontWeight: supplier.outstandingAmount > 0 ? 600 : 400,
                    color: supplier.outstandingAmount > 0 ? '#dc2626' : '#666'
                  }}>
                    {supplier.outstandingAmount.toLocaleString()}원
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#666' }}>
                    {supplier._count.purchases}건
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: supplier.isActive ? '#d1fae5' : '#f3f4f6',
                      color: supplier.isActive ? '#059669' : '#6b7280'
                    }}>
                      {supplier.isActive ? '사용' : '미사용'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(supplier)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e5e5e5',
                        background: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginRight: '4px'
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
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
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {editingSupplier ? '매입처 수정' : '매입처 등록'}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    매입처명 *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    코드 *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={!!editingSupplier}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px',
                      background: editingSupplier ? '#f9fafb' : '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    담당자명
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    연락처
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  주소
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  계좌정보
                </label>
                <input
                  type="text"
                  value={form.bankInfo}
                  onChange={(e) => setForm({ ...form, bankInfo: e.target.value })}
                  placeholder="은행명 계좌번호 예금주"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    신용한도
                  </label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    결제기한 (일)
                  </label>
                  <input
                    type="number"
                    value={form.paymentTermDays}
                    onChange={(e) => setForm({ ...form, paymentTermDays: parseInt(e.target.value) || 30 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  메모
                </label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#007aff',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {editingSupplier ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
