'use client'

import { useState, useEffect } from 'react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: string
  confirmText?: string  // 사용자가 입력해야 할 텍스트
  loading?: boolean
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = '삭제 확인',
  message,
  confirmText = '삭제',
  loading = false,
}: ConfirmDeleteModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setIsProcessing(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, isProcessing])

  const isConfirmEnabled = inputValue === confirmText

  const handleConfirm = async () => {
    if (!isConfirmEnabled || isProcessing) return
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#ffebee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚠️
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1f', margin: 0 }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <p style={{ fontSize: '14px', color: '#424245', lineHeight: 1.6, marginBottom: '20px' }}>
          {message}
        </p>

        {/* Warning Box */}
        <div
          style={{
            background: '#fff8e6',
            border: '1px solid #ffd666',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#946200', margin: 0, fontWeight: 500 }}>
            ⚠️ 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        {/* Confirmation Input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              color: '#86868b',
              marginBottom: '8px',
            }}
          >
            확인을 위해 <strong style={{ color: '#ff3b30' }}>"{confirmText}"</strong>를 입력하세요
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmText}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${inputValue === confirmText ? '#34c759' : inputValue ? '#ff9500' : '#e9ecef'}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmEnabled) handleConfirm()
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: isConfirmEnabled ? '#ff3b30' : '#f5f5f5',
              color: isConfirmEnabled ? '#fff' : '#c5c5c7',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isConfirmEnabled && !isProcessing ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {isProcessing ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
