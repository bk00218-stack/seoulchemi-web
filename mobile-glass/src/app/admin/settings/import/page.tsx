'use client'

import { useState, useRef } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

type ImportType = 'products' | 'inventory' | 'stores'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportType>('products')
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [mode, setMode] = useState('create')
  const [adjustMode, setAdjustMode] = useState('set')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { key: ImportType; label: string; desc: string }[] = [
    { key: 'products', label: '상품', desc: '상품 대량 등록/수정' },
    { key: 'inventory', label: '재고', desc: '재고 일괄 수정' },
    { key: 'stores', label: '가맹점', desc: '가맹점 대량 등록/수정' },
  ]

  const handleDownloadTemplate = () => {
    window.location.href = `/api/import/${activeTab}`
  }

  const handleDownloadData = () => {
    let url = `/api/export/${activeTab}`
    if (activeTab === 'products') {
      url += '?includeOptions=true'
    }
    window.location.href = url
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (activeTab === 'inventory') {
        formData.append('adjustMode', adjustMode)
      } else {
        formData.append('mode', mode)
      }

      const res = await fetch(`/api/import/${activeTab}`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setResults(data.results)
      } else {
        alert(data.error || '업로드에 실패했습니다')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('업로드에 실패했습니다')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>데이터 가져오기</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          CSV 파일로 데이터를 대량 등록하거나 내보냅니다
        </p>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setResults(null); }}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeTab === tab.key ? 'none' : '1px solid #e5e5e5',
              background: activeTab === tab.key ? '#007aff' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#1d1d1f',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 가져오기 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📥 가져오기 (업로드)
          </h2>

          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            {tabs.find(t => t.key === activeTab)?.desc}
          </p>

          {/* 모드 선택 */}
          {activeTab !== 'inventory' ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                가져오기 모드
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'create', label: '신규만', desc: '기존 데이터 건너뜀' },
                  { value: 'update', label: '수정만', desc: '기존 데이터만 수정' },
                  { value: 'upsert', label: '통합', desc: '신규 등록 + 기존 수정' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === opt.value ? '2px solid #007aff' : '1px solid #e5e5e5',
                      background: mode === opt.value ? '#f0f7ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: '#86868b' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                재고 수정 방식
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'set', label: '덮어쓰기', desc: '입력값으로 변경' },
                  { value: 'add', label: '추가', desc: '기존 재고에 더하기' },
                  { value: 'subtract', label: '차감', desc: '기존 재고에서 빼기' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAdjustMode(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: adjustMode === opt.value ? '2px solid #007aff' : '1px solid #e5e5e5',
                      background: adjustMode === opt.value ? '#f0f7ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: '#86868b' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 파일 업로드 */}
          <div style={{ marginBottom: '16px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'block',
                padding: '40px 20px',
                borderRadius: '8px',
                border: '2px dashed #e5e5e5',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? '#f9fafb' : '#fff'
              }}
            >
              {uploading ? (
                <span style={{ color: '#86868b' }}>업로드 중...</span>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontWeight: 500 }}>CSV 파일을 선택하세요</div>
                  <div style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
                    또는 여기에 파일을 드래그하세요
                  </div>
                </>
              )}
            </label>
          </div>

          {/* 템플릿 다운로드 */}
          <button
            onClick={handleDownloadTemplate}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 템플릿 다운로드
          </button>

          {/* 결과 표시 */}
          {results && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              borderRadius: '8px', 
              background: results.failed > 0 ? '#fef2f2' : '#d1fae5'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                {results.failed > 0 ? '⚠️ 가져오기 완료 (일부 오류)' : '✅ 가져오기 완료'}
              </div>
              <div style={{ fontSize: '14px' }}>
                <span style={{ color: '#10b981' }}>성공: {results.success}</span>
                {' · '}
                <span style={{ color: '#f59e0b' }}>건너뜀: {results.skipped}</span>
                {' · '}
                <span style={{ color: '#dc2626' }}>실패: {results.failed}</span>
              </div>
              {results.errors.length > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px', 
                  background: '#fff', 
                  borderRadius: '4px',
                  maxHeight: '100px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#dc2626'
                }}>
                  {results.errors.slice(0, 10).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                  {results.errors.length > 10 && (
                    <div>... 외 {results.errors.length - 10}개</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 내보내기 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📤 내보내기 (다운로드)
          </h2>

          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            현재 데이터를 CSV 파일로 내보냅니다
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleDownloadData}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: '#007aff',
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              {activeTab === 'products' && '📦 상품 목록 다운로드'}
              {activeTab === 'inventory' && '📊 재고 현황 다운로드'}
              {activeTab === 'stores' && '🏪 가맹점 목록 다운로드'}
            </button>

            {/* 추가 다운로드 옵션 */}
            {activeTab === 'stores' && (
              <button
                onClick={() => window.location.href = '/api/export/stores?type=receivables'}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💰 미수금 현황 다운로드
              </button>
            )}

            {activeTab === 'inventory' && (
              <button
                onClick={() => window.location.href = '/api/export/inventory?lowStock=true'}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⚠️ 재고 부족 상품만 다운로드
              </button>
            )}
          </div>

          {/* 바로가기 */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
              다른 내보내기
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a 
                href="/api/export/orders" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: '#fff', 
                  border: '1px solid #e5e5e5',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: '#1d1d1f'
                }}
              >
                주문 내역
              </a>
              <a 
                href="/api/export/products" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: '#fff', 
                  border: '1px solid #e5e5e5',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: '#1d1d1f'
                }}
              >
                상품 기본
              </a>
              <a 
                href="/api/export/products?includeOptions=true" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: '#fff', 
                  border: '1px solid #e5e5e5',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: '#1d1d1f'
                }}
              >
                상품 + 옵션
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
