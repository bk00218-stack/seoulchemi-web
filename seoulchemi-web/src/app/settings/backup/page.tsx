'use client'

import { useState, useRef } from 'react'
import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

export default function BackupPage() {
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [backupInfo, setBackupInfo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('백업 실패')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seoulchemi_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('백업 파일이 다운로드되었습니다.')
    } catch (error) {
      alert('백업 생성에 실패했습니다.')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.version || !data.data) {
        alert('유효하지 않은 백업 파일입니다.')
        return
      }
      
      setBackupInfo({
        filename: file.name,
        createdAt: data.createdAt,
        counts: data.counts,
        data: data
      })
    } catch (error) {
      alert('파일을 읽는데 실패했습니다.')
    }
  }

  const handleRestore = async () => {
    if (!backupInfo?.data) return
    
    if (!confirm('정말로 복원하시겠습니까?\n기존 데이터가 덮어쓰기될 수 있습니다.')) return
    
    setRestoreLoading(true)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupInfo.data)
      })
      
      const result = await res.json()
      
      if (!res.ok) throw new Error(result.error || '복원 실패')
      
      alert(`복원이 완료되었습니다.\n\n복원된 항목:\n- 그룹: ${result.restored.groups}개\n- 직원: ${result.restored.staff}개\n- 브랜드: ${result.restored.brands}개`)
      setBackupInfo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      alert(error.message || '복원에 실패했습니다.')
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#212529' }}>
          💾 백업/복원
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 백업 생성 */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📤</span> 백업 생성
            </h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
              현재 시스템의 전체 데이터를 JSON 파일로 백업합니다.<br/>
              <span style={{ fontSize: 12, color: '#999' }}>가맹점, 상품, 주문, 거래내역 등 모든 데이터가 포함됩니다.</span>
            </p>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              style={{
                padding: '12px 24px', borderRadius: 8, border: 'none',
                background: backupLoading ? '#ccc' : 'linear-gradient(135deg, #5d7a5d 0%, #4a6b4a 100%)',
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: backupLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {backupLoading ? '백업 생성중...' : '📥 백업 다운로드'}
            </button>
          </div>

          {/* 복원 */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📥</span> 복원
            </h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              백업 파일에서 데이터를 복원합니다.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #ddd', borderRadius: 8, padding: 40,
                textAlign: 'center', color: '#666', cursor: 'pointer',
                background: backupInfo ? '#f0fdf4' : '#fafafa',
                transition: 'all 0.2s'
              }}
            >
              {backupInfo ? (
                <div>
                  <div style={{ fontSize: 18, marginBottom: 12 }}>📄 {backupInfo.filename}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                    생성일: {new Date(backupInfo.createdAt).toLocaleString('ko-KR')}
                  </div>
                  {backupInfo.counts && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      {Object.entries(backupInfo.counts).map(([key, value]) => (
                        <span key={key} style={{ padding: '4px 10px', background: '#e8f5e9', borderRadius: 4, fontSize: 12 }}>
                          {key}: {String(value)}개
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  <div>백업 파일을 클릭하여 선택하세요</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>.json 파일만 지원</div>
                </div>
              )}
            </div>
            
            {backupInfo && (
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button
                  onClick={handleRestore}
                  disabled={restoreLoading}
                  style={{
                    flex: 1, padding: '12px 24px', borderRadius: 8, border: 'none',
                    background: restoreLoading ? '#ccc' : '#1565c0',
                    color: '#fff', fontWeight: 600, fontSize: 14, cursor: restoreLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {restoreLoading ? '복원중...' : '🔄 복원 시작'}
                </button>
                <button
                  onClick={() => { setBackupInfo(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  style={{
                    padding: '12px 24px', borderRadius: 8, border: '1px solid #ddd',
                    background: '#fff', color: '#666', fontSize: 14, cursor: 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            )}
          </div>

          {/* 주의사항 */}
          <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#856404' }}>⚠️ 주의사항</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#856404', lineHeight: 1.8 }}>
              <li>복원 시 기존 데이터가 덮어쓰기될 수 있습니다.</li>
              <li>복원 전 현재 데이터를 백업해두는 것을 권장합니다.</li>
              <li>백업 파일은 안전한 곳에 보관하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
