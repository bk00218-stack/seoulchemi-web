'use client'

import { useState } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

interface Notice {
  id: number
  title: string
  content: string
  category: 'general' | 'promotion' | 'important' | 'system'
  isPinned: boolean
  isPublished: boolean
  targetGroups: number[] | null  // null이면 전체 대상
  viewCount: number
  createdAt: string
  updatedAt: string
  authorName: string
}

const CATEGORY_LABELS = {
  general: { label: '일반', color: '#2196f3', bg: '#e3f2fd' },
  promotion: { label: '프로모션', color: '#4caf50', bg: '#e8f5e9' },
  important: { label: '중요', color: '#f44336', bg: '#ffebee' },
  system: { label: '시스템', color: '#9e9e9e', bg: '#f5f5f5' },
}

// 목업 데이터
const MOCK_NOTICES: Notice[] = [
  {
    id: 1,
    title: '2024년 설 연휴 배송 안내',
    content: '2024년 설 연휴 기간 동안 배송이 지연될 수 있습니다.\n\n배송 마감: 2월 8일 오전\n배송 재개: 2월 13일\n\n양해 부탁드립니다.',
    category: 'important',
    isPinned: true,
    isPublished: true,
    targetGroups: null,
    viewCount: 342,
    createdAt: '2024-01-25T09:00:00',
    updatedAt: '2024-01-25T09:00:00',
    authorName: '관리자',
  },
  {
    id: 2,
    title: 'VIP 그룹 특별 할인 안내',
    content: 'VIP 그룹 가맹점 대상 특별 프로모션을 진행합니다.\n\n- 기간: 2024.02.01 ~ 2024.02.29\n- 대상: VIP 그룹\n- 혜택: 추가 5% 할인',
    category: 'promotion',
    isPinned: false,
    isPublished: true,
    targetGroups: [1],
    viewCount: 128,
    createdAt: '2024-01-20T14:30:00',
    updatedAt: '2024-01-22T10:15:00',
    authorName: '영업팀',
  },
  {
    id: 3,
    title: '신규 렌즈 라인업 출시 안내',
    content: 'HOYA 신규 렌즈 라인업이 출시되었습니다.\n\n상품 목록 페이지에서 확인해주세요.',
    category: 'general',
    isPinned: false,
    isPublished: true,
    targetGroups: null,
    viewCount: 256,
    createdAt: '2024-01-15T11:00:00',
    updatedAt: '2024-01-15T11:00:00',
    authorName: '상품팀',
  },
  {
    id: 4,
    title: '시스템 정기 점검 안내 (초안)',
    content: '2024년 2월 1일 오전 2시~6시 시스템 점검이 예정되어 있습니다.',
    category: 'system',
    isPinned: false,
    isPublished: false,
    targetGroups: null,
    viewCount: 0,
    createdAt: '2024-01-28T16:00:00',
    updatedAt: '2024-01-28T16:00:00',
    authorName: '시스템팀',
  },
]

const MOCK_GROUPS = [
  { id: 1, name: 'VIP 그룹' },
  { id: 2, name: '일반 그룹' },
  { id: 3, name: '신규 그룹' },
  { id: 4, name: '지방 그룹' },
]

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as Notice['category'],
    isPinned: false,
    isPublished: true,
    targetGroups: null as number[] | null,
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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

  const handleOpenModal = (notice: Notice | null = null) => {
    if (notice) {
      setEditingNotice(notice)
      setFormData({
        title: notice.title,
        content: notice.content,
        category: notice.category,
        isPinned: notice.isPinned,
        isPublished: notice.isPublished,
        targetGroups: notice.targetGroups,
      })
    } else {
      setEditingNotice(null)
      setFormData({
        title: '',
        content: '',
        category: 'general',
        isPinned: false,
        isPublished: true,
        targetGroups: null,
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    setSaving(true)

    setTimeout(() => {
      const now = new Date().toISOString()
      
      if (editingNotice) {
        setNotices(notices.map(n => 
          n.id === editingNotice.id 
            ? { 
                ...n, 
                ...formData,
                updatedAt: now,
              }
            : n
        ))
        alert('공지사항이 수정되었습니다.')
      } else {
        const newNotice: Notice = {
          id: Math.max(...notices.map(n => n.id)) + 1,
          ...formData,
          viewCount: 0,
          createdAt: now,
          updatedAt: now,
          authorName: '관리자',
        }
        setNotices([newNotice, ...notices])
        alert('공지사항이 등록되었습니다.')
      }
      
      setSaving(false)
      setShowModal(false)
    }, 500)
  }

  const handleDelete = (notice: Notice) => {
    setDeleteTarget(notice)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setNotices(notices.filter(n => n.id !== deleteTarget.id))
    }
    setDeleteModalOpen(false)
  }

  const handleTogglePin = (notice: Notice) => {
    setNotices(notices.map(n => 
      n.id === notice.id ? { ...n, isPinned: !n.isPinned } : n
    ))
  }

  const handleTogglePublish = (notice: Notice) => {
    setNotices(notices.map(n => 
      n.id === notice.id ? { ...n, isPublished: !n.isPublished } : n
    ))
  }

  const filteredNotices = notices.filter(n => {
    if (filter === 'published') return n.isPublished
    if (filter === 'draft') return !n.isPublished
    return true
  }).sort((a, b) => {
    // 고정 먼저, 그 다음 날짜순
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const stats = {
    total: notices.length,
    published: notices.filter(n => n.isPublished).length,
    draft: notices.filter(n => !n.isPublished).length,
    pinned: notices.filter(n => n.isPinned).length,
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>가맹점 공지사항</h2>
        <button onClick={() => handleOpenModal()} style={btnStyle('primary')}>
          + 공지 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📢</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>전체 공지</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.total}</div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>게시됨</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34c759' }}>{stats.published}</div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📝</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>초안</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff9500' }}>{stats.draft}</div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📌</span>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px' }}>고정</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#007aff' }}>{stats.pinned}</div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[
          { label: `전체 (${stats.total})`, value: 'all' },
          { label: `게시됨 (${stats.published})`, value: 'published' },
          { label: `초안 (${stats.draft})`, value: 'draft' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value as typeof filter)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: filter === opt.value ? '#007aff' : '#f5f5f7',
              color: filter === opt.value ? '#fff' : '#666'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 공지 목록 */}
      <div style={cardStyle}>
        {filteredNotices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>
            {filter === 'draft' ? '초안이 없습니다' : '등록된 공지사항이 없습니다'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNotices.map(notice => {
              const categoryInfo = CATEGORY_LABELS[notice.category]
              const isExpanded = expandedId === notice.id
              
              return (
                <div
                  key={notice.id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: notice.isPinned ? '2px solid #007aff' : '1px solid #e9ecef',
                    background: notice.isPinned ? '#f0f7ff' : notice.isPublished ? '#fff' : '#fafafa',
                  }}
                >
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {notice.isPinned && <span style={{ fontSize: '14px' }}>📌</span>}
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          fontWeight: 500,
                          color: categoryInfo.color,
                          background: categoryInfo.bg,
                        }}>
                          {categoryInfo.label}
                        </span>
                        {!notice.isPublished && (
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#ff9500',
                            background: '#fff3e0',
                          }}>
                            초안
                          </span>
                        )}
                        {notice.targetGroups && (
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            color: '#666',
                            background: '#f0f0f0',
                          }}>
                            {MOCK_GROUPS.filter(g => notice.targetGroups?.includes(g.id)).map(g => g.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                        {notice.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>
                        {notice.authorName} · {new Date(notice.createdAt).toLocaleDateString('ko-KR')} · 조회 {notice.viewCount}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePin(notice)}
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          border: '1px solid #e9ecef', 
                          background: notice.isPinned ? '#007aff' : '#fff', 
                          color: notice.isPinned ? '#fff' : '#666',
                          fontSize: '11px', 
                          cursor: 'pointer' 
                        }}
                      >
                        {notice.isPinned ? '고정 해제' : '고정'}
                      </button>
                      <button
                        onClick={() => handleTogglePublish(notice)}
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          border: '1px solid #e9ecef', 
                          background: notice.isPublished ? '#fff' : '#34c759', 
                          color: notice.isPublished ? '#666' : '#fff',
                          fontSize: '11px', 
                          cursor: 'pointer' 
                        }}
                      >
                        {notice.isPublished ? '숨김' : '게시'}
                      </button>
                      <button
                        onClick={() => handleOpenModal(notice)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(notice)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ffebee', color: '#c62828', fontSize: '11px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  
                  {/* 확장된 내용 */}
                  {isExpanded && (
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #e9ecef',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#333',
                    }}>
                      {notice.content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 공지 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingNotice ? '공지 수정' : '공지 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                제목 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                placeholder="공지 제목을 입력하세요"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>분류</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as Notice['category'] })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="general">일반</option>
                  <option value="promotion">프로모션</option>
                  <option value="important">중요</option>
                  <option value="system">시스템</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>대상 그룹</label>
                <select
                  value={formData.targetGroups ? formData.targetGroups.join(',') : ''}
                  onChange={e => {
                    const value = e.target.value
                    setFormData({ 
                      ...formData, 
                      targetGroups: value ? value.split(',').map(Number) : null 
                    })
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}
                >
                  <option value="">전체 가맹점</option>
                  {MOCK_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                내용 <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px', minHeight: '200px', resize: 'vertical', lineHeight: 1.6 }}
                placeholder="공지 내용을 입력하세요"
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                />
                <span style={{ fontSize: '14px' }}>📌 상단 고정</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <span style={{ fontSize: '14px' }}>✅ 즉시 게시</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btnStyle('secondary')}>취소</button>
              <button onClick={handleSave} disabled={saving} style={btnStyle('primary')}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="공지사항 삭제"
        message={`'${deleteTarget?.title}' 공지를 삭제하시겠습니까?`}
        confirmText="삭제"
      />
    </Layout>
  )
}
