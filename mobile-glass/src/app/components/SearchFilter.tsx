'use client'

import { useState } from 'react'

interface FilterOption {
  label: string
  value: string
}

interface SearchFilterProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value?: string) => void
  filters?: {
    label: string
    key: string
    options: FilterOption[]
    value?: string
    onChange?: (value: string) => void
  }[]
  dateRange?: boolean
  onDateChange?: (start: string, end: string) => void
  actions?: React.ReactNode
}

export default function SearchFilter({
  placeholder = '검색어를 입력하세요',
  value: controlledValue,
  onChange: controlledOnChange,
  onSearch,
  filters = [],
  dateRange = false,
  onDateChange,
  actions
}: SearchFilterProps) {
  const [internalValue, setInternalValue] = useState('')
  const searchValue = controlledValue ?? internalValue
  const setSearchValue = controlledOnChange ?? setInternalValue
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSearch = () => {
    onSearch?.(searchValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value)
      onDateChange?.(value, endDate)
    } else {
      setEndDate(value)
      onDateChange?.(startDate, value)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 검색 입력 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              fontSize: '14px',
              width: '200px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            검색
          </button>
        </div>

        {/* 필터 드롭다운 */}
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filter.value || ''}
            onChange={(e) => filter.onChange?.(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              fontSize: '14px',
              background: '#fff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* 날짜 범위 */}
        {dateRange && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <span style={{ color: '#86868b' }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 영역 */}
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  )
}

// 필터 버튼 그룹
export function FilterButtonGroup({
  options,
  value,
  onChange
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px',
            borderRadius: '16px',
            background: value === opt.value ? '#1d1d1f' : 'transparent',
            color: value === opt.value ? '#fff' : '#1d1d1f',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// 아웃라인 버튼
export function OutlineButton({
  onClick,
  children,
  disabled = false
}: {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        background: '#fff',
        color: disabled ? '#c5c5c7' : '#1d1d1f',
        border: '1px solid #e5e5e5',
        fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  )
}

// 프라이머리 버튼
export function PrimaryButton({
  onClick,
  children,
  disabled = false,
  color = '#007aff'
}: {
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  color?: string
}) {
  return (
    <button
      onClick={onClick ? onClick : undefined}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        background: disabled ? '#e5e5e5' : color,
        color: disabled ? '#86868b' : '#fff',
        border: 'none',
        fontSize: '13px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  )
}
