'use client'

import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
}

export default function ConfirmDialog({
  isOpen,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div style={{
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: 360,
        width: '100%',
        margin: '0 16px',
        padding: 24
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#111',
          marginBottom: 8
        }}>
          {title}
        </h3>
        <p style={{
          color: '#666',
          marginBottom: 24,
          whiteSpace: 'pre-line',
          lineHeight: 1.5
        }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 500,
              color: '#555',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: variant === 'danger' ? '#dc2626' : '#2563eb',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = variant === 'danger' ? '#b91c1c' : '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = variant === 'danger' ? '#dc2626' : '#2563eb'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
