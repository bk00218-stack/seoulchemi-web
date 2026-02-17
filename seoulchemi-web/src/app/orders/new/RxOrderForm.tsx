'use client'

import { useState, useEffect } from 'react'

// 타입 정의
interface Product { 
  id: number
  name: string
  brandId: number
  brand?: string
  sellingPrice: number
}

// 처방 정보 타입
interface Prescription {
  sph: string
  cyl: string
  axis: string
  add: string
  ioBase: string
  ioPrism: string
  udBase: string
  udPrism: string
  curve: string
  phiType: string
  phiH: string
  phiV: string
  decentH: string
  decentV: string
}

// 가공 정보 타입
interface ProcessingInfo {
  pd: string
  oh: string
  tilt: string
  wrap: string
  inset: string
  ct: string
  et: string
  vd: string
  frameW: string
  frameH: string
  bridge: string
  ed: string
  readDist: string
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

interface RxOrderFormProps {
  orderType: '착색' | 'RX'
  products: Product[]
  selectedBrandId: number | null
  onSubmit?: (data: any) => void
}

export default function RxOrderForm({ orderType, products, selectedBrandId, onSubmit }: RxOrderFormProps) {
  // 카테고리별 Level2 옵션
  const level2Options = orderType === '착색' 
    ? ['단초점', '단초점 하이커브', '다초점']
    : ['단초점', '변색', '편광']

  // 상태
  const [level2, setLevel2] = useState<string>('')
  const [productR, setProductR] = useState<Product | null>(null)
  const [productL, setProductL] = useState<Product | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [initials, setInitials] = useState('')
  const [memo, setMemo] = useState('')
  const [shipperMemo, setShipperMemo] = useState('')
  const [matchType, setMatchType] = useState<'원형' | '매치'>('원형')
  const [prescriptionR, setPrescriptionR] = useState<Prescription>(emptyPrescription)
  const [prescriptionL, setPrescriptionL] = useState<Prescription>(emptyPrescription)
  const [processingR, setProcessingR] = useState<ProcessingInfo>(emptyProcessing)
  const [processingL, setProcessingL] = useState<ProcessingInfo>(emptyProcessing)
  const [serviceCode, setServiceCode] = useState('')
  const [freeformType, setFreeformType] = useState<'USH' | 'HMC' | 'HC' | 'NC'>('USH')
  const [colorName, setColorName] = useState('')

  // 필터링된 상품
  const filteredProducts = selectedBrandId 
    ? products.filter(p => p.brandId === selectedBrandId)
    : products

  // 초기화
  const handleReset = () => {
    setLevel2('')
    setProductR(null)
    setProductL(null)
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

  // 데이터 수집
  const getOrderData = () => ({
    orderType,
    level2,
    customerName,
    initials,
    memo,
    shipperMemo,
    matchType,
    serviceCode,
    freeformType,
    colorName,
    items: [
      productR && { side: 'R', productId: productR.id, prescription: prescriptionR, processing: processingR },
      productL && { side: 'L', productId: productL.id, prescription: prescriptionL, processing: processingL }
    ].filter(Boolean)
  })

  // 스타일
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid #ccc',
    borderRadius: 4,
  }

  const cellInput: React.CSSProperties = {
    width: '100%',
    padding: '3px 4px',
    fontSize: 11,
    border: '1px solid #ddd',
    borderRadius: 2,
    textAlign: 'center'
  }

  const thStyle: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: 10,
    fontWeight: 600,
    background: '#f5f5f5',
    border: '1px solid #ddd',
    whiteSpace: 'nowrap'
  }

  const tdStyle: React.CSSProperties = {
    padding: '4px',
    border: '1px solid #ddd',
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: '#fff', 
      border: '1px solid #c5dbc5', 
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{ 
        padding: '8px 12px', 
        background: 'linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 700, color: '#fff' }}>
          {orderType} 주문 입력
        </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
          R/L 품목 선택 후 처방 입력
        </span>
      </div>

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {/* Level2 선택 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Level2</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {level2Options.map(opt => (
              <button
                key={opt}
                onClick={() => setLevel2(opt)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  background: level2 === opt ? '#4a6b4a' : '#fff',
                  color: level2 === opt ? '#fff' : '#333',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* R/L 품목 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>R-품목</label>
            <select
              value={productR?.id || ''}
              onChange={(e) => {
                const p = filteredProducts.find(p => p.id === Number(e.target.value))
                setProductR(p || null)
              }}
              style={inputStyle}
            >
              <option value="">선택...</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>L-품목</label>
            <select
              value={productL?.id || ''}
              onChange={(e) => {
                const p = filteredProducts.find(p => p.id === Number(e.target.value))
                setProductL(p || null)
              }}
              style={inputStyle}
            >
              <option value="">선택...</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 고객 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>고객명</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>이니셜</label>
            <input type="text" value={initials} onChange={(e) => setInitials(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>비고</label>
            <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>매치선택</label>
            <select value={matchType} onChange={(e) => setMatchType(e.target.value as '원형' | '매치')} style={inputStyle}>
              <option value="원형">원형</option>
              <option value="매치">매치</option>
            </select>
          </div>
        </div>

        {/* 처방 그리드 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 600 }}>처방 정보</label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 50 }}></th>
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
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#fff3e0', textAlign: 'center', fontSize: 11 }}>R</td>
                  {(['sph', 'cyl', 'axis', 'add', 'ioBase', 'ioPrism', 'udBase', 'udPrism', 'curve', 'phiType', 'phiH', 'phiV', 'decentH', 'decentV'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input type="text" value={prescriptionR[field]} onChange={(e) => handlePrescriptionChange('R', field, e.target.value)} style={cellInput} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#e3f2fd', textAlign: 'center', fontSize: 11 }}>L</td>
                  {(['sph', 'cyl', 'axis', 'add', 'ioBase', 'ioPrism', 'udBase', 'udPrism', 'curve', 'phiType', 'phiH', 'phiV', 'decentH', 'decentV'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input type="text" value={prescriptionL[field]} onChange={(e) => handlePrescriptionChange('L', field, e.target.value)} style={cellInput} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 서비스 옵션 */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', marginRight: 6 }}>서비스 코드</label>
            <input type="text" value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} style={{ ...inputStyle, width: 80 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: '#666' }}>프리폼</label>
            {(['USH', 'HMC', 'HC', 'NC'] as const).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontSize: 11 }}>
                <input type="radio" name="freeform" checked={freeformType === type} onChange={() => setFreeformType(type)} style={{ accentColor: '#5d7a5d' }} />
                {type}
              </label>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', marginRight: 6 }}>색상명</label>
            <input type="text" value={colorName} onChange={(e) => setColorName(e.target.value)} style={{ ...inputStyle, width: 100 }} />
          </div>
        </div>

        {/* 가공 정보 그리드 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 600 }}>가공 정보</label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 50 }}></th>
                  <th style={thStyle}>단안PD</th>
                  <th style={thStyle}>OH</th>
                  <th style={thStyle}>T(경사각)</th>
                  <th style={thStyle}>W(안면각)</th>
                  <th style={thStyle}>INSET</th>
                  <th style={thStyle}>CT</th>
                  <th style={thStyle}>ET</th>
                  <th style={thStyle}>VD</th>
                  <th style={thStyle}>테가로</th>
                  <th style={thStyle}>테높이</th>
                  <th style={thStyle}>브릿지</th>
                  <th style={thStyle}>ED</th>
                  <th style={thStyle}>명시거리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#fff3e0', textAlign: 'center', fontSize: 11 }}>R</td>
                  {(['pd', 'oh', 'tilt', 'wrap', 'inset', 'ct', 'et', 'vd', 'frameW', 'frameH', 'bridge', 'ed', 'readDist'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input type="text" value={processingR[field]} onChange={(e) => handleProcessingChange('R', field, e.target.value)} style={cellInput} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, background: '#e3f2fd', textAlign: 'center', fontSize: 11 }}>L</td>
                  {(['pd', 'oh', 'tilt', 'wrap', 'inset', 'ct', 'et', 'vd', 'frameW', 'frameH', 'bridge', 'ed', 'readDist'] as const).map(field => (
                    <td key={field} style={tdStyle}>
                      <input type="text" value={processingL[field]} onChange={(e) => handleProcessingChange('L', field, e.target.value)} style={cellInput} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 출하처 비고 */}
        <div>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>출하처 비고</label>
          <input type="text" value={shipperMemo} onChange={(e) => setShipperMemo(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* 푸터 버튼 */}
      <div style={{ 
        padding: '8px 12px', 
        background: '#f5f5f5', 
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <button onClick={handleReset} style={{ padding: '6px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
          초기화
        </button>
        <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center' }}>
          ※ 접수는 오른쪽 패널에서
        </span>
      </div>
    </div>
  )
}
