'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState } from 'react'

export default function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // 안경원 정보
    storeName: '행복안경원',
    storePhone: '02-1234-5678',
    storeAddress: '서울시 강남구 테헤란로 123',
    
    // 포인트 설정
    pointRate: 1,
    pointMinPurchase: 10000,
    
    // 리마인더 설정
    checkupMonths: 12,
    checkupRemindDays: 7,
    birthdayRemindDays: 7,
    
    // 문자 설정
    smsEnabled: false,
    smsSignature: '[행복안경원]',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const handleSave = () => {
    // TODO: API 저장
    toast.success('설정이 저장되었습니다')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500">CRM 시스템 설정을 관리합니다</p>
      </div>

      {/* 안경원 정보 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">안경원 정보</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">안경원명</label>
            <input
              type="text"
              name="storeName"
              value={settings.storeName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="text"
              name="storePhone"
              value={settings.storePhone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              name="storeAddress"
              value={settings.storeAddress}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 포인트 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">포인트 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적립율 (%)</label>
            <input
              type="number"
              name="pointRate"
              value={settings.pointRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">결제금액의 {settings.pointRate}%가 포인트로 적립됩니다</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 구매금액 (원)</label>
            <input
              type="number"
              name="pointMinPurchase"
              value={settings.pointMinPurchase}
              onChange={handleChange}
              min="0"
              step="1000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{settings.pointMinPurchase.toLocaleString()}원 이상 구매 시 포인트 적립</p>
          </div>
        </div>
      </div>

      {/* 리마인더 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">리마인더 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정기검안 주기 (개월)</label>
            <input
              type="number"
              name="checkupMonths"
              value={settings.checkupMonths}
              onChange={handleChange}
              min="1"
              max="36"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검안 리마인더 (며칠 전)</label>
            <input
              type="number"
              name="checkupRemindDays"
              value={settings.checkupRemindDays}
              onChange={handleChange}
              min="1"
              max="30"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생일 리마인더 (며칠 전)</label>
            <input
              type="number"
              name="birthdayRemindDays"
              value={settings.birthdayRemindDays}
              onChange={handleChange}
              min="0"
              max="30"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 문자 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">문자 발송 설정</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="smsEnabled"
              checked={settings.smsEnabled}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">문자 발송 기능 사용</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문자 서명</label>
            <input
              type="text"
              name="smsSignature"
              value={settings.smsSignature}
              onChange={handleChange}
              disabled={!settings.smsEnabled}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">모든 문자 끝에 자동으로 추가됩니다</p>
          </div>
        </div>
      </div>

      {/* 서울케미 연동 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">서울케미 연동</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">연동됨</p>
            <p className="text-sm text-gray-500">서울케미 렌즈 주문 연동이 활성화되어 있습니다</p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        설정 저장
      </button>
    </div>
  )
}
