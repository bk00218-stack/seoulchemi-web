'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalCustomers: number
  newCustomersThisMonth: number
  todaySales: number
  monthSales: number
  pendingReminders: number
  recentCustomers: Array<{
    id: number
    name: string
    phone: string
    lastVisitAt: string | null
  }>
  todayBirthdays: Array<{
    id: number
    name: string
    phone: string
  }>
}

export default function CrmDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: API 연동
    // 임시 데이터
    setStats({
      totalCustomers: 1234,
      newCustomersThisMonth: 45,
      todaySales: 2850000,
      monthSales: 48500000,
      pendingReminders: 12,
      recentCustomers: [
        { id: 1, name: '김철수', phone: '010-1234-5678', lastVisitAt: '2026-02-10' },
        { id: 2, name: '이영희', phone: '010-2345-6789', lastVisitAt: '2026-02-09' },
        { id: 3, name: '박지민', phone: '010-3456-7890', lastVisitAt: '2026-02-08' },
      ],
      todayBirthdays: [
        { id: 5, name: '최민수', phone: '010-5555-1234' },
      ],
    })
    setLoading(false)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500">오늘의 현황을 확인하세요</p>
        </div>
        <Link
          href="/crm/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">신규 고객</span>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 고객</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {stats?.totalCustomers.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-green-600">
            +{stats?.newCustomersThisMonth} 이번달
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">오늘 매출</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.todaySales || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">이번달 매출</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.monthSales || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">예정 알림</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {stats?.pendingReminders}건
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 두 컬럼 레이아웃 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 최근 방문 고객 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">최근 방문 고객</h2>
            <Link href="/crm/customers" className="text-sm text-blue-600 hover:underline">
              전체보기
            </Link>
          </div>
          <div className="divide-y">
            {stats?.recentCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/crm/customers/${customer.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {customer.lastVisitAt}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 오늘 생일 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">🎂 오늘 생일</h2>
          </div>
          {stats?.todayBirthdays && stats.todayBirthdays.length > 0 ? (
            <div className="divide-y">
              {stats.todayBirthdays.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-pink-600 font-medium">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200">
                    축하 문자
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              오늘 생일인 고객이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 빠른 실행 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 mb-4">빠른 실행</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/crm/customers/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span className="text-3xl">👤</span>
            <span className="text-sm font-medium text-blue-700">신규 고객</span>
          </Link>
          <Link
            href="/crm/sales/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <span className="text-3xl">🧾</span>
            <span className="text-sm font-medium text-green-700">판매 등록</span>
          </Link>
          <Link
            href="/crm/orders/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <span className="text-3xl">📦</span>
            <span className="text-sm font-medium text-purple-700">렌즈 주문</span>
          </Link>
          <Link
            href="/crm/customers"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <span className="text-3xl">🔍</span>
            <span className="text-sm font-medium text-orange-700">고객 검색</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
