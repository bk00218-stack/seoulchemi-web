'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: number
  name: string
  phone: string
  phone2: string | null
  email: string | null
  birthDate: string | null
  gender: string | null
  address: string | null
  memo: string | null
  smsAgree: boolean
  firstVisitAt: string
  lastVisitAt: string | null
  visitCount: number
  totalPurchase: number
  totalPoints: number
}

interface Prescription {
  id: number
  measuredAt: string
  measuredBy: string | null
  odSph: string | null
  odCyl: string | null
  odAxis: string | null
  odAdd: string | null
  osSph: string | null
  osCyl: string | null
  osAxis: string | null
  osAdd: string | null
  pdFar: string | null
  memo: string | null
}

interface Purchase {
  id: number
  saleNo: string
  saleDate: string
  finalAmount: number
  paymentMethod: string
  itemSummary: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'prescription' | 'purchase'>('info')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/crm/customers/${params.id}`)
        if (!res.ok) {
          throw new Error('고객을 찾을 수 없습니다')
        }
        const data = await res.json()
        
        // 날짜 포맷팅
        const formatDate = (d: string | null) => d ? d.split('T')[0] : null
        
        setCustomer({
          ...data,
          birthDate: formatDate(data.birthDate),
          firstVisitAt: formatDate(data.firstVisitAt),
          lastVisitAt: formatDate(data.lastVisitAt),
        })
        
        // 도수 기록
        if (data.prescriptions) {
          setPrescriptions(data.prescriptions.map((p: any) => ({
            ...p,
            measuredAt: formatDate(p.measuredAt),
          })))
        }
        
        // 구매 이력
        if (data.purchases) {
          setPurchases(data.purchases.map((p: any) => ({
            id: p.id,
            saleNo: p.saleNo,
            saleDate: formatDate(p.saleDate),
            finalAmount: p.finalAmount,
            paymentMethod: p.paymentMethod,
            itemSummary: p.items?.map((i: any) => i.productName).join(', ') || '-',
          })))
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCustomer()
  }, [params.id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatGender = (gender: string | null) => {
    if (gender === 'M') return '남'
    if (gender === 'F') return '여'
    return '-'
  }

  const formatPayment = (method: string) => {
    const methods: Record<string, string> = {
      card: '카드',
      cash: '현금',
      transfer: '계좌이체',
      mixed: '복합결제',
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">고객을 찾을 수 없습니다</p>
        <Link href="/crm/customers" className="text-blue-600 hover:underline mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          href="/crm/customers"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500">{customer.phone}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="전화">
            📞
          </button>
          <button className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200" title="문자">
            💬
          </button>
          <Link
            href={`/crm/customers/${customer.id}/edit`}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            title="수정"
          >
            ✏️
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">방문 횟수</p>
          <p className="text-2xl font-bold text-gray-900">{customer.visitCount}회</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">총 구매금액</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalPurchase)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">보유 포인트</p>
          <p className="text-2xl font-bold text-blue-600">{customer.totalPoints.toLocaleString()}P</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">최근 방문</p>
          <p className="text-2xl font-bold text-gray-900">{customer.lastVisitAt || '-'}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            기본정보
          </button>
          <button
            onClick={() => setActiveTab('prescription')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'prescription'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            도수기록 ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'purchase'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            구매이력 ({purchases.length})
          </button>
        </div>

        <div className="p-4">
          {/* 기본정보 탭 */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">생년월일</p>
                  <p className="font-medium">{customer.birthDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">성별</p>
                  <p className="font-medium">{formatGender(customer.gender)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium">{customer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SMS 수신</p>
                  <p className="font-medium">{customer.smsAgree ? '동의' : '미동의'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">주소</p>
                <p className="font-medium">{customer.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">메모</p>
                <p className="font-medium whitespace-pre-wrap">{customer.memo || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">첫 방문일</p>
                  <p className="font-medium">{customer.firstVisitAt}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">최근 방문일</p>
                  <p className="font-medium">{customer.lastVisitAt || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 도수기록 탭 */}
          {activeTab === 'prescription' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  href={`/crm/customers/${customer.id}/prescription/new`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + 새 도수 기록
                </Link>
              </div>
              {prescriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">도수 기록이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx, index) => (
                    <div
                      key={rx.id}
                      className={`border rounded-lg p-4 ${index === 0 ? 'border-blue-300 bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rx.measuredAt}</span>
                          {index === 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded">최신</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{rx.measuredBy || '측정자 미기록'}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left py-1 pr-2">눈</th>
                              <th className="text-center px-2">SPH</th>
                              <th className="text-center px-2">CYL</th>
                              <th className="text-center px-2">AXIS</th>
                              <th className="text-center px-2">ADD</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="font-medium py-1 pr-2">우안(OD)</td>
                              <td className="text-center px-2">{rx.odSph || '-'}</td>
                              <td className="text-center px-2">{rx.odCyl || '-'}</td>
                              <td className="text-center px-2">{rx.odAxis || '-'}</td>
                              <td className="text-center px-2">{rx.odAdd || '-'}</td>
                            </tr>
                            <tr>
                              <td className="font-medium py-1 pr-2">좌안(OS)</td>
                              <td className="text-center px-2">{rx.osSph || '-'}</td>
                              <td className="text-center px-2">{rx.osCyl || '-'}</td>
                              <td className="text-center px-2">{rx.osAxis || '-'}</td>
                              <td className="text-center px-2">{rx.osAdd || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>PD: {rx.pdFar || '-'}</span>
                        {rx.memo && <span className="ml-4">메모: {rx.memo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 구매이력 탭 */}
          {activeTab === 'purchase' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  href={`/crm/sales/new?customerId=${customer.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + 새 판매 등록
                </Link>
              </div>
              {purchases.length === 0 ? (
                <p className="text-center text-gray-500 py-8">구매 이력이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <Link
                      key={purchase.id}
                      href={`/crm/sales/${purchase.id}`}
                      className="block border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{purchase.saleDate}</p>
                          <p className="text-sm text-gray-500">{purchase.saleNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(purchase.finalAmount)}</p>
                          <p className="text-sm text-gray-500">{formatPayment(purchase.paymentMethod)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{purchase.itemSummary}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/crm/sales/new?customerId=${customer.id}`}
          className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 text-center font-medium"
        >
          💰 판매 등록
        </Link>
        <Link
          href={`/crm/orders/new?customerId=${customer.id}`}
          className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 text-center font-medium"
        >
          📦 렌즈 주문
        </Link>
      </div>
    </div>
  )
}
