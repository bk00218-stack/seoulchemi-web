'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout, { cardStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

// 목업 데이터
const mockSettings = [
  { id: 1, brand: '다비치', productLine: '단초점 1.60', minStock: 3, maxStock: 10, reorderPoint: 5, currentAvg: 4.2, status: 'ok' },
  { id: 2, brand: '다비치', productLine: '단초점 1.67', minStock: 2, maxStock: 8, reorderPoint: 4, currentAvg: 2.8, status: 'warning' },
  { id: 3, brand: '에실로', productLine: '누진 1.60', minStock: 2, maxStock: 6, reorderPoint: 3, currentAvg: 5.1, status: 'ok' },
  { id: 4, brand: '에실로', productLine: '누진 1.67', minStock: 1, maxStock: 4, reorderPoint: 2, currentAvg: 0.8, status: 'critical' },
  { id: 5, brand: '호야', productLine: '단초점 1.60', minStock: 2, maxStock: 8, reorderPoint: 4, currentAvg: 6.3, status: 'ok' },
  { id: 6, brand: '호야', productLine: '누진 1.67', minStock: 1, maxStock: 5, reorderPoint: 2, currentAvg: 1.2, status: 'warning' },
  { id: 7, brand: '자이스', productLine: '중근용 1.60', minStock: 1, maxStock: 4, reorderPoint: 2, currentAvg: 3.5, status: 'ok' },
]

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 14,
  outline: 'none',
  width: 60,
  textAlign: 'center' as const,
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export default function OptimalStockPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState(mockSettings)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const filteredSettings = settings.filter(s =>
    s.brand.toLowerCase().includes(search.toLowerCase()) ||
    s.productLine.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: settings.length,
    ok: settings.filter(s => s.status === 'ok').length,
    warning: settings.filter(s => s.status === 'warning').length,
    critical: settings.filter(s => s.status === 'critical').length,
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ok': return { bg: '#e8f5e9', color: '#34c759', label: '적정' }
      case 'warning': return { bg: '#fff3e0', color: '#ff9500', label: '주의' }
      case 'critical': return { bg: '#ffebee', color: '#ff3b30', label: '위험' }
      default: return { bg: 'var(--gray-100)', color: 'var(--gray-500)', label: '-' }
    }
  }

  const handleValueChange = (id: number, field: 'minStock' | 'maxStock' | 'reorderPoint', value: number) => {
    setSettings(settings.map(s => s.id === id ? { ...s, [field]: value } : s))
    setHasChanges(true)
  }

  const handleSave = () => {
    toast.success('적정 재고 설정이 저장되었습니다.')
    setHasChanges(false)
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>적정 재고 설정</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          품목별 최소/최대 재고 수량과 재주문 시점을 설정합니다. 재고 알림에 활용됩니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>전체 품목</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#34c759', fontSize: 13, marginBottom: 4 }}>적정 재고</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{stats.ok}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#ff9500', fontSize: 13, marginBottom: 4 }}>재고 주의</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>{stats.warning}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#ff3b30', fontSize: 13, marginBottom: 4 }}>재고 위험</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff3b30' }}>{stats.critical}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
      </div>

      {/* 도움말 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, background: '#f0f8ff', border: '1px solid #007aff20' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
            <strong>최소 재고</strong>: 이 수량 이하가 되면 &apos;위험&apos; 알림이 발생합니다.<br/>
            <strong>재주문점</strong>: 이 수량 이하가 되면 &apos;주의&apos; 알림과 함께 발주를 권장합니다.<br/>
            <strong>최대 재고</strong>: 과잉 재고를 방지하기 위한 권장 최대 수량입니다.
          </div>
        </div>
      </div>

      {/* 필터 및 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 브랜드, 품목 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 280, textAlign: 'left' as const }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ ...btnStyle, background: 'var(--gray-100)', color: '#1d1d1f' }}
          >
            + 품목 추가
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              style={{ ...btnStyle, background: '#34c759', color: '#fff' }}
            >
              변경사항 저장
            </button>
          )}
        </div>
      </div>

      {/* 설정 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>브랜드</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>품목</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>최소</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(위험)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>재주문점</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(주의)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>최대</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(권장)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>현재 평균</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredSettings.map(setting => {
              const statusStyle = getStatusStyle(setting.status)
              return (
                <tr key={setting.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                      {setting.brand}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{setting.productLine}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={setting.minStock}
                      onChange={e => handleValueChange(setting.id, 'minStock', parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, borderColor: '#ff3b30' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={setting.reorderPoint}
                      onChange={e => handleValueChange(setting.id, 'reorderPoint', parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, borderColor: '#ff9500' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={setting.maxStock}
                      onChange={e => handleValueChange(setting.id, 'maxStock', parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, borderColor: '#34c759' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 500 }}>
                    {setting.currentAvg.toFixed(1)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 품목 추가 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            width: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, margin: '0 0 24px' }}>품목별 적정 재고 추가</h3>
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', background: 'var(--gray-50)', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
              <p style={{ margin: 0 }}>품목 추가 기능 준비중입니다.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...btnStyle, background: 'var(--gray-100)', color: '#1d1d1f' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
