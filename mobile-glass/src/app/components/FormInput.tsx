'use client'

import { useState } from 'react'

interface FormInputProps {
  label: string
  name: string
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'date' | 'textarea' | 'select'
  value: string | number
  onChange: (name: string, value: string | number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { label: string; value: string | number }[]
  rows?: number
  error?: string
  hint?: string
  prefix?: string
  suffix?: string
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 4,
  error,
  hint,
  prefix,
  suffix
}: FormInputProps) {
  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: error ? '1px solid #ff3b30' : '1px solid var(--border-color)',
    fontSize: '14px',
    outline: 'none',
    background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    transition: 'border-color 0.2s'
  }

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={{ ...baseInputStyle, resize: 'vertical' }}
        />
      )
    }

    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
          style={{ ...baseInputStyle, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <option value="">{placeholder || '선택하세요'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    const input = (
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...baseInputStyle,
          paddingLeft: prefix ? '36px' : '12px',
          paddingRight: suffix ? '36px' : '12px'
        }}
      />
    )

    if (prefix || suffix) {
      return (
        <div style={{ position: 'relative' }}>
          {prefix && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                fontSize: '14px'
              }}
            >
              {prefix}
            </span>
          )}
          {input}
          {suffix && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                fontSize: '14px'
              }}
            >
              {suffix}
            </span>
          )}
        </div>
      )
    }

    return input
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)'
        }}
      >
        {label}
        {required && <span style={{ color: '#ff3b30', marginLeft: '4px' }}>*</span>}
      </label>
      {renderInput()}
      {error && (
        <div style={{ marginTop: '4px', fontSize: '12px', color: '#ff3b30' }}>{error}</div>
      )}
      {hint && !error && (
        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{hint}</div>
      )}
    </div>
  )
}

// 폼 섹션
export function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px'
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

// 폼 그리드 (2열 레이아웃)
export function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
      }}
    >
      {children}
    </div>
  )
}

// 폼 액션 버튼 영역
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        marginTop: '8px'
      }}
    >
      {children}
    </div>
  )
}

// 취소 버튼
export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: 'none',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
      }}
    >
      취소
    </button>
  )
}

// 저장 버튼
export function SaveButton({
  onClick,
  disabled = false,
  label = '저장'
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 24px',
        borderRadius: '8px',
        background: disabled ? 'var(--gray-300)' : '#007aff',
        color: disabled ? 'var(--text-tertiary)' : '#fff',
        border: 'none',
        fontSize: '14px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {label}
    </button>
  )
}
