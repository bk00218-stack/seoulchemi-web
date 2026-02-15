'use client'

import { useState } from 'react'
import Layout, { cardStyle, btnStyle, inputStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

interface ShippingOption {
  id: number
  name: string
  basePrice: number
  freeThreshold: number | null
  estimatedDays: string
  isActive: boolean
}

interface ShippingZone {
  id: number
  region: string
  additionalFee: number
}

const mockShippingOptions: ShippingOption[] = [
  { id: 1, name: '기본 배송', basePrice: 3000, freeThreshold: 50000, estimatedDays: '2-3일', isActive: true },
  { id: 2, name: '빠른 배송', basePrice: 5000, freeThreshold: 100000, estimatedDays: '1-2일', isActive: true },
  { id: 3, name: '당일 배송', basePrice: 8000, freeThreshold: null, estimatedDays: '당일', isActive: false },
]

const mockZones: ShippingZone[] = [
  { id: 1, region: '제주도', additionalFee: 3000 },
  { id: 2, region: '도서산간', additionalFee: 5000 },
]

export default function ShippingPage() {
  const [options, setOptions] = useState(mockShippingOptions)
  const [zones, setZones] = useState(mockZones)
  const [saved, setSaved] = useState(false)

  const toggleOption = (id: number) => {
    setOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, isActive: !opt.isActive } : opt
    ))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="설정">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>배송 설정</h1>
          <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>
            배송비 및 배송 옵션을 설정합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ color: '#059669', fontSize: '13px' }}>✓ 저장되었습니다</span>}
          <button 
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 배송 옵션 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>🚚 배송 옵션</h3>
          <button style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#007aff',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer'
          }}>
            + 옵션 추가
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>배송 옵션</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>기본 배송비</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>무료배송 기준</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>예상 소요일</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>사용</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {options.map(option => (
              <tr key={option.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{option.name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                  {option.basePrice.toLocaleString()}원
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                  {option.freeThreshold ? `${option.freeThreshold.toLocaleString()}원 이상` : '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center' }}>
                  {option.estimatedDays}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={option.isActive}
                      onChange={() => toggleOption(option.id)}
                      style={{ width: 18, height: 18, accentColor: '#007aff' }}
                    />
                  </label>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    background: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 지역별 추가 배송비 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>📍 지역별 추가 배송비</h3>
          <button style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            background: '#fff',
            fontSize: '13px',
            cursor: 'pointer'
          }}>
            + 지역 추가
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>지역</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>추가 배송비</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(zone => (
              <tr key={zone.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{zone.region}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>
                  +{zone.additionalFee.toLocaleString()}원
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      background: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>수정</button>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fee2e2',
                      background: '#fff',
                      fontSize: '12px',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 배송 정책 설정 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>⚙️ 배송 정책</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              기본 배송 방법
            </label>
            <select style={{ ...inputStyle, width: '200px' }}>
              <option value="1">기본 배송</option>
              <option value="2">빠른 배송</option>
              <option value="3">당일 배송</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>묶음 배송 허용</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#007aff' }} />
              <span style={{ fontSize: '14px' }}>배송 추적 제공</span>
            </label>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              배송 안내 문구
            </label>
            <textarea 
              style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
              defaultValue="주문 후 2-3일 이내 배송됩니다. 도서산간 지역은 추가 배송비가 부과될 수 있습니다."
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}
