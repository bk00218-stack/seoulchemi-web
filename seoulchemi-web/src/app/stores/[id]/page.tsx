'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { STORES_SIDEBAR } from '../../constants/sidebar'
import StatCard, { StatCardGrid } from '../../components/StatCard'
import Link from 'next/link'

interface Store {
  id: number
  code: string
  name: string
  ownerName: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  bizNo: string | null
  email: string | null
  paymentTermDays: number
  billingDay: number | null
  creditLimit: number
  groupId: number | null
  groupName: string | null
  salesRepName: string | null
  deliveryContact: string | null
  isActive: boolean
  createdAt: string
  outstandingAmount: number
  totalOrders: number
  totalSales: number
  lastOrderAt: string | null
}

interface RecentOrder {
  id: number
  orderNo: string
  totalAmount: number
  status: string
  createdAt: string
  itemCount: number
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: '#ff9500', bg: '#fff3e0' },
  confirmed: { label: '확정', color: '#007aff', bg: '#e3f2fd' },
  processing: { label: '처리중', color: '#9c27b0', bg: '#f3e5f5' },
  shipped: { label: '출고', color: '#2196f3', bg: '#e3f2fd' },
  delivered: { label: '배송완료', color: '#34c759', bg: '#e8f5e9' },
  cancelled: { label: '취소', color: '#ff3b30', bg: '#ffebee' },
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (storeId) {
      fetchStore()
      fetchRecentOrders()
    }
  }, [storeId])

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}`)
      if (res.ok) {
        const data = await res.json()
        setStore(data)
      } else {
        router.push('/stores')
      }
    } catch (error) {
      console.error('Failed to fetch store:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch(`/api/orders?storeId=${storeId}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setRecentOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (loading) {
    return (
      <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          로딩 중...
        </div>
      </Layout>
    )
  }

  if (!store) {
    return (
      <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          가맹점을 찾을 수 없습니다
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={STORES_SIDEBAR} activeNav="가맹점">
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => router.push('/stores')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ← 목록
          </button>
          <span style={{ 
            padding: '4px 10px', 
            background: '#f5f5f7', 
            borderRadius: '6px', 
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#86868b'
          }}>
            {store.code}
          </span>
          <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            background: store.isActive ? '#e8f5e9' : '#f5f5f7',
            color: store.isActive ? '#34c759' : '#86868b'
          }}>
            {store.isActive ? '활성' : '비활성'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 4px' }}>{store.name}</h1>
            {store.groupName && (
              <span style={{ fontSize: '14px', color: '#86868b' }}>
                그룹: {store.groupName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={`/stores/${store.id}/discounts`}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                background: '#fff',
                fontSize: '13px',
                textDecoration: 'none',
                color: '#1d1d1f'
              }}
            >
              💰 할인 설정
            </Link>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#007aff',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              수정
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <StatCardGrid>
        <StatCard 
          label="총 주문" 
          value={store.totalOrders} 
          unit="건" 
          icon="📦"
        />
        <StatCard 
          label="총 매출" 
          value={formatCurrency(store.totalSales)} 
          unit="원" 
          icon="💰"
        />
        <StatCard 
          label="미수금" 
          value={formatCurrency(store.outstandingAmount)} 
          unit="원" 
          icon="💳"
          highlight={store.outstandingAmount > 0}
        />
        <StatCard 
          label="신용한도" 
          value={formatCurrency(store.creditLimit)} 
          unit="원" 
          icon="📊"
        />
      </StatCardGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* 기본 정보 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>기본 정보</h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>대표자</span>
              <span style={{ fontWeight: 500 }}>{store.ownerName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>전화</span>
              <span style={{ fontFamily: 'monospace' }}>{store.phone || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>핸드폰</span>
              <span style={{ fontFamily: 'monospace' }}>{store.mobile || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>이메일</span>
              <span>{store.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>사업자번호</span>
              <span style={{ fontFamily: 'monospace' }}>{store.bizNo || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#86868b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>주소</span>
              <span style={{ fontSize: '14px' }}>{store.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* 결제 정보 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>결제 정보</h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>결제기한</span>
              <span style={{ fontWeight: 500 }}>{store.paymentTermDays}일</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>청구일</span>
              <span>{store.billingDay ? `매월 ${store.billingDay}일` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>담당자</span>
              <span>{store.salesRepName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>배송담당</span>
              <span>{store.deliveryContact || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>최근 주문</span>
              <span>
                {store.lastOrderAt 
                  ? new Date(store.lastOrderAt).toLocaleDateString('ko-KR') 
                  : '-'
                }
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>등록일</span>
              <span>{new Date(store.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>

          {store.outstandingAmount > 0 && (
            <Link
              href={`/stores/receivables/transactions?storeId=${store.id}`}
              style={{
                display: 'block',
                marginTop: '20px',
                padding: '12px',
                borderRadius: '8px',
                background: '#fff3e0',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#ff9500',
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              미수금 내역 보기 →
            </Link>
          )}
        </div>
      </div>

      {/* 최근 주문 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>최근 주문</h2>
          <Link
            href={`/admin/orders?storeId=${store.id}`}
            style={{ color: '#007aff', fontSize: '13px', textDecoration: 'none' }}
          >
            전체 보기 →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
            주문 내역이 없습니다
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>주문번호</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>상품</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>금액</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>주문일</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => {
                const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: '#666', bg: '#f5f5f7' }
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/admin/orders?orderNo=${order.orderNo}`}
                        style={{ color: '#007aff', textDecoration: 'none', fontFamily: 'monospace', fontSize: '13px' }}
                      >
                        {order.orderNo}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                      {order.itemCount}개
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(order.totalAmount)}원
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: statusInfo.color,
                        background: statusInfo.bg
                      }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#86868b' }}>
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 빠른 액션 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '12px', 
        marginTop: '24px' 
      }}>
        <Link
          href={`/admin/orders/new?storeId=${store.id}`}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#fff',
            textDecoration: 'none',
            textAlign: 'center',
            color: '#1d1d1f'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>새 주문</div>
        </Link>
        <Link
          href={`/stores/receivables/deposit?storeId=${store.id}`}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#fff',
            textDecoration: 'none',
            textAlign: 'center',
            color: '#1d1d1f'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>입금 처리</div>
        </Link>
        <Link
          href={`/stores/${store.id}/discounts`}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#fff',
            textDecoration: 'none',
            textAlign: 'center',
            color: '#1d1d1f'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>할인 설정</div>
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#fff',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖨️</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>인쇄</div>
        </button>
      </div>
    </Layout>
  )
}
