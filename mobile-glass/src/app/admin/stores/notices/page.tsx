'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'

interface Notice {
  id: number
  title: string
  content: string
  author: string
  targetGroups: string[]
  isPinned: boolean
  viewCount: number
  createdAt: string
}

const sampleData: Notice[] = [
  { id: 1, title: '2024년 1월 배송 일정 안내', content: '설 연휴 기간 배송 일정을 안내드립니다...', author: '관리자', targetGroups: ['전체'], isPinned: true, viewCount: 156, createdAt: '2024-01-15' },
  { id: 2, title: '신상품 출시 안내 - 에실로 크리잘 뉴', content: '에실로 크리잘 뉴 라인이 출시되었습니다...', author: '관리자', targetGroups: ['A그룹', 'B그룹'], isPinned: true, viewCount: 98, createdAt: '2024-01-12' },
  { id: 3, title: '가격 정책 변경 안내', content: '2024년 2월부터 일부 상품의 가격이 조정됩니다...', author: '관리자', targetGroups: ['전체'], isPinned: false, viewCount: 234, createdAt: '2024-01-10' },
  { id: 4, title: '시스템 점검 안내', content: '1월 20일 새벽 2시-6시 시스템 점검...', author: '관리자', targetGroups: ['전체'], isPinned: false, viewCount: 67, createdAt: '2024-01-08' },
  { id: 5, title: 'A그룹 할인 이벤트', content: 'A그룹 가맹점 대상 특별 할인 이벤트...', author: '관리자', targetGroups: ['A그룹'], isPinned: false, viewCount: 45, createdAt: '2024-01-05' },
]

export default function NoticesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  const columns: Column<Notice>[] = [
    { key: 'isPinned', label: '', width: '30px', render: (v) => (
      v ? <span style={{ color: '#ff9500' }}>📌</span> : null
    )},
    { key: 'title', label: '제목', render: (v, row) => (
      <div>
        <span style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => { setEditingNotice(row); setShowModal(true); }}>
          {v as string}
        </span>
        {row.isPinned && (
          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fff3e0', color: '#ff9500', padding: '1px 6px', borderRadius: '4px' }}>
            고정
          </span>
        )}
      </div>
    )},
    { key: 'targetGroups', label: '대상', render: (v) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(v as string[]).map((group, idx) => (
          <span key={idx} style={{ 
            background: group === '전체' ? '#e3f2fd' : '#f5f5f7',
            color: group === '전체' ? '#007aff' : '#666',
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '11px' 
          }}>
            {group}
          </span>
        ))}
      </div>
    )},
    { key: 'author', label: '작성자', render: (v) => (
      <span style={{ color: '#666' }}>{v as string}</span>
    )},
    { key: 'viewCount', label: '조회', align: 'center', render: (v) => (
      <span style={{ color: '#86868b' }}>{v as number}</span>
    )},
    { key: 'createdAt', label: '작성일', render: (v) => (
      <span style={{ color: '#86868b', fontSize: '12px' }}>{v as string}</span>
    )},
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => { setEditingNotice(row); setShowModal(true); }}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#f5f5f7',
            color: '#007aff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          수정
        </button>
        <button
          onClick={() => alert('삭제하시겠습니까?')}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#ffebee',
            color: '#ff3b30',
            border: 'none',
            fontSize: '12px',
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
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 공지</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{sampleData.length}개</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>고정 공지</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff9500' }}>
            {sampleData.filter(n => n.isPinned).length}개
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 조회수</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>
            {sampleData.reduce((sum, n) => sum + n.viewCount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="제목, 내용 검색"
        filters={[
          { label: '대상 그룹', key: 'group', options: [
            { label: '전체', value: 'all' },
            { label: 'A그룹', value: 'A' },
            { label: 'B그룹', value: 'B' },
            { label: 'C그룹', value: 'C' },
          ]}
        ]}
        actions={
          <button
            onClick={() => { setEditingNotice(null); setShowModal(true); }}
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
            + 공지 작성
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="공지사항이 없습니다"
      />

      {/* 작성/수정 모달 */}
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
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingNotice ? '공지사항 수정' : '공지사항 작성'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>제목 *</label>
              <input type="text" defaultValue={editingNotice?.title} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>내용 *</label>
              <textarea defaultValue={editingNotice?.content} rows={8} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>대상 그룹</label>
                <select defaultValue={editingNotice?.targetGroups[0]} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="전체">전체</option>
                  <option value="A그룹">A그룹</option>
                  <option value="B그룹">B그룹</option>
                  <option value="C그룹">C그룹</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={editingNotice?.isPinned} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px' }}>상단 고정</span>
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { alert('저장되었습니다.'); setShowModal(false); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
