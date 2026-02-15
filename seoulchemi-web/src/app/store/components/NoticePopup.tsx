'use client'

import { useState, useEffect } from 'react'

interface Notice {
  id: number
  title: string
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  showOnce: boolean
}

export default function NoticePopup() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    try {
      const res = await fetch('/api/notices?active=true&displayType=popup')
      const data = await res.json()
      
      // 하루동안 안보기 체크
      const hidden = JSON.parse(localStorage.getItem('hidden-notices') || '{}')
      const today = new Date().toDateString()
      
      const visibleNotices = (data.notices || []).filter((n: Notice) => {
        if (n.showOnce && hidden[n.id] === today) return false
        return true
      })
      
      setNotices(visibleNotices)
    } catch (e) {
      console.error(e)
    }
  }

  function handleClose() {
    if (currentIndex < notices.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setNotices([])
    }
  }

  function handleHideToday() {
    const notice = notices[currentIndex]
    if (notice) {
      const hidden = JSON.parse(localStorage.getItem('hidden-notices') || '{}')
      hidden[notice.id] = new Date().toDateString()
      localStorage.setItem('hidden-notices', JSON.stringify(hidden))
    }
    handleClose()
  }

  function handleClick() {
    const notice = notices[currentIndex]
    if (notice?.linkUrl) {
      window.open(notice.linkUrl, '_blank')
    }
  }

  if (notices.length === 0) return null

  const notice = notices[currentIndex]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        maxWidth: '480px',
        maxHeight: '80vh',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* 내용 */}
        <div onClick={handleClick} style={{ cursor: notice.linkUrl ? 'pointer' : 'default' }}>
          {notice.imageUrl ? (
            <img src={notice.imageUrl} alt={notice.title} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ padding: '40px 30px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: '#1d1d1f' }}>{notice.title}</h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>{notice.content}</p>
            </div>
          )}
        </div>

        {/* 하단 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
        }}>
          {notice.showOnce ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
              <input type="checkbox" onChange={handleHideToday} style={{ cursor: 'pointer' }} />
              오늘 하루 보지 않기
            </label>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notices.length > 1 && (
              <span style={{ fontSize: '12px', color: '#86868b' }}>{currentIndex + 1} / {notices.length}</span>
            )}
            <button
              onClick={handleClose}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: '#007aff',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {currentIndex < notices.length - 1 ? '다음' : '닫기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
