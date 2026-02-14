'use client'

import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

export default function BackupPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>백업/복원</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          시스템 데이터를 백업하고 복원합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>💾 백업 생성</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
            현재 시스템의 전체 데이터를 백업합니다.
          </p>
          <button style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            백업 시작
          </button>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>📋 백업 이력</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>생성일시</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>파일명</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>크기</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  백업 이력이 없습니다
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>🔄 복원</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
            백업 파일에서 데이터를 복원합니다.
          </p>
          <div style={{
            border: '2px dashed #e9ecef',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            백업 파일을 여기에 드래그하거나 클릭하여 업로드
          </div>
        </div>
      </div>
    </Layout>
  )
}
