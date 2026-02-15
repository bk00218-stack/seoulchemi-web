'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'

interface Notice {
  id: number
  title: string
  content: string | null
  type: string
  displayType: string
  imageUrl: string | null
  linkUrl: string | null
  isImportant: boolean
  isPinned: boolean
  showOnce: boolean
  startDate: string | null
  endDate: string | null
  isActive: boolean
  viewCount: number
  clickCount: number
  authorName: string | null
  createdAt: string
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  notice: { label: '공지', color: '#1565c0', bg: '#e3f2fd' },
  event: { label: '이벤트', color: '#2e7d32', bg: '#e8f5e9' },
  urgent: { label: '긴급', color: '#c62828', bg: '#ffebee' },
}

const DISPLAY_LABELS: Record<string, string> = {
  popup: '팝업',
  banner: '배너',
  both: '팝업+배너',
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // 모달
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  
  // 미리보기
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null)
  
  // 폼
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'notice',
    displayType: 'popup',
    imageUrl: '',
    linkUrl: '',
    isImportant: false,
    isPinned: false,
    showOnce: true,
    startDate: '',
    endDate: '',
    isActive: true,
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    try {
      const res = await fetch('/api/notices')
      const data = await res.json()
      setNotices(data.notices || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openModal(notice: Notice | null = null) {
    if (notice) {
      setEditingNotice(notice)
      setForm({
        title: notice.title,
        content: notice.content || '',
        type: notice.type,
        displayType: notice.displayType,
        imageUrl: notice.imageUrl || '',
        linkUrl: notice.linkUrl || '',
        isImportant: notice.isImportant,
        isPinned: notice.isPinned,
        showOnce: notice.showOnce,
        startDate: notice.startDate ? notice.startDate.split('T')[0] : '',
        endDate: notice.endDate ? notice.endDate.split('T')[0] : '',
        isActive: notice.isActive,
      })
    } else {
      setEditingNotice(null)
      setForm({
        title: '',
        content: '',
        type: 'notice',
        displayType: 'popup',
        imageUrl: '',
        linkUrl: '',
        isImportant: false,
        isPinned: false,
        showOnce: true,
        startDate: '',
        endDate: '',
        isActive: true,
      })
    }
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return }
    if (!form.imageUrl && !form.content) { alert('이미지 또는 내용을 입력해주세요.'); return }
    
    setSaving(true)
    try {
      const url = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices'
      const method = editingNotice ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          imageUrl: form.imageUrl || null,
          linkUrl: form.linkUrl || null,
          content: form.content || null,
        })
      })
      
      if (!res.ok) throw new Error()
      
      setShowModal(false)
      fetchNotices()
    } catch (e) {
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(notice: Notice) {
    if (!confirm(`'${notice.title}' 공지를 삭제하시겠습니까?`)) return
    
    try {
      await fetch(`/api/notices/${notice.id}`, { method: 'DELETE' })
      fetchNotices()
    } catch (e) {
      alert('삭제 실패')
    }
  }

  async function handleToggle(notice: Notice, field: 'isActive' | 'isPinned') {
    try {
      await fetch(`/api/notices/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !notice[field] })
      })
      fetchNotices()
    } catch (e) {
      alert('수정 실패')
    }
  }

  const filteredNotices = notices.filter(n => {
    if (filter === 'active') return n.isActive
    if (filter === 'inactive') return !n.isActive
    return true
  })

  const stats = {
    total: notices.length,
    active: notices.filter(n => n.isActive).length,
    popup: notices.filter(n => n.displayType === 'popup' || n.displayType === 'both').length,
    banner: notices.filter(n => n.displayType === 'banner' || n.displayType === 'both').length,
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>가맹점 공지사항</h2>
          <p style={{ fontSize: '13px', color: '#86868b', margin: '4px 0 0' }}>안경원 주문 사이트에 표시될 팝업/배너를 관리합니다</p>
        </div>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          + 공지 등록
        </button>
      </div>

      {/* 요약 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>전체</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600 }}>{stats.total}</span>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>활성</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600, color: '#34c759' }}>{stats.active}</span>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>🖼️ 팝업</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600, color: '#007aff' }}>{stats.popup}</span>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '13px', color: '#86868b' }}>📢 배너</span>
          <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 600, color: '#ff9500' }}>{stats.banner}</span>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
            background: filter === f ? '#007aff' : '#f5f5f7', color: filter === f ? '#fff' : '#666'
          }}>
            {f === 'all' ? '전체' : f === 'active' ? '활성' : '비활성'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>로딩 중...</div>
        ) : filteredNotices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#86868b' }}>등록된 공지사항이 없습니다</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 500 }}>공지</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '80px' }}>유형</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '80px' }}>표시</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '120px' }}>기간</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '60px' }}>조회</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, width: '200px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map(notice => {
                const typeInfo = TYPE_LABELS[notice.type] || TYPE_LABELS.notice
                return (
                  <tr key={notice.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {notice.isPinned && <span>📌</span>}
                        {notice.imageUrl && <span>🖼️</span>}
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{notice.title}</span>
                        {!notice.isActive && <span style={{ fontSize: '11px', color: '#999', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>비활성</span>}
                      </div>
                      {notice.content && <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{notice.content}</div>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: typeInfo.color, background: typeInfo.bg }}>{typeInfo.label}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>{DISPLAY_LABELS[notice.displayType]}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
                      {notice.startDate || notice.endDate ? (
                        <>{notice.startDate?.split('T')[0] || '~'} ~ {notice.endDate?.split('T')[0] || ''}</>
                      ) : '상시'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>{notice.viewCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => setPreviewNotice(notice)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>미리보기</button>
                        <button onClick={() => handleToggle(notice, 'isActive')} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', background: notice.isActive ? '#e8f5e9' : '#f5f5f7', color: notice.isActive ? '#2e7d32' : '#999', cursor: 'pointer' }}>
                          {notice.isActive ? '활성' : '비활성'}
                        </button>
                        <button onClick={() => handleToggle(notice, 'isPinned')} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', background: notice.isPinned ? '#e3f2fd' : '#f5f5f7', color: notice.isPinned ? '#1565c0' : '#999', cursor: 'pointer' }}>
                          {notice.isPinned ? '고정' : '고정'}
                        </button>
                        <button onClick={() => openModal(notice)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>수정</button>
                        <button onClick={() => handleDelete(notice)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer' }}>삭제</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{editingNotice ? '공지 수정' : '공지 등록'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 제목 */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>제목 *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="공지 제목" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>

              {/* 유형 & 표시방식 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>유형</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}>
                    <option value="notice">공지</option>
                    <option value="event">이벤트</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>표시 방식</label>
                  <select value={form.displayType} onChange={e => setForm({ ...form, displayType: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }}>
                    <option value="popup">팝업</option>
                    <option value="banner">배너</option>
                    <option value="both">팝업+배너</option>
                  </select>
                </div>
              </div>

              {/* 이미지 URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>이미지 URL</label>
                <input type="text" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" style={{ marginTop: '8px', maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #e9ecef' }} />}
              </div>

              {/* 링크 URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>클릭시 이동 URL (선택)</label>
                <input type="text" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
              </div>

              {/* 내용 */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>내용 (선택)</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="공지 내용 (이미지 없이 텍스트만 표시할 경우)" rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px', resize: 'vertical' }} />
              </div>

              {/* 기간 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>시작일 (선택)</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>종료일 (선택)</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} />
                </div>
              </div>

              {/* 옵션 */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> 활성화
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} /> 📌 상단 고정
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={form.isImportant} onChange={e => setForm({ ...form, isImportant: e.target.checked })} /> ⚠️ 중요
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={form.showOnce} onChange={e => setForm({ ...form, showOnce: e.target.checked })} /> 하루동안 안보기 옵션
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px', background: saving ? '#ccc' : '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewNotice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setPreviewNotice(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '0', maxWidth: '500px', maxHeight: '80vh', overflow: 'hidden', position: 'relative' }} onClick={e => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button onClick={() => setPreviewNotice(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', fontSize: '18px', cursor: 'pointer', zIndex: 10 }}>×</button>
            
            {previewNotice.imageUrl ? (
              <img src={previewNotice.imageUrl} alt={previewNotice.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ padding: '40px 30px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>{previewNotice.title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>{previewNotice.content}</p>
              </div>
            )}
            
            {/* 하단 옵션 */}
            {previewNotice.showOnce && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                  <input type="checkbox" /> 오늘 하루 보지 않기
                </label>
                <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#007aff', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer' }}>닫기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
