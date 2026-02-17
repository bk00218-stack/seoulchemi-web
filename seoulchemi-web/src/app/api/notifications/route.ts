import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // 시스템 알림 생성
    const systemAlerts = await generateSystemAlerts()
    
    return NextResponse.json({ 
      notifications: systemAlerts.slice(0, limit), 
      unreadCount: systemAlerts.length
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ 
      notifications: [], 
      unreadCount: 0
    })
  }
}

// 시스템 알림 자동 생성
async function generateSystemAlerts() {
  const alerts = []
  const now = new Date()

  try {
    // 대기 중인 주문
    const pendingOrders = await prisma.order.count({
      where: { status: 'pending' }
    })
    if (pendingOrders > 0) {
      alerts.push({
        id: 'pending-orders',
        type: 'warning',
        title: '대기 주문',
        message: `처리 대기 중인 주문이 ${pendingOrders}건 있습니다`,
        createdAt: now,
        isRead: false,
        link: '/?status=pending'
      })
    }

    // 오늘 새 주문
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: today } }
    })
    if (todayOrders > 0) {
      alerts.push({
        id: 'today-orders',
        type: 'info',
        title: '오늘 주문',
        message: `오늘 ${todayOrders}건의 새 주문이 들어왔습니다`,
        createdAt: now,
        isRead: false,
        link: '/'
      })
    }

    // 재고 부족 상품 (ProductOption 재고 0인 경우)
    const outOfStock = await prisma.productOption.count({
      where: { stock: 0 }
    })
    if (outOfStock > 0) {
      alerts.push({
        id: 'out-of-stock',
        type: 'danger',
        title: '재고 부족',
        message: `재고가 없는 상품 옵션이 ${outOfStock}개 있습니다`,
        createdAt: now,
        isRead: false,
        link: '/admin/products/inventory'
      })
    }

    // 미수금 경고
    const overdueStores = await prisma.store.count({
      where: { 
        outstandingAmount: { gt: 0 },
        lastPaymentAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })
    if (overdueStores > 0) {
      alerts.push({
        id: 'overdue-payments',
        type: 'danger',
        title: '미수금 연체',
        message: `30일 이상 미입금 거래처가 ${overdueStores}곳 있습니다`,
        createdAt: now,
        isRead: false,
        link: '/stores/settle'
      })
    }

  } catch (e) {
    console.error('Failed to generate system alerts:', e)
  }

  return alerts
}

// POST: 알림 읽음 처리 (시스템 알림은 실제 상태 저장 없음)
export async function POST(request: NextRequest) {
  try {
    const { markAllRead } = await request.json()

    if (markAllRead) {
      // 시스템 알림은 DB에 저장되지 않으므로 성공만 반환
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
