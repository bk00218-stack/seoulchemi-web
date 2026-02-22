'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle, inputStyle, btnStyle } from '../../components/Layout'
import { SETTINGS_SIDEBAR } from '../../constants/sidebar'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TintColor {
  key: string
  label: string
  hex: string
}

type BrandKey = 'hoya' | 'essilor' | 'chemiglas' | 'daemyung' | 'etc'

const TINT_BRANDS: { key: BrandKey; label: string }[] = [
  { key: 'hoya',      label: '호야' },
  { key: 'essilor',   label: '에실로' },
  { key: 'chemiglas', label: '케미그라스' },
  { key: 'daemyung',  label: '대명' },
  { key: 'etc',       label: '기타' },
]

const DEFAULT_COLORS: TintColor[] = [
  { key: 'gray',   label: '그레이',  hex: '#8b8b8b' },
  { key: 'brown',  label: '브라운',  hex: '#a0522d' },
  { key: 'green',  label: '그린',    hex: '#2e8b57' },
  { key: 'blue',   label: '블루',    hex: '#4169e1' },
  { key: 'pink',   label: '핑크',    hex: '#e75480' },
  { key: 'yellow', label: '옐로우',  hex: '#daa520' },
  { key: 'orange', label: '오렌지',  hex: '#e8740c' },
  { key: 'purple', label: '퍼플',    hex: '#8a2be2' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function TintColorsPage() {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = useState<BrandKey>('hoya')
  const [colorsByBrand, setColorsByBrand] = useState<Record<BrandKey, TintColor[]>>({
    hoya: [], essilor: [], chemiglas: [], daemyung: [], etc: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 새 색상 추가 폼
  const [newLabel, setNewLabel] = useState('')
  const [newHex, setNewHex] = useState('#6b7280')

  // ─── Load ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/admin/settings?group=tint.colors')
      .then(r => r.json())
      .then(data => {
        const settings: Record<string, string> = {}
        ;(data.settings || []).forEach((s: { key: string; value: string }) => {
          settings[s.key] = s.value
        })

        const result = { ...colorsByBrand }
        let hasAny = false
        for (const brand of TINT_BRANDS) {
          const raw = settings[`tint.colors.${brand.key}`]
          if (raw) {
            try {
              result[brand.key] = JSON.parse(raw)
              hasAny = true
            } catch { /* skip */ }
          }
        }

        if (!hasAny) {
          // 초기 데이터 세팅
          for (const brand of TINT_BRANDS) {
            result[brand.key] = [...DEFAULT_COLORS]
          }
        }
        setColorsByBrand(result)
      })
      .catch(() => {
        // fallback
        const result = { ...colorsByBrand }
        for (const brand of TINT_BRANDS) {
          result[brand.key] = [...DEFAULT_COLORS]
        }
        setColorsByBrand(result)
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const settings: Record<string, string> = {}
      for (const brand of TINT_BRANDS) {
        settings[`tint.colors.${brand.key}`] = JSON.stringify(colorsByBrand[brand.key])
      }
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) toast.success('저장 완료')
      else toast.error('저장 실패')
    } catch {
      toast.error('오류가 발생했습니다.')
    }
    setSaving(false)
  }

  // ─── Handlers ──────────────────────────────────────────────────────────

  const addColor = () => {
    const label = newLabel.trim()
    if (!label) { toast.warning('색상 이름을 입력해주세요.'); return }
    const key = label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    setColorsByBrand(prev => ({
      ...prev,
      [activeBrand]: [...prev[activeBrand], { key, label, hex: newHex }],
    }))
    setNewLabel('')
    setNewHex('#6b7280')
  }

  const removeColor = (key: string) => {
    setColorsByBrand(prev => ({
      ...prev,
      [activeBrand]: prev[activeBrand].filter(c => c.key !== key),
    }))
  }

  const updateColor = (key: string, field: 'label' | 'hex', value: string) => {
    setColorsByBrand(prev => ({
      ...prev,
      [activeBrand]: prev[activeBrand].map(c =>
        c.key === key ? { ...c, [field]: value } : c
      ),
    }))
  }

  const moveColor = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    const list = [...colorsByBrand[activeBrand]]
    if (newIndex < 0 || newIndex >= list.length) return
    ;[list[index], list[newIndex]] = [list[newIndex], list[index]]
    setColorsByBrand(prev => ({ ...prev, [activeBrand]: list }))
  }

  const copyToAll = () => {
    const source = colorsByBrand[activeBrand]
    const result = { ...colorsByBrand }
    for (const brand of TINT_BRANDS) {
      if (brand.key !== activeBrand) {
        result[brand.key] = source.map(c => ({ ...c }))
      }
    }
    setColorsByBrand(result)
    toast.success(`${TINT_BRANDS.find(b => b.key === activeBrand)?.label} 색상을 전체에 복사했습니다.`)
  }

  const activeColors = colorsByBrand[activeBrand]

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Layout sidebarMenus={SETTINGS_SIDEBAR} activeNav="settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>착색 색상 관리</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>브랜드별 착색 색상을 관리합니다</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...btnStyle,
            background: saving ? '#9ca3af' : '#2563eb',
            color: '#fff',
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '전체 저장'}
        </button>
      </div>

      {loading ? (
        <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: '#6b7280' }}>
          로딩 중...
        </div>
      ) : (
        <>
          {/* 브랜드 탭 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {TINT_BRANDS.map(brand => (
              <button
                key={brand.key}
                onClick={() => setActiveBrand(brand.key)}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: activeBrand === brand.key ? 700 : 500,
                  background: activeBrand === brand.key ? '#1e40af' : '#f3f4f6',
                  color: activeBrand === brand.key ? '#fff' : '#374151',
                  border: activeBrand === brand.key ? '1px solid #1e40af' : '1px solid #e5e7eb',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {brand.label}
                <span style={{
                  marginLeft: 6,
                  fontSize: 12,
                  opacity: 0.7,
                }}>
                  ({colorsByBrand[brand.key].length})
                </span>
              </button>
            ))}
          </div>

          {/* 색상 목록 */}
          <div style={{ ...cardStyle, padding: 0 }}>
            {/* 헤더 */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {TINT_BRANDS.find(b => b.key === activeBrand)?.label} 색상 목록
              </span>
              <button
                onClick={copyToAll}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                전체 브랜드에 복사
              </button>
            </div>

            {/* 색상 리스트 */}
            <div style={{ padding: 16 }}>
              {activeColors.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                  등록된 색상이 없습니다. 아래에서 추가해주세요.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeColors.map((color, i) => (
                    <div
                      key={color.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 12px',
                        background: '#f9fafb',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {/* 순서 버튼 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button
                          onClick={() => moveColor(i, -1)}
                          disabled={i === 0}
                          style={{
                            padding: '0 4px', fontSize: 10, cursor: i === 0 ? 'default' : 'pointer',
                            background: 'transparent', border: 'none', color: i === 0 ? '#d1d5db' : '#6b7280',
                          }}
                        >▲</button>
                        <button
                          onClick={() => moveColor(i, 1)}
                          disabled={i === activeColors.length - 1}
                          style={{
                            padding: '0 4px', fontSize: 10,
                            cursor: i === activeColors.length - 1 ? 'default' : 'pointer',
                            background: 'transparent', border: 'none',
                            color: i === activeColors.length - 1 ? '#d1d5db' : '#6b7280',
                          }}
                        >▼</button>
                      </div>

                      {/* 색상 미리보기 */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: color.hex,
                        border: '2px solid #e5e7eb',
                        flexShrink: 0,
                      }} />

                      {/* 색상 코드 입력 */}
                      <input
                        type="color"
                        value={color.hex}
                        onChange={e => updateColor(color.key, 'hex', e.target.value)}
                        style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
                      />

                      {/* 이름 */}
                      <input
                        value={color.label}
                        onChange={e => updateColor(color.key, 'label', e.target.value)}
                        style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 13 }}
                      />

                      {/* HEX 코드 표시 */}
                      <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', width: 70 }}>
                        {color.hex}
                      </span>

                      {/* 삭제 */}
                      <button
                        onClick={() => removeColor(color.key)}
                        style={{
                          padding: '4px 8px', fontSize: 12,
                          background: '#fee2e2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 색상 추가 */}
              <div style={{
                marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <input
                  type="color"
                  value={newHex}
                  onChange={e => setNewHex(e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
                />
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addColor() }}
                  placeholder="색상 이름 (예: 그레이)"
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{newHex}</span>
                <button
                  onClick={addColor}
                  style={{
                    ...btnStyle,
                    background: '#2563eb',
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: 13,
                  }}
                >
                  + 추가
                </button>
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              미리보기 - {TINT_BRANDS.find(b => b.key === activeBrand)?.label}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {activeColors.map(color => (
                <div
                  key={color.key}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: color.hex,
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }} />
                  <span style={{ fontSize: 11, color: '#374151' }}>{color.label}</span>
                </div>
              ))}
              {activeColors.length === 0 && (
                <span style={{ color: '#9ca3af', fontSize: 13 }}>색상이 없습니다</span>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
