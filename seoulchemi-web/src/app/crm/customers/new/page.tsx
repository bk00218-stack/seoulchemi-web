'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CustomerForm {
  name: string
  phone: string
  phone2: string
  email: string
  birthDate: string
  gender: string
  zipcode: string
  address: string
  addressDetail: string
  memo: string
  smsAgree: boolean
  emailAgree: boolean
}

export default function NewCustomerPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CustomerForm>({
    name: '',
    phone: '',
    phone2: '',
    email: '',
    birthDate: '',
    gender: '',
    zipcode: '',
    address: '',
    addressDetail: '',
    memo: '',
    smsAgree: true,
    emailAgree: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: formatPhone(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name.trim()) {
      toast.warning('고객명을 입력해주세요')
      return
    }
    if (!form.phone.trim()) {
      toast.warning('전화번호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 409) {
          // 중복 전화번호
          if (confirm(`이미 등록된 전화번호입니다. 해당 고객 정보를 확인하시겠습니까?`)) {
            router.push(`/crm/customers/${data.existingId}`)
          }
          return
        }
        throw new Error(data.error || '등록 실패')
      }
      
      toast.success('고객이 등록되었습니다')
      router.push(`/crm/customers/${data.id}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/crm/customers"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신규 고객 등록</h1>
          <p className="text-gray-500">새로운 고객 정보를 입력하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          
          <div className="space-y-4">
            {/* 고객명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="홍길동"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 전화번호 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  보조 연락처
                </label>
                <input
                  type="tel"
                  name="phone2"
                  value={form.phone2}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 생년월일 & 성별 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">선택 안함</option>
                  <option value="M">남성</option>
                  <option value="F">여성</option>
                </select>
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 주소 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">주소 정보</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                name="zipcode"
                value={form.zipcode}
                onChange={handleChange}
                placeholder="우편번호"
                className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                주소 검색
              </button>
            </div>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="기본 주소"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              name="addressDetail"
              value={form.addressDetail}
              onChange={handleChange}
              placeholder="상세 주소"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h2>
          
          <div className="space-y-4">
            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                name="memo"
                value={form.memo}
                onChange={handleChange}
                placeholder="고객 관련 메모를 입력하세요"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* 마케팅 동의 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마케팅 수신 동의
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsAgree"
                    checked={form.smsAgree}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">SMS 문자</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailAgree"
                    checked={form.emailAgree}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">이메일</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href="/crm/customers"
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? '등록 중...' : '고객 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
