'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

interface Backup {
  filename: string
  size: number
  createdAt: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup')
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      if (res.ok) {
        fetchBackups()
        alert('백업이 생성되었습니다!')
      } else {
        const data = await res.json()
        alert(data.error || '백업 생성에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm('이 백업을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/backup?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchBackups()
      } else {
        alert('백업 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.')
    }
  }

  const downloadBackup = (filename: string) => {
    window.open(`/api/backup/download?filename=${encodeURIComponent(filename)}`, '_blank')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>백업 관리</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            데이터베이스 백업을 관리합니다. 최근 10개 백업만 유지됩니다.
          </p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: creating ? 'var(--text-tertiary)' : 'var(--primary)',
            color: '#fff',
            fontWeight: 500,
            cursor: creating ? 'not-allowed' : 'pointer'
          }}
        >
          {creating ? '생성 중...' : '💾 새 백업 생성'}
        </button>
      </div>

      {/* 자동 백업 설정 */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>자동 백업 설정</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            <span style={{ color: 'var(--text-primary)' }}>매일 자동 백업</span>
          </label>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            매일 새벽 3시에 자동으로 백업됩니다.
          </span>
        </div>
      </div>

      {/* 백업 목록 */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            백업 목록 ({backups.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</div>
        ) : backups.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>백업이 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>파일명</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>크기</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>생성일</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup, idx) => (
                <tr key={backup.filename} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: 500 }}>{backup.filename}</div>
                    {idx === 0 && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: 'var(--success-light)',
                        color: 'var(--success)'
                      }}>
                        최신
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{formatSize(backup.size)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                    {new Date(backup.createdAt).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => downloadBackup(backup.filename)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.filename)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--danger-light)',
                        background: 'var(--bg-primary)',
                        color: 'var(--danger)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
