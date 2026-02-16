'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
  anchorRef?: React.RefObject<HTMLElement | null>
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default',
  anchorRef
}: ConfirmDialogProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; arrowLeft: number; arrowOnTop: boolean }>({ 
    top: 0, 
    left: 0,
    arrowLeft: 50,
    arrowOnTop: false
  })

  const updatePosition = useCallback(() => {
    if (!anchorRef?.current || !popupRef.current) return

    const anchor = anchorRef.current.getBoundingClientRect()
    const popup = popupRef.current.getBoundingClientRect()
    const padding = 12
    const arrowHeight = 10

    // 버튼 위에 위치 (스크롤 위치 반영)
    let top = anchor.top + window.scrollY - popup.height - arrowHeight
    let left = anchor.left + window.scrollX + anchor.width / 2 - popup.width / 2
    let arrowLeft = 50
    let arrowOnTop = false // 화살표가 위에 있는지 (팝업이 아래로 갈 때)

    // 화면 왼쪽 벗어나면 조정
    if (left < padding) {
      const oldLeft = left
      left = padding
      arrowLeft = ((anchor.left + anchor.width / 2 - left) / popup.width) * 100
    }

    // 화면 오른쪽 벗어나면 조정
    if (left + popup.width > window.innerWidth - padding) {
      const newLeft = window.innerWidth - popup.width - padding
      arrowLeft = ((anchor.left + anchor.width / 2 - newLeft) / popup.width) * 100
      left = newLeft
    }

    // 화면 위쪽 벗어나면 버튼 아래로
    if (anchor.top - popup.height - arrowHeight < padding) {
      top = anchor.bottom + window.scrollY + arrowHeight
      arrowOnTop = true
    }

    setPosition({ 
      top, 
      left, 
      arrowLeft: Math.max(15, Math.min(85, arrowLeft)),
      arrowOnTop 
    })
  }, [anchorRef])

  useEffect(() => {
    if (isOpen) {
      // 약간의 딜레이 후 포지션 계산 (DOM 렌더링 후)
      requestAnimationFrame(() => {
        updatePosition()
        confirmButtonRef.current?.focus()
      })
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [isOpen, updatePosition])

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

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // anchorRef 클릭은 무시
        if (anchorRef?.current?.contains(e.target as Node)) return
        onCancel()
      }
    }
    
    // 약간의 딜레이 후 이벤트 등록 (버튼 클릭 이벤트와 충돌 방지)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onCancel, anchorRef])

  if (!isOpen) return null

  // anchorRef 없으면 중앙 모달로 폴백
  if (!anchorRef?.current) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 p-5">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">
            {message}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${
                variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 반투명 백드롭 */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onCancel} />
      
      {/* 플로팅 팝업 */}
      <div
        ref={popupRef}
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* 말풍선 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px] max-w-[300px]">
          {title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">
            {message}
          </p>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors shadow-sm ${
                variant === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        
        {/* 화살표 */}
        <div 
          className={`absolute w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 ${
            position.arrowOnTop 
              ? '-top-2 border-l border-t border-gray-200 dark:border-gray-700' 
              : '-bottom-2 border-r border-b border-gray-200 dark:border-gray-700'
          }`}
          style={{ left: `${position.arrowLeft}%`, marginLeft: -8 }}
        />
      </div>
    </>
  )
}
