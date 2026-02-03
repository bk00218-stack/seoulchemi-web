import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shipping - 출고 목록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // 출고 관련 상태만 필터 (confirmed 이상)
  if (status && status !== 'all') {
    where.status = status
  } else {
    where.status = { in: ['confirmed', 'shipped', 'delivered'] }
  }
  
  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { store: { name: { contains: search } } },
    ]
  }
  
  const orders = await prisma.order.findMany({
    where,
    include: {
      store: true,
      items: {
        include: {
          product: {
            include: { brand: true }
          }
        }
      }
    },
    orderBy: { orderedAt: 'desc' },
    take: 100,
  })
  
  // 통계
  const stats = await prisma.order.groupBy({
    by: ['status'],
    where: { status: { in: ['confirmed', 'shipped', 'delivered'] } },
    _count: true,
  })
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayDelivered = await prisma.order.count({
    where: {
      status: 'delivered',
      deliveredAt: { gte: today },
    },
  })
  
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const weekShipped = await prisma.order.count({
    where: {
      status: { in: ['shipped', 'delivered'] },
      shippedAt: { gte: weekStart },
    },
  })
  
  return NextResponse.json({
    orders: orders.map(order => ({
      id: order.id,
      orderNo: order.orderNo,
      store: order.store.name,
      address: order.store.address || '주소 미등록',
      items: order.items.length > 1 
        ? `${order.items[0].product.name} 외 ${order.items.length - 1}종`
        : order.items[0]?.product.name || '-',
      quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      status: order.status,
      orderedAt: order.orderedAt.toISOString().split('T')[0],
      shippedAt: order.shippedAt?.toISOString().split('T')[0] || null,
      deliveredAt: order.deliveredAt?.toISOString().split('T')[0] || null,
      totalAmount: order.totalAmount,
      trackingNo: '', // TODO: 송장번호 필드 추가 필요
    })),
    stats: {
      confirmed: stats.find(s => s.status === 'confirmed')?._count || 0,
      shipped: stats.find(s => s.status === 'shipped')?._count || 0,
      delivered: stats.find(s => s.status === 'delivered')?._count || 0,
      todayDelivered,
      weekShipped,
    },
  })
}

// PATCH /api/shipping - 상태 변경
export async function PATCH(request: Request) {
  const body = await request.json()
  const { orderIds, status } = body
  
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: '주문을 선택해주세요' }, { status: 400 })
  }
  
  if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
    return NextResponse.json({ error: '잘못된 상태값입니다' }, { status: 400 })
  }
  
  const updateData: any = { status }
  
  if (status === 'shipped') {
    updateData.shippedAt = new Date()
  } else if (status === 'delivered') {
    updateData.deliveredAt = new Date()
  }
  
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: updateData,
  })
  
  return NextResponse.json({ success: true, updatedCount: orderIds.length })
}
