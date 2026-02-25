'use client'

import { useState, useEffect, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
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
  selectedProductId?: number | null
  selectedStore?: Store | null
  onOrderSubmitted?: () => void
  onBrandChange?: (brandId: number | null) => void
  onProductChange?: (productId: number | null) => void
}

export interface RxOrderFormRef {
  focusCascade: () => void
}

interface TintColor {
  key: string
  label: string
  hex: string
}

type TintBrandKey = 'common' | 'hoya' | 'guardian' | 'chemi' | 'essilor' | 'acute'

// ─── Constants ────────────────────────────────────────────────────────────────

const CORRIDOR_OPTIONS = ['11mm', '12mm', '13mm', '14mm', '17mm', '18mm']

const TINT_BRANDS: { key: TintBrandKey; label: string }[] = [
  { key: 'common',   label: '공용' },
  { key: 'hoya',     label: '호야' },
  { key: 'guardian', label: '가디안' },
  { key: 'chemi',    label: '케미' },
  { key: 'essilor',  label: '에실로' },
  { key: 'acute',    label: 'ACUTE' },
]

// 브랜드별 착색 색상 (레티나 기준)
const TINT_COLORS_BY_BRAND: Record<TintBrandKey, TintColor[]> = {
  // 공용 착색 (15개)
  common: [
    { key: '스모그',       label: '스모그',       hex: '#696969' },
    { key: '브라운',       label: '브라운',       hex: '#8B4513' },
    { key: '그린(레이밴)', label: '그린(레이밴)', hex: '#228B22' },
    { key: 'BLACK',        label: 'BLACK',        hex: '#1a1a1a' },
    { key: 'GRAY',         label: 'GRAY',         hex: '#808080' },
    { key: '가디안 Y',     label: '가디안 Y',     hex: '#DAA520' },
    { key: '그린',         label: '그린',         hex: '#2E8B57' },
    { key: '레드',         label: '레드',         hex: '#CD5C5C' },
    { key: '블루',         label: '블루',         hex: '#4169E1' },
    { key: '옐로우',       label: '옐로우',       hex: '#FFD700' },
    { key: '틴트그린',     label: '틴트그린',     hex: '#90EE90' },
    { key: '틴트블루',     label: '틴트블루',     hex: '#87CEEB' },
    { key: '틴트옐로우',   label: '틴트옐로우',   hex: '#FFFACD' },
    { key: '틴트퍼플',     label: '틴트퍼플',     hex: '#9370DB' },
    { key: '틴트핑크',     label: '틴트핑크',     hex: '#FFB6C1' },
  ],
  // 호야 착색 (30개)
  hoya: [
    { key: 'ABL', label: 'ABL', hex: '#4169E1' },
    { key: 'BLV', label: 'BLV', hex: '#8A2BE2' },
    { key: 'CBL', label: 'CBL', hex: '#4682B4' },
    { key: 'CCB', label: 'CCB', hex: '#5F9EA0' },
    { key: 'CMB', label: 'CMB', hex: '#D2691E' },
    { key: 'CPK', label: 'CPK', hex: '#FFB6C1' },
    { key: 'IGY', label: 'IGY', hex: '#708090' },
    { key: 'LGN', label: 'LGN', hex: '#90EE90' },
    { key: 'MLP', label: 'MLP', hex: '#DDA0DD' },
    { key: 'RGY', label: 'RGY', hex: '#BC8F8F' },
    { key: 'RWN', label: 'RWN', hex: '#8B0000' },
    { key: 'SBK', label: 'SBK', hex: '#1a1a1a' },
    { key: 'SBL', label: 'SBL', hex: '#87CEEB' },
    { key: 'SBR', label: 'SBR', hex: '#A0522D' },
    { key: 'SDO', label: 'SDO', hex: '#FF8C00' },
    { key: 'SG',  label: 'SG',  hex: '#2E8B57' },
    { key: 'SGN', label: 'SGN', hex: '#3CB371' },
    { key: 'SGY', label: 'SGY', hex: '#708090' },
    { key: 'SNO', label: 'SNO', hex: '#FFFAFA' },
    { key: 'SYL', label: 'SYL', hex: '#F0E68C' },
    { key: 'VB',  label: 'VB',  hex: '#EE82EE' },
    { key: 'CN',  label: 'CN',  hex: '#00CED1' },
    { key: 'EB',  label: 'EB',  hex: '#4169E1' },
    { key: 'FG',  label: 'FG',  hex: '#228B22' },
    { key: 'LI',  label: 'LI',  hex: '#E6E6FA' },
    { key: 'PP',  label: 'PP',  hex: '#9370DB' },
    { key: 'PW',  label: 'PW',  hex: '#FFE4E1' },
    { key: 'SB',  label: 'SB',  hex: '#87CEEB' },
    { key: 'SBW', label: 'SBW', hex: '#DEB887' },
    { key: 'SGE', label: 'SGE', hex: '#8FBC8F' },
  ],
  // 가디안 착색 (12개)
  guardian: [
    { key: 'B1', label: 'B1', hex: '#8B4513' },
    { key: 'B2', label: 'B2', hex: '#A0522D' },
    { key: 'B3', label: 'B3', hex: '#D2691E' },
    { key: 'G1', label: 'G1', hex: '#2E8B57' },
    { key: 'G2', label: 'G2', hex: '#3CB371' },
    { key: 'G3', label: 'G3', hex: '#90EE90' },
    { key: 'K1', label: 'K1', hex: '#2F4F4F' },
    { key: 'K2', label: 'K2', hex: '#696969' },
    { key: 'K3', label: 'K3', hex: '#808080' },
    { key: 'Y1', label: 'Y1', hex: '#DAA520' },
    { key: 'Y2', label: 'Y2', hex: '#FFD700' },
    { key: 'Y3', label: 'Y3', hex: '#F0E68C' },
  ],
  // 케미 착색 (24개)
  chemi: [
    { key: '1-ABL',  label: 'ABL',  hex: '#4169E1' },
    { key: '2-VB',   label: 'VB',   hex: '#EE82EE' },
    { key: '3-BLV',  label: 'BLV',  hex: '#8A2BE2' },
    { key: '4-CBL',  label: 'CBL',  hex: '#4682B4' },
    { key: '5-MLP',  label: 'MLP',  hex: '#DDA0DD' },
    { key: '6-IGY',  label: 'IGY',  hex: '#708090' },
    { key: '7-CMB',  label: 'CMB',  hex: '#D2691E' },
    { key: '8-SNO',  label: 'SNO',  hex: '#FFFAFA' },
    { key: '9-RWN',  label: 'RWN',  hex: '#8B0000' },
    { key: '10-CPK', label: 'CPK',  hex: '#FFB6C1' },
    { key: '11-RGY', label: 'RGY',  hex: '#BC8F8F' },
    { key: '12-CCB', label: 'CCB',  hex: '#5F9EA0' },
    { key: '13-SG',  label: 'SG',   hex: '#2E8B57' },
    { key: '14-SGY', label: 'SGY',  hex: '#708090' },
    { key: '15-SBL', label: 'SBL',  hex: '#87CEEB' },
    { key: '16-SGN', label: 'SGN',  hex: '#3CB371' },
    { key: '17-SBK', label: 'SBK',  hex: '#1a1a1a' },
    { key: '18-SBR', label: 'SBR',  hex: '#A0522D' },
    { key: 'S-1',    label: 'S-1',  hex: '#696969' },
    { key: 'S-2',    label: 'S-2',  hex: '#808080' },
    { key: 'S-3',    label: 'S-3',  hex: '#A9A9A9' },
    { key: 'S-4',    label: 'S-4',  hex: '#8B4513' },
    { key: 'S-5',    label: 'S-5',  hex: '#A0522D' },
    { key: 'S-6',    label: 'S-6',  hex: '#D2B48C' },
  ],
  // 에실로-ACUTE(신) 착색 (21개)
  essilor: [
    { key: 'ABL',     label: 'ABL',     hex: '#4169E1' },
    { key: 'BLV',     label: 'BLV',     hex: '#8A2BE2' },
    { key: 'BTBR',    label: 'BTBR',    hex: '#8B4513' },
    { key: 'CBLP',    label: 'CBLP',    hex: '#4682B4' },
    { key: 'CCB',     label: 'CCB',     hex: '#5F9EA0' },
    { key: 'CMB',     label: 'CMB',     hex: '#D2691E' },
    { key: 'CPKP',    label: 'CPKP',    hex: '#FFB6C1' },
    { key: 'IGY',     label: 'IGY',     hex: '#708090' },
    { key: 'LGN',     label: 'LGN',     hex: '#90EE90' },
    { key: 'MAS',     label: 'MAS',     hex: '#800000' },
    { key: 'MBK',     label: 'MBK',     hex: '#1a1a1a' },
    { key: 'MLP',     label: 'MLP',     hex: '#DDA0DD' },
    { key: 'RGY',     label: 'RGY',     hex: '#BC8F8F' },
    { key: 'RWN',     label: 'RWN',     hex: '#8B0000' },
    { key: 'SBL',     label: 'SBL',     hex: '#87CEEB' },
    { key: 'SDO',     label: 'SDO',     hex: '#FF8C00' },
    { key: 'SGN',     label: 'SGN',     hex: '#3CB371' },
    { key: 'SGY',     label: 'SGY',     hex: '#708090' },
    { key: 'SNO',     label: 'SNO',     hex: '#FFFAFA' },
    { key: 'TOU',     label: 'TOU',     hex: '#D2B48C' },
    { key: 'X-perio', label: 'X-perio', hex: '#808080' },
  ],
  // ACUTE 착색 (17개)
  acute: [
    { key: 'CBL', label: 'CBL', hex: '#4682B4' },
    { key: 'CGY', label: 'CGY', hex: '#708090' },
    { key: 'CPK', label: 'CPK', hex: '#FFB6C1' },
    { key: 'CPP', label: 'CPP', hex: '#DDA0DD' },
    { key: 'DBR', label: 'DBR', hex: '#654321' },
    { key: 'DGN', label: 'DGN', hex: '#006400' },
    { key: 'DGY', label: 'DGY', hex: '#404040' },
    { key: 'GBL', label: 'GBL', hex: '#4682B4' },
    { key: 'GGY', label: 'GGY', hex: '#696969' },
    { key: 'GPK', label: 'GPK', hex: '#FFB6C1' },
    { key: 'GPP', label: 'GPP', hex: '#9370DB' },
    { key: 'MGY', label: 'MGY', hex: '#808080' },
    { key: 'NBR', label: 'NBR', hex: '#8B4513' },
    { key: 'OBL', label: 'OBL', hex: '#4169E1' },
    { key: 'SBR', label: 'SBR', hex: '#A0522D' },
    { key: 'SYL', label: 'SYL', hex: '#F0E68C' },
    { key: 'WBR', label: 'WBR', hex: '#D2B48C' },
  ],
}

const FALLBACK_COLORS: TintColor[] = TINT_COLORS_BY_BRAND.common

const COATING_OPTIONS = [
  { key: 'ar',          label: '반사방지(AR)' },
  { key: 'bluelight',   label: '블루라이트'   },
  { key: 'photochromic',label: '변색'          },
  { key: 'scratch',     label: '스크래치방지' },
  { key: 'uv',          label: 'UV'            },
  { key: 'hydrophobic', label: '발수'          },
  { key: 'oleophobic',  label: '발유'          },
]

const PROCESS_TYPES = ['풀프레임', '반무테(나이론)', '무테(드릴)']
const SPECIAL_PROCESS_OPTIONS = ['홈파기', '면취', '경사면취', '기타']

const PRISM_OPTIONS = Array.from({ length: 16 }, (_, i) => ((i + 1) * 0.5).toFixed(1))
const BASE_OPTIONS  = ['BU', 'BD', 'BI', 'BO']

// SPH: -15.00 ~ +15.00 (0.25 단위)
const SPH_OPTIONS: string[] = []
for (let i = -15; i <= 15; i += 0.25) {
  SPH_OPTIONS.push(i >= 0 ? `+${i.toFixed(2)}` : i.toFixed(2))
}

// CYL: -6.00 ~ +6.00 (0.25 단위)
const CYL_OPTIONS: string[] = []
for (let i = -6; i <= 6; i += 0.25) {
  CYL_OPTIONS.push(i >= 0 ? `+${i.toFixed(2)}` : i.toFixed(2))
}

// AXIS: 0 ~ 180
const AXIS_OPTIONS: string[] = []
for (let i = 0; i <= 180; i++) {
  AXIS_OPTIONS.push(String(i))
}

// ADD: +050 ~ +400 (025 단위) - 정수 형식
const ADD_OPTIONS: string[] = []
for (let i = 50; i <= 400; i += 25) {
  ADD_OPTIONS.push(`+${String(i).padStart(3, '0')}`)
}

// 숫자 입력 → 도수 변환 (200 → -2.00, 225 → -2.25)
function parseRxInput(input: string, field: 'sph' | 'cyl'): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  
  // 이미 소수점 포함이면 그대로
  if (trimmed.includes('.')) {
    const n = parseFloat(trimmed)
    if (isNaN(n)) return trimmed
    return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
  }
  
  // 3자리 숫자 입력 (200, 225 등) → 나누기 100
  const hasPlus = trimmed.startsWith('+')
  const numStr = hasPlus ? trimmed.slice(1) : trimmed
  const num = parseInt(numStr, 10)
  if (!isNaN(num) && numStr.length >= 2 && numStr.length <= 4) {
    const val = num / 100
    // +붙으면 양수, 아니면 음수
    if (hasPlus) return `+${val.toFixed(2)}`
    return (-val).toFixed(2)
  }
  
  return trimmed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSph(v: string): string {
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}
function fmtCyl(v: string): string {
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}

// ADD: +050 형식으로 변환
function fmtAdd(v: string): string {
  const trimmed = v.trim().replace('+', '')
  // 이미 3자리 정수 형식이면 그대로
  if (/^\d{3}$/.test(trimmed)) return `+${trimmed}`
  // 소수점 형식이면 정수로 변환 (0.50 -> 050)
  const n = parseFloat(v)
  if (isNaN(n)) return v
  const intVal = Math.round(n * 100)
  if (intVal >= 50 && intVal <= 400) return `+${String(intVal).padStart(3, '0')}`
  return v
}

const emptyRx = { sph: '', cyl: '', axis: '', add: '', curve: '', pd: '', prism: '', base: '' }

// ─── Component ────────────────────────────────────────────────────────────────

const RxOrderForm = forwardRef<RxOrderFormRef, RxOrderFormProps>(({
  orderType,
  products,
  selectedBrandId: initBrand,
  selectedProductId: initProduct,
  selectedStore,
  onOrderSubmitted,
  onBrandChange,
  onProductChange,
}, ref) => {
  const { toast } = useToast()

  // ── Cascade state
  const [cBrand, setCBrand] = useState<number | ''>(initBrand ?? '')
  const [cLine,  setCLine]  = useState<number | ''>('')  // 이제 productId 저장
  const [cCorr,  setCCorr]  = useState('')

  // ── Sync with parent's brand selection (always sync when initBrand changes)
  useEffect(() => {
    if (initBrand !== null && initBrand !== cBrand) {
      setCBrand(initBrand)
      setCLine(''); setCCorr('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initBrand])

  // ── Sync with parent's product selection (find and set cascade values)
  useEffect(() => {
    if (!initProduct) return
    const product = products.find(p => p.id === initProduct)
    if (!product) return
    
    // 상품 선택 시: 브랜드 + 상품ID 설정
    setCBrand(product.brandId)
    setCLine(product.id)  // 이제 productId 직접 저장
    setCCorr('')
  }, [initProduct, products])

  // ── Prescription
  const [rxR, setRxR] = useState({ ...emptyRx })
  const [rxL, setRxL] = useState({ ...emptyRx })

  // ── Tint (브랜드별)
  const [tintBrand,    setTintBrand]    = useState<TintBrandKey>('common')
  const [tintColor,    setTintColor]    = useState('none')
  const [tintDensity,  setTintDensity]  = useState(0)
  const [tintGradient, setTintGradient] = useState(false)
  const [tintColorsByBrand, setTintColorsByBrand] = useState<Record<TintBrandKey, TintColor[]>>({
    common: TINT_COLORS_BY_BRAND.common,
    hoya: TINT_COLORS_BY_BRAND.hoya,
    guardian: TINT_COLORS_BY_BRAND.guardian,
    chemi: TINT_COLORS_BY_BRAND.chemi,
    essilor: TINT_COLORS_BY_BRAND.essilor,
    acute: TINT_COLORS_BY_BRAND.acute,
  })
  const [tintLoaded, setTintLoaded] = useState(true)  // 기본값 사용

  // ── Coating
  const [coatings, setCoatings] = useState<string[]>([])

  // ── Inframe (RX only)
  const [frameModel,    setFrameModel]    = useState('')
  const [frameA,        setFrameA]        = useState('')
  const [frameB,        setFrameB]        = useState('')
  const [frameDbl,      setFrameDbl]      = useState('')
  const [frameTemple,   setFrameTemple]   = useState('')
  const [processType,   setProcessType]   = useState('풀프레임')
  const [specialProcess,setSpecialProcess]= useState<string[]>([])
  const [processMemo,   setProcessMemo]   = useState('')
  const [frameSent,     setFrameSent]     = useState(false)
  const [frameSentDate, setFrameSentDate] = useState('')
  const [frameReturn,   setFrameReturn]   = useState(false)

  // ── Fitting
  const [fw, setFw] = useState('')
  const [fb, setFb] = useState('')
  const [fd, setFd] = useState('')
  const [fh, setFh] = useState('')
  const [decR, setDecR] = useState('')  // 편심 R (직접 입력)
  const [decL, setDecL] = useState('')  // 편심 L (직접 입력)
  const [frameSize, setFrameSize] = useState('')  // 프레임 사이즈 (예: 52□18-140)

  // ── Misc
  const [customerName, setCustomerName] = useState('')
  const [memo,         setMemo]         = useState('')
  const [loading,      setLoading]      = useState(false)

  // ─── Keyboard Navigation ────────────────────────────────────────────────

  // 처방 필드 순서: R행 → L행 순서로
  const RX_FIELDS = ['sph', 'cyl', 'axis', 'add', 'pd', 'prism', 'base', 'curve'] as const
  const rxRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({})

  const setRxRef = useCallback((key: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    rxRefs.current[key] = el
  }, [])

  const focusRxField = useCallback((side: 'R' | 'L', field: string) => {
    const key = `${side}-${field}`
    const el = rxRefs.current[key]
    if (el) {
      el.focus()
      if ('select' in el && typeof el.select === 'function') el.select()
    }
  }, [])

  const getNextRxField = useCallback((side: 'R' | 'L', field: string): { side: 'R' | 'L'; field: string } | null => {
    const idx = RX_FIELDS.indexOf(field as typeof RX_FIELDS[number])
    if (idx === -1) return null
    if (idx < RX_FIELDS.length - 1) {
      return { side, field: RX_FIELDS[idx + 1] }
    } else if (side === 'R') {
      return { side: 'L', field: RX_FIELDS[0] }
    }
    return null // L행 마지막
  }, [])

  const getPrevRxField = useCallback((side: 'R' | 'L', field: string): { side: 'R' | 'L'; field: string } | null => {
    const idx = RX_FIELDS.indexOf(field as typeof RX_FIELDS[number])
    if (idx === -1) return null
    if (idx > 0) {
      return { side, field: RX_FIELDS[idx - 1] }
    } else if (side === 'L') {
      return { side: 'R', field: RX_FIELDS[RX_FIELDS.length - 1] }
    }
    return null // R행 첫번째
  }, [])

  const handleRxKeyDown = useCallback((side: 'R' | 'L', field: string, e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement

    if (e.key === 'Enter') {
      e.preventDefault()
      const next = getNextRxField(side, field)
      if (next) {
        focusRxField(next.side, next.field)
      } else if (side === 'L' && field === 'curve') {
        // L-CURVE 다음은 피팅 PD로 이동
        focusFrameField('fpd_input')
      }
    }
    else if (e.key === 'ArrowRight') {
      // 커서가 맨 끝이면 다음 필드로
      if ('selectionStart' in target && target.selectionStart === target.value.length) {
        e.preventDefault()
        const next = getNextRxField(side, field)
        if (next) focusRxField(next.side, next.field)
      }
    }
    else if (e.key === 'ArrowLeft') {
      // 커서가 맨 앞이면 이전 필드로
      if ('selectionStart' in target && target.selectionStart === 0) {
        e.preventDefault()
        const prev = getPrevRxField(side, field)
        if (prev) focusRxField(prev.side, prev.field)
      }
    }
    else if (e.key === 'ArrowDown') {
      // R→L 이동 또는 select에서 다음 옵션
      if (side === 'R' && !(target.tagName === 'SELECT')) {
        e.preventDefault()
        focusRxField('L', field)
      }
    }
    else if (e.key === 'ArrowUp') {
      // L→R 이동 또는 select에서 이전 옵션
      if (side === 'L' && !(target.tagName === 'SELECT')) {
        e.preventDefault()
        focusRxField('R', field)
      }
    }
  }, [getNextRxField, getPrevRxField, focusRxField])

  const handleRxWheel = useCallback((side: 'R' | 'L', field: string, e: React.WheelEvent<HTMLInputElement>) => {
    if (field !== 'sph' && field !== 'cyl' && field !== 'add' && field !== 'axis' && field !== 'curve') return
    e.preventDefault()
    const target = e.target as HTMLInputElement
    const val = parseFloat(target.value) || 0
    const step = field === 'axis' ? 1 : 0.25
    const delta = e.deltaY < 0 ? step : -step
    let newVal = val + delta

    // 범위 제한
    if (field === 'axis') newVal = Math.max(1, Math.min(180, Math.round(newVal)))
    else if (field === 'curve') newVal = Math.max(0, Math.min(10, newVal))
    else if (field === 'add') newVal = Math.max(0, Math.min(4, newVal))

    const formatted = field === 'axis' ? String(newVal) 
      : field === 'sph' ? fmtSph(newVal.toFixed(2))
      : newVal.toFixed(2)

    setRx(side, field, formatted)
  }, [])

  // ─── Inframe Keyboard Navigation ────────────────────────────────────────

  const FRAME_FIELDS = ['model', 'a', 'b', 'dbl', 'temple', 'memo', 'fpd_input', 'fw', 'fb', 'fd', 'fh', 'decR', 'decL'] as const
  const frameRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const setFrameRef = useCallback((key: string) => (el: HTMLInputElement | null) => {
    frameRefs.current[key] = el
  }, [])

  const focusFrameField = useCallback((field: string) => {
    const el = frameRefs.current[field]
    if (el) {
      el.focus()
      if ('select' in el) el.select()
    }
  }, [])

  const handleFrameKeyDown = useCallback((field: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const idx = FRAME_FIELDS.indexOf(field as typeof FRAME_FIELDS[number])
    if (idx === -1) return

    if (e.key === 'Enter') {
      e.preventDefault()
      if (idx < FRAME_FIELDS.length - 1) {
        focusFrameField(FRAME_FIELDS[idx + 1])
      }
    }
    else if (e.key === 'ArrowRight') {
      if (target.selectionStart === target.value.length && idx < FRAME_FIELDS.length - 1) {
        e.preventDefault()
        focusFrameField(FRAME_FIELDS[idx + 1])
      }
    }
    else if (e.key === 'ArrowLeft') {
      if (target.selectionStart === 0 && idx > 0) {
        e.preventDefault()
        focusFrameField(FRAME_FIELDS[idx - 1])
      }
    }
  }, [focusFrameField])

  // ─── Cascade Dropdown Navigation ────────────────────────────────────────

  const cascadeRefs = useRef<Record<string, HTMLSelectElement | null>>({})

  const setCascadeRef = useCallback((key: string) => (el: HTMLSelectElement | null) => {
    cascadeRefs.current[key] = el
  }, [])

  const focusCascade = useCallback((key: string) => {
    const el = cascadeRefs.current[key]
    if (el && !el.disabled) {
      el.focus()
      // 드롭다운 펼치기 시도
      requestAnimationFrame(() => {
        try {
          // showPicker가 가장 확실함 (Chrome 99+)
          if ('showPicker' in el && typeof el.showPicker === 'function') {
            (el as HTMLSelectElement).showPicker()
          }
        } catch {
          // showPicker 실패 시 mousedown 이벤트로 시도
          try {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
          } catch {
            // 그래도 안 되면 그냥 focus만
          }
        }
      })
    }
  }, [])

  const CASCADE_ORDER = ['brand', 'line', 'type', 'idx', 'corr'] as const

  const handleCascadeKeyDown = useCallback((field: string, e: React.KeyboardEvent<HTMLSelectElement>) => {
    const idx = CASCADE_ORDER.indexOf(field as typeof CASCADE_ORDER[number])
    if (idx === -1) return

    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault()
      // 다음 필드로 이동
      for (let i = idx + 1; i < CASCADE_ORDER.length; i++) {
        const nextKey = CASCADE_ORDER[i]
        const nextEl = cascadeRefs.current[nextKey]
        if (nextEl && !nextEl.disabled) {
          focusCascade(nextKey)
          return
        }
      }
      // cascade 다 끝나면 처방 SPH로 이동
      focusRxField('R', 'sph')
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      // 이전 필드로 이동
      for (let i = idx - 1; i >= 0; i--) {
        const prevKey = CASCADE_ORDER[i]
        const prevEl = cascadeRefs.current[prevKey]
        if (prevEl && !prevEl.disabled) {
          focusCascade(prevKey)
          return
        }
      }
    }
  }, [focusCascade, focusRxField])

  // ─── Expose focusCascade to parent via ref ──────────────────────────────

  useImperativeHandle(ref, () => ({
    focusCascade: () => {
      // 첫 번째 활성화된 cascade 필드에 포커스
      for (const key of CASCADE_ORDER) {
        const el = cascadeRefs.current[key]
        if (el && !el.disabled) {
          focusCascade(key)
          return
        }
      }
    }
  }), [focusCascade])

  // ─── Load tint colors from DB (optional override) ────────────────────────

  useEffect(() => {
    fetch('/api/admin/settings?group=tint.colors')
      .then(r => r.json())
      .then(data => {
        const settings: Record<string, string> = {}
        ;(data.settings || []).forEach((s: { key: string; value: string }) => {
          settings[s.key] = s.value
        })
        // DB에 설정된 값이 있으면 오버라이드
        const result: Record<TintBrandKey, TintColor[]> = {
          common: [...TINT_COLORS_BY_BRAND.common],
          hoya: [...TINT_COLORS_BY_BRAND.hoya],
          guardian: [...TINT_COLORS_BY_BRAND.guardian],
          chemi: [...TINT_COLORS_BY_BRAND.chemi],
          essilor: [...TINT_COLORS_BY_BRAND.essilor],
          acute: [...TINT_COLORS_BY_BRAND.acute],
        }
        for (const brand of TINT_BRANDS) {
          const raw = settings[`tint.colors.${brand.key}`]
          if (raw) {
            try { result[brand.key] = JSON.parse(raw) } catch { /* skip */ }
          }
        }
        setTintColorsByBrand(result)
      })
      .catch(() => {
        // 실패해도 기본값 유지
      })
  }, [])

  // ─── Cascade Derivations ──────────────────────────────────────────────────

  const brands = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach(p => { if (!map.has(p.brandId)) map.set(p.brandId, p.brand) })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [products])

  // 브랜드별 상품 목록 (실제 제품명으로 표시)
  const productList = useMemo(() => {
    if (!cBrand) return []
    return products
      .filter(p => p.brandId === cBrand)
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [products, cBrand])

  // 선택된 상품 (cLine이 이제 productId를 저장)
  const selectedProduct = useMemo((): Product | null => {
    if (cLine === '') return null
    return products.find(p => p.id === cLine) ?? null
  }, [products, cLine])

  // 선택된 상품의 속성 표시용
  const displayType = selectedProduct?.optionType ?? ''
  const displayIdx = selectedProduct?.refractiveIndex ?? ''

  // matched는 이제 selectedProduct와 동일
  const matched = selectedProduct

  const needsCorridor = displayType === '누진다초점'
  const fpd = fw && fb ? String(parseFloat(fw) + parseFloat(fb)) : ''

  // ── Notify parent when matched product changes
  useEffect(() => {
    if (onProductChange) {
      onProductChange(matched?.id ?? null)
    }
  }, [matched, onProductChange])

  // ── 피팅 PD (양안) 자동계산: R PD + L PD
  const fittingPdCalc = useMemo(() => {
    const r = parseFloat(rxR.pd) || 0
    const l = parseFloat(rxL.pd) || 0
    return r > 0 || l > 0 ? String(r + l) : ''
  }, [rxR.pd, rxL.pd])

  // ── 피팅 FPD 자동계산: 가로(A) + 브릿지(DBL)
  const fittingFPD = useMemo(() => {
    const a = parseFloat(fw)
    const dbl = parseFloat(fb)
    if (isNaN(a) || isNaN(dbl) || a <= 0 || dbl <= 0) return ''
    return String(a + dbl)
  }, [fw, fb])

  // ── 피팅 ED 자동계산: √(가로² + 상하²)
  const fittingED = useMemo(() => {
    const a = parseFloat(fw)
    const b = parseFloat(fh)
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return ''
    return Math.sqrt(a * a + b * b).toFixed(1)
  }, [fw, fh])

  // ── 사이즈 표기 자동생성: 52□18 형식
  const autoFrameSize = useMemo(() => {
    const a = parseFloat(fw)
    const dbl = parseFloat(fb)
    if (isNaN(a) || isNaN(dbl) || a <= 0 || dbl <= 0) return ''
    return `${Math.round(a)}□${Math.round(dbl)}`
  }, [fw, fb])

  // ── 편심(디센터) 계산: (FPD/2 - 처방PD)
  const fittingDecenter = useMemo(() => {
    const fpd = parseFloat(fittingFPD)
    const pdR = parseFloat(rxR.pd)
    const pdL = parseFloat(rxL.pd)
    if (isNaN(fpd) || fpd <= 0) return { r: '', l: '' }
    const halfFpd = fpd / 2
    const r = !isNaN(pdR) && pdR > 0 ? (halfFpd - pdR).toFixed(1) : ''
    const l = !isNaN(pdL) && pdL > 0 ? (halfFpd - pdL).toFixed(1) : ''
    return { r, l }
  }, [fittingFPD, rxR.pd, rxL.pd])

  // ── 최소 블랭크 직경: ED + |편심| × 2 + 여유(2mm)
  // R/L 중 큰 값 하나만 표시 (양쪽 같은 블랭크 사용)
  const fittingMinBlank = useMemo(() => {
    const ed = parseFloat(fittingED)
    if (isNaN(ed) || ed <= 0) return ''
    const decR = Math.abs(parseFloat(fittingDecenter.r) || 0)
    const decL = Math.abs(parseFloat(fittingDecenter.l) || 0)
    const maxDec = Math.max(decR, decL)
    // 최소 블랭크 = ED + (편심 × 2) + 가공여유(2mm)
    return (ed + maxDec * 2 + 2).toFixed(1)
  }, [fittingED, fittingDecenter])

  // ── 굴절률 추출 (상품명에서)
  const refractiveIndex = useMemo(() => {
    if (!selectedProduct?.name) return 1.60 // 기본값
    const name = selectedProduct.name
    if (name.includes('1.74')) return 1.74
    if (name.includes('1.67')) return 1.67
    if (name.includes('1.60')) return 1.60
    if (name.includes('1.56')) return 1.56
    if (name.includes('1.50')) return 1.50
    return 1.60
  }, [selectedProduct?.name])

  // ── 렌즈 두께 계산 (구면 기준 + 난시 고려)
  const lensThickness = useMemo(() => {
    const ed = parseFloat(fittingED)
    const decRVal = parseFloat(decR) || 0
    const decLVal = parseFloat(decL) || 0
    
    if (isNaN(ed) || ed <= 0) return { r: null, l: null }
    
    const n = refractiveIndex
    const centerThickness = 1.2 // 최소 중심두께 (mm)
    const edgeMin = 1.5 // 최소 가장자리 두께 (mm)
    
    const calcThickness = (sph: string, cyl: string, axis: string, dec: number) => {
      const spherePower = parseFloat(sph) || 0
      const cylPower = parseFloat(cyl) || 0
      const axisVal = parseFloat(axis) || 0
      
      if (spherePower === 0 && cylPower === 0) return null
      
      // 실제 렌즈 반경 (ED/2 + 편심)
      const radius = (ed / 2) + Math.abs(dec)
      
      // 합산 도수 (가장 강한 경선)
      const maxPower = spherePower + cylPower
      const minPower = spherePower
      
      // 난시 축에 따른 두께 방향 계산
      // 0°/180° 축: 좌우 방향이 CYL 영향
      // 90° 축: 상하 방향이 CYL 영향
      const isHorizontalAxis = axisVal <= 30 || axisVal >= 150
      
      // Sag 공식 근사: thickness = power × radius² / (2000 × (n-1))
      const sagFactor = (radius * radius) / (2000 * (n - 1))
      
      // 비구면 보정 계수 (구면 대비 약 15% 두께 감소)
      const asphericalFactor = 0.85
      
      if (maxPower < 0) {
        // 마이너스 렌즈 (근시) - 가장자리가 두꺼움
        const edgeThickMax = (centerThickness + Math.abs(maxPower) * sagFactor) * asphericalFactor
        const edgeThickMin = (centerThickness + Math.abs(minPower) * sagFactor) * asphericalFactor
        return {
          center: centerThickness.toFixed(1),
          edgeMax: edgeThickMax.toFixed(1),
          edgeMin: edgeThickMin.toFixed(1),
          type: 'minus',
          axis: isHorizontalAxis ? '좌우' : '상하'
        }
      } else {
        // 플러스 렌즈 (원시) - 중심이 두꺼움
        const centerThickCalc = (edgeMin + maxPower * sagFactor) * asphericalFactor
        return {
          center: centerThickCalc.toFixed(1),
          edgeMax: edgeMin.toFixed(1),
          edgeMin: edgeMin.toFixed(1),
          type: 'plus',
          axis: isHorizontalAxis ? '좌우' : '상하'
        }
      }
    }
    
    return {
      r: calcThickness(rxR.sph, rxR.cyl, rxR.axis, decRVal),
      l: calcThickness(rxL.sph, rxL.cyl, rxL.axis, decLVal)
    }
  }, [fittingED, decR, decL, rxR, rxL, refractiveIndex])

  // ── ED (유효직경) 자동계산: √(A² + B²)
  const frameED = useMemo(() => {
    const a = parseFloat(frameA)
    const b = parseFloat(frameB)
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return ''
    return Math.sqrt(a * a + b * b).toFixed(1)
  }, [frameA, frameB])

  // ── 프레임 PD 계산 (A + DBL)
  const framePD = useMemo(() => {
    const a = parseFloat(frameA)
    const dbl = parseFloat(frameDbl)
    if (isNaN(a) || isNaN(dbl) || a <= 0 || dbl <= 0) return ''
    return String(a + dbl)
  }, [frameA, frameDbl])

  // ── 디센터 계산 (처방PD - 프레임PD) / 2
  const decenter = useMemo(() => {
    const rxPdR = parseFloat(rxR.pd)
    const rxPdL = parseFloat(rxL.pd)
    const fpdVal = parseFloat(framePD)
    if (isNaN(fpdVal) || fpdVal <= 0) return { r: '', l: '' }
    const r = !isNaN(rxPdR) ? ((fpdVal / 2) - rxPdR).toFixed(1) : ''
    const l = !isNaN(rxPdL) ? ((fpdVal / 2) - rxPdL).toFixed(1) : ''
    return { r, l }
  }, [rxR.pd, rxL.pd, framePD])

  // ── 최소공경 계산 (ED + |디센터| + 여유2mm)
  const minBlankSize = useMemo(() => {
    const ed = parseFloat(frameED)
    if (isNaN(ed) || ed <= 0) return { r: '', l: '' }
    const decR = parseFloat(decenter.r)
    const decL = parseFloat(decenter.l)
    const r = !isNaN(decR) ? (ed + Math.abs(decR) + 2).toFixed(1) : ''
    const l = !isNaN(decL) ? (ed + Math.abs(decL) + 2).toFixed(1) : ''
    return { r, l }
  }, [frameED, decenter])

  const badge = useMemo(() => {
    if (!selectedProduct) return ''
    const bn = selectedProduct.brand ?? ''
    const pn = selectedProduct.name ?? ''
    const cor = needsCorridor && cCorr ? ` / ${cCorr}` : ''
    return [bn, pn, displayIdx].filter(Boolean).join(' / ') + cor
  }, [selectedProduct, displayIdx, needsCorridor, cCorr])

  const activeTintColors = tintColorsByBrand[tintBrand] || []

  // ─── Handlers ────────────────────────────────────────────────────────────

  const setRx = (side: 'R' | 'L', f: string, v: string) => {
    if (side === 'R') setRxR(p => ({ ...p, [f]: v }))
    else              setRxL(p => ({ ...p, [f]: v }))
  }
  const blurRx = (side: 'R' | 'L', f: string, v: string) => {
    if      (f === 'sph') setRx(side, f, fmtSph(v))
    else if (f === 'cyl') setRx(side, f, fmtCyl(v))
    else if (f === 'add') setRx(side, f, fmtAdd(v))
  }

  const toggleCoating = (k: string) =>
    setCoatings(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  const toggleSpecialProcess = (k: string) =>
    setSpecialProcess(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  const reset = () => {
    setCBrand(''); setCLine(''); setCCorr('')
    setRxR({ ...emptyRx }); setRxL({ ...emptyRx })
    setTintBrand('common'); setTintColor('none'); setTintDensity(0); setTintGradient(false)
    setCoatings([])
    setFrameModel(''); setFrameA(''); setFrameB(''); setFrameDbl(''); setFrameTemple('')
    setProcessType('풀프레임'); setSpecialProcess([]); setProcessMemo('')
    setFrameSent(false); setFrameSentDate(''); setFrameReturn(false)
    setFw(''); setFb(''); setFd(''); setFh(''); setDecR(''); setDecL(''); setFrameSize('')
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
            tint: {
              brand: tintBrand,
              color: tintColor,
              density: tintDensity,
              gradient: tintGradient,
            },
            coatings,
            fitting: { fw, fb, fpd, fd, fh },
            inframe: orderType === 'RX' ? {
              model: frameModel,
              sizeA: frameA, sizeB: frameB, dbl: frameDbl, temple: frameTemple,
              processType, specialProcess, processMemo,
              frameSent, frameSentDate, frameReturn,
            } : null,
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
        toast.success('주문 접수 완료!')
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
  const fieldInputStyle: React.CSSProperties = {
    width: '100%', padding: '5px 8px', fontSize: 12,
    border: '1px solid #d1d5db', borderRadius: 4,
    background: '#fff', outline: 'none', color: '#111',
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
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {/* 브랜드 */}
            <div>
              <label style={labelSt}>브랜드</label>
              <select
                ref={setCascadeRef('brand')}
                style={selStyle} value={cBrand}
                onChange={e => {
                  const v = e.target.value ? parseInt(e.target.value) : '' as const
                  setCBrand(v); setCLine(''); setCCorr('')
                  // 부모에게 브랜드 변경 알림
                  onBrandChange?.(v || null)
                  // 다음 드롭다운으로 자동 이동
                  if (v) setTimeout(() => focusCascade('line'), 100)
                }}
                onKeyDown={e => handleCascadeKeyDown('brand', e)}>
                <option value="">선택</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* 상품 (실제 제품 목록) */}
            <div>
              <label style={labelSt}>상품</label>
              <select
                ref={setCascadeRef('line')}
                style={{ ...selStyle, color: !cBrand ? '#9ca3af' : '#111' }}
                value={cLine} disabled={!cBrand || productList.length === 0}
                onChange={e => {
                  const v = e.target.value ? parseInt(e.target.value) : '' as const
                  setCLine(v); setCCorr('')
                  // 상품 선택하면 바로 처방으로 (누진다초점이면 누진대로)
                  if (v) {
                    const prod = products.find(p => p.id === v)
                    setTimeout(() => {
                      if (prod?.optionType === '누진다초점') focusCascade('corr')
                      else focusRxField('R', 'sph')
                    }, 100)
                  }
                }}
                onKeyDown={e => handleCascadeKeyDown('line', e)}>
                <option value="">{productList.length === 0 ? '-' : '선택'}</option>
                {productList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.refractiveIndex ? `(${p.refractiveIndex})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 굴절률 */}
            <div>
              <label style={labelSt}>굴절률</label>
              <select
                ref={setCascadeRef('idx')}
                style={{ ...selStyle, color: !selectedProduct ? '#9ca3af' : '#111' }}
                value={displayIdx || ''}
                disabled={!selectedProduct}
                onKeyDown={e => handleCascadeKeyDown('idx', e)}>
                <option value="">{selectedProduct ? displayIdx || '-' : '-'}</option>
              </select>
            </div>

            {/* 누진대 */}
            <div>
              <label style={labelSt}>누진대</label>
              <select
                ref={setCascadeRef('corr')}
                style={{ ...selStyle, color: (displayType !== '누진다초점' || !selectedProduct) ? '#9ca3af' : '#111' }}
                value={cCorr}
                disabled={displayType !== '누진다초점' || !selectedProduct}
                onChange={e => {
                  setCCorr(e.target.value)
                  // 선택 후 처방으로 이동
                  if (e.target.value) setTimeout(() => focusRxField('R', 'sph'), 100)
                }}
                onKeyDown={e => handleCascadeKeyDown('corr', e)}>
                <option value="">{displayType === '누진다초점' ? '선택' : '-'}</option>
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
                  <th style={{ ...rxTh, width: 60 }}>SPH</th>
                  <th style={{ ...rxTh, width: 60 }}>CYL</th>
                  <th style={{ ...rxTh, width: 45 }}>AXIS</th>
                  <th style={{ ...rxTh, width: 50 }}>ADD</th>
                  <th style={{ ...rxTh, width: 40 }}>PD</th>
                  <th style={{ ...rxTh, width: 55 }}>PRISM</th>
                  <th style={{ ...rxTh, width: 50 }}>BASE</th>
                  <th style={{ ...rxTh, width: 45 }}>CURVE</th>
                </tr>
              </thead>
              <tbody>
                {(['R', 'L'] as const).map(side => {
                  const rx    = side === 'R' ? rxR : rxL
                  const color = side === 'R' ? '#2563eb' : '#16a34a'
                  return (
                    <tr key={side}>
                      <td style={{ ...rxTd, background: '#f4f6f8', fontWeight: 700, fontSize: 11, color }}>{side}</td>

                      {/* SPH — 입력+드롭다운 (0.25 단위) */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-sph`)}
                          list={`sph-options-${side}`}
                          style={{ ...inpStyle, width: '100%', fontSize: 11 }}
                          value={rx.sph}
                          placeholder="-"
                          onChange={e => setRx(side, 'sph', e.target.value)}
                          onBlur={e => {
                            const converted = parseRxInput(e.target.value, 'sph')
                            if (converted !== e.target.value) setRx(side, 'sph', converted)
                          }}
                          onKeyDown={e => handleRxKeyDown(side, 'sph', e)}
                          onWheel={e => handleRxWheel(side, 'sph', e)}
                        />
                        <datalist id={`sph-options-${side}`}>
                          {SPH_OPTIONS.map(v => <option key={v} value={v} />)}
                        </datalist>
                      </td>

                      {/* CYL — 입력+드롭다운 (0.25 단위) */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-cyl`)}
                          list={`cyl-options-${side}`}
                          style={{ ...inpStyle, width: '100%', fontSize: 11 }}
                          value={rx.cyl}
                          placeholder="-"
                          onChange={e => setRx(side, 'cyl', e.target.value)}
                          onBlur={e => {
                            const converted = parseRxInput(e.target.value, 'cyl')
                            if (converted !== e.target.value) setRx(side, 'cyl', converted)
                          }}
                          onKeyDown={e => handleRxKeyDown(side, 'cyl', e)}
                          onWheel={e => handleRxWheel(side, 'cyl', e)}
                        />
                        <datalist id={`cyl-options-${side}`}>
                          {CYL_OPTIONS.map(v => <option key={v} value={v} />)}
                        </datalist>
                      </td>

                      {/* AXIS — 드롭다운+입력 (0~180) */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-axis`)}
                          list={`axis-options-${side}`}
                          style={{ ...inpStyle, width: '100%', fontSize: 11 }}
                          value={rx.axis}
                          placeholder="-"
                          onChange={e => setRx(side, 'axis', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'axis', e)}
                          onWheel={e => handleRxWheel(side, 'axis', e)}
                        />
                        <datalist id={`axis-options-${side}`}>
                          {AXIS_OPTIONS.map(v => <option key={v} value={v} />)}
                        </datalist>
                      </td>

                      {/* ADD — 드롭다운+입력 (+0.50~+4.00, 0.25단위) */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-add`)}
                          list={`add-options-${side}`}
                          style={{ ...inpStyle, width: '100%', fontSize: 11 }}
                          value={rx.add}
                          placeholder="-"
                          onChange={e => setRx(side, 'add', e.target.value)}
                          onBlur={e => blurRx(side, 'add', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'add', e)}
                          onWheel={e => handleRxWheel(side, 'add', e)}
                        />
                        <datalist id={`add-options-${side}`}>
                          {ADD_OPTIONS.map(v => <option key={v} value={v} />)}
                        </datalist>
                      </td>

                      {/* PD — 키보드 네비게이션 */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-pd`)}
                          style={{ ...inpStyle, width: '100%' }}
                          type="number" step="0.5" placeholder="-"
                          value={rx.pd}
                          onChange={e => setRx(side, 'pd', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'pd', e)}
                        />
                      </td>

                      {/* PRISM — 키보드 네비게이션 */}
                      <td style={rxTd}>
                        <select
                          ref={setRxRef(`${side}-prism`) as React.Ref<HTMLSelectElement>}
                          style={{ ...inpStyle, width: '100%', cursor: 'pointer' }}
                          value={rx.prism}
                          onChange={e => setRx(side, 'prism', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'prism', e)}>
                          <option value="">-</option>
                          {PRISM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* BASE — 키보드 네비게이션 */}
                      <td style={rxTd}>
                        <select
                          ref={setRxRef(`${side}-base`) as React.Ref<HTMLSelectElement>}
                          style={{ ...inpStyle, width: '100%', cursor: 'pointer' }}
                          value={rx.base}
                          onChange={e => setRx(side, 'base', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'base', e)}>
                          <option value="">-</option>
                          {BASE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </td>

                      {/* CURVE — 숫자 입력 */}
                      <td style={rxTd}>
                        <input
                          ref={setRxRef(`${side}-curve`)}
                          style={{ ...inpStyle, width: '100%' }}
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={rx.curve}
                          placeholder="-"
                          onChange={e => setRx(side, 'curve', e.target.value)}
                          onKeyDown={e => handleRxKeyDown(side, 'curve', e)}
                          onWheel={e => handleRxWheel(side, 'curve', e)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ③ 피팅 + 가공 정보 */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={secHead}><span>👓 피팅</span></div>
          <div style={secBody}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}>
              <div>
                <label style={labelSt}>PD (양안)</label>
                <input
                  ref={setFrameRef('fpd_input')}
                  type="number" 
                  step="0.5"
                  placeholder="64"
                  value={fittingPdCalc}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val) && val > 0) {
                      const half = (val / 2).toFixed(1)
                      setRx('R', 'pd', half)
                      setRx('L', 'pd', half)
                    } else if (e.target.value === '') {
                      setRx('R', 'pd', '')
                      setRx('L', 'pd', '')
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('fw')
                    }
                  }}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '2px solid #5d7a5d', borderRadius: 4, background: '#f0faf5', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>가로 (mm)</label>
                <input
                  ref={setFrameRef('fw')}
                  type="number" value={fw}
                  onChange={e => setFw(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('fb')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('fpd_input')
                    }
                  }}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>브릿지 (mm)</label>
                <input
                  ref={setFrameRef('fb')}
                  type="number" value={fb}
                  onChange={e => setFb(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('fd')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('fw')
                    }
                  }}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>대각 (mm)</label>
                <input
                  ref={setFrameRef('fd')}
                  type="number" value={fd}
                  onChange={e => setFd(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('fh')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('fb')
                    }
                  }}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>상하 (mm)</label>
                <input
                  ref={setFrameRef('fh')}
                  type="number" value={fh}
                  onChange={e => setFh(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('fsize')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('fd')
                    }
                  }}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>ED (유효직경)</label>
                <input
                  type="text" 
                  value={fittingED ? `${fittingED}mm` : ''}
                  readOnly
                  placeholder="--mm"
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#f0faf5', color: '#5d7a5d', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            {/* 편심 입력 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginTop: 8,
            }}>
              <div>
                <label style={labelSt}>편심 R</label>
                <input
                  ref={setFrameRef('decR')}
                  type="number"
                  step="0.5"
                  value={decR}
                  onChange={e => setDecR(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('decL')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('fh')
                    }
                  }}
                  placeholder="0"
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={labelSt}>편심 L</label>
                <input
                  ref={setFrameRef('decL')}
                  type="number"
                  step="0.5"
                  value={decL}
                  onChange={e => setDecL(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'ArrowRight') {
                      e.preventDefault(); focusFrameField('memo')
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault(); focusFrameField('decR')
                    }
                  }}
                  placeholder="0"
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', outline: 'none' }}
                />
              </div>
              {/* 최소블랭크 (자동계산, 표시만) */}
              <div>
                <label style={labelSt}>최소블랭크</label>
                <input
                  type="text" 
                  value={(() => {
                    const ed = parseFloat(fittingED)
                    const dr = Math.abs(parseFloat(decR) || 0)
                    const dl = Math.abs(parseFloat(decL) || 0)
                    if (isNaN(ed) || ed <= 0) return ''
                    const maxDec = Math.max(dr, dl)
                    return `${(ed + maxDec * 2 + 2).toFixed(1)}mm`
                  })()}
                  readOnly
                  placeholder="--mm"
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#f8f8f8', color: '#6b7280', outline: 'none' }}
                />
              </div>
              <div />
            </div>

            {/* 자동 계산값 표시 */}
            {(fittingFPD || autoFrameSize) && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '8px 20px', 
                marginTop: 12,
                marginBottom: 8, 
                padding: '8px 12px',
                background: '#f8faf9',
                borderRadius: 6,
                fontSize: 11, 
                color: '#6b7280' 
              }}>
                {autoFrameSize && (
                  <span>사이즈: <strong style={{ color: '#5d7a5d' }}>{autoFrameSize}</strong></span>
                )}
                {fittingFPD && (
                  <span>FPD: <strong style={{ color: '#5d7a5d' }}>{fittingFPD}</strong></span>
                )}
                <span>굴절률: <strong style={{ color: '#5d7a5d' }}>{refractiveIndex}</strong></span>
              </div>
            )}

            {/* 렌즈 두께 예상 표시 */}
            {(lensThickness.r || lensThickness.l) && (
              <div style={{ 
                marginBottom: 12, 
                padding: '10px 12px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: 6,
                border: '1px solid #f59e0b',
                fontSize: 11
              }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 6 }}>
                  📏 예상 렌즈 두께 (비구면 기준)
                </div>
                <div style={{ display: 'flex', gap: 24, color: '#78350f' }}>
                  {lensThickness.r && (
                    <div>
                      <strong>R:</strong>{' '}
                      {lensThickness.r.type === 'minus' ? (
                        <>중심 {lensThickness.r.center}mm → 가장자리 <strong>{lensThickness.r.edgeMax}mm</strong> ({lensThickness.r.axis} 최대)</>
                      ) : (
                        <>중심 <strong>{lensThickness.r.center}mm</strong> → 가장자리 {lensThickness.r.edgeMax}mm</>
                      )}
                    </div>
                  )}
                  {lensThickness.l && (
                    <div>
                      <strong>L:</strong>{' '}
                      {lensThickness.l.type === 'minus' ? (
                        <>중심 {lensThickness.l.center}mm → 가장자리 <strong>{lensThickness.l.edgeMax}mm</strong> ({lensThickness.l.axis} 최대)</>
                      ) : (
                        <>중심 <strong>{lensThickness.l.center}mm</strong> → 가장자리 {lensThickness.l.edgeMax}mm</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 가공 정보 */}
            <div style={{ paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <label style={labelSt}>가공 유형</label>
                  <select
                    value={processType}
                    onChange={e => setProcessType(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); focusFrameField('memo')
                      }
                    }}
                    style={{ ...selStyle, width: 'auto', minWidth: 130 }}
                  >
                    {PROCESS_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelSt}>가공 메모</label>
                  <input
                    ref={setFrameRef('memo')}
                    value={processMemo}
                    onChange={e => setProcessMemo(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        // 착색 드롭다운으로 이동
                      }
                    }}
                    placeholder="가공 메모..."
                    style={fieldInputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ④ 코팅 */}
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

        {/* ⑤ 착색 — 브랜드별 드롭다운 */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={secHead}><span>🎨 착색</span></div>
          <div style={secBody}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* 브랜드 드롭다운 */}
              <div>
                <label style={labelSt}>브랜드</label>
                <select
                  value={tintBrand}
                  onChange={e => { setTintBrand(e.target.value as TintBrandKey); setTintColor('none') }}
                  style={{ ...selStyle, minWidth: 100 }}
                >
                  {TINT_BRANDS.map(tb => (
                    <option key={tb.key} value={tb.key}>{tb.label}</option>
                  ))}
                </select>
              </div>

              {/* 착색 색상 드롭다운 */}
              <div>
                <label style={labelSt}>색상</label>
                <select
                  value={tintColor}
                  onChange={e => setTintColor(e.target.value)}
                  style={{ ...selStyle, minWidth: 140 }}
                >
                  <option value="none">없음</option>
                  {activeTintColors.map(tc => (
                    <option key={tc.key} value={tc.key}>{tc.label}</option>
                  ))}
                </select>
              </div>

              {/* 농도 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={labelSt}>농도</label>
                <input
                  type="number" min={0} max={85} step={5}
                  value={tintDensity}
                  onChange={e => setTintDensity(Math.max(0, Math.min(85, parseInt(e.target.value) || 0)))}
                  style={{
                    width: 60, padding: '5px 8px', fontSize: 12,
                    border: '1px solid #d1d5db', borderRadius: 4, textAlign: 'center',
                  }}
                />
                <span style={{ color: '#6b7280', fontSize: 12 }}>%</span>
              </div>

              {/* 그라데이션 */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', paddingBottom: 4 }}>
                <input
                  type="checkbox" checked={tintGradient}
                  onChange={e => setTintGradient(e.target.checked)}
                  style={{ accentColor: G }}
                />
                그라데이션
              </label>

              {/* 선택된 색상 미리보기 */}
              {tintColor !== 'none' && (
                <div style={{ 
                  width: 24, height: 24, borderRadius: 4, 
                  background: activeTintColors.find(c => c.key === tintColor)?.hex || '#ccc',
                  border: '1px solid #d1d5db',
                  marginBottom: 4,
                }} title={activeTintColors.find(c => c.key === tintColor)?.label} />
              )}
            </div>
          </div>
        </div>

        {/* ⑥ 고객명 + 메모 */}
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
})

RxOrderForm.displayName = 'RxOrderForm'

export default RxOrderForm
