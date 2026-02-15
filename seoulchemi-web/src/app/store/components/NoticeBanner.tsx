'use client'

import { useState, useEffect } from 'react'

interface Notice {
  id: number
  title: string
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  type: string
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  notice: { bg: '#e3f2fd', color: '#1565c0' },
  event: { bg: '#e8f5e9', color: '#2e7d32' },
  urgent: { bg: '#ffebee', color: '#c62828' },
}

export default function NoticeBanner() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  // 자동 슬라이드 (여러 개일 때)
  useEffect(() => {
    if (notices.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % notices.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [notices.length])

  async function fetchNotices() {
    try {
      const res = await fetch('/api/notices?active=true&displayType=banner')
      const data = await res.json()
      setNotices(data.notices || [])
    } catch (e) {
      console.error(e)
    }
  }

  function handleClick() {
    const notice = notices[currentIndex]
    if (notice?.linkUrl) {
      window.open(notice.linkUrl, '_blank')
    }
  }

  if (!isVisible || notices.length === 0) return null

  const notice = notices[currentIndex]
  const colors = TYPE_COLORS[notice.type] || TYPE_COLORS.notice

  return (
    <div style={{
      background: colors.bg,
      borderRadius: '12px',
      padding: '12px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: notice.linkUrl ? 'pointer' : 'default',
      position: 'relative',
    }} onClick={handleClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '20px' }}>
          {notice.type === 'urgent' ? '🚨' : notice.type === 'event' ? '🎉' : '📢'}
        </span>
        <div>
          <span style={{ fontWeight: 600, color: colors.color, fontSize: '14px' }}>{notice.title}</span>
          {notice.content && (
            <span style={{ marginLeft: '12px', color: '#666', fontSize: '13px' }}>
              {notice.content.length > 50 ? notice.content.slice(0, 50) + '...' : notice.content}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {notices.length > 1 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {notices.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  background: idx === currentIndex ? colors.color : '#ccc',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(false) }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#999',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '8px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
