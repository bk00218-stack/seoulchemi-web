'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Order {
  id: number
  orderNo: string
  orderedAt: string
  customerName: string
  productName: string
  status: string
  linkedOrderNo: string | null
}

export default function OrdersPage() {
  const [orders] = useState<Order[]>([
    { id: 1, orderNo: 'O2026021001', orderedAt: '2026-02-10', customerName: '김철수', productName: '케미 1.67 누진 (OD/OS)', status: 'shipped', linkedOrderNo: 'SC2026021001' },
    { id: 2, orderNo: 'O2026020901', orderedAt: '2026-02-09', customerName: '이영희', productName: '케미 1.60 단초점 (OD/OS)', status: 'pending', linkedOrderNo: null },
    { id: 3, orderNo: 'O2026020801', orderedAt: '2026-02-08', customerName: '박지민', productName: '하이텍 컬러렌즈 그레이 (OD/OS)', status: 'delivered', linkedOrderNo: 'SC2026020801' },
  ])

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '주문대기', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: '주문확인', color: 'bg-blue-100 text-blue-700' },
    shipped: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
    delivered: { label: '배송완료', color: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">렌즈 주문</h1>
          <p className="text-gray-500">서울케미 렌즈 주문 내역</p>
        </div>
        <Link
          href="/crm/orders/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>새 주문</span>
        </Link>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm whitespace-nowrap">
          전체 ({orders.length})
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm whitespace-nowrap hover:bg-gray-200">
          주문대기 (1)
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm whitespace-nowrap hover:bg-gray-200">
          배송중 (1)
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm whitespace-nowrap hover:bg-gray-200">
          배송완료 (1)
        </button>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y">
          {orders.map((order) => {
            const status = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
            
            return (
              <Link
                key={order.id}
                href={`/crm/orders/${order.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.productName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {order.orderNo}
                      {order.linkedOrderNo && (
                        <span className="ml-2 text-blue-500">
                          → 서울케미: {order.linkedOrderNo}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {order.orderedAt}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 서울케미 연동 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div>
            <p className="font-medium text-blue-900">서울케미 연동</p>
            <p className="text-sm text-blue-700 mt-1">
              렌즈 주문 시 서울케미 시스템으로 자동 연동됩니다.
              주문 상태는 실시간으로 동기화됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
