'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'

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

const AREA_CODES = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주']

interface DeliveryStaff {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
  isActive: boolean
  storeCount: number
  createdAt: string
}

export default function DeliveryStaffPage() {
  const [staffList, setStaffList] = useState<DeliveryStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    areaCode: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchStaffList()
  }, [])

  async function fetchStaffList() {
    try {
      const res = await fetch('/api/delivery-staff')
      const data = await res.json()
      setStaffList(data.deliveryStaff || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ name: '', phone: '', areaCode: '' })
    setErrors({})
    setEditingId(null)
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) {
      newErrors.name = '담당자명은 필수입니다.'
    }
    if (form.phone && !/^[\d-]+$/.test(form.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return

    try {
      setSaving(true)
      const url = editingId ? `/api/delivery-staff/${editingId}` : '/api/delivery-staff'
      const method = editingId ? 'PUT' : 'POST'
      
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

      alert(editingId ? '수정되었습니다.' : '등록되었습니다.')
      setShowModal(false)
      resetForm()
      fetchStaffList()
    } catch (e) {
      console.error(e)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(staff: DeliveryStaff) {
    setForm({
      name: staff.name,
      phone: staff.phone || '',
      areaCode: staff.areaCode || '',
    })
    setEditingId(staff.id)
    setShowModal(true)
  }

  async function handleDelete(staff: DeliveryStaff) {
    if (!confirm(`"${staff.name}" 담당자를 비활성화하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/delivery-staff/${staff.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '비활성화에 실패했습니다.')
        return
      }

      alert('비활성화되었습니다.')
      fetchStaffList()
    } catch (e) {
      console.error(e)
      alert('비활성화에 실패했습니다.')
    }
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
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #333'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>배송담당자 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            배송을 담당하는 직원 관리
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + 담당자 추가
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12,
        marginBottom: 15
      }}>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #1976d2'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>전체 담당자</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1976d2' }}>{staffList.length}명</div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>담당 거래처</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>
            {staffList.reduce((sum, s) => sum + s.storeCount, 0)}개
          </div>
        </div>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: 8, 
          padding: '15px 20px',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: 12, color: '#666' }}>평균 담당</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>
            {staffList.length > 0 
              ? Math.round(staffList.reduce((sum, s) => sum + s.storeCount, 0) / staffList.length) 
              : 0}개
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>담당자명</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>연락처</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>담당지역</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>담당 거래처</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#999' }}>로딩 중...</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🚚</div>
                    등록된 배송담당자가 없습니다
                  </td>
                </tr>
              ) : (
                staffList.map((staff, index) => (
                  <tr 
                    key={staff.id}
                    style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>
                      {staff.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12 }}>
                      {staff.phone || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12 }}>
                      {staff.areaCode ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: '#e3f2fd',
                          color: '#1976d2'
                        }}>
                          {staff.areaCode}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: staff.storeCount > 0 ? '#e8f5e9' : '#f5f5f5',
                        color: staff.storeCount > 0 ? '#4caf50' : '#999'
                      }}>
                        {staff.storeCount}개
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        background: staff.isActive ? '#e8f5e9' : '#f5f5f5',
                        color: staff.isActive ? '#4caf50' : '#999'
                      }}>
                        {staff.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 6 }}
                        onClick={() => handleEdit(staff)}
                      >
                        수정
                      </button>
                      <button 
                        style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: '#f5f5f5', color: '#999' }}
                        onClick={() => handleDelete(staff)}
                      >
                        비활성화
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        }} onClick={() => setShowModal(false)}>
          <div 
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '90%',
              maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                🚚 {editingId ? '배송담당자 수정' : '배송담당자 추가'}
              </h2>
              <button 
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  fontSize: 24, 
                  cursor: 'pointer', 
                  color: '#999',
                  padding: 4
                }}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 24 }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>담당자명 *</label>
                <input 
                  type="text"
                  style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="홍길동"
                />
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
              </div>
              
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>연락처</label>
                <input 
                  type="text"
                  style={{ ...inputStyle, width: '100%', borderColor: errors.phone ? '#f44336' : undefined }}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
                {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
              </div>
              
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>담당지역</label>
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
            </div>
            
            {/* 모달 푸터 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button 
                style={{ ...btnStyle, minWidth: 80 }}
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button 
                style={{ ...btnStyle, background: '#1976d2', color: '#fff', border: 'none', minWidth: 100 }}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '저장 중...' : editingId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
