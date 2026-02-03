'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter from '../../../components/SearchFilter'

interface Notice {
  id: number
  title: string
  content: string
  type: string
  isImportant: boolean
  isPinned: boolean
  viewCount: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

interface Stats {
  total: number
  notice: number
  event: number
  urgent: number
  pinned: number
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, notice: 0, event: 0, urgent: 0, pinned: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notice',
    isImportant: false,
    isPinned: false,
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [typeFilter])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter) params.append('type', typeFilter)
      
      const res = await fetch(`/api/notices?${params}`)
      const data = await res.json()
      setNotices(data.notices || [])
      setStats(data.stats || { total: 0, notice: 0, event: 0, urgent: 0, pinned: 0 })
    } catch (error) {
      console.error('Failed to load notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (notice: Notice | null) => {
    if (notice) {
      setFormData({
        title: notice.title,
        content: notice.content,
        type: notice.type,
        isImportant: notice.isImportant,
        isPinned: notice.isPinned,
        isActive: notice.isActive
      })
      setEditingNotice(notice)
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'notice',
        isImportant: false,
        isPinned: false,
        isActive: true
      })
      setEditingNotice(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      const url = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices'
      const method = editingNotice ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowModal(false)
        loadData()
      }
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    
    try {
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      alert('삭제에 실패했습니다.')
    }
  }

  const togglePin = async (notice: Notice) => {
    try {
      await fetch(`/api/notices/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !notice.isPinned })
      })
      loadData()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const columns: Column<Notice>[] = [
    { key: 'isPinned', label: '', width: '40px', render: (v) => (
      v ? <span title="고정됨">📌</span> : null
    )},
    { key: 'type', label: '구분', width: '80px', render: (v) => {
      const types: Record<string, { bg: string; color: string; label: string }> = {
        notice: { bg: '#e3f2fd', color: '#1565c0', label: '공지' },
        event: { bg: '#e8f5e9', color: '#2e7d32', label: '이벤트' },
        urgent: { bg: '#ffebee', color: '#c62828', label: '긴급' }
      }
      const style = types[v as string] || types.notice
      return (
        <span style={{ 
          background: style.bg, 
          color: style.color, 
          padding: '3px 8px', 
          borderRadius: '4px', 
          fontSize: '11px',
          fontWeight: 500
        }}>
          {style.label}
        </span>
      )
    }},
    { key: 'title', label: '제목', render: (v, row) => (
      <div>
        {row.isImportant && <span style={{ color: '#ff3b30', marginRight: '4px' }}>⚠️</span>}
        <span style={{ fontWeight: 500 }}>{v as string}</span>
      </div>
    )},
    { key: 'viewCount', label: '조회', width: '60px', align: 'center', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as number}</span>
    )},
    { key: 'createdAt', label: '등록일', width: '100px', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>
        {new Date(v as string).toLocaleDateString('ko-KR')}
      </span>
    )},
    { key: 'isActive', label: '상태', width: '70px', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: '관리', width: '140px', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => togglePin(row)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: row.isPinned ? '#fff3e0' : '#f5f5f7',
            color: row.isPinned ? '#ff9500' : '#666',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {row.isPinned ? '고정해제' : '고정'}
        </button>
        <button
          onClick={() => openEditModal(row)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: '#f5f5f7',
            color: '#007aff',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          수정
        </button>
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: '#fff0f0',
            color: '#ff3b30',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          삭제
        </button>
      </div>
    )},
  ]

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        가맹점 공지사항
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>전체</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{stats.total}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>공지</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1565c0' }}>{stats.notice}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>이벤트</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#2e7d32' }}>{stats.event}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>긴급</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#c62828' }}>{stats.urgent}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>고정</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>{stats.pinned}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>건</span></div>
        </div>
      </div>

      <SearchFilter
        placeholder="제목, 내용 검색"
        value={search}
        onChange={setSearch}
        onSearch={() => { setLoading(true); loadData(); }}
        filters={[
          {
            key: 'type',
            label: '구분',
            options: [
              { label: '전체', value: '' },
              { label: '공지', value: 'notice' },
              { label: '이벤트', value: 'event' },
              { label: '긴급', value: 'urgent' }
            ],
            value: typeFilter,
            onChange: setTypeFilter
          }
        ]}
        actions={
          <button
            onClick={() => openEditModal(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 공지 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={notices}
        loading={loading}
        emptyMessage="등록된 공지사항이 없습니다"
      />

      {/* 등록/수정 모달 */}
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
            width: '560px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingNotice ? '공지사항 수정' : '공지사항 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>제목 *</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>구분</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}
                >
                  <option value="notice">공지</option>
                  <option value="event">이벤트</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isImportant}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>중요</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>상단 고정</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>활성</span>
                </label>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>내용 *</label>
              <textarea 
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', resize: 'vertical' }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
