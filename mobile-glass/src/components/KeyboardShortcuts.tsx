'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

const SHORTCUTS = [
  { key: 'g h', description: '홈/대시보드', action: 'navigate', path: '/admin' },
  { key: 'g o', description: '주문 목록', action: 'navigate', path: '/admin/orders' },
  { key: 'g n', description: '새 주문', action: 'navigate', path: '/admin/orders/new' },
  { key: 'g s', description: '가맹점', action: 'navigate', path: '/admin/stores' },
  { key: 'g p', description: '상품', action: 'navigate', path: '/admin/products' },
  { key: 'g i', description: '재고', action: 'navigate', path: '/admin/products/inventory' },
  { key: 'g r', description: '반품', action: 'navigate', path: '/admin/orders/returns' },
  { key: 'g t', description: '통계', action: 'navigate', path: '/admin/stats' },
  { key: 'g b', description: '바코드 스캔', action: 'navigate', path: '/admin/orders/scan' },
  { key: '/', description: '검색 포커스', action: 'search' },
  { key: 'd', description: '다크모드 토글', action: 'theme' },
  { key: '?', description: '단축키 도움말', action: 'help' },
  { key: 'Escape', description: '모달 닫기', action: 'close' },
]

export default function KeyboardShortcuts() {
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const [showHelp, setShowHelp] = useState(false)
  const [keyBuffer, setKeyBuffer] = useState('')

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 무시
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
        return
      }

      // Escape로 모달 닫기
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowHelp(false)
        return
      }

      // ? 도움말
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setShowHelp(prev => !prev)
        return
      }

      // d 다크모드
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleTheme()
        return
      }

      // / 검색
      if (e.key === '/') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="검색"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
        return
      }

      // g + 키 조합 (네비게이션)
      if (e.key === 'g' && !keyBuffer) {
        setKeyBuffer('g')
        timeout = setTimeout(() => setKeyBuffer(''), 1000)
        return
      }

      if (keyBuffer === 'g') {
        const combo = `g ${e.key}`
        const shortcut = SHORTCUTS.find(s => s.key === combo)
        if (shortcut && shortcut.action === 'navigate' && shortcut.path) {
          e.preventDefault()
          router.push(shortcut.path)
        }
        setKeyBuffer('')
        clearTimeout(timeout)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [keyBuffer, router, toggleTheme])

  if (!showHelp) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={() => setShowHelp(false)}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          ⌨️ 키보드 단축키
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            네비게이션
          </div>
          {SHORTCUTS.filter(s => s.action === 'navigate').map(shortcut => (
            <div
              key={shortcut.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{shortcut.description}</span>
              <kbd style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)'
              }}>
                {shortcut.key}
              </kbd>
            </div>
          ))}

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px' }}>
            기타
          </div>
          {SHORTCUTS.filter(s => s.action !== 'navigate').map(shortcut => (
            <div
              key={shortcut.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{shortcut.description}</span>
              <kbd style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)'
              }}>
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowHelp(false)}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
