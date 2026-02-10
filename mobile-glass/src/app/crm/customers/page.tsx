'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

interface Customer {
  id: number
  name: string
  phone: string
  birthDate: string | null
  lastVisitAt: string | null
  visitCount: number
  totalPurchase: number
  memo: string | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'lastVisitAt' | 'totalPurchase'>('lastVisitAt')
  const [total, setTotal] = useState(0)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sortBy,
        ...(search && { search }),
      })
      const res = await fetch(`/api/crm/customers?${params}`)
      const data = await res.json()
      
      if (data.customers) {
        setCustomers(data.customers.map((c: any) => ({
          ...c,
          birthDate: c.birthDate ? c.birthDate.split('T')[0] : null,
          lastVisitAt: c.lastVisitAt ? c.lastVisitAt.split('T')[0] : null,
        })))
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }, [search, sortBy])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // API에서 이미 정렬/필터된 데이터가 오므로 그대로 사용
  const sortedCustomers = customers

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return Math.floor(amount / 10000) + '만원'
    }
    return amount.toLocaleString() + '원'
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객관리</h1>
          <p className="text-gray-500">총 {total}명의 고객</p>
        </div>
        <Link
          href="/crm/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>신규 고객 등록</span>
        </Link>
      </div>

      {/* 검색 & 정렬 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 전화번호 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="lastVisitAt">최근 방문순</option>
            <option value="name">이름순</option>
            <option value="totalPurchase">구매금액순</option>
          </select>
        </div>
      </div>

      {/* 고객 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <span className="text-4xl">👥</span>
          <p className="mt-4 text-gray-500">
            {search ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
          </p>
          {!search && (
            <Link
              href="/crm/customers/new"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              첫 고객을 등록해보세요
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 데스크톱 테이블 */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">고객명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">연락처</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">생년월일</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">방문</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">총 구매</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">최근방문</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/customers/${customer.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.birthDate || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{customer.visitCount}회</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(customer.totalPurchase)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customer.lastVisitAt || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm max-w-[200px] truncate">
                      {customer.memo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 리스트 */}
          <div className="lg:hidden divide-y">
            {sortedCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/crm/customers/${customer.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-lg">
                    {customer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {customer.visitCount}회
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                  {customer.memo && (
                    <p className="text-xs text-gray-400 truncate mt-1">{customer.memo}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-gray-900">{formatCurrency(customer.totalPurchase)}</p>
                  <p className="text-xs text-gray-500">{customer.lastVisitAt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
