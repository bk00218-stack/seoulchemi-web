'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  createdAt: string
  isRead: boolean
  link?: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    
    // 30Ï¥àÎßà???¥ÎßÅ
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
    setLoading(false)
  }

  const typeColors = {
    info: { bg: '#dbeafe', text: '#1d4ed8', icon: '?πÔ∏è' },
    warning: { bg: '#fef3c7', text: '#d97706', icon: '?†Ô∏è' },
    danger: { bg: '#fee2e2', text: '#dc2626', icon: '?ö®' },
    success: { bg: '#d1fae5', text: '#059669', icon: '?? }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ?åÎ¶º Î≤ÑÌäº */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          fontSize: '20px',
          borderRadius: '8px',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        ?îî
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '18px',
            height: '18px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ?åÎ¶º ?úÎ°≠?§Ïö¥ */}
      {isOpen && (
        <>
          {/* Î∞±ÎìúÎ°?*/}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40
            }}
          />
          
          {/* ?åÎ¶º ?®ÎÑê */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '360px',
            maxHeight: '480px',
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 50,
            overflow: 'hidden'
          }}>
            {/* ?§Îçî */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>?åÎ¶º</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  style={{
                    fontSize: '13px',
                    color: '#667eea',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Ï≤òÎ¶¨ Ï§?..' : 'Î™®Îëê ?ΩÏùå'}
                </button>
              )}
            </div>

            {/* ?åÎ¶º Î™©Î°ù */}
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>?îï</div>
                  <p>?àÎ°ú???åÎ¶º???ÜÏäµ?àÎã§</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const colors = typeColors[notif.type] || typeColors.info
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (notif.link) {
                          window.location.href = notif.link
                        }
                        setIsOpen(false)
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: notif.link ? 'pointer' : 'default',
                        background: notif.isRead ? '#fff' : '#f9fafb',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (notif.link) e.currentTarget.style.background = '#f3f4f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = notif.isRead ? '#fff' : '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: colors.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {colors.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: notif.isRead ? 400 : 600,
                            color: '#1f2937',
                            marginBottom: '2px'
                          }}>
                            {notif.title}
                          </p>
                          <p style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {notif.message}
                          </p>
                          <p style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginTop: '4px'
                          }}>
                            {new Date(notif.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* ?∏ÌÑ∞ */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <a
                href="/notifications"
                style={{
                  fontSize: '13px',
                  color: '#667eea',
                  textDecoration: 'none'
                }}
              >
                ?ÑÏ≤¥ ?åÎ¶º Î≥¥Í∏∞ ??
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
