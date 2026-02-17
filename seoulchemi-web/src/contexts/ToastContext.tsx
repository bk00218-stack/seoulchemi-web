'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 4000),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 420,
          pointerEvents: 'none',
        }}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; color: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', icon: '✓', color: '#15803d' },
  error: { bg: '#fef2f2', border: '#ef4444', icon: '✕', color: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '!', color: '#d97706' },
  info: { bg: '#eff6ff', border: '#3b82f6', icon: 'i', color: '#2563eb' },
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = TOAST_STYLES[toast.type]

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'toastSlideIn 0.25s ease-out',
        pointerEvents: 'auto',
        minWidth: 280,
      }}
    >
      {/* Icon */}
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: style.border,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        marginTop: 1,
      }}>
        {style.icon}
      </span>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: 13,
        lineHeight: '1.5',
        color: style.color,
        fontWeight: 500,
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
      }}>
        {toast.message}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          color: '#9ca3af',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // 폴백: Context 외부에서 호출 시 console로 대체
    return {
      toast: {
        success: (msg) => console.log('[toast:success]', msg),
        error: (msg) => console.error('[toast:error]', msg),
        warning: (msg) => console.warn('[toast:warning]', msg),
        info: (msg) => console.log('[toast:info]', msg),
      }
    }
  }
  return ctx
}
