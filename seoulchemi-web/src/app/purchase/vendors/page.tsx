'use client'

import { useState, useEffect } from 'react'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle, thStyle, tdStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

interface Vendor {
  id: number
  name: string
  code: string
  businessRegNo: string | null
  ownerName: string | null
  phone: string | null
  fax: string | null
  email: string | null
  address: string | null
  bankName: string | null
  accountNo: string | null
  accountHolder: string | null
  paymentTermDays: number
  memo: string | null
  isActive: boolean
  totalPurchases: number
  unpaidAmount: number
  lastPurchaseDate: string | null
  createdAt: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [saving, setSaving] = useState(false)
  
  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    code: '',
    businessRegNo: '',
    ownerName: '',
    phone: '',
    fax: '',
    email: '',
    address: '',
    bankName: '',
    accountNo: '',
    accountHolder: '',
    paymentTermDays: 30,
    memo: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    try {
      const res = await fetch('/api/vendors')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (e) {
      console.error('Failed to fetch vendors:', e)
      // 샘플 데이터
      setVendors([
        {
          id: 1,
          name: '(주)서울렌즈',
          code: 'V001',
          businessRegNo: '123-45-67890',
          ownerName: '김대표',
          phone: '02-1234-5678',
          fax: '02-1234-5679',
          email: 'seoul@lens.com',
          address: '서울시 강남구 테헤란로 123',
          bankName: '국민은행',
          accountNo: '123-456-789012',
          accountHolder: '(주)서울렌즈',
          paymentTermDays: 30,
          memo: '주거래 매입처',
          isActive: true,
          totalPurchases: 125000000,
          unpaidAmount: 15000000,
          lastPurchaseDate: '2026-02-08',
          createdAt: '2024-01-15',
        },
        {
          id: 2,
          name: '대한옵틱스',
          code: 'V002',
          businessRegNo: '234-56-78901',
          ownerName: '이사장',
          phone: '031-987-6543',
          fax: null,
          email: 'daehan@optics.kr',
          address: '경기도 성남시 분당구',
          bankName: '신한은행',
          accountNo: '110-123-456789',
          accountHolder: '대한옵틱스',
          paymentTermDays: 45,
          memo: null,
          isActive: true,
          totalPurchases: 85000000,
          unpaidAmount: 8500000,
          lastPurchaseDate: '2026-02-05',
          createdAt: '2024-03-20',
        },
        {
          id: 3,
          name: '글로벌비전',
          code: 'V003',
          businessRegNo: '345-67-89012',
          ownerName: '박글로',
          phone: '02-5555-6666',
          fax: '02-5555-6667',
          email: 'global@vision.com',
          address: '서울시 서초구 반포대로',
          bankName: '우리은행',
          accountNo: '1002-123-456789',
          accountHolder: '글로벌비전',
          paymentTermDays: 30,
          memo: '해외 제품 전문',
          isActive: true,
          totalPurchases: 45000000,
          unpaidAmount: 0,
          lastPurchaseDate: '2026-01-28',
          createdAt: '2024-06-10',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({
      name: '',
      code: '',
      businessRegNo: '',
      ownerName: '',
      phone: '',
      fax: '',
      email: '',
      address: '',
      bankName: '',
      accountNo: '',
      accountHolder: '',
      paymentTermDays: 30,
      memo: '',
    })
    setErrors({})
    setEditingVendor(null)
  }

  function handleEdit(vendor: Vendor) {
    setForm({
      name: vendor.name,
      code: vendor.code,
      businessRegNo: vendor.businessRegNo || '',
      ownerName: vendor.ownerName || '',
      phone: vendor.phone || '',
      fax: vendor.fax || '',
      email: vendor.email || '',
      address: vendor.address || '',
      bankName: vendor.bankName || '',
      accountNo: vendor.accountNo || '',
      accountHolder: vendor.accountHolder || '',
      paymentTermDays: vendor.paymentTermDays,
      memo: vendor.memo || '',
    })
    setEditingVendor(vendor)
    setShowModal(true)
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = '매입처명은 필수입니다.'
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
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors'
      const method = editingVendor ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '저장에 실패했습니다.')
        return
      }

      alert(editingVendor ? '수정되었습니다.' : '등록되었습니다.')
      setShowModal(false)
      resetForm()
      fetchVendors()
    } catch (e) {
      console.error(e)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(vendor: Vendor) {
    if (!confirm(`${vendor.name}을(를) ${vendor.isActive ? '비활성화' : '활성화'}하시겠습니까?`)) return

    try {
      await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      })
      fetchVendors()
    } catch (e) {
      console.error(e)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 필터링
  const filteredVendors = vendors.filter(v => {
    if (statusFilter === 'active' && !v.isActive) return false
    if (statusFilter === 'inactive' && v.isActive) return false
    if (search) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || 
             v.code.toLowerCase().includes(q) ||
             (v.ownerName && v.ownerName.toLowerCase().includes(q))
    }
    return true
  })

  // 통계
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.isActive).length,
    totalPurchases: vendors.reduce((sum, v) => sum + v.totalPurchases, 0),
    totalUnpaid: vendors.reduce((sum, v) => sum + v.unpaidAmount, 0),
  }

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
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
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
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>매입처 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>매입처 정보를 등록하고 관리합니다</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + 매입처 등록
          </button>
          <button style={{ ...btnStyle, background: '#4caf50', color: '#fff', border: 'none' }}>
            📥 엑셀다운
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 15 }}>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
          <div style={{ fontSize: 12, color: '#666' }}>전체 매입처</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{stats.total}개</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #4caf50' }}>
          <div style={{ fontSize: 12, color: '#666' }}>활성 매입처</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>{stats.active}개</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #9c27b0' }}>
          <div style={{ fontSize: 12, color: '#666' }}>총 매입금액</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9c27b0' }}>{(stats.totalPurchases / 10000).toLocaleString()}만</div>
        </div>
        <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: '4px solid #f44336' }}>
          <div style={{ fontSize: 12, color: '#666' }}>총 미결제</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{(stats.totalUnpaid / 10000).toLocaleString()}만</div>
        </div>
      </div>

      {/* 검색 필터 */}
      <div style={{ ...cardStyle, padding: 12, marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          style={selectStyle}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
        >
          <option value="all">상태 전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        <input 
          type="text" 
          placeholder="매입처명, 코드, 대표자 검색..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 250 }} 
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          검색결과: <strong>{filteredVendors.length}</strong>개
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
              <tr>
                <th style={thStyle}>코드</th>
                <th style={thStyle}>매입처명</th>
                <th style={thStyle}>대표자</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>사업자번호</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>총 매입금</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>미결제</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>결제조건</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>최근거래</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>상태</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ ...tdStyle, padding: 40, textAlign: 'center', color: '#868e96' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ ...tdStyle, padding: 40, textAlign: 'center', color: '#868e96' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>🏭</div>
                    등록된 매입처가 없습니다
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <tr 
                    key={vendor.id} 
                    style={{ 
                      background: index % 2 === 0 ? '#fff' : '#fafafa',
                      opacity: vendor.isActive ? 1 : 0.6
                    }}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#666' }}>{vendor.code}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{vendor.name}</td>
                    <td style={tdStyle}>{vendor.ownerName || '-'}</td>
                    <td style={tdStyle}>{vendor.phone || '-'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{vendor.businessRegNo || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>
                      {vendor.totalPurchases.toLocaleString()}원
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: vendor.unpaidAmount > 0 ? '#f44336' : '#4caf50'
                    }}>
                      {vendor.unpaidAmount > 0 ? vendor.unpaidAmount.toLocaleString() + '원' : '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        background: '#eef4ee',
                        color: '#5d7a5d',
                      }}>
                        {vendor.paymentTermDays}일
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12, color: '#666' }}>
                      {vendor.lastPurchaseDate || '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        background: vendor.isActive ? '#e8f5e9' : '#f5f5f5',
                        color: vendor.isActive ? '#4caf50' : '#999'
                      }}>
                        {vendor.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button 
                        style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 4 }}
                        onClick={() => handleEdit(vendor)}
                      >
                        수정
                      </button>
                      <button 
                        style={{ 
                          ...btnStyle, 
                          padding: '4px 10px', 
                          fontSize: 11,
                          background: vendor.isActive ? '#f5f5f5' : '#e8f5e9',
                          color: vendor.isActive ? '#999' : '#4caf50'
                        }}
                        onClick={() => handleToggleActive(vendor)}
                      >
                        {vendor.isActive ? '비활성화' : '활성화'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowModal(false)}>
          <div 
            style={{ 
              background: '#fff', 
              borderRadius: 16, 
              width: '90%', 
              maxWidth: 700, 
              maxHeight: '90vh', 
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ 
              padding: '20px 24px', 
              background: 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#fff' }}>
                  🏭 {editingVendor ? '매입처 수정' : '매입처 등록'}
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
                  매입처 정보를 입력해주세요
                </p>
              </div>
              <button 
                style={{ border: 'none', background: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', color: '#fff', padding: '8px 12px', borderRadius: 8 }} 
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* 왼쪽: 기본 정보 */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#5d7a5d', borderBottom: '2px solid #5d7a5d', paddingBottom: 8 }}>
                    📋 기본 정보
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>매입처명 *</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="(주)서울렌즈"
                      />
                      {errors.name && <div style={errorStyle}>{errors.name}</div>}
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>코드</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value })}
                        placeholder="V001"
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
                        placeholder="김대표"
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>사업자등록번호</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%', borderColor: errors.businessRegNo ? '#f44336' : undefined }}
                        value={form.businessRegNo}
                        onChange={e => setForm({ ...form, businessRegNo: e.target.value })}
                        placeholder="123-45-67890"
                      />
                      {errors.businessRegNo && <div style={errorStyle}>{errors.businessRegNo}</div>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>📞 전화번호</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>📠 팩스</label>
                      <input 
                        type="text"
                        style={{ ...inputStyle, width: '100%' }}
                        value={form.fax}
                        onChange={e => setForm({ ...form, fax: e.target.value })}
                        placeholder="02-1234-5679"
                      />
                    </div>
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>📧 이메일</label>
                    <input 
                      type="email"
                      style={{ ...inputStyle, width: '100%', borderColor: errors.email ? '#f44336' : undefined }}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="vendor@company.com"
                    />
                    {errors.email && <div style={errorStyle}>{errors.email}</div>}
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>📍 주소</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="서울시 강남구..."
                    />
                  </div>
                </div>
                
                {/* 오른쪽: 결제 정보 */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#4caf50', borderBottom: '2px solid #4caf50', paddingBottom: 8 }}>
                    💳 결제 정보
                  </h3>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>결제 조건 (일)</label>
                    <input 
                      type="number"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.paymentTermDays}
                      onChange={e => setForm({ ...form, paymentTermDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>🏦 은행명</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.bankName}
                      onChange={e => setForm({ ...form, bankName: e.target.value })}
                      placeholder="국민은행"
                    />
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>계좌번호</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.accountNo}
                      onChange={e => setForm({ ...form, accountNo: e.target.value })}
                      placeholder="123-456-789012"
                    />
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>예금주</label>
                    <input 
                      type="text"
                      style={{ ...inputStyle, width: '100%' }}
                      value={form.accountHolder}
                      onChange={e => setForm({ ...form, accountHolder: e.target.value })}
                      placeholder="(주)서울렌즈"
                    />
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>📝 메모</label>
                    <textarea 
                      style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical' }}
                      value={form.memo}
                      onChange={e => setForm({ ...form, memo: e.target.value })}
                      placeholder="메모를 입력하세요..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 10,
              background: '#fafafa'
            }}>
              <button 
                style={{ ...btnStyle, minWidth: 100 }} 
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button 
                style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff', minWidth: 120 }} 
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '저장 중...' : editingVendor ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
