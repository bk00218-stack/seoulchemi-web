'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import { STORES_SIDEBAR } from '../../../constants/sidebar'
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal'

interface StoreGroup {
  id: number
  name: string
  storeCount: number
}

interface GroupType {
  id: number
  name: string
  description: string | null
  color: string
}

interface GroupTypeSetting {
  groupId: number
  groupName: string
  typeId: number | null
  typeName: string | null
}

// 목업 데이터
const MOCK_GROUPS: StoreGroup[] = [
  { id: 1, name: 'VIP 그룹', storeCount: 15 },
  { id: 2, name: '일반 그룹', storeCount: 45 },
  { id: 3, name: '신규 그룹', storeCount: 8 },
  { id: 4, name: '지방 그룹', storeCount: 22 },
]

const MOCK_TYPES: GroupType[] = [
  { id: 1, name: '프리미엄', description: '최우선 서비스 대상', color: '#9c27b0' },
  { id: 2, name: '일반', description: '기본 서비스 대상', color: '#2196f3' },
  { id: 3, name: '신규', description: '신규 가맹점 프로모션 대상', color: '#4caf50' },
  { id: 4, name: '특별관리', description: '특별 관리 대상 그룹', color: '#ff9800' },
]

const MOCK_SETTINGS: GroupTypeSetting[] = [
  { groupId: 1, groupName: 'VIP 그룹', typeId: 1, typeName: '프리미엄' },
  { groupId: 2, groupName: '일반 그룹', typeId: 2, typeName: '일반' },
  { groupId: 3, groupName: '신규 그룹', typeId: 3, typeName: '신규' },
  { groupId: 4, groupName: '지방 그룹', typeId: null, typeName: null },
]

export default function GroupTypesPage() {
  const { toast } = useToast()
  const [groups] = useState<StoreGroup[]>(MOCK_GROUPS)
  const [types, setTypes] = useState<GroupType[]>(MOCK_TYPES)
  const [settings, setSettings] = useState<GroupTypeSetting[]>(MOCK_SETTINGS)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingType, setEditingType] = useState<GroupType | null>(null)
  const [typeForm, setTypeForm] = useState({ name: '', description: '', color: '#2196f3' })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroupType | null>(null)

  const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  const btnStyle = (variant: 'primary' | 'secondary' | 'danger' = 'secondary') => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: variant === 'primary' ? 'none' : '1px solid #e9ecef',
    background: variant === 'primary' ? '#007aff' : variant === 'danger' ? '#ff3b30' : '#fff',
    color: variant === 'primary' || variant === 'danger' ? '#fff' : '#1d1d1f',
    fontSize: '14px',
    fontWeight: 500 as const,
    cursor: 'pointer',
  })

  const colorOptions = [
    '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
    '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#f44336',
  ]

  const handleOpenTypeModal = (type: GroupType | null = null) => {
    if (type) {
      setEditingType(type)
      setTypeForm({ name: type.name, description: type.description || '', color: type.color })
    } else {
      setEditingType(null)
      setTypeForm({ name: '', description: '', color: '#2196f3' })
    }
    setShowTypeModal(true)
  }

  const handleSaveType = () => {
    if (!typeForm.name.trim()) {
      toast.warning('타입명을 입력해주세요.')
      return
    }

    if (editingType) {
      setTypes(types.map(t => 
        t.id === editingType.id 
          ? { ...t, name: typeForm.name, description: typeForm.description || null, color: typeForm.color }
          : t
      ))
      // 설정에서도 이름 업데이트
      setSettings(settings.map(s => 
        s.typeId === editingType.id 
          ? { ...s, typeName: typeForm.name }
          : s
      ))
      toast.success('타입이 수정되었습니다.')
    } else {
      const newType: GroupType = {
        id: Math.max(...types.map(t => t.id)) + 1,
        name: typeForm.name,
        description: typeForm.description || null,
        color: typeForm.color,
      }
      setTypes([...types, newType])
      toast.success('타입이 등록되었습니다.')
    }
    setShowTypeModal(false)
  }

  const handleDeleteType = (type: GroupType) => {
    setDeleteTarget(type)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setTypes(types.filter(t => t.id !== deleteTarget.id))
      // 해당 타입을 사용하던 그룹들 초기화
      setSettings(settings.map(s => 
        s.typeId === deleteTarget.id 
          ? { ...s, typeId: null, typeName: null }
          : s
      ))
    }
    setDeleteModalOpen(false)
  }

  const handleGroupTypeChange = (groupId: number, typeId: number | null) => {
    const type = typeId ? types.find(t => t.id === typeId) : null
    setSettings(settings.map(s => 
      s.groupId === groupId 
        ? { ...s, typeId: typeId, typeName: type?.name || null }
        : s
    ))
  }

  const getTypeForGroup = (groupId: number) => {
    const setting = settings.find(s => s.groupId === groupId)
    if (setting?.typeId) {
      return types.find(t => t.id === setting.typeId)
    }
    return null
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>그룹별 타입 설정</h2>
        <button onClick={() => handleOpenTypeModal()} style={btnStyle('primary')}>
          + 타입 추가
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 타입 관리 */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>타입 목록</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {types.map(type => (
              <div
                key={type.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: type.color,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{type.name}</div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>
                      {type.description || '설명 없음'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleOpenTypeModal(type)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => handleDeleteType(type)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ffebee', color: '#c62828', fontSize: '11px', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}

            {types.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                등록된 타입이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 그룹별 타입 설정 */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>그룹별 타입 지정</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groups.map(group => {
              const currentType = getTypeForGroup(group.id)
              return (
                <div
                  key={group.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    background: '#fafafa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{group.name}</div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>
                      {group.storeCount}개 가맹점
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentType && (
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: currentType.color,
                      }} />
                    )}
                    <select
                      value={currentType?.id || ''}
                      onChange={e => handleGroupTypeChange(group.id, e.target.value ? parseInt(e.target.value) : null)}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #e9ecef', 
                        fontSize: '13px',
                        minWidth: '120px',
                        background: '#fff',
                      }}
                    >
                      <option value="">선택 안함</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 타입별 그룹 현황 */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>타입별 그룹 현황</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {types.map(type => {
            const groupsWithType = settings.filter(s => s.typeId === type.id)
            return (
              <div 
                key={type.id}
                style={{ 
                  padding: '16px', 
                  borderRadius: '10px', 
                  border: `2px solid ${type.color}20`,
                  background: `${type.color}08`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: type.color,
                  }} />
                  <span style={{ fontWeight: 600, color: type.color }}>{type.name}</span>
                </div>
                {groupsWithType.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#86868b' }}>연결된 그룹 없음</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {groupsWithType.map(s => (
                      <span key={s.groupId} style={{ fontSize: '13px', color: '#333' }}>
                        • {s.groupName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          {/* 미지정 그룹 */}
          <div 
            style={{ 
              padding: '16px', 
              borderRadius: '10px', 
              border: '2px solid #e9ecef',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#e9ecef',
              }} />
              <span style={{ fontWeight: 600, color: '#86868b' }}>미지정</span>
            </div>
            {settings.filter(s => !s.typeId).length === 0 ? (
              <div style={{ fontSize: '13px', color: '#86868b' }}>모든 그룹이 타입 지정됨</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {settings.filter(s => !s.typeId).map(s => (
                  <span key={s.groupId} style={{ fontSize: '13px', color: '#333' }}>
                    • {s.groupName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 타입 추가/수정 모달 */}
      {showTypeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingType ? '타입 수정' : '타입 추가'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                타입명 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input
                type="text"
                value={typeForm.name}
                onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                placeholder="예: 프리미엄"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input
                type="text"
                value={typeForm.description}
                onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                placeholder="타입에 대한 설명 (선택사항)"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>색상</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setTypeForm({ ...typeForm, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color,
                      border: typeForm.color === color ? '3px solid #333' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTypeModal(false)} style={btnStyle('secondary')}>취소</button>
              <button onClick={handleSaveType} style={btnStyle('primary')}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="타입 삭제"
        message={`'${deleteTarget?.name}' 타입을 삭제하시겠습니까?\n이 타입을 사용하는 그룹은 타입 미지정 상태가 됩니다.`}
        confirmText="삭제"
      />
    </Layout>
  )
}
