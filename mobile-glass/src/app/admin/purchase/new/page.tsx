'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, CancelButton, SaveButton } from '../../../components/FormInput'

interface PurchaseForm {
  supplierId: string
  date: string
  brand: string
  product: string
  quantity: number
  unitPrice: number
  memo: string
}

interface PurchaseItem {
  id: number
  brand: string
  product: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [form, setForm] = useState<PurchaseForm>({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    brand: '',
    product: '',
    quantity: 1,
    unitPrice: 0,
    memo: ''
  })
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [nextId, setNextId] = useState(1)

  const handleChange = (name: string, value: string | number) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const addItem = () => {
    if (!form.brand || !form.product || form.quantity <= 0) {
      alert('상품 정보를 입력해주세요.')
      return
    }
    const newItem: PurchaseItem = {
      id: nextId,
      brand: form.brand,
      product: form.product,
      quantity: form.quantity,
      unitPrice: form.unitPrice,
      totalPrice: form.quantity * form.unitPrice
    }
    setItems([...items, newItem])
    setNextId(nextId + 1)
    setForm(prev => ({ ...prev, brand: '', product: '', quantity: 1, unitPrice: 0 }))
  }

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = () => {
    if (!form.supplierId) {
      alert('매입처를 선택해주세요.')
      return
    }
    if (items.length === 0) {
      alert('상품을 추가해주세요.')
      return
    }
    alert('매입이 등록되었습니다.')
    router.push('/admin/purchase')
  }

  const suppliers = [
    { label: '에실로코리아', value: '1' },
    { label: '호야광학', value: '2' },
    { label: '칼자이스코리아', value: '3' },
    { label: '니콘광학', value: '4' },
  ]

  const brands = [
    { label: '에실로', value: '에실로' },
    { label: '호야', value: '호야' },
    { label: '칼자이스', value: '칼자이스' },
    { label: '니콘', value: '니콘' },
  ]

  const products = [
    { label: '크리잘 사파이어 1.60', value: '크리잘 사파이어 1.60' },
    { label: '크리잘 블루컷 1.60', value: '크리잘 블루컷 1.60' },
    { label: '블루컨트롤 1.60', value: '블루컨트롤 1.60' },
    { label: '바리락스 X 1.60', value: '바리락스 X 1.60' },
    { label: '드라이브세이프 1.67', value: '드라이브세이프 1.67' },
  ]

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <AdminLayout activeMenu="purchase">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        매입등록
      </h2>

      <FormSection title="매입 기본정보">
        <FormGrid>
          <FormInput
            label="매입처"
            name="supplierId"
            type="select"
            value={form.supplierId}
            onChange={handleChange}
            options={suppliers}
            required
            placeholder="매입처를 선택하세요"
          />
          <FormInput
            label="매입일자"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </FormGrid>
      </FormSection>

      <FormSection title="상품 추가">
        <FormGrid>
          <FormInput
            label="브랜드"
            name="brand"
            type="select"
            value={form.brand}
            onChange={handleChange}
            options={brands}
          />
          <FormInput
            label="상품"
            name="product"
            type="select"
            value={form.product}
            onChange={handleChange}
            options={products}
          />
        </FormGrid>
        <FormGrid>
          <FormInput
            label="수량"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
          />
          <FormInput
            label="단가"
            name="unitPrice"
            type="number"
            value={form.unitPrice}
            onChange={handleChange}
            suffix="원"
          />
        </FormGrid>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={addItem}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#34c759',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 상품 추가
          </button>
        </div>
      </FormSection>

      <FormSection title="상품 목록">
        {items.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
            추가된 상품이 없습니다
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#86868b' }}>브랜드</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#86868b' }}>상품명</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#86868b' }}>수량</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#86868b' }}>단가</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#86868b' }}>합계</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#86868b' }}>삭제</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#007aff' }}>
                        {item.brand}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{item.product}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}원</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{item.totalPrice.toLocaleString()}원</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: '#ffebee',
                          color: '#ff3b30',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f5f5f7' }}>
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>총 합계</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '16px', color: '#007aff' }}>
                    {totalAmount.toLocaleString()}원
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </FormSection>

      <FormSection title="메모">
        <FormInput
          label="매입 메모"
          name="memo"
          type="textarea"
          value={form.memo}
          onChange={handleChange}
          placeholder="특이사항이나 참고사항을 입력하세요"
        />
        <FormActions>
          <CancelButton onClick={() => router.back()} />
          <SaveButton onClick={handleSubmit} label="매입 등록" />
        </FormActions>
      </FormSection>
    </AdminLayout>
  )
}
