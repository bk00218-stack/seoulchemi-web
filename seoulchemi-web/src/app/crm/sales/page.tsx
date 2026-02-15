'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Sale {
  id: number
  saleNo: string
  saleDate: string
  customerName: string
  customerPhone: string
  finalAmount: number
  paymentMethod: string
  itemCount: number
}

export default function SalesPage() {
  const [sales] = useState<Sale[]>([
    { id: 1, saleNo: 'S2026021001', saleDate: '2026-02-10', customerName: '김철수', customerPhone: '010-1234-5678', finalAmount: 450000, paymentMethod: 'card', itemCount: 2 },
    { id: 2, saleNo: 'S2026020901', saleDate: '2026-02-09', customerName: '이영희', customerPhone: '010-2345-6789', finalAmount: 280000, paymentMethod: 'cash', itemCount: 1 },
    { id: 3, saleNo: 'S2026020801', saleDate: '2026-02-08', customerName: '박지민', customerPhone: '010-3456-7890', finalAmount: 180000, paymentMethod: 'card', itemCount: 1 },
  ])

  const [dateRange, setDateRange] = useState('today')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const totalSales = sales.reduce((sum, s) => sum + s.finalAmount, 0)

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">판매관리</h1>
          <p className="text-gray-500">오늘 매출: {formatCurrency(totalSales)}</p>
        </div>
        <Link
          href="/crm/sales/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>판매 등록</span>
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today', label: '오늘' },
            { value: 'week', label: '이번주' },
            { value: 'month', label: '이번달' },
            { value: 'all', label: '전체' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 판매 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y">
          {sales.map((sale) => (
            <Link
              key={sale.id}
              href={`/crm/sales/${sale.id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{sale.customerName}</p>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    {sale.itemCount}건
                  </span>
                </div>
                <p className="text-sm text-gray-500">{sale.customerPhone}</p>
                <p className="text-xs text-gray-400 mt-1">{sale.saleNo}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(sale.finalAmount)}</p>
                <p className="text-sm text-gray-500">{sale.saleDate}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
