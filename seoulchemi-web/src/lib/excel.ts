// 간단한 CSV 기반 엑셀 다운로드 유틸리티
// 실제 xlsx 파일이 필요하면 xlsx 라이브러리 설치 필요

export interface ExcelColumn {
  key: string
  label: string
  format?: (value: any) => string
}

export function downloadExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string
) {
  // BOM for UTF-8
  const BOM = '\uFEFF'
  
  // 헤더 행
  const headers = columns.map(col => `"${col.label}"`).join(',')
  
  // 데이터 행
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      const formatted = col.format ? col.format(value) : value
      // 쉼표, 따옴표, 줄바꿈이 있으면 따옴표로 감싸기
      const strValue = String(formatted ?? '')
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  })
  
  const csv = BOM + [headers, ...rows].join('\n')
  
  // 다운로드
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 날짜 포맷팅
export function formatDate(date: string | Date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 금액 포맷팅
export function formatMoney(value: number) {
  return value?.toLocaleString() ?? '0'
}
