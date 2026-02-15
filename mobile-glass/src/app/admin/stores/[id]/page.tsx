'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '../../../components/Navigation'
import StatCard, { StatCardGrid } from '../../../components/StatCard'
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
  pending: { label: '?ÄÍ∏?, color: '#ff9500', bg: '#fff3e0' },
  confirmed: { label: '?ïÏ†ï', color: '#007aff', bg: '#e3f2fd' },
  processing: { label: 'Ï≤òÎ¶¨Ï§?, color: '#9c27b0', bg: '#f3e5f5' },
  shipped: { label: 'Ï∂úÍ≥†', color: '#2196f3', bg: '#e3f2fd' },
  delivered: { label: 'Î∞∞ÏÜ°?ÑÎ£å', color: '#34c759', bg: '#e8f5e9' },
  cancelled: { label: 'Ï∑®ÏÜå', color: '#ff3b30', bg: '#ffebee' },
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
      <AdminLayout activeMenu="stores">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          Î°úÎî© Ï§?..
        </div>
      </AdminLayout>
    )
  }

  if (!store) {
    return (
      <AdminLayout activeMenu="stores">
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
          Í∞ÄÎßπÏ†ê??Ï∞æÏùÑ ???ÜÏäµ?àÎã§
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeMenu="stores">
      {/* ?§Îçî */}
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
            ??Î™©Î°ù
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
            {store.isActive ? '?úÏÑ±' : 'ÎπÑÌôú??}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 4px' }}>{store.name}</h1>
            {store.groupName && (
              <span style={{ fontSize: '14px', color: '#86868b' }}>
                Í∑∏Î£π: {store.groupName}
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
              ?í∞ ?†Ïù∏ ?§Ï†ï
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
              ?òÏ†ï
            </button>
          </div>
        </div>
      </div>

      {/* ?µÍ≥Ñ Ïπ¥Îìú */}
      <StatCardGrid>
        <StatCard 
          label="Ï¥?Ï£ºÎ¨∏" 
          value={store.totalOrders} 
          unit="Í±? 
          icon="?ì¶"
        />
        <StatCard 
          label="Ï¥?Îß§Ï∂ú" 
          value={formatCurrency(store.totalSales)} 
          unit="?? 
          icon="?í∞"
        />
        <StatCard 
          label="ÎØ∏ÏàòÍ∏? 
          value={formatCurrency(store.outstandingAmount)} 
          unit="?? 
          icon="?í≥"
          highlight={store.outstandingAmount > 0}
        />
        <StatCard 
          label="?†Ïö©?úÎèÑ" 
          value={formatCurrency(store.creditLimit)} 
          unit="?? 
          icon="?ìä"
        />
      </StatCardGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* Í∏∞Î≥∏ ?ïÎ≥¥ */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Í∏∞Î≥∏ ?ïÎ≥¥</h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?Ä?úÏûê</span>
              <span style={{ fontWeight: 500 }}>{store.ownerName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?ÑÌôî</span>
              <span style={{ fontFamily: 'monospace' }}>{store.phone || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?∏Îìú??/span>
              <span style={{ fontFamily: 'monospace' }}>{store.mobile || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?¥Î©î??/span>
              <span>{store.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?¨ÏóÖ?êÎ≤à??/span>
              <span style={{ fontFamily: 'monospace' }}>{store.bizNo || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#86868b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Ï£ºÏÜå</span>
              <span style={{ fontSize: '14px' }}>{store.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Í≤∞Ï†ú ?ïÎ≥¥ */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Í≤∞Ï†ú ?ïÎ≥¥</h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>Í≤∞Ï†úÍ∏∞Ìïú</span>
              <span style={{ fontWeight: 500 }}>{store.paymentTermDays}??/span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>Ï≤?µ¨??/span>
              <span>{store.billingDay ? `Îß§Ïõî ${store.billingDay}?? : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?¥Îãπ??/span>
              <span>{store.salesRepName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>Î∞∞ÏÜ°?¥Îãπ</span>
              <span>{store.deliveryContact || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>ÏµúÍ∑º Ï£ºÎ¨∏</span>
              <span>
                {store.lastOrderAt 
                  ? new Date(store.lastOrderAt).toLocaleDateString('ko-KR') 
                  : '-'
                }
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>?±Î°ù??/span>
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
              ÎØ∏ÏàòÍ∏??¥Ïó≠ Î≥¥Í∏∞ ??
            </Link>
          )}
        </div>
      </div>

      {/* ÏµúÍ∑º Ï£ºÎ¨∏ */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>ÏµúÍ∑º Ï£ºÎ¨∏</h2>
          <Link
            href={`/admin/orders?storeId=${store.id}`}
            style={{ color: '#007aff', fontSize: '13px', textDecoration: 'none' }}
          >
            ?ÑÏ≤¥ Î≥¥Í∏∞ ??
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
            Ï£ºÎ¨∏ ?¥Ïó≠???ÜÏäµ?àÎã§
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>Ï£ºÎ¨∏Î≤àÌò∏</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>?ÅÌíà</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>Í∏àÏï°</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>?ÅÌÉú</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#86868b' }}>Ï£ºÎ¨∏??/th>
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
                      {order.itemCount}Í∞?
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(order.totalAmount)}??
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

      {/* Îπ†Î•∏ ?°ÏÖò */}
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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>?ì¶</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>??Ï£ºÎ¨∏</div>
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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>?í≥</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>?ÖÍ∏à Ï≤òÎ¶¨</div>
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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>?í∞</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>?†Ïù∏ ?§Ï†ï</div>
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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>?ñ®Ô∏?/div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>?∏ÏáÑ</div>
        </button>
      </div>
    </AdminLayout>
  )
}
