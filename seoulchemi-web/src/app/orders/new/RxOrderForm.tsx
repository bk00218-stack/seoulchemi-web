'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/contexts/ToastContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number
  name: string
  brandId: number
  brand: string
  productLine?: { id: number; name: string } | null
  optionType?: string | null
  refractiveIndex?: string | null
  sellingPrice: number
}

interface Store { id: number; name: string }

interface RxOrderFormProps {
  orderType: '착색' | 'RX'
  products: Product[]
  selectedBrandId: number | null
  selectedStore?: Store | null
  onOrderSubmitted?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CORRIDOR_OPTIONS = ['11mm', '12mm', '13mm', '14mm', '17mm', '18mm']

const TINT_COLORS = [
  { key: 'none',   label: '없음',    bg: 'linear-gradient(45deg,#fff 45%,#e5e7eb 45%,#e5e7eb 55%,#fff 55%)', border: '#e5e7eb' },
  { key: 'gray',   label: '그레이',  bg: 'linear-gradient(180deg,#9ca3af,#6b7280)' },
  { key: 'brown',  label: '브라운',  bg: 'linear-gradient(180deg,#d97706,#92400e)' },
  { key: 'green',  label: '그린',    bg: 'linear-gradient(180deg,#22c55e,#15803d)' },
  { key: 'blue',   label: '블루',    bg: 'linear-gradient(180deg,#3b82f6,#1d4ed8)' },
  { key: 'pink',   label: '핑크',    bg: 'linear-gradient(180deg,#ec4899,#be185d)' },
  { key: 'yellow', label: '옐로우',  bg: 'linear-gradient(180deg,#fbbf24,#d97706)' },
  { key: 'orange', label: '오렌지',  bg: 'linear-gradient(180deg,#f97316,#c2410c)' },
  { key: 'purple', label: '퍼플',    bg: 'linear-gradient(180deg,#a855f7,#7c3aed)' },
]

const COATING_OPTIONS = [
  { key: 'ar',          label: '반사방지(AR)' },
  { key: 'bluelight',   label: '블루라이트'   },
  { key: 'photochromic',label: '변색'          },
  { key: 'scratch',     label: '스크래치방지' },
  { key: 'uv',          label: 'UV'            },
  { key: 'hydrophobic', label: '발수'          },
  { key: 'oleophobic',  label: '발유'          },
]

const PRISM_OPTIONS = Array.from({ length: 16 }, (_, i) => ((i + 1) * 0.5).toFixed(1))
const BASE_OPTIONS  = ['BU', 'BD', 'BI', 'BO']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSph(v: string): string {
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}
function fmtCyl(v: string): string {
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n.toFixed(2)
}

const emptyRx = { sph: '', cyl: '', axis: '', add: '', curve: '', pd: '', prism: '', base: '' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function RxOrderForm({
  orderType,
  products,
  selectedBrandId: initBrand,
  selectedStore,
  onOrderSubmitted,
}: RxOrderFormProps) {
  const { toast } = useToast()

  // ── Cascade state
  const [cBrand, setCBrand] = useState<number | ''>(initBrand ?? '')
  const [cLine,  setCLine]  = useState<number | ''>('')
  const [cType,  setCType]  = useState('')
  const [cIdx,   setCIdx]   = useState('')
  const [cCorr,  setCCorr]  = useState('')

  // ── Prescription
  const [rxR, setRxR] = useState({ ...emptyRx })
  const [rxL, setRxL] = useState({ ...emptyRx })

  // ── Tint
  const [tintColor,    setTintColor]    = useState('none')
  const [tintDensity,  setTintDensity]  = useState(0)
  const [tintGradient, setTintGradient] = useState(false)

  // ── Coating
  const [coatings, setCoatings] = useState<string[]>([])

  // ── Fitting
  const [fw, setFw] = useState('')
  const [fb, setFb] = useState('')
  const [fd, setFd] = useState('')
  const [fh, setFh] = useState('')

  // ── Misc
  const [customerName, setCustomerName] = useState('')
  const [memo,         setMemo]         = useState('')
  const [loading,      setLoading]      = useState(false)

  // ─── Cascade Derivations ──────────────────────────────────────────────────

  const brands = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach(p => { if (!map.has(p.brandId)) map.set(p.brandId, p.brand) })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [products])

  const lines = useMemo(() => {
    if (!cBrand) return []
    const map = new Map<number, string>()
    products
      .filter(p => p.brandId === cBrand && p.productLine)
      .forEach(p => { if (p.productLine) map.set(p.productLine.id, p.productLine.name) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products, cBrand])

  const types = useMemo(() => {
    if (!cBrand) return []
    let fp = products.filter(p => p.brandId === cBrand)
    if (cLine !== '') fp = fp.filter(p => p.productLine?.id === cLine)
    const set = new Set<string>()
    fp.forEach(p => { if (p.optionType) set.add(p.optionType) })
    return Array.from(set)
  }, [products, cBrand, cLine])

  const indices = useMemo(() => {
    if (!cBrand) return []
    let fp = products.filter(p => p.brandId === cBrand)
    if (cLine !== '') fp = fp.filter(p => p.productLine?.id === cLine)
    if (cType)        fp = fp.filter(p => p.optionType === cType)
    const set = new Set<string>()
    fp.forEach(p => { if (p.refractiveIndex) set.add(p.refractiveIndex) })
    return Array.from(set).sort()
  }, [products, cBrand, cLine, cType])

  const matched = useMemo((): Product | null => {
    if (!cBrand || !cIdx) return null
    let fp = products.filter(p => p.brandId === cBrand && p.refractiveIndex === cIdx)
    if (cLine !== '') fp = fp.filter(p => p.productLine?.id === cLine)
    if (cType)        fp = fp.filter(p => p.optionType === cType)
    return fp[0] ?? null
  }, [products, cBrand, cLine, cType, cIdx])

  const needsCorridor = cType === '누진다초점'
  const fpd = fw && fb ? String(parseFloat(fw) + parseFloat(fb)) : ''

  const badge = useMemo(() => {
    if (!cBrand || !cIdx) return ''
    const bn  = brands.find(b => b.id === cBrand)?.name ?? ''
    const ln  = lines.find(l => l.id === cLine)?.name ?? ''
    const cor = needsCorridor && cCorr ? ` / ${cCorr}` : ''
    return [bn, ln, cType, cIdx].filter(Boolean).join(' / ') + cor
  }, [cBrand, cIdx, brands, lines, cLine, cType, needsCorridor, cCorr])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const setRx = (side: 'R' | 'L', f: string, v: string) => {
    if (side === 'R') setRxR(p => ({ ...p, [f]: v }))
    else              setRxL(p => ({ ...p, [f]: v }))
  }
  const blurRx = (side: 'R' | 'L', f: string, v: string) => {
    if      (f === 'sph')                setRx(side, f, fmtSph(v))
    else if (f === 'cyl' || f === 'add') setRx(side, f, fmtCyl(v))
  }

  const toggleCoating = (k: string) =>
    setCoatings(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  const reset = () => {
    setCBrand(''); setCLine(''); setCType(''); setCIdx(''); setCCorr('')
    setRxR({ ...emptyRx }); setRxL({ ...emptyRx })
    setTintColor('none'); setTintDensity(0); setTintGradient(false)
    setCoatings([])
    setFw(''); setFb(''); setFd(''); setFh('')
    setCustomerName(''); setMemo('')
  }

  const handleSubmit = async () => {
    if (!selectedStore) { toast.warning('가맹점을 먼저 선택해주세요.'); return }
    if (!matched)       { toast.warning('렌즈를 선택해주세요.');         return }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.id,
          orderType,
          memo,
          customerName,
          rxData: {
            productId: matched.id,
            corridor: cCorr,
            rxR, rxL,
            tint: orderType === '착색'
              ? { color: tintColor, density: tintDensity, gradient: tintGradient }
              : null,
            coatings,
            fitting: { fw, fb, fpd, fd, fh },
          },
          items: [{
            productId: matched.id,
            quantity: 1,
            sph:  rxR.sph  || '+0.00',
            cyl:  rxR.cyl  || '0.00',
            axis: rxR.axis || '0',
          }],
        }),
      })
      if (res.ok) {
        toast.success('주문 접수 완료! ✅')
        reset()
        onOrderSubmitted?.()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || '주문 생성 실패')
      }
    } catch {
      toast.error('오류가 발생했습니다.')
    }
    setLoading(false)
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const G  = '#5d7a5d'
  const GL = '#4a6b4a'

  const selStyle: React.CSSProperties = {
    width: '100%', padding: '5px 8px', fontSize: 12,
    border: '1px solid #d1d5db', borderRadius: 4,
    background: '#fff', color: '#111', outline: 'none', cursor: 'pointer',
  }
  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '3px 4px', fontSize: 12,
    border: 'none', background: 'transparent',
    textAlign: 'center', outline: 'none', color: '#111',
  }
  const secHead: React.CSSProperties = {
    background: '#f4f6f8', borderBottom: '1px solid #dde1e7',
    padding: '5px 12px', fontSize: 11, fontWeight: 600, color: G,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }
  const secBody: React.CSSProperties = { padding: '10px 12px' }
  const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    marginBottom: 3, display: 'block',
  }
  const rxTh: React.CSSProperties = {
    background: '#f4f6f8', border: '1px solid #dde1e7',
    padding: '4px 5px', fontSize: 10, fontWeight: 600,
    textAlign: 'center', color: '#374151', whiteSpace: 'nowrap',
  }
  const rxTd: React.CSSProperties = {
    border: '1px solid #dde1e7', padding: '2px', textAlign: 'center',
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', border: '1px solid #c5dbc5',
      borderRadius: 8, overflow: 'hidden',
    }}>

      {/* ── 헤더 */}
      <div style={{
        padding: '8px 14px',
        background: `linear-gradient(135deg, ${G} 0%, ${GL} 100%)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
          {orderType} 주문
        </span>
        {badge && (
          <span style={{
            fontSize: 11, background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px', borderRadius: 3,
            color: '#fff', fontWeight: 600, maxWidth: '70%',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{badge}</span>
        )}
      </div>

      {/* ── 스크롤 바디 */}
      <div style={{ flex: 1, overflowY: 'auto', fontSize: 12 }}>

        {/* ① 렌즈 선택 cascade */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={secHead}>
            <span>🔍 렌즈 선택</span>
          </div>
          <div style={{
            ...secBody,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}>
            {/* 브랜드 */}
            <div>
              <label style={labelSt}>브랜드</label>
              <select style={selStyle} value={cBrand}
                onChange={e => {
                  const v = e.target.value ? parseInt(e.target.value) : '' as const
                  setCBrand(v); setCLine(''); setCType(''); setCIdx(''); setCCorr('')
                }}>
                <option value="">선택</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* 상품(라인) */}
            <div>
              <label style={labelSt}>상품</label>
              <select style={{ ...selStyle, color: !cBrand ? '#9ca3af' : '#111' }}
                value={cLine} disabled={!cBrand || lines.length === 0}
                onChange={e => {
                  const v = e.target.value ? parseInt(e.target.value) : '' as const
                  setCLine(v); setCType(''); setCIdx(''); setCCorr('')
                }}>
                <option value="">{lines.length === 0 ? '-' : '선택'}</option>
                {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* 품목 */}
            <div>
              <label style={labelSt}>품목</label>
              <select style={{ ...selStyle, color: !cBrand ? '#9ca3af' : '#111' }}
                value={cType} disabled={!cBrand}
                onChange={e => { setCType(e.target.value); setCIdx(''); setCCorr('') }}>
                <option value="">선택</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 굴절률 */}
            <div>
              <label style={labelSt}>굴절률</label>
              <select style={{ ...selStyle, color: !cType ? '#9ca3af' : '#111' }}
                value={cIdx} disabled={!cType}
                onChange={e => { setCIdx(e.target.value); if (!needsCorridor) setCCorr('') }}>
                <option value="">선택</option>
                {indices.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* 누진대 */}
            <div>
              <label style={labelSt}>누진대</label>
              <select
                style={{ ...selStyle, color: (!needsCorridor || !cIdx) ? '#9ca3af' : '#111' }}
                value={cCorr}
                disabled={!needsCorridor || !cIdx}
                onChange={e => setCCorr(e.target.value)}>
                <option value="">{needsCorridor ? '선택' : '-'}</option>
                {needsCorridor && CORRIDOR_OPTIONS.map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ② 처방 정보 */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={secHead}>
            <span>📋 처방 정보</span>
            <button
              style={{
                fontSize: 10, padding: '2px 8px',
                background: '#e8f5ee', color: G,
                border: `1px solid #a7d7be`, borderRadius: 3,
                cursor: 'pointer',
              }}
              onClick={() => setRxL({ ...rxR })}>
              ↓ R → L 복사
            </button>
          </div>
          <div style={secBody}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...rxTh, width: 26 }}></th>
                  <th style={rxTh}>SPH</th>
                  <th style={rxTh}>CYL</th>
                  <th style={rxTh}>AXIS</th>
                  <th style={rxTh}>ADD</th>
                  <th style={rxTh}>CURVE</th>
                  <th style={{ ...rxTh, borderLeft: '2px solid #93c5fd' }}>PD</th>
                  <th style={rxTh}>PRISM</th>
                  <th style={rxTh}>BASE</th>
                </tr>
              </thead>
              <tbody>
                {(['R', 'L'] as const).map(side => {
                  const rx    = side === 'R' ? rxR : rxL
                  const color = side === 'R' ? '#2563eb' : '#16a34a'
                  return (
                    <tr key={side}>
                      <td style={{ ...rxTd, background: '#f4f6f8', fontWeight: 700, fontSize: 11, color }}>{side}</td>

                      {/* SPH / CYL / AXIS / ADD / CURVE */}
                      {(['sph', 'cyl', 'axis', 'add', 'curve'] as const).map(f => (
                        <td key={f} style={rxTd}>
                          <input
                            style={{ ...inpStyle, width: '100%' }}
                            value={rx[f]}
                            placeholder="-"
                            onChange={e => setRx(side, f, e.target.value)}
                            onBlur={e => blurRx(side, f, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                          />
                        </td>
                      ))}

                      {/* PD */}
                      <td style={{ ...rxTd, borderLeft: '2px solid #93c5fd' }}>
                        <input
                          style={{ ...inpStyle, width: '100%' }}
                          type="number" step="0.5" placeholder="-"
                          value={rx.pd}
                          onChange={e => setRx(side, 'pd', e.target.value)}
                        />
                      </td>

                      {/* PRISM */}
                      <td style={rxTd}>
                        <select style={{ ...inpStyle, width: '100%', cursor: 'pointer' }}
                          value={rx.prism}
                          onChange={e => setRx(side, 'prism', e.target.value)}>
                          <option value="">-</option>
                          {PRISM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* BASE */}
                      <td style={rxTd}>
                        <select style={{ ...inpStyle, width: '100%', cursor: 'pointer' }}
                          value={rx.base}
                          onChange={e => setRx(side, 'base', e.target.value)}>
                          <option value="">-</option>
                          {BASE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ③ 착색 or 코팅 */}
        {orderType === '착색' ? (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={secHead}><span>🎨 착색</span></div>
            <div style={secBody}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* 색상 스와치 */}
                <div>
                  <label style={labelSt}>색상</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {TINT_COLORS.map(tc => (
                      <div
                        key={tc.key}
                        title={tc.label}
                        onClick={() => setTintColor(tc.key)}
                        style={{
                          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
                          background: tc.bg,
                          border:     tintColor === tc.key
                            ? `3px solid ${G}`
                            : `2px solid ${tc.border ?? 'transparent'}`,
                          boxShadow:  tintColor === tc.key
                            ? `0 0 0 1px white, 0 0 0 3px ${G}`
                            : undefined,
                          transition: 'transform 0.1s',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 농도 */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={labelSt}>농도</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input
                      type="range" min={0} max={85} step={5}
                      value={tintDensity}
                      onChange={e => setTintDensity(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: G }}
                    />
                    <input
                      type="number" min={0} max={85}
                      value={tintDensity}
                      onChange={e => setTintDensity(Math.max(0, Math.min(85, parseInt(e.target.value) || 0)))}
                      style={{
                        width: 52, padding: '4px 6px', fontSize: 12,
                        border: '1px solid #ddd', borderRadius: 4, textAlign: 'center',
                      }}
                    />
                    <span style={{ color: '#6b7280', fontSize: 12 }}>%</span>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox" checked={tintGradient}
                      onChange={e => setTintGradient(e.target.checked)}
                      style={{ accentColor: G }}
                    />
                    그라데이션
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={secHead}><span>✨ 코팅</span></div>
            <div style={secBody}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {COATING_OPTIONS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => toggleCoating(c.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                      background:  coatings.includes(c.key) ? '#e8f5ee' : '#f3f4f6',
                      color:       coatings.includes(c.key) ? G         : '#374151',
                      border:      coatings.includes(c.key)
                        ? `1px solid ${G}`
                        : '1px solid #e5e7eb',
                      fontWeight:  coatings.includes(c.key) ? 600 : 400,
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ④ 피팅 정보 */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={secHead}><span>👓 피팅</span></div>
          <div style={{
            ...secBody,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}>
            {[
              { label: '가로 (mm)',  val: fw,  set: setFw  },
              { label: '브릿지 (mm)',val: fb,  set: setFb  },
              { label: '프레임 PD', val: fpd, set: null    },
              { label: '대각 (mm)', val: fd,  set: setFd  },
              { label: '상하 (mm)', val: fh,  set: setFh  },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label style={labelSt}>{label}</label>
                <input
                  type="number"
                  value={val}
                  readOnly={!set}
                  onChange={e => set?.(e.target.value)}
                  style={{
                    width: '100%', padding: '5px 8px', fontSize: 12,
                    border: '1px solid #d1d5db', borderRadius: 4,
                    background: set ? '#fff' : '#f0faf5',
                    color:      set ? '#111' : G,
                    fontWeight: set ? 400 : 600,
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ 고객명 + 메모 */}
        <div style={secBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
            <div>
              <label style={labelSt}>고객명</label>
              <input
                style={{
                  width: '100%', padding: '5px 8px', fontSize: 12,
                  border: '1px solid #d1d5db', borderRadius: 4,
                  background: '#fff', outline: 'none',
                }}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label style={labelSt}>메모</label>
              <input
                style={{
                  width: '100%', padding: '5px 8px', fontSize: 12,
                  border: '1px solid #d1d5db', borderRadius: 4,
                  background: '#fff', outline: 'none',
                }}
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="특이사항..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 푸터 버튼 */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid #eee',
        display: 'flex', gap: 8, background: '#f9fafb',
      }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px', background: '#fff',
            border: '1px solid #ddd', borderRadius: 4,
            cursor: 'pointer', fontSize: 12,
          }}>
          초기화
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !matched}
          style={{
            flex: 1, padding: '8px',
            background: loading || !matched ? '#9ca3af' : GL,
            color: '#fff', border: 'none', borderRadius: 4,
            cursor: loading || !matched ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700,
            transition: 'background 0.2s',
          }}>
          {loading
            ? '처리 중...'
            : matched
              ? `주문 → ${matched.name}`
              : '렌즈를 선택하세요'}
        </button>
      </div>
    </div>
  )
}
