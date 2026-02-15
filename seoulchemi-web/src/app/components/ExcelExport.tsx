'use client'

import { useState } from 'react'

interface ExcelExportProps {
  endpoint: string
  filename: string
  label?: string
  params?: Record<string, string>
}

export default function ExcelExport({ endpoint, filename, label = '엑셀 다운로드', params = {} }: ExcelExportProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const queryString = new URLSearchParams({ ...params, format: 'csv' }).toString()
      const res = await fetch(`${endpoint}?${queryString}`)
      
      if (!res.ok) {
        throw new Error('다운로드 실패')
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
      alert('다운로드에 실패했습니다.')
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
        background: '#fff',
        color: '#10b981',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '16px' }}>{loading ? '⏳' : '📥'}</span>
      {loading ? '다운로드 중...' : label}
    </button>
  )
}

// 테이블 데이터를 CSV로 변환하는 유틸
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

// 클라이언트 사이드 엑셀 내보내기 버튼
export function ExcelExportButton({ 
  data, 
  columns, 
  filename, 
  label = '엑셀 다운로드' 
}: { 
  data: Record<string, unknown>[]
  columns: { key: string; label: string }[]
  filename: string
  label?: string 
}) {
  const handleExport = () => {
    if (data.length === 0) {
      alert('내보낼 데이터가 없습니다.')
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
        background: '#fff',
        color: '#10b981',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '16px' }}>📥</span>
      {label}
    </button>
  )
}
