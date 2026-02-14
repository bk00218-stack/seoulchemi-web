'use client'

import { useState } from 'react'

interface ExcelExportProps {
  endpoint: string
  filename: string
  label?: string
  params?: Record<string, string>
}

export default function ExcelExport({ endpoint, filename, label = '?‘ì? ?¤ìš´ë¡œë“œ', params = {} }: ExcelExportProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const queryString = new URLSearchParams({ ...params, format: 'csv' }).toString()
      const res = await fetch(`${endpoint}?${queryString}`)
      
      if (!res.ok) {
        throw new Error('?¤ìš´ë¡œë“œ ?¤íŒ¨')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('?¤ìš´ë¡œë“œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #10b981',
        background: 'var(--bg-primary)',
        color: '#10b981',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '16px' }}>{loading ? '?? : '?“¥'}</span>
      {loading ? '?¤ìš´ë¡œë“œ ì¤?..' : label}
    </button>
  )
}

// ?Œì´ë¸??°ì´?°ë? CSVë¡?ë³€?˜í•˜??? í‹¸
export function exportToCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string) {
  // BOM for Korean support
  const BOM = '\uFEFF'
  
  // Header
  const header = columns.map(col => col.label).join(',')
  
  // Rows
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      const strValue = String(value)
      // Escape quotes and wrap in quotes if contains comma
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  )

  const csv = BOM + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ?´ë¼?´ì–¸???¬ì´???‘ì? ?´ë³´?´ê¸° ë²„íŠ¼
export function ExcelExportButton({ 
  data, 
  columns, 
  filename, 
  label = '?‘ì? ?¤ìš´ë¡œë“œ' 
}: { 
  data: Record<string, unknown>[]
  columns: { key: string; label: string }[]
  filename: string
  label?: string 
}) {
  const handleExport = () => {
    if (data.length === 0) {
      alert('?´ë³´???°ì´?°ê? ?†ìŠµ?ˆë‹¤.')
      return
    }
    exportToCSV(data, columns, filename)
  }

  return (
    <button
      onClick={handleExport}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #10b981',
        background: 'var(--bg-primary)',
        color: '#10b981',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '16px' }}>?“¥</span>
      {label}
    </button>
  )
}
