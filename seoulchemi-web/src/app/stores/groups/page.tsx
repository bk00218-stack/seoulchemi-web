'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

interface StoreGroup {
  id: number
  name: string
  description: string | null
  storeCount: number
  createdAt: string
}

interface Store {
  id: number
  code: string
  name: string
  ownerName: string
  groupId: number | null
  groupName: string | null
}

// 목업 데이터
const MOCK_GROUPS: StoreGroup[] = [
  { id: 1, name: 'VIP 그룹', description: '프리미엄 가맹점', storeCount: 15, createdAt: '2024-01-01' },
  { id: 2, name: '일반 그룹', description: '일반 할인 적용', storeCount: 45, createdAt: '2024-01-15' },
  { id: 3, name: '신규 그룹', description: '신규 가맹점 프로모션', storeCount: 8, createdAt: '2024-02-01' },
  { id: 4, name: '지방 그룹', description: '지방 지역 가맹점', storeCount: 22, createdAt: '2024-02-10' },
]

const MOCK_STORES: Store[] = [
  { id: 1, code: 'S001', name: '서울안경원', ownerName: '김철수', groupId: 1, groupName: 'VIP 그룹' },
  { id: 2, code: 'S002', name: '강남안경원', ownerName: '이영희', groupId: 1, groupName: 'VIP 그룹' },
  { id: 3, code: 'S003', name: '부산안경원', ownerName: '박민수', groupId: 4, groupName: '지방 그룹' },
  { id: 4, code: 'S004', name: '대구안경원', ownerName: '정수진', groupId: null, groupName: null },
  { id: 5, code: 'S005', name: '인천안경원', ownerName: '최동훈', groupId: 2, groupName: '일반 그룹' },
  { id: 6, code: 'S006', name: '광주안경원', ownerName: '한지민', groupId: null, groupName: null },
]

export default function StoreGroupsPage() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<StoreGroup[]>(MOCK_GROUPS)
  const [stores, setStores] = useState<Store[]>(MOCK_STORES)
  const [selectedGroup, setSelectedGroup] = useState<StoreGroup | null>(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<StoreGroup | null>(null)
  const [groupForm, setGroupForm] = useState({ name: '', description: '' })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StoreGroup | null>(null)
  const [searchStore, setSearchStore] = useState('')

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

  const handleOpenGroupModal = (group: StoreGroup | null = null) => {
    if (group) {
      setEditingGroup(group)
      setGroupForm({ name: group.name, description: group.description || '' })
    } else {
      setEditingGroup(null)
      setGroupForm({ name: '', description: '' })
    }
    setShowGroupModal(true)
  }

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) {
      toast.warning('그룹명을 입력해주세요.')
      return
    }

    if (editingGroup) {
      setGroups(groups.map(g => 
        g.id === editingGroup.id 
          ? { ...g, name: groupForm.name, description: groupForm.description }
          : g
      ))
      toast.success('그룹이 수정되었습니다.')
    } else {
      const newGroup: StoreGroup = {
        id: Math.max(...groups.map(g => g.id)) + 1,
        name: groupForm.name,
        description: groupForm.description || null,
        storeCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setGroups([...groups, newGroup])
      toast.success('그룹이 등록되었습니다.')
    }
    setShowGroupModal(false)
  }

  const handleDeleteGroup = (group: StoreGroup) => {
    setDeleteTarget(group)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setGroups(groups.filter(g => g.id !== deleteTarget.id))
      setStores(stores.map(s => 
        s.groupId === deleteTarget.id ? { ...s, groupId: null, groupName: null } : s
      ))
      if (selectedGroup?.id === deleteTarget.id) {
        setSelectedGroup(null)
      }
    }
    setDeleteModalOpen(false)
  }

  const handleAssignStore = (store: Store) => {
    if (!selectedGroup) return
    
    setStores(stores.map(s => 
      s.id === store.id 
        ? { ...s, groupId: selectedGroup.id, groupName: selectedGroup.name }
        : s
    ))
    setGroups(groups.map(g => 
      g.id === selectedGroup.id 
        ? { ...g, storeCount: g.storeCount + 1 }
        : g.id === store.groupId
          ? { ...g, storeCount: Math.max(0, g.storeCount - 1) }
          : g
    ))
  }

  const handleUnassignStore = (store: Store) => {
    const oldGroupId = store.groupId
    setStores(stores.map(s => 
      s.id === store.id 
        ? { ...s, groupId: null, groupName: null }
        : s
    ))
    if (oldGroupId) {
      setGroups(groups.map(g => 
        g.id === oldGroupId 
          ? { ...g, storeCount: Math.max(0, g.storeCount - 1) }
          : g
      ))
    }
  }

  const filteredStores = searchStore 
    ? stores.filter(s => 
        s.name.includes(searchStore) || 
        s.code.includes(searchStore) || 
        s.ownerName.includes(searchStore)
      )
    : stores

  const assignedStores = selectedGroup 
    ? stores.filter(s => s.groupId === selectedGroup.id)
    : []

  const unassignedStores = stores.filter(s => s.groupId === null)

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>그룹별 가맹점 연결</h2>
        <button onClick={() => handleOpenGroupModal()} style={btnStyle('primary')}>
          + 그룹 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📁</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>전체 그룹</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{groups.length}</div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>연결된 가맹점</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34c759' }}>
              {stores.filter(s => s.groupId !== null).length}
            </div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>❓</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>미연결 가맹점</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff9500' }}>
              {stores.filter(s => s.groupId === null).length}
            </div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📊</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>평균 그룹 크기</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + g.storeCount, 0) / groups.length) : 0}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 그룹 목록 */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>그룹 목록</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: selectedGroup?.id === group.id ? '2px solid #007aff' : '1px solid #e9ecef',
                  background: selectedGroup?.id === group.id ? '#f0f7ff' : '#fafafa',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{group.name}</div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>
                    {group.description || '설명 없음'} · {group.storeCount}개 가맹점
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => handleOpenGroupModal(group)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(group)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ffebee', color: '#c62828', fontSize: '11px', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 가맹점 연결 관리 */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {selectedGroup ? `${selectedGroup.name} - 가맹점 관리` : '그룹을 선택하세요'}
          </h3>

          {selectedGroup ? (
            <>
              {/* 연결된 가맹점 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#34c759', marginBottom: '8px' }}>
                  ✓ 연결된 가맹점 ({assignedStores.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {assignedStores.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>
                      연결된 가맹점이 없습니다
                    </div>
                  ) : (
                    assignedStores.map(store => (
                      <div
                        key={store.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: '#e8f5e9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500 }}>{store.name}</span>
                          <span style={{ fontSize: '12px', color: '#86868b', marginLeft: '8px' }}>
                            ({store.code})
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnassignStore(store)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#fff', color: '#c62828', fontSize: '11px', cursor: 'pointer' }}
                        >
                          해제
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 미연결 가맹점 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#ff9500', marginBottom: '8px' }}>
                  ○ 미연결 가맹점 ({unassignedStores.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {unassignedStores.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '13px' }}>
                      모든 가맹점이 그룹에 연결되어 있습니다
                    </div>
                  ) : (
                    unassignedStores.map(store => (
                      <div
                        key={store.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: '#fff3e0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500 }}>{store.name}</span>
                          <span style={{ fontSize: '12px', color: '#86868b', marginLeft: '8px' }}>
                            ({store.code}) {store.ownerName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAssignStore(store)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#007aff', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                        >
                          연결
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#86868b' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
              <div>좌측에서 그룹을 선택하면<br />가맹점을 연결/해제할 수 있습니다</div>
            </div>
          )}
        </div>
      </div>

      {/* 그룹 추가/수정 모달 */}
      {showGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingGroup ? '그룹 수정' : '그룹 추가'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                그룹명 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input
                type="text"
                value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                placeholder="예: VIP 그룹"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <textarea
                value={groupForm.description}
                onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                placeholder="그룹에 대한 설명 (선택사항)"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGroupModal(false)} style={btnStyle('secondary')}>취소</button>
              <button onClick={handleSaveGroup} style={btnStyle('primary')}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="그룹 삭제"
        message={`'${deleteTarget?.name}' 그룹을 삭제하시겠습니까?\n이 그룹에 연결된 가맹점은 미연결 상태가 됩니다.`}
        confirmText="삭제"
      />
    </Layout>
  )
}
