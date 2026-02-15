'use client'

import Layout from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

export default function DataPage() {
  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>데이터 관리</h1>
        <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
          시스템 데이터를 관리합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>📦 데이터 내보내기</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
            상품, 거래처, 주문 데이터를 엑셀 파일로 내보냅니다.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#fff',
              cursor: 'pointer'
            }}>
              상품 데이터
            </button>
            <button style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#fff',
              cursor: 'pointer'
            }}>
              거래처 데이터
            </button>
            <button style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#fff',
              cursor: 'pointer'
            }}>
              주문 데이터
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>📥 데이터 가져오기</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
            엑셀 파일에서 데이터를 가져옵니다.
          </p>
          <div style={{
            border: '2px dashed #e9ecef',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            파일을 여기에 드래그하거나 클릭하여 업로드
          </div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#dc2626' }}>⚠️ 데이터 초기화</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
            주의: 이 작업은 되돌릴 수 없습니다.
          </p>
          <button style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#fee2e2',
            color: '#dc2626',
            cursor: 'pointer'
          }}>
            데이터 초기화
          </button>
        </div>
      </div>
    </Layout>
  )
}
