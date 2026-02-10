'use client'

import { useState } from 'react'

export default function ReportsPage() {
  const [period, setPeriod] = useState('month')

  const stats = {
    totalSales: 48500000,
    salesCount: 156,
    avgSale: 310897,
    newCustomers: 45,
    returnCustomers: 111,
    topProducts: [
      { name: '케미 1.67 단초점', count: 45, amount: 6750000 },
      { name: '케미 1.60 누진', count: 32, amount: 9600000 },
      { name: '하이텍 1.74 블루라이트', count: 28, amount: 5600000 },
      { name: '콘택트렌즈 (일회용)', count: 89, amount: 2670000 },
    ],
    dailySales: [
      { date: '02/01', amount: 1200000 },
      { date: '02/02', amount: 1800000 },
      { date: '02/03', amount: 2100000 },
      { date: '02/04', amount: 900000 },
      { date: '02/05', amount: 1500000 },
      { date: '02/06', amount: 2400000 },
      { date: '02/07', amount: 1950000 },
    ],
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const maxDailySale = Math.max(...stats.dailySales.map(d => d.amount))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계/리포트</h1>
          <p className="text-gray-500">매출 및 고객 통계를 확인하세요</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'week', label: '주간' },
            { value: 'month', label: '월간' },
            { value: 'year', label: '연간' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">총 매출</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(stats.totalSales / 10000).toLocaleString()}만원
          </p>
          <p className="text-xs text-green-600 mt-2">▲ 12.5% 전월 대비</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">판매 건수</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.salesCount}건</p>
          <p className="text-xs text-green-600 mt-2">▲ 8% 전월 대비</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">평균 객단가</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.avgSale)}
          </p>
          <p className="text-xs text-green-600 mt-2">▲ 4.2% 전월 대비</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">신규 고객</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.newCustomers}명</p>
          <p className="text-xs text-gray-500 mt-2">재방문: {stats.returnCustomers}명</p>
        </div>
      </div>

      {/* 일별 매출 차트 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">일별 매출</h2>
        <div className="space-y-3">
          {stats.dailySales.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="w-12 text-sm text-gray-600">{day.date}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${(day.amount / maxDailySale) * 100}%` }}
                />
              </div>
              <span className="w-24 text-sm text-gray-700 text-right">
                {(day.amount / 10000).toFixed(0)}만원
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 인기 상품 */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">인기 상품 TOP 5</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="text-left py-2">순위</th>
                <th className="text-left py-2">상품명</th>
                <th className="text-center py-2">판매수</th>
                <th className="text-right py-2">매출</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((product, index) => (
                <tr key={product.name} className="border-b last:border-0">
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{product.name}</td>
                  <td className="py-3 text-center">{product.count}건</td>
                  <td className="py-3 text-right">{formatCurrency(product.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 고객 분석 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 유형</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600">{stats.newCustomers}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">신규 고객</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-600">{stats.returnCustomers}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">재방문 고객</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 수단</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">카드</span>
              <span className="font-medium">68%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">현금</span>
              <span className="font-medium">25%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-green-500 h-full rounded-full" style={{ width: '25%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">계좌이체</span>
              <span className="font-medium">7%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '7%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
