'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout, { btnStyle, cardStyle, inputStyle, selectStyle } from '../../components/Layout'
import { PURCHASE_SIDEBAR } from '../../constants/sidebar'

export default function PurchaseNewPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    brand: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    memo: ''
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const totalAmount = formData.quantity * formData.unitPrice

  // 목업 데이터
  const mockSuppliers = [
    { id: 1, name: '(주)한국유리' },
    { id: 2, name: '대명글라스' },
    { id: 3, name: '서울자동차유리' },
  ]

  const mockBrands = ['현대', '기아', '쉐보레', '르노삼성', '쌍용', '기타']

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500 as const,
    color: 'var(--gray-700)',
    marginBottom: 6
  }

  const fieldGroupStyle = {
    marginBottom: 20
  }

  const handleSubmit = () => {
    toast.info('매입 등록 기능은 아직 준비 중입니다.')
  }

  return (
    <Layout sidebarMenus={PURCHASE_SIDEBAR} activeNav="매입">
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>매입 등록</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>신규 매입 내역을 등록합니다</p>
      </div>

      {/* Form Card */}
      <div style={{ ...cardStyle, padding: 24, maxWidth: 600 }}>
        {/* 매입일자 */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>매입일자 *</label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={e => handleChange('purchaseDate', e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>

        {/* 매입처 */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>매입처 *</label>
          <select
            value={formData.supplierId}
            onChange={e => handleChange('supplierId', e.target.value)}
            style={{ ...selectStyle, width: '100%' }}
          >
            <option value="">매입처를 선택하세요</option>
            {mockSuppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 브랜드 */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>브랜드</label>
          <select
            value={formData.brand}
            onChange={e => handleChange('brand', e.target.value)}
            style={{ ...selectStyle, width: '100%' }}
          >
            <option value="">브랜드 선택</option>
            {mockBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* 상품명 */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>상품명 *</label>
          <input
            type="text"
            placeholder="상품명을 입력하세요"
            value={formData.productName}
            onChange={e => handleChange('productName', e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>

        {/* 수량 / 단가 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...fieldGroupStyle }}>
          <div>
            <label style={labelStyle}>수량 *</label>
            <input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>단가 (원) *</label>
            <input
              type="number"
              min={0}
              value={formData.unitPrice}
              onChange={e => handleChange('unitPrice', parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        </div>

        {/* 매입금액 */}
        <div style={{ 
          ...cardStyle, 
          background: 'var(--gray-50)', 
          padding: 16, 
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>매입금액</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
            {totalAmount.toLocaleString()}원
          </span>
        </div>

        {/* 비고 */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>비고</label>
          <textarea
            placeholder="비고사항을 입력하세요"
            value={formData.memo}
            onChange={e => handleChange('memo', e.target.value)}
            rows={3}
            style={{ 
              ...inputStyle, 
              width: '100%', 
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button 
            style={{ ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-600)', border: 'none' }}
            onClick={() => window.history.back()}
          >
            취소
          </button>
          <button 
            style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}
            onClick={handleSubmit}
          >
            등록하기
          </button>
        </div>
      </div>
    </Layout>
  )
}
