'use client'

import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

const AREA_CODES = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주']

interface StoreGroup {
  id: number
  name: string
  description: string | null
  discountRate: number
  storeType: string
  isActive: boolean
  storeCount: number
}

interface Staff {
  id: number
  name: string
  phone: string | null
  areaCode: string | null
  isActive: boolean
  storeCount: number
}

type ModalType = 'group' | 'delivery' | 'sales' | null

export default function StaffManagementPage() {
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [deliveryStaff, setDeliveryStaff] = useState<Staff[]>([])
  const [salesStaff, setSalesStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  
  // 모달
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  
  // 폼
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', areaCode: '' })
  const [groupForm, setGroupForm] = useState({ name: '', description: '', discountRate: 0, storeType: 'normal' })
  
  // 일괄등록 모달
  const [bulkType, setBulkType] = useState<'group' | 'delivery' | 'sales' | null>(null)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)

  useEffect(() => {
    Promise.all([fetchGroups(), fetchDeliveryStaff(), fetchSalesStaff()])
      .finally(() => setLoading(false))
  }, [])

  async function fetchGroups() {
    try {
      const res = await fetch('/api/store-groups')
      const data = await res.json()
      setGroups(data || [])
    } catch (e) { console.error(e) }
  }

  async function fetchDeliveryStaff() {
    try {
      const res = await fetch('/api/delivery-staff')
      const data = await res.json()
      setDeliveryStaff(data.deliveryStaff || [])
    } catch (e) { console.error(e) }
  }

  async function fetchSalesStaff() {
    try {
      const res = await fetch('/api/sales-staff')
      const data = await res.json()
      setSalesStaff(data.salesStaff || [])
    } catch (e) { console.error(e) }
  }

  function openModal(type: ModalType, item?: StoreGroup | Staff) {
    setModalType(type)
    if (item) {
      setEditingId(item.id)
      if (type === 'group') {
        const g = item as StoreGroup
        setGroupForm({ name: g.name, description: g.description || '', discountRate: g.discountRate, storeType: g.storeType })
      } else {
        const s = item as Staff
        setStaffForm({ name: s.name, phone: s.phone || '', areaCode: s.areaCode || '' })
      }
    } else {
      setEditingId(null)
      setStaffForm({ name: '', phone: '', areaCode: '' })
      setGroupForm({ name: '', description: '', discountRate: 0, storeType: 'normal' })
    }
  }

  function closeModal() {
    setModalType(null)
    setEditingId(null)
  }

  async function handleSubmit() {
    if (modalType === 'group' && !groupForm.name.trim()) { alert('그룹명을 입력해주세요.'); return }
    if (modalType !== 'group' && !staffForm.name.trim()) { alert('담당자명을 입력해주세요.'); return }

    setSaving(true)
    try {
      let url: string, method: string, body: any

      if (modalType === 'group') {
        url = editingId ? `/api/store-groups/${editingId}` : '/api/store-groups'
        method = editingId ? 'PUT' : 'POST'
        body = groupForm
      } else if (modalType === 'delivery') {
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

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '저장 실패')
        return
      }

      closeModal()
      if (modalType === 'group') fetchGroups()
      else if (modalType === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  // 다운로드
  function handleDownload(type: 'group' | 'delivery' | 'sales') {
    let headers: string[], rows: string[][]
    
    if (type === 'group') {
      headers = ['그룹명', '설명', '할인율(%)', '타입', '거래처수']
      rows = groups.map(g => [g.name, g.description || '', String(g.discountRate), g.storeType, String(g.storeCount)])
    } else if (type === 'delivery') {
      headers = ['담당자명', '연락처', '담당지역', '거래처수']
      rows = deliveryStaff.map(s => [s.name, s.phone || '', s.areaCode || '', String(s.storeCount)])
    } else {
      headers = ['담당자명', '연락처', '담당지역', '거래처수']
      rows = salesStaff.map(s => [s.name, s.phone || '', s.areaCode || '', String(s.storeCount)])
    }
    
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = type === 'group' ? '그룹' : type === 'delivery' ? '배송담당' : '영업담당'
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 일괄등록 파일 처리
  async function handleBulkUpload() {
    if (!bulkFile || !bulkType) return
    
    setBulkUploading(true)
    try {
      const text = await bulkFile.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { alert('데이터가 없습니다.'); return }
      
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const items = []
      
      for (let i = 1; i < lines.length; i++) {
        const values: string[] = []
        let current = '', inQuotes = false
        for (const char of lines[i]) {
          if (char === '"') inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
          else current += char
        }
        values.push(current.trim())
        
        if (bulkType === 'group') {
          if (values[0]) items.push({ name: values[0], description: values[1] || '', discountRate: parseFloat(values[2]) || 0, storeType: values[3] || 'normal' })
        } else {
          if (values[0]) items.push({ name: values[0], phone: values[1] || '', areaCode: values[2] || '' })
        }
      }
      
      if (items.length === 0) { alert('등록할 데이터가 없습니다.'); return }
      
      const endpoint = bulkType === 'group' ? 'store-groups' : bulkType === 'delivery' ? 'delivery-staff' : 'sales-staff'
      let success = 0, failed = 0
      
      for (const item of items) {
        try {
          const res = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })
          if (res.ok) success++
          else failed++
        } catch { failed++ }
      }
      
      alert(`등록 완료: ${success}건 성공, ${failed}건 실패`)
      setBulkType(null)
      setBulkFile(null)
      
      if (bulkType === 'group') fetchGroups()
      else if (bulkType === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      alert('파일 처리 실패')
    } finally {
      setBulkUploading(false)
    }
  }

  async function handleDelete(type: 'group' | 'delivery' | 'sales', id: number) {
    const label = type === 'group' ? '그룹' : type === 'delivery' ? '배송담당자' : '영업담당자'
    if (!confirm(`이 ${label}을(를) 삭제하시겠습니까?`)) return

    try {
      const endpoint = type === 'group' ? 'store-groups' : type === 'delivery' ? 'delivery-staff' : 'sales-staff'
      const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '삭제 실패')
        return
      }
      if (type === 'group') fetchGroups()
      else if (type === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      alert('삭제 실패')
    }
  }

  const columnStyle: React.CSSProperties = {
    flex: 1,
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8f9fa'
  }

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '4px'
  }

  const itemStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '4px',
    background: '#fff',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'all 0.15s'
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#007aff',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>담당자 관리</h2>
        <p style={{ fontSize: '13px', color: '#86868b', margin: '4px 0 0' }}>그룹, 배송담당, 영업담당을 관리합니다</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#86868b' }}>
          로딩 중...
        </div>
      ) : (
        /* 3단 컬럼 */
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 180px)' }}>
          {/* 그룹 */}
          <div style={columnStyle}>
            <div style={headerStyle}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>📁 그룹</span>
                <span style={{ marginLeft: '6px', fontSize: '12px', color: '#86868b' }}>{groups.length}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handleDownload('group')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer' }}>⬇ 다운</button>
                <button onClick={() => setBulkType('group')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer' }}>⬆ 등록</button>
                <button style={addBtnStyle} onClick={() => openModal('group')}>+ 추가</button>
              </div>
            </div>
            <div style={listStyle}>
              {groups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#86868b', fontSize: '13px' }}>등록된 그룹이 없습니다</div>
              ) : groups.map(group => (
                <div 
                  key={group.id} 
                  style={itemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</span>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>{group.discountRate}%</span>
                      <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '10px', background: group.storeCount > 0 ? '#e8f5e9' : '#f5f5f5', color: group.storeCount > 0 ? '#2e7d32' : '#999' }}>
                        {group.storeCount}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => openModal('group', group)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete('group', group.id)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #ffcdd2', background: '#fff', color: '#c62828', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 배송담당 */}
          <div style={columnStyle}>
            <div style={headerStyle}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>🚚 배송담당</span>
                <span style={{ marginLeft: '6px', fontSize: '12px', color: '#86868b' }}>{deliveryStaff.length}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handleDownload('delivery')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer' }}>⬇ 다운</button>
                <button onClick={() => setBulkType('delivery')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer' }}>⬆ 등록</button>
                <button style={addBtnStyle} onClick={() => openModal('delivery')}>+ 추가</button>
              </div>
            </div>
            <div style={listStyle}>
              {deliveryStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#86868b', fontSize: '13px' }}>등록된 배송담당이 없습니다</div>
              ) : deliveryStaff.map(staff => (
                <div 
                  key={staff.id} 
                  style={itemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap' }}>{staff.name}</span>
                      {staff.areaCode && <span style={{ fontSize: '10px', color: '#1565c0', background: '#e3f2fd', padding: '1px 5px', borderRadius: '4px' }}>{staff.areaCode}</span>}
                      <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '10px', background: staff.storeCount > 0 ? '#e3f2fd' : '#f5f5f5', color: staff.storeCount > 0 ? '#1565c0' : '#999' }}>
                        {staff.storeCount}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => openModal('delivery', staff)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete('delivery', staff.id)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #ffcdd2', background: '#fff', color: '#c62828', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 영업담당 */}
          <div style={columnStyle}>
            <div style={headerStyle}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>👔 영업담당</span>
                <span style={{ marginLeft: '6px', fontSize: '12px', color: '#86868b' }}>{salesStaff.length}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handleDownload('sales')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer' }}>⬇ 다운</button>
                <button onClick={() => setBulkType('sales')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer' }}>⬆ 등록</button>
                <button style={addBtnStyle} onClick={() => openModal('sales')}>+ 추가</button>
              </div>
            </div>
            <div style={listStyle}>
              {salesStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#86868b', fontSize: '13px' }}>등록된 영업담당이 없습니다</div>
              ) : salesStaff.map(staff => (
                <div 
                  key={staff.id} 
                  style={itemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap' }}>{staff.name}</span>
                      {staff.areaCode && <span style={{ fontSize: '10px', color: '#e65100', background: '#fff3e0', padding: '1px 5px', borderRadius: '4px' }}>{staff.areaCode}</span>}
                      <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '10px', background: staff.storeCount > 0 ? '#fff3e0' : '#f5f5f5', color: staff.storeCount > 0 ? '#e65100' : '#999' }}>
                        {staff.storeCount}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => openModal('sales', staff)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete('sales', staff.id)} style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #ffcdd2', background: '#fff', color: '#c62828', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 모달 */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                {modalType === 'group' ? '📁 그룹' : modalType === 'delivery' ? '🚚 배송담당' : '👔 영업담당'} {editingId ? '수정' : '추가'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            {modalType === 'group' ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>그룹명 *</label>
                  <input 
                    type="text" 
                    value={groupForm.name} 
                    onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="VIP, 도매 등"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
                  <input 
                    type="text" 
                    value={groupForm.description} 
                    onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                    placeholder="그룹 설명"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>할인율 (%)</label>
                    <input 
                      type="number" 
                      value={groupForm.discountRate} 
                      onChange={e => setGroupForm({ ...groupForm, discountRate: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>타입</label>
                    <select 
                      value={groupForm.storeType} 
                      onChange={e => setGroupForm({ ...groupForm, storeType: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                    >
                      <option value="normal">일반</option>
                      <option value="vip">VIP</option>
                      <option value="wholesale">도매</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>담당자명 *</label>
                  <input 
                    type="text" 
                    value={staffForm.name} 
                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="홍길동"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>연락처</label>
                  <input 
                    type="text" 
                    value={staffForm.phone} 
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>담당지역</label>
                  <select 
                    value={staffForm.areaCode} 
                    onChange={e => setStaffForm({ ...staffForm, areaCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                  >
                    <option value="">선택</option>
                    {AREA_CODES.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button 
                onClick={handleSubmit} 
                disabled={saving}
                style={{ padding: '10px 24px', borderRadius: '8px', background: saving ? '#ccc' : '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? '저장 중...' : editingId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄등록 모달 */}
      {bulkType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                ⬆ {bulkType === 'group' ? '그룹' : bulkType === 'delivery' ? '배송담당' : '영업담당'} 일괄등록
              </h3>
              <button onClick={() => { setBulkType(null); setBulkFile(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#1565c0' }}>
              <strong>CSV 형식:</strong><br/>
              {bulkType === 'group' 
                ? '그룹명, 설명, 할인율(%), 타입' 
                : '담당자명, 연락처, 담당지역'}
            </div>

            <div style={{ border: '2px dashed #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '16px', background: '#fafafa' }}>
              <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="bulk-staff-input" />
              <label htmlFor="bulk-staff-input" style={{ cursor: 'pointer' }}>
                {bulkFile ? (
                  <div><span style={{ fontSize: '14px', fontWeight: 500 }}>📄 {bulkFile.name}</span></div>
                ) : (
                  <div><span style={{ fontSize: '28px' }}>📁</span><p style={{ margin: '8px 0 0', color: '#86868b', fontSize: '13px' }}>CSV 파일 선택</p></div>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setBulkType(null); setBulkFile(null); }} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading} style={{ padding: '10px 24px', borderRadius: '8px', background: bulkFile && !bulkUploading ? '#007aff' : '#ccc', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: bulkFile && !bulkUploading ? 'pointer' : 'not-allowed' }}>
                {bulkUploading ? '등록 중...' : '일괄 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
