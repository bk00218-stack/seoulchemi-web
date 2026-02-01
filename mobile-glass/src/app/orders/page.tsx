import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

async function getOrders() {
  return await prisma.order.findMany({
    orderBy: { orderedAt: 'desc' },
    include: { 
      store: true,
      items: { include: { product: true } }
    },
    take: 50
  })
}

const statusColors: Record<string, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3', 
  shipped: '#9c27b0',
  delivered: '#4caf50',
  cancelled: '#f44336'
}

const statusLabels: Record<string, string> = {
  pending: '대기',
  confirmed: '확인',
  shipped: '출고',
  delivered: '배송완료',
  cancelled: '취소'
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        borderBottom: '2px solid #333', 
        paddingBottom: '20px', 
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>📦 주문 관리</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>모바일글라스</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/" style={{ 
            padding: '10px 16px',
            background: '#eee',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '6px'
          }}>← 상품목록</a>
          <Link href="/orders/new" style={{ 
            padding: '10px 20px',
            background: '#4caf50',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>➕ 새 주문</Link>
        </div>
      </header>

      {/* 통계 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ padding: '20px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div style={{ color: '#666' }}>대기</div>
        </div>
        <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
            {orders.filter(o => o.status === 'confirmed').length}
          </div>
          <div style={{ color: '#666' }}>확인</div>
        </div>
        <div style={{ padding: '20px', background: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>
            {orders.filter(o => o.status === 'shipped').length}
          </div>
          <div style={{ color: '#666' }}>출고</div>
        </div>
        <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div style={{ color: '#666' }}>배송완료</div>
        </div>
      </div>

      {/* 주문 목록 */}
      {orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map(order => (
            <div 
              key={order.id}
              style={{
                padding: '20px',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{order.orderNo}</strong>
                  <span style={{ marginLeft: '10px', color: '#666' }}>
                    {order.store.name}
                  </span>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  background: statusColors[order.status] || '#999',
                  color: '#fff'
                }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              
              {/* 주문 상품 */}
              <div style={{ 
                background: '#f9f9f9', 
                padding: '12px', 
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: '14px'
                  }}>
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>{item.totalPrice.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                <span>
                  {new Date(order.orderedAt).toLocaleString('ko-KR')}
                </span>
                <strong style={{ fontSize: '18px', color: '#333' }}>
                  {order.totalAmount.toLocaleString()}원
                </strong>
              </div>
              
              {order.memo && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  background: '#fffde7',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  📝 {order.memo}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#999', fontSize: '18px' }}>주문 내역이 없습니다.</p>
          <Link href="/orders/new" style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            background: '#4caf50',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px'
          }}>
            첫 주문 생성하기
          </Link>
        </div>
      )}

      <footer style={{ 
        marginTop: '50px', 
        paddingTop: '20px', 
        borderTop: '1px solid #eee',
        color: '#999',
        fontSize: '12px'
      }}>
        MobileGlass Admin v0.1 | 서울케미렌즈
      </footer>
    </div>
  )
}
