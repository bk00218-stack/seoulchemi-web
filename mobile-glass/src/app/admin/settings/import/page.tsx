'use client'

import { useState, useRef } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

type ImportType = 'stores' | 'products' | 'inventory'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('stores')
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any[]>([])
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const templates = {
    stores: {
      name: '가맹점',
      columns: ['코드', '가맹점명', '전화번호', '주소', '대표자', '신용한도'],
      sample: [
        { '코드': 'BK-001', '가맹점명': '밝은안경', '전화번호': '02-1234-5678', '주소': '서울시 강남구', '대표자': '홍길동', '신용한도': '5000000' }
      ]
    },
    products: {
      name: '상품',
      columns: ['브랜드', '상품명', '옵션타입', '상품구분', '매입가', '판매가', 'SPH', 'CYL'],
      sample: [
        { '브랜드': '케미', '상품명': '1.56 비구면', '옵션타입': '안경렌즈 여벌', '상품구분': '일반', '매입가': '10000', '판매가': '15000', 'SPH': 'Y', 'CYL': 'N' }
      ]
    },
    inventory: {
      name: '재고',
      columns: ['바코드', '재고'],
      sample: [
        { '바코드': '8801234567890', '재고': '100' }
      ]
    }
  }

  const currentTemplate = templates[importType]

  // CSV 파싱
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      data.push(row)
    }

    return data
  }

  // 파일 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    setResult(null)

    const text = await file.text()

    if (file.name.endsWith('.csv')) {
      setData(parseCSV(text))
    } else if (file.name.endsWith('.json')) {
      try {
        const json = JSON.parse(text)
        setData(Array.isArray(json) ? json : [json])
      } catch {
        alert('JSON 파일 형식이 올바르지 않습니다.')
        setData([])
      }
    } else {
      alert('CSV 또는 JSON 파일만 지원합니다.')
      setData([])
    }
  }

  // 샘플 다운로드
  const downloadSample = () => {
    const headers = currentTemplate.columns.join(',')
    const rows = currentTemplate.sample.map(row =>
      currentTemplate.columns.map(col => row[col] || '').join(',')
    ).join('\n')
    
    const csv = '\uFEFF' + headers + '\n' + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_sample.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 가져오기 실행
  const handleImport = async () => {
    if (data.length === 0) {
      alert('가져올 데이터가 없습니다.')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          data,
          options: { updateExisting }
        })
      })

      const json = await res.json()

      if (res.ok) {
        setResult({
          success: json.success,
          failed: json.failed,
          errors: json.errors || []
        })
      } else {
        alert(json.error || '가져오기에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  // 초기화
  const reset = () => {
    setFile(null)
    setData([])
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          데이터 가져오기
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          CSV 또는 JSON 파일로 데이터를 일괄 등록합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 왼쪽: 설정 */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          {/* 가져오기 유형 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
              가져오기 유형
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => {
                    setImportType(key as ImportType)
                    reset()
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: importType === key ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: importType === key ? '#fff' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* 필수 컬럼 안내 */}
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
              필수 컬럼
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {currentTemplate.columns.join(', ')}
            </div>
            <button
              onClick={downloadSample}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '13px',
                cursor: 'pointer',
                color: 'var(--primary)'
              }}
            >
              📥 샘플 파일 다운로드
            </button>
          </div>

          {/* 파일 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
              파일 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer'
              }}
            />
            {file && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                선택됨: {file.name} ({data.length}행)
              </div>
            )}
          </div>

          {/* 옵션 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={e => setUpdateExisting(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>기존 데이터 업데이트 (코드/이름 중복 시)</span>
            </label>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              초기화
            </button>
            <button
              onClick={handleImport}
              disabled={importing || data.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: importing || data.length === 0 ? 'var(--text-tertiary)' : 'var(--primary)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: importing || data.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {importing ? '가져오는 중...' : `${data.length}개 가져오기`}
            </button>
          </div>
        </div>

        {/* 오른쪽: 미리보기 & 결과 */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px' }}>
          {result ? (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                가져오기 결과
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--success-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{result.success}</div>
                  <div style={{ fontSize: '13px', color: 'var(--success)' }}>성공</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--danger-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)' }}>{result.failed}</div>
                  <div style={{ fontSize: '13px', color: 'var(--danger)' }}>실패</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>오류 목록</div>
                  {result.errors.slice(0, 50).map((error, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '4px' }}>
                      {error}
                    </div>
                  ))}
                  {result.errors.length > 50 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ... 외 {result.errors.length - 50}개
                    </div>
                  )}
                </div>
              )}
            </>
          ) : data.length > 0 ? (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                데이터 미리보기 ({data.length}행)
              </h2>
              <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)' }}>
                      {Object.keys(data[0] || {}).map(key => (
                        <th key={key} style={{ padding: '8px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 20).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                            {String(value || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 20 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    ... 외 {data.length - 20}행
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div style={{ fontSize: '14px' }}>CSV 또는 JSON 파일을 선택하세요</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
