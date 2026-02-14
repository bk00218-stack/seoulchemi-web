'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, cardStyle, selectStyle, inputStyle } from '../../components/Layout'

const SIDEBAR = [
  {
    title: 'ê´€ë¦?,
    items: [
      { label: 'ê°€ë§¹ì  ê´€ë¦?, href: '/stores' },
      { label: '?´ë‹¹??ê´€ë¦?, href: '/stores/delivery-staff' },
      { label: 'ê°€ë§¹ì  ê³µì??¬í•­', href: '/stores/notices' },
    ]
  },
  {
    title: 'ê·¸ë£¹ê´€ë¦?,
    items: [
      { label: 'ê·¸ë£¹ë³?ê°€ë§¹ì  ?°ê²°', href: '/stores/groups' },
      { label: 'ê·¸ë£¹ë³?? ì¸???¤ì •', href: '/stores/groups/discounts' },
      { label: 'ê·¸ë£¹ë³??€???¤ì •', href: '/stores/groups/types' },
    ]
  }
]

const AREA_CODES = ['?œìš¸', 'ê²½ê¸°', '?¸ì²œ', 'ê°•ì›', 'ì¶©ë¶', 'ì¶©ë‚¨', '?€??, '?¸ì¢…', '?„ë¶', '?„ë‚¨', 'ê´‘ì£¼', 'ê²½ë¶', 'ê²½ë‚¨', '?€êµ?, '?¸ì‚°', 'ë¶€??, '?œì£¼']

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
  
  // ê·¸ë£¹ ?íƒœ
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  
  // ë°°ì†¡?´ë‹¹ ?íƒœ
  const [deliveryStaff, setDeliveryStaff] = useState<Staff[]>([])
  const [deliveryLoading, setDeliveryLoading] = useState(true)
  
  // ?ì—…?´ë‹¹ ?íƒœ
  const [salesStaff, setSalesStaff] = useState<Staff[]>([])
  const [salesLoading, setSalesLoading] = useState(true)
  
  // ëª¨ë‹¬ ?íƒœ
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // ???íƒœ (??³„ë¡??¤ë¦„)
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
      if (!groupForm.name.trim()) newErrors.name = 'ê·¸ë£¹ëª…ì? ?„ìˆ˜?…ë‹ˆ??'
    } else {
      if (!staffForm.name.trim()) newErrors.name = '?´ë‹¹?ëª…?€ ?„ìˆ˜?…ë‹ˆ??'
      if (staffForm.phone && !/^[\d-]+$/.test(staffForm.phone)) {
        newErrors.phone = '?¬ë°”ë¥??„í™”ë²ˆí˜¸ ?•ì‹???„ë‹™?ˆë‹¤.'
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
        alert(data.error || '?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
        return
      }

      alert(editingId ? '?˜ì •?˜ì—ˆ?µë‹ˆ??' : '?±ë¡?˜ì—ˆ?µë‹ˆ??')
      setShowModal(false)
      resetForm()
      
      if (activeTab === 'group') fetchGroups()
      else if (activeTab === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      console.error(e)
      alert('?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.')
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
    const label = activeTab === 'group' ? 'ê·¸ë£¹' : activeTab === 'delivery' ? 'ë°°ì†¡?´ë‹¹?? : '?ì—…?´ë‹¹??
    if (!confirm(`??${label}??ë¥? ë¹„í™œ?±í™”?˜ì‹œê² ìŠµ?ˆê¹Œ?`)) return

    try {
      const endpoint = activeTab === 'group' ? 'store-groups' : activeTab === 'delivery' ? 'delivery-staff' : 'sales-staff'
      const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'ë¹„í™œ?±í™”???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
        return
      }

      alert('ë¹„í™œ?±í™”?˜ì—ˆ?µë‹ˆ??')
      if (activeTab === 'group') fetchGroups()
      else if (activeTab === 'delivery') fetchDeliveryStaff()
      else fetchSalesStaff()
    } catch (e) {
      console.error(e)
      alert('ë¹„í™œ?±í™”???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
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
      case 'group': return 'ê·¸ë£¹'
      case 'delivery': return 'ë°°ì†¡?´ë‹¹??
      case 'sales': return '?ì—…?´ë‹¹??
    }
  }

  const getTabIcon = () => {
    switch (activeTab) {
      case 'group': return '?“'
      case 'delivery': return '?šš'
      case 'sales': return '?‘”'
    }
  }

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="ê°€ë§¹ì ">
      {/* ?¤ë” */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottom: '2px solid #5d7a5d'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>?´ë‹¹??ê·¸ë£¹ ê´€ë¦?/h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            ê·¸ë£¹, ë°°ì†¡?´ë‹¹, ?ì—…?´ë‹¹ ê´€ë¦?
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            style={{ ...btnStyle, background: '#ff9800', color: '#fff', border: 'none' }}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            + {getTabTitle()} ì¶”ê?
          </button>
        </div>
      </div>

      {/* ??*/}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0',
        marginBottom: 15,
        background: 'var(--bg-primary)'
      }}>
        <button style={tabStyle(activeTab === 'group')} onClick={() => setActiveTab('group')}>
          ?“ ê·¸ë£¹ ({groups.length})
        </button>
        <button style={tabStyle(activeTab === 'delivery')} onClick={() => setActiveTab('delivery')}>
          ?šš ë°°ì†¡?´ë‹¹ ({deliveryStaff.length})
        </button>
        <button style={tabStyle(activeTab === 'sales')} onClick={() => setActiveTab('sales')}>
          ?‘” ?ì—…?´ë‹¹ ({salesStaff.length})
        </button>
      </div>

      {/* ?”ì•½ ì¹´ë“œ */}
      {activeTab === 'group' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?„ì²´ ê·¸ë£¹</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>{groups.length}ê°?/div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?°ê²°??ê±°ë˜ì²?/div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>{groups.reduce((sum, g) => sum + (g.storeCount || 0), 0)}ê°?/div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?‰ê·  ? ì¸??/div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>
              {groups.length > 0 ? (groups.reduce((sum, g) => sum + g.discountRate, 0) / groups.length).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      )}
      
      {(activeTab === 'delivery' || activeTab === 'sales') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #5d7a5d' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?„ì²´ ?´ë‹¹??/div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#5d7a5d' }}>
              {(activeTab === 'delivery' ? deliveryStaff : salesStaff).length}ëª?
            </div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?´ë‹¹ ê±°ë˜ì²?/div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>
              {(activeTab === 'delivery' ? deliveryStaff : salesStaff).reduce((sum, s) => sum + s.storeCount, 0)}ê°?
            </div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '15px 20px', borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontSize: 12, color: '#666' }}>?‰ê·  ?´ë‹¹</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>
              {(() => {
                const list = activeTab === 'delivery' ? deliveryStaff : salesStaff
                return list.length > 0 ? Math.round(list.reduce((sum, s) => sum + s.storeCount, 0) / list.length) : 0
              })()}ê°?
            </div>
          </div>
        </div>
      )}

      {/* ?Œì´ë¸?*/}
      <div style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', height: '100%' }}>
          {activeTab === 'group' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ê·¸ë£¹ëª?/th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?¤ëª…</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>? ì¸??/th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?€??/th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>ê±°ë˜ì²˜ìˆ˜</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?¡ì…˜</th>
                </tr>
              </thead>
              <tbody>
                {groupsLoading ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</td></tr>
                ) : groups.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>?“</div>
                    ?±ë¡??ê·¸ë£¹???†ìŠµ?ˆë‹¤
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
                        {group.storeCount}ê°?
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => handleEditGroup(group)}>?˜ì •</button>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }} onClick={() => handleDelete(group.id)}>ë¹„í™œ?±í™”</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?´ë‹¹?ëª…</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?°ë½ì²?/th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?´ë‹¹ì§€??/th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?´ë‹¹ ê±°ë˜ì²?/th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?íƒœ</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>?¡ì…˜</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'delivery' ? deliveryLoading : salesLoading) ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ë¡œë”© ì¤?..</td></tr>
                ) : (activeTab === 'delivery' ? deliveryStaff : salesStaff).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{getTabIcon()}</div>
                    ?±ë¡??{getTabTitle()}ê°€ ?†ìŠµ?ˆë‹¤
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
                        {staff.storeCount}ê°?
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: staff.isActive ? '#e8f5e9' : '#f5f5f5', color: staff.isActive ? '#4caf50' : '#999' }}>
                        {staff.isActive ? '?œì„±' : 'ë¹„í™œ??}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => handleEditStaff(staff)}>?˜ì •</button>
                      <button style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }} onClick={() => handleDelete(staff.id)}>ë¹„í™œ?±í™”</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ëª¨ë‹¬ */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, width: '90%', maxWidth: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            {/* ëª¨ë‹¬ ?¤ë” */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {getTabIcon()} {editingId ? `${getTabTitle()} ?˜ì •` : `${getTabTitle()} ì¶”ê?`}
              </h2>
              <button style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }} onClick={() => setShowModal(false)}>Ã—</button>
            </div>
            
            {/* ëª¨ë‹¬ ë°”ë”” */}
            <div style={{ padding: 24 }}>
              {activeTab === 'group' ? (
                <>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>ê·¸ë£¹ëª?*</label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                      value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="VIP ê·¸ë£¹" />
                    {errors.name && <div style={errorStyle}>{errors.name}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>?¤ëª…</label>
                    <input type="text" style={{ ...inputStyle, width: '100%' }}
                      value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="ê·¸ë£¹ ?¤ëª…" />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>? ì¸??(%)</label>
                      <input type="number" style={{ ...inputStyle, width: '100%' }}
                        value={groupForm.discountRate} onChange={e => setGroupForm({ ...groupForm, discountRate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>?€??/label>
                      <select style={{ ...selectStyle, width: '100%' }}
                        value={groupForm.storeType} onChange={e => setGroupForm({ ...groupForm, storeType: e.target.value })}>
                        <option value="normal">?¼ë°˜</option>
                        <option value="vip">VIP</option>
                        <option value="wholesale">?„ë§¤</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>?´ë‹¹?ëª… *</label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.name ? '#f44336' : undefined }}
                      value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="?ê¸¸?? />
                    {errors.name && <div style={errorStyle}>{errors.name}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>?°ë½ì²?/label>
                    <input type="text" style={{ ...inputStyle, width: '100%', borderColor: errors.phone ? '#f44336' : undefined }}
                      value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="010-1234-5678" />
                    {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>?´ë‹¹ì§€??/label>
                    <select style={{ ...selectStyle, width: '100%' }}
                      value={staffForm.areaCode} onChange={e => setStaffForm({ ...staffForm, areaCode: e.target.value })}>
                      <option value="">? íƒ</option>
                      {AREA_CODES.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {/* ëª¨ë‹¬ ?¸í„° */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={{ ...btnStyle, minWidth: 80 }} onClick={() => setShowModal(false)}>ì·¨ì†Œ</button>
              <button style={{ ...btnStyle, background: '#5d7a5d', border: 'none', color: '#fff', minWidth: 100 }} onClick={handleSubmit} disabled={saving}>
                {saving ? '?€??ì¤?..' : editingId ? '?˜ì •' : '?±ë¡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
