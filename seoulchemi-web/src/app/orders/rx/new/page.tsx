'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Layout, { btnStyle, selectStyle, inputStyle, cardStyle, thStyle, tdStyle } from '../../../components/Layout'
import { ORDER_SIDEBAR } from '../../../constants/sidebar'

// 타입 정의
interface Brand { id: number; name: string }
interface Product { 
  id: number
  name: string
  brandId: number
  brand?: { name: string }
  sellingPrice: number
  productType: string
  optionType: string
}
interface Store { 
  id: number
  name: string
  code: string
  phone?: string
  address?: string
}

// 처방 정보 타입
interface Prescription {
  sph: string
  cyl: string
  axis: string
  add: string
  ioBase: string    // IO베이스
  ioPrism: string   // IO프리즘
  udBase: string    // UD베이스
  udPrism: string   // UD프리즘
  curve: string     // 커브
  phiType: string   // 파이구분
  phiH: string      // 가로파이
  phiV: string      // 세로파이
  decentH: string   // 가로편심(IN)
  decentV: string   // 세로편심(UP)
}

// 가공 정보 타입
interface ProcessingInfo {
  pd: string        // 단안PD
  oh: string        // OH(광학중심)
  tilt: string      // T(경사각)
  wrap: string      // W(안면각)
  inset: string     // INSET
  ct: string        // CT(중심두께)
  et: string        // ET(가두께)
  vd: string        // VD(정점간거리)
  frameW: string    // 테가로
  frameH: string    // 테높이
  bridge: string    // 브릿지
  ed: string        // ED(대각)
  readDist: string  // 명시거리
}

const emptyPrescription: Prescription = {
  sph: '', cyl: '', axis: '', add: '',
  ioBase: '', ioPrism: '', udBase: '', udPrism: '',
  curve: '', phiType: '', phiH: '', phiV: '',
  decentH: '', decentV: ''
}

const emptyProcessing: ProcessingInfo = {
  pd: '', oh: '', tilt: '', wrap: '', inset: '',
  ct: '', et: '', vd: '',
  frameW: '', frameH: '', bridge: '', ed: '', readDist: ''
}

export default function RxNewOrderPage() {
  // 기본 상태
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  
  // 제품 선택
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [category, setCategory] = useState<'여벌착색' | 'RX' | '매직폼'>('RX')
  const [level2, setLevel2] = useState<string>('')
  const [level3, setLevel3] = useState<string>('')
  const [level4, setLevel4] = useState<string>('')
  
  // R/L 품목
  const [productR, setProductR] = useState<Product | null>(null)
  const [productL, setProductL] = useState<Product | null>(null)
  
  // 주문 정보
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [storeSearch, setStoreSearch] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [initials, setInitials] = useState('')
  const [memo, setMemo] = useState('')
  const [shipperMemo, setShipperMemo] = useState('')
  const [matchType, setMatchType] = useState<'원형' | '매치'>('원형')
  
  // 처방 정보 (R/L)
  const [prescriptionR, setPrescriptionR] = useState<Prescription>(emptyPrescription)
  const [prescriptionL, setPrescriptionL] = useState<Prescription>(emptyPrescription)
  
  // 가공 정보 (R/L)
  const [processingR, setProcessingR] = useState<ProcessingInfo>(emptyProcessing)
  const [processingL, setProcessingL] = useState<ProcessingInfo>(emptyProcessing)
  
  // 추가 옵션
  const [serviceCode, setServiceCode] = useState('')
  const [freeformType, setFreeformType] = useState<'USH' | 'HMC' | 'HC' | 'NC'>('USH')
  const [colorName, setColorName] = useState('')
  
  // Refs
  const storeInputRef = useRef<HTMLInputElement>(null)

  // 카테고리별 Level2 옵션
  const level2Options = {
    '여벌착색': ['단초점', '단초점 하이커브', '다초점'],
    'RX': ['단초점', '변색', '편광'],
    '매직폼': ['스탠다드', '프리미엄']
  }

  // 데이터 로드
  useEffect(() => {
    // 브랜드 & 상품 로드
    fetch('/api/products').then(r => r.json()).then(data => {
      setBrands(data.brands || [])
      setProducts(data.products || [])
    })
    // 거래처 로드
    fetch('/api/stores?limit=1000').then(r => r.json()).then(data => {
      setStores(data.stores || [])
    })
  }, [])

  // F9 키 핸들러 - 주문 접수
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault()
        handleSubmitOrder()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStore, productR, productL, prescriptionR, prescriptionL])

  // 필터링된 상품 (브랜드 + 카테고리 기준)
  const filteredProducts = products.filter(p => {
    if (selectedBrandId && p.brandId !== selectedBrandId) return false
    // TODO: 카테고리, Level2 등으로 추가 필터링
    return true
  })

  // 거래처 검색 결과
  const storeResults = storeSearch 
    ? stores.filter(s => 
        s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.code.includes(storeSearch)
      ).slice(0, 10)
    : []

  // 초기화
  const handleReset = () => {
    setSelectedBrandId(null)
    setCategory('RX')
    setLevel2('')
    setLevel3('')
    setLevel4('')
    setProductR(null)
    setProductL(null)
    setSelectedStore(null)
    setStoreSearch('')
    setCustomerName('')
    setInitials('')
    setMemo('')
    setShipperMemo('')
    setMatchType('원형')
    setPrescriptionR(emptyPrescription)
    setPrescriptionL(emptyPrescription)
    setProcessingR(emptyProcessing)
    setProcessingL(emptyProcessing)
    setServiceCode('')
    setFreeformType('USH')
    setColorName('')
  }

  // 주문 접수 (F9)
  const handleSubmitOrder = async () => {
    // 유효성 검사
    if (!selectedStore) {
      alert('출하처(가맹점)를 선택해주세요.')
      return
    }
    if (!productR && !productL) {
      alert('R 또는 L 품목을 선택해주세요.')
      return
    }
    
    setLoading(true)
    try {
      const orderData = {
        storeId: selectedStore.id,
        orderType: 'rx',
        customerName,
        initials,
        memo,
        shipperMemo,
        matchType,
        serviceCode,
        freeformType,
        colorName,
        items: [
          productR && {
            side: 'R',
            productId: productR.id,
            prescription: prescriptionR,
            processing: processingR
          },
          productL && {
            side: 'L',
            productId: productL.id,
            prescription: prescriptionL,
            processing: processingL
          }
        ].filter(Boolean)
      }
      
      const res = await fetch('/api/orders/rx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`RX 주문이 접수되었습니다!\n주문번호: ${data.orderNo}`)
        handleReset()
      } else {
        const err = await res.json()
        alert(`접수 실패: ${err.error}`)
      }
    } catch (error) {
      console.error('Order submit error:', error)
      alert('주문 접수 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 처방 입력 핸들러
  const handlePrescriptionChange = (side: 'R' | 'L', field: keyof Prescription, value: string) => {
    if (side === 'R') {
      setPrescriptionR(prev => ({ ...prev, [field]: value }))
    } else {
      setPrescriptionL(prev => ({ ...prev, [field]: value }))
    }
  }

  // 가공 정보 입력 핸들러
  const handleProcessingChange = (side: 'R' | 'L', field: keyof ProcessingInfo, value: string) => {
    if (side === 'R') {
      setProcessingR(prev => ({ ...prev, [field]: value }))
    } else {
      setProcessingL(prev => ({ ...prev, [field]: value }))
    }
  }

  // 입력 스타일
  const smallInput: React.CSSProperties = {
    width: 60,
    padding: '6px 8px',
    fontSize: 13,
    border: '1px solid var(--gray-200)',
    borderRadius: 4,
    textAlign: 'center'
  }

  const cellInput: React.CSSProperties = {
    width: '100%',
    padding: '4px',
    fontSize: 12,
    border: '1px solid var(--gray-200)',
    borderRadius: 2,
    textAlign: 'center'
  }

  return (
    <Layout sidebarMenus={ORDER_SIDEBAR} activeNav="주문">
      {/* 타이틀 */}
      <div style={{ 
        background: '#5d4e37', 
        color: '#fff', 
        padding: '12px 20px', 
        borderRadius: '8px 8px 0 0',
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>RX 주문 접수</span>
        <span style={{ fontSize: 12, opacity: 0.8 }}>F9 = 접수</span>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ ...cardStyle, borderRadius: '0 0 8px 8px', padding: 16 }}>
        
        {/* 상단: 제품 선택 영역 */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 16, 
          padding: 12, 
          background: 'var(--gray-50)', 
          borderRadius: 8 
        }}>
          {/* 브랜드 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>브랜드</label>
            <select
              value={selectedBrandId || ''}
              onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : null)}
              style={{ ...selectStyle, minWidth: 120 }}
            >
              <option value="">전체</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* 카테고리 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>카테고리</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['여벌착색', 'RX', '매직폼'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setLevel2('') }}
                  style={{
                    ...btnStyle,
                    padding: '6px 12px',
                    fontSize: 13,
                    background: category === cat ? 'var(--primary)' : '#fff',
                    color: category === cat ? '#fff' : 'var(--gray-700)',
                    border: category === cat ? 'none' : '1px solid var(--gray-300)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Level2 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>Level2</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {level2Options[category].map(opt => (
                <button
                  key={opt}
                  onClick={() => setLevel2(opt)}
                  style={{
                    ...btnStyle,
                    padding: '6px 12px',
                    fontSize: 13,
                    background: level2 === opt ? '#4a6b4a' : '#fff',
                    color: level2 === opt ? '#fff' : 'var(--gray-700)',
                    border: level2 === opt ? 'none' : '1px solid var(--gray-300)'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 주문 정보 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 12, 
          marginBottom: 16,
          padding: 12,
          background: '#fff',
          border: '1px solid var(--gray-200)',
          borderRadius: 8
        }}>
          {/* 출하처 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>출하처 *</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={storeInputRef}
                type="text"
                value={selectedStore ? selectedStore.name : storeSearch}
                onChange={(e) => { setStoreSearch(e.target.value); setSelectedStore(null) }}
                placeholder="가맹점 검색..."
                style={{ ...inputStyle, width: '100%' }}
              />
              {storeResults.length > 0 && !selectedStore && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {storeResults.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { setSelectedStore(s); setStoreSearch('') }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-100)',
                        fontSize: 13
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <strong>{s.name}</strong>
                      <span style={{ color: 'var(--gray-500)', marginLeft: 8 }}>{s.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 고객명 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>고객명</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* 이니셜 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>이니셜</label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* 비고 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>비고</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* R-품목 */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>R-품목</label>
            <select
              value={productR?.id || ''}
              onChange={(e) => {
                const p = filteredProducts.find(p => p.id === Number(e.target.value))
                setProductR(p || null)
              }}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">선택...</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* L-품목 */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>L-품목</label>
            <select
              value={productL?.id || ''}
              onChange={(e) => {
                const p = filteredProducts.find(p => p.id === Number(e.target.value))
                setProductL(p || null)
              }}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">선택...</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 출하처 비고 */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>출하처 비고</label>
            <input
              type="text"
              value={shipperMemo}
              onChange={(e) => setShipperMemo(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* 매치선택 */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>매치선택</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as '원형' | '매치')}
              style={{ ...selectStyle, width: 120 }}
            >
              <option value="원형">원형</option>
              <option value="매치">매치</option>
            </select>
          </div>
        </div>

        {/* 처방 그리드 */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>
            처방 정보
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th style={{ ...thStyle, width: 80 }}></th>
                  <th style={thStyle}>SPH</th>
                  <th style={thStyle}>CYL</th>
                  <th style={thStyle}>AXIS</th>
                  <th style={thStyle}>ADD</th>
                  <th style={thStyle}>IO베이스</th>
                  <th style={thStyle}>IO프리즘</th>
                  <th style={thStyle}>UD베이스</th>
                  <th style={thStyle}>UD프리즘</th>
                  <th style={thStyle}>커브</th>
                  <th style={thStyle}>파이구분</th>
                  <th style={thStyle}>가로파이</th>
                  <th style={thStyle}>세로파이</th>
                  <th style={thStyle}>가로편심</th>
                  <th style={thStyle}>세로편심</th>
                </tr>
              </thead>
              <tbody>
                {/* R 오른쪽 */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#fff3e0' }}>R 오른쪽</td>
                  {(['sph', 'cyl', 'axis', 'add', 'ioBase', 'ioPrism', 'udBase', 'udPrism', 'curve', 'phiType', 'phiH', 'phiV', 'decentH', 'decentV'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input
                        type="text"
                        value={prescriptionR[field]}
                        onChange={(e) => handlePrescriptionChange('R', field, e.target.value)}
                        style={cellInput}
                      />
                    </td>
                  ))}
                </tr>
                {/* L 왼쪽 */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#e3f2fd' }}>L 왼쪽</td>
                  {(['sph', 'cyl', 'axis', 'add', 'ioBase', 'ioPrism', 'udBase', 'udPrism', 'curve', 'phiType', 'phiH', 'phiV', 'decentH', 'decentV'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input
                        type="text"
                        value={prescriptionL[field]}
                        onChange={(e) => handlePrescriptionChange('L', field, e.target.value)}
                        style={cellInput}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
            ※ SPH, CYL은 부호와 숫자만 입력 (예: -0.25 → -25, -10.00 → -1000)
          </p>
        </div>

        {/* 서비스 옵션 */}
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          alignItems: 'center', 
          marginBottom: 16,
          padding: 12,
          background: 'var(--gray-50)',
          borderRadius: 8
        }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', marginRight: 8 }}>서비스 코드</label>
            <input
              type="text"
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value)}
              style={{ ...smallInput, width: 100 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', marginRight: 8 }}>프리폼 주문형태</label>
            <div style={{ display: 'inline-flex', gap: 12 }}>
              {(['USH', 'HMC', 'HC', 'NC'] as const).map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="freeformType"
                    checked={freeformType === type}
                    onChange={() => setFreeformType(type)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: 13 }}>{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', marginRight: 8 }}>색상명</label>
            <input
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              style={{ ...smallInput, width: 120 }}
            />
          </div>
        </div>

        {/* 가공 정보 그리드 */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>
            가공 정보
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th style={{ ...thStyle, width: 80 }}></th>
                  <th style={thStyle}>단안PD</th>
                  <th style={thStyle}>OH(광학중심)</th>
                  <th style={thStyle}>T(경사각)</th>
                  <th style={thStyle}>W(안면각)</th>
                  <th style={thStyle}>INSET</th>
                  <th style={thStyle}>CT(중심두께)</th>
                  <th style={thStyle}>ET(가두께)</th>
                  <th style={thStyle}>VD(정점간거리)</th>
                  <th style={thStyle}>테가로</th>
                  <th style={thStyle}>테높이</th>
                  <th style={thStyle}>브릿지</th>
                  <th style={thStyle}>ED(대각)</th>
                  <th style={thStyle}>명시거리</th>
                </tr>
              </thead>
              <tbody>
                {/* R 오른쪽 */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#fff3e0' }}>R 오른쪽</td>
                  {(['pd', 'oh', 'tilt', 'wrap', 'inset', 'ct', 'et', 'vd', 'frameW', 'frameH', 'bridge', 'ed', 'readDist'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input
                        type="text"
                        value={processingR[field]}
                        onChange={(e) => handleProcessingChange('R', field, e.target.value)}
                        style={cellInput}
                      />
                    </td>
                  ))}
                </tr>
                {/* L 왼쪽 */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#e3f2fd' }}>L 왼쪽</td>
                  {(['pd', 'oh', 'tilt', 'wrap', 'inset', 'ct', 'et', 'vd', 'frameW', 'frameH', 'bridge', 'ed', 'readDist'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input
                        type="text"
                        value={processingL[field]}
                        onChange={(e) => handleProcessingChange('L', field, e.target.value)}
                        style={cellInput}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <button
            onClick={handleReset}
            style={{
              ...btnStyle,
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🔄 초기화
          </button>
          <button
            onClick={handleSubmitOrder}
            disabled={loading}
            style={{
              ...btnStyle,
              padding: '10px 32px',
              background: '#e65100',
              color: '#fff',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {loading ? '접수 중...' : '📝 주문하기 (F9)'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
