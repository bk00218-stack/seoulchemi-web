'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

const AREA_CODES = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주']

type TabType = 'group' | 'delivery' | 'sales'

interface StoreGroup {
  id: number
  name: string
  description: string | null
  discountRate: number
  storeType: string
  isActive: boolean
  storeCount: number
  createdAt: string
}

interface Staff {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
  isActive: boolean
  storeCount: number
  createdAt: string
}

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('group')
  
  // 그룹 상태
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  
  // 배송담당 상태
  const [deliveryStaff, setDeliveryStaff] = useState<Staff[]>([])
  const [deliveryLoading, setDeliveryLoading] = useState(true)
  
  // 영업담당 상태
  const [salesStaff, setSalesStaff] = useState<Staff[]>([])
  const [salesLoading, setSalesLoading] = useState(true)
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // 폼 상태 (탭별로 다름)
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', areaCode: '' })
  const [groupForm, setGroupForm] = useState({ name: '', description: '', discountRate: 0, storeType: 'normal' })

  useEffect(() => {
    fetchGroups()
    fetchDeliveryStaff()
    fetchSalesStaff()
  }, [])

  async function fetchGroups() {
    try {
      const res = await fetch('/api/store-groups')
      const data = await res.json()
      setGroups(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setGroupsLoading(false)
    }
  }

  async function fetchDeliveryStaff() {
    try {
      const res = await fetch('/api/delivery-staff')
      const data = await res.json()
      setDeliveryStaff(data.deliveryStaff || [])
    } catch (e) {
      console.error(e)
    } finally {
      setDeliveryLoading(false)
    }
  }

  async function fetchSalesStaff() {
    try {
      const res = await fetch('/api/sales-staff')
      const data = await res.json()
      setSalesStaff(data.salesStaff || [])
    } catch (e) {
      console.error(e)
    } finally {
      setSalesLoading(false)
    }
  }

  function resetForm() {
    setStaffForm({ name: '', phone: '', areaCode: '' })
    setGroupForm({ name: '', description: '', discountRate: 0, storeType: 'normal' })
    setErrors({})
    setEditingId(null)
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}
    if (activeTab === 'group') {
      if (!groupForm.name.trim()) newErrors.name = '그룹명은 필수입니다.'
    } else {
      if (!staffForm.name.trim()) newErrors.name = '담당자명은 필수입니다.'
      if (staffForm.phone && !/^[\d-]+$/.test(staffForm.phone)) {
        newErrors.phone = '올바른 전화번호 형식이 아닙니다.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return

    try {
      setSaving(true)
      let url: string
      let method: string
      let body: Record<string, unknown>

      if (activeTab === 'group') {
        url = editingId ? `/api/store-groups/${editingId}` : '/api/store-groups'
        method = editingId ? 'PUT' : 'POST'
        body = groupForm
      } else if (activeTab === 'delivery') {
        url = editingId ? `/api/delivery-staff/${editingId}` : '/api/delivery-staff'
        method = editingId ? 'PUT' : 'POST'
        body = staffForm
      } else {
        url = editingId ? `/api/sales-staff/${editingId}` : '/api/sales-staff'
        method = editingId ? 'PUT' : 'POST'
        body = staffForm
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '저장에 실패했습니다.')
        return
      }

      alert(editingId ? '수정되었습니다.' : '등록되었습니다.')
      setShowModal(false)
      resetForm()
      
      if (activeTab === 'group') fetchGroups()
      else if (activeTab === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      console.error(e)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleEditGroup(group: StoreGroup) {
    setGroupForm({
      name: group.name,
      description: group.description || '',
      discountRate: group.discountRate,
      storeType: group.storeType,
    })
    setEditingId(group.id)
    setShowModal(true)
  }

  function handleEditStaff(staff: Staff) {
    setStaffForm({
      name: staff.name,
      phone: staff.phone || '',
      areaCode: staff.areaCode || '',
    })
    setEditingId(staff.id)
    setShowModal(true)
  }

  async function handleDelete(id: number) {
    const label = activeTab === 'group' ? '그룹' : activeTab === 'delivery' ? '배송담당자' : '영업담당자'
    if (!confirm(`이 ${label}을(를) 비활성화하시겠습니까?`)) return

    try {
      const endpoint = activeTab === 'group' ? 'store-groups' : activeTab === 'delivery' ? 'delivery-staff' : 'sales-staff'
      const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '비활성화에 실패했습니다.')
        return
      }

      alert('비활성화되었습니다.')
      if (activeTab === 'group') fetchGroups()
      else if (activeTab === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
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

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    border: 'none',
    borderBottom: isActive ? '3px solid #5d7a5d' : '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    color: isActive ? '#5d7a5d' : '#666',
    transition: 'all 0.2s',
  })

  const getTabTitle = () => {
    switch (activeTab) {
      case 'group': return '그룹'
      case 'delivery': return '배송담당자'
      case 'sales': return '영업담당자'
    }
  }

  const getTabIcon = () => {
    switch (activeTab) {
      case 'group': return '📁'
      case 'delivery': return '🚚'
      case 'sales': return '👔'
    }
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
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
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>담당자/그룹 관리</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            그룹, 배송담당, 영업담당 관리
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + {getTabTitle()} 추가
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0',
        marginBottom: 15,
        background: '#fff'
      }}>
        <button style={tabStyle(activeTab === 'group')} onClick={() => setActiveTab('group')}>
          📁 그룹 ({groups.length})
        </button>
        <button style={tabStyle(activeTab === 'delivery')} onClick={() => setActiveTab('delivery')}>
          🚚 배송담당 ({deliveryStaff.length})
        </button>
        <button style={tabStyle(activeTab === 'sales')} onClick={() => setActiveTab('sales')}>
          👔 영업담당 ({salesStaff.length})
        </button>
      </div>

      {/* 요약 카드 */}
      {activeTab === 'group' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
            <div style={{ fontSize: 12, color: '#666' }}>전체 그룹</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{groups.length}개</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontSize: 12, color: '#666' }}>연결된 거래처</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>{groups.reduce((sum, g) => sum + (g.storeCount || 0), 0)}개</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontSize: 12, color: '#666' }}>평균 할인율</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>
              {groups.length > 0 ? (groups.reduce((sum, g) => sum + g.discountRate, 0) / groups.length).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      )}
      
      {(activeTab === 'delivery' || activeTab === 'sales') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
            <div style={{ fontSize: 12, color: '#666' }}>전체 담당자</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>
              {(activeTab === 'delivery' ? deliveryStaff : salesStaff).length}명
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontSize: 12, color: '#666' }}>담당 거래처</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>
              {(activeTab === 'delivery' ? deliveryStaff : salesStaff).reduce((sum, s) => sum + s.storeCount, 0)}개
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontSize: 12, color: '#666' }}>평균 담당</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>
              {(() => {
                const list = activeTab === 'delivery' ? deliveryStaff : salesStaff
                return list.length > 0 ? Math.round(list.reduce((sum, s) => sum + s.storeCount, 0) / list.length) : 0
              })()}개
            </div>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          {activeTab === 'group' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>그룹명</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>설명</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>할인율</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>타입</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>거래처수</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {groupsLoading ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>로딩 중...</td></tr>
                ) : groups.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                    등록된 그룹이 없습니다
                  </td></tr>
                ) : groups.map((group, index) => (
                  <tr key={group.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{group.name}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{group.description || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, background: '#eef4ee', color: '#5d7a5d' }}>
                        {group.discountRate}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: 12 }}>{group.storeType}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, background: group.storeCount > 0 ? '#e8f5e9' : '#f5f5f5', color: group.storeCount > 0 ? '#4caf50' : '#999' }}>
                        {group.storeCount}개
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => handleEditGroup(group)}>수정</button>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: '#f8f9fa', color: '#868e96' }} onClick={() => handleDelete(group.id)}>비활성화</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
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
                {(activeTab === 'delivery' ? deliveryLoading : salesLoading) ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>로딩 중...</td></tr>
                ) : (activeTab === 'delivery' ? deliveryStaff : salesStaff).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#868e96' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{getTabIcon()}</div>
                    등록된 {getTabTitle()}가 없습니다
                  </td></tr>
                ) : (activeTab === 'delivery' ? deliveryStaff : salesStaff).map((staff, index) => (
                  <tr key={staff.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{staff.name}</td>
                    <td style={{ padding: '12px', fontSize: 12 }}>{staff.phone || '-'}</td>
                    <td style={{ padding: '12px', fontSize: 12 }}>
                      {staff.areaCode ? (
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, background: '#eef4ee', color: '#5d7a5d' }}>{staff.areaCode}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: staff.storeCount > 0 ? '#e8f5e9' : '#f5f5f5', color: staff.storeCount > 0 ? '#4caf50' : '#999' }}>
                        {staff.storeCount}개
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: staff.isActive ? '#e8f5e9' : '#f5f5f5', color: staff.isActive ? '#4caf50' : '#999' }}>
                        {staff.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => handleEditStaff(staff)}>수정</button>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: '#f8f9fa', color: '#868e96' }} onClick={() => handleDelete(staff.id)}>비활성화</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {getTabIcon()} {editingId ? `${getTabTitle()} 수정` : `${getTabTitle()} 추가`}
              </h2>
              <button style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#868e96', padding: 4 }} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            {/* 모달 바디 */}
            <div style={{ padding: 24 }}>
              {activeTab === 'group' ? (
                <>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>그룹명 *</label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                      value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="VIP 그룹" />
                    {errors.name && <div style={errorStyle}>{errors.name}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>설명</label>
                    <input type="text" style={{ ...inputStyle, width: '100%' }}
                      value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="그룹 설명" />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>할인율 (%)</label>
                      <input type="number" style={{ ...inputStyle, width: '100%' }}
                        value={groupForm.discountRate} onChange={e => setGroupForm({ ...groupForm, discountRate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>타입</label>
                      <select style={{ ...selectStyle, width: '100%' }}
                        value={groupForm.storeType} onChange={e => setGroupForm({ ...groupForm, storeType: e.target.value })}>
                        <option value="normal">일반</option>
                        <option value="vip">VIP</option>
                        <option value="wholesale">도매</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>담당자명 *</label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                      value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="홍길동" />
                    {errors.name && <div style={errorStyle}>{errors.name}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>연락처</label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.phone ? '#f44336' : undefined }}
                      value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="010-1234-5678" />
                    {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>담당지역</label>
                    <select style={{ ...selectStyle, width: '100%' }}
                      value={staffForm.areaCode} onChange={e => setStaffForm({ ...staffForm, areaCode: e.target.value })}>
                      <option value="">선택</option>
                      {AREA_CODES.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {/* 모달 푸터 */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={{ ...btnStyle, minWidth: 80 }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff', minWidth: 100 }} onClick={handleSubmit} disabled={saving}>
                {saving ? '저장 중...' : editingId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
