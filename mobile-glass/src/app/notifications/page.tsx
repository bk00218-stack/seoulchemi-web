'use client'

import { useState, useEffect } from 'react'
import Layout, { cardStyle, btnStyle } from '../components/Layout'
import { SETTINGS_SIDEBAR } from '../constants/sidebar'

interface Notification {
  id: string | number
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  createdAt: string
  link?: string
  isRead?: boolean
}

interface NotificationData {
  notifications: Notification[]
  systemAlerts: Notification[]
  unreadCount: number
}

const typeConfig = {
  info: { icon: 'ℹ️', bg: '#dbeafe', color: '#2563eb' },
  warning: { icon: '⚠️', bg: '#fef3c7', color: '#d97706' },
  danger: { icon: '🚨', bg: '#fee2e2', color: '#dc2626' },
  success: { icon: '✅', bg: '#d1fae5', color: '#059669' },
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationData>({ notifications: [], systemAlerts: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all read:', error)
    }
  }

  // 모든 알림 합치기
  const allNotifications = [...(data.systemAlerts || []), ...(data.notifications || [])]
  const filteredNotifications = filter === 'unread' 
    ? allNotifications.filter(n => !n.isRead)
    : allNotifications

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🔔 알림</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            시스템 알림 및 주요 업데이트
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            style={{
              ...btnStyle,
              background: filter === 'unread' ? '#5d7a5d' : '#fff',
              color: filter === 'unread' ? '#fff' : '#374151',
              border: filter === 'unread' ? 'none' : '1px solid #e5e7eb'
            }}
          >
            {filter === 'unread' ? '읽지 않은 알림만' : '전체 보기'}
          </button>
          {data.unreadCount > 0 && (
            <button onClick={markAllRead} style={btnStyle}>
              ✓ 모두 읽음
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {data.unreadCount > 0 && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: '#fef3c7',
          color: '#d97706',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ⚠️ 읽지 않은 알림 {data.unreadCount}건
        </div>
      )}

      {/* Notifications List */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            로딩 중...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification, idx) => {
              const config = typeConfig[notification.type] || typeConfig.info
              const isUnread = notification.isRead === false

              return (
                <a
                  key={notification.id}
                  href={notification.link || '#'}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: 20,
                    borderBottom: idx < filteredNotifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: isUnread ? '#f9fafb' : '#fff',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.2s'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: config.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0
                  }}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{notification.title}</span>
                      {isUnread && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#3b82f6'
                        }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
                      {notification.message}
                    </p>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                      {new Date(notification.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>

                  {/* Arrow */}
                  {notification.link && (
                    <span style={{ color: '#9ca3af', fontSize: 18 }}>→</span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* 알림 설정 */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>⚙️ 알림 설정</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: '새 주문 알림', desc: '새로운 주문이 들어오면 알림', checked: true },
            { label: '재고 부족 알림', desc: '재고가 0개인 상품 발생 시 알림', checked: true },
            { label: '미결제 알림', desc: '미결제 금액 발생 시 알림', checked: false },
          ].map((item, i) => (
            <label key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none',
              cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{item.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.checked}
                style={{ width: 20, height: 20, accentColor: '#5d7a5d' }}
              />
            </label>
          ))}
        </div>
      </div>
    </Layout>
  )
}
