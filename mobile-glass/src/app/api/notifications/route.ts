import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    // 알림 조회
    const notifications = await prisma.notification.findMany({
      where: unreadOnly ? { isRead: false } : {},
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // 읽지 않은 알림 수
    const unreadCount = await prisma.notification.count({
      where: { isRead: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    
    // 테이블이 없으면 빈 배열 반환
    return NextResponse.json({ 
      notifications: [], 
      unreadCount: 0,
      // 시스템 알림 생성 (테이블 없을 때 대체)
      systemAlerts: await generateSystemAlerts()
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
        link: '/admin/products/inventory'
      })
    }

  } catch (e) {
    console.error('Failed to generate system alerts:', e)
  }

  return alerts
}

// POST: 알림 읽음 처리
export async function POST(request: NextRequest) {
  try {
    const { notificationId, markAllRead } = await request.json()

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
