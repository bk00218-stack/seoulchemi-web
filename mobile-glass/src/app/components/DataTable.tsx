'use client'

import { useState } from 'react'

export interface Column<T> {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[] | Column<any>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  selectable?: boolean
  selectedIds?: Set<number | string>
  onSelectionChange?: (ids: Set<number | string>) => void
  idKey?: string
  onRowClick?: (row: T) => void
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = '?∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§',
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  idKey = 'id',
  onRowClick
}: DataTableProps<T>) {
  const allIds = data.map(row => row[idKey] as number | string)
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(allIds))
    }
  }

  const toggleSelectRow = (id: number | string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    onSelectionChange?.(newSelected)
  }

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {selectable && (
              <th style={{ padding: '12px 14px', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 14px',
                  textAlign: col.align || 'left',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: col.width
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}
              >
                Î°úÎî©Ï§?..
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowId = row[idKey] as number | string
              const isSelected = selectedIds.has(rowId)
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? '#f0f7ff' : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default'
                  }}
                >
                  {selectable && (
                    <td style={{ padding: '12px 14px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelectRow(rowId)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 14px',
                        textAlign: col.align || 'left',
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row, idx)
                        : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ?ÅÌÉú Î±ÉÏ? Ïª¥Ìè¨?åÌä∏
export function StatusBadge({ status, statusMap }: { 
  status: string
  statusMap?: Record<string, { bg: string; color: string; label: string }>
}) {
  const defaultMap: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fff3e0', color: '#ff9500', label: '?ÄÍ∏? },
    confirmed: { bg: '#eef4ee', color: '#007aff', label: '?ïÏù∏' },
    shipped: { bg: '#e8f5e9', color: '#34c759', label: 'Ï∂úÍ≥†' },
    delivered: { bg: '#f3e5f5', color: '#af52de', label: '?ÑÎ£å' },
    cancelled: { bg: '#ffebee', color: '#ff3b30', label: 'Ï∑®ÏÜå' },
    active: { bg: '#e8f5e9', color: '#34c759', label: '?úÏÑ±' },
    inactive: { bg: '#f5f5f5', color: 'var(--text-tertiary)', label: 'ÎπÑÌôú?? }
  }
  const map = statusMap || defaultMap
  const s = map[status] || { bg: 'var(--bg-secondary)', color: 'var(--text-tertiary)', label: status }

  return (
    <span
      style={{
        padding: '3px 8px',
        borderRadius: '4px',
        background: s.bg,
        color: s.color,
        fontSize: '11px',
        fontWeight: 500,
        whiteSpace: 'nowrap'
      }}
    >
      {s.label}
    </span>
  )
}
