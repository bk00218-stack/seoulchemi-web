'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, CancelButton, SaveButton } from '../../../components/FormInput'

interface OrderForm {
  storeId: string
  orderType: string
  brand: string
  product: string
  sph: string
  cyl: string
  axis: string
  quantity: number
  price: number
  memo: string
  // RX 추가 필드
  leftSph: string
  leftCyl: string
  leftAxis: string
  pd: string
  add: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [form, setForm] = useState<OrderForm>({
    storeId: '',
    orderType: 'stock',
    brand: '',
    product: '',
    sph: '',
    cyl: '',
    axis: '',
    quantity: 1,
    price: 0,
    memo: '',
    leftSph: '',
    leftCyl: '',
    leftAxis: '',
    pd: '',
    add: ''
  })

  const handleChange = (name: string, value: string | number) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.storeId || !form.brand || !form.product) {
      alert('필수 항목을 입력해주세요.')
      return
    }
    // API 호출
    alert('주문이 등록되었습니다.')
    router.push('/admin/orders')
  }

  const stores = [
    { label: '강남안경', value: '1' },
    { label: '역삼안경원', value: '2' },
    { label: '신사안경', value: '3' },
    { label: '압구정광학', value: '4' },
    { label: '청담안경', value: '5' },
  ]

  const brands = [
    { label: '에실로', value: 'essilor' },
    { label: '호야', value: 'hoya' },
    { label: '니콘', value: 'nikon' },
    { label: '칼자이스', value: 'zeiss' },
  ]

  const products = [
    { label: '크리잘 블루컷', value: 'crizal-blue' },
    { label: '크리잘 사파이어', value: 'crizal-sapphire' },
    { label: '바리락스 X', value: 'varilux-x' },
    { label: '블루컨트롤', value: 'blue-control' },
  ]

  const sphOptions = Array.from({ length: 33 }, (_, i) => {
    const val = (i * 0.25 - 4).toFixed(2)
    return { label: val, value: val }
  })

  const cylOptions = Array.from({ length: 17 }, (_, i) => {
    const val = (i * -0.25).toFixed(2)
    return { label: val, value: val }
  })

  return (
    <AdminLayout activeMenu="order">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        관리자 주문등록
      </h2>

      <FormSection title="주문 기본정보">
        <FormGrid>
          <FormInput
            label="가맹점 선택"
            name="storeId"
            type="select"
            value={form.storeId}
            onChange={handleChange}
            options={stores}
            required
            placeholder="가맹점을 선택하세요"
          />
          <FormInput
            label="주문 유형"
            name="orderType"
            type="select"
            value={form.orderType}
            onChange={handleChange}
            options={[
              { label: '여벌 주문', value: 'stock' },
              { label: 'RX 주문', value: 'rx' },
            ]}
            required
          />
        </FormGrid>
      </FormSection>

      <FormSection title="상품 정보">
        <FormGrid>
          <FormInput
            label="브랜드"
            name="brand"
            type="select"
            value={form.brand}
            onChange={handleChange}
            options={brands}
            required
          />
          <FormInput
            label="상품"
            name="product"
            type="select"
            value={form.product}
            onChange={handleChange}
            options={products}
            required
          />
        </FormGrid>
        <FormGrid>
          <FormInput
            label="수량"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            required
          />
          <FormInput
            label="단가"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            suffix="원"
          />
        </FormGrid>
      </FormSection>

      <FormSection title={form.orderType === 'rx' ? '우안 (Right) 도수' : '도수 정보'}>
        <FormGrid>
          <FormInput
            label="SPH (구면)"
            name="sph"
            type="select"
            value={form.sph}
            onChange={handleChange}
            options={sphOptions}
          />
          <FormInput
            label="CYL (난시)"
            name="cyl"
            type="select"
            value={form.cyl}
            onChange={handleChange}
            options={cylOptions}
          />
        </FormGrid>
        {form.orderType === 'rx' && (
          <FormInput
            label="AXIS (축)"
            name="axis"
            type="number"
            value={form.axis}
            onChange={handleChange}
            hint="0~180 사이의 값"
          />
        )}
      </FormSection>

      {form.orderType === 'rx' && (
        <>
          <FormSection title="좌안 (Left) 도수">
            <FormGrid>
              <FormInput
                label="SPH (구면)"
                name="leftSph"
                type="select"
                value={form.leftSph}
                onChange={handleChange}
                options={sphOptions}
              />
              <FormInput
                label="CYL (난시)"
                name="leftCyl"
                type="select"
                value={form.leftCyl}
                onChange={handleChange}
                options={cylOptions}
              />
            </FormGrid>
            <FormInput
              label="AXIS (축)"
              name="leftAxis"
              type="number"
              value={form.leftAxis}
              onChange={handleChange}
              hint="0~180 사이의 값"
            />
          </FormSection>

          <FormSection title="추가 정보">
            <FormGrid>
              <FormInput
                label="PD (동공거리)"
                name="pd"
                type="text"
                value={form.pd}
                onChange={handleChange}
                suffix="mm"
              />
              <FormInput
                label="ADD (가입도)"
                name="add"
                type="text"
                value={form.add}
                onChange={handleChange}
              />
            </FormGrid>
          </FormSection>
        </>
      )}

      <FormSection title="메모">
        <FormInput
          label="주문 메모"
          name="memo"
          type="textarea"
          value={form.memo}
          onChange={handleChange}
          placeholder="특이사항이나 요청사항을 입력하세요"
        />
        <FormActions>
          <CancelButton onClick={() => router.back()} />
          <SaveButton onClick={handleSubmit} label="주문 등록" />
        </FormActions>
      </FormSection>
    </AdminLayout>
  )
}
