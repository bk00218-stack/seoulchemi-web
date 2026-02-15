import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/rx - RX 주문 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const where: any = { orderType: 'rx' }
    
    if (status && status !== 'all') {
      where.status = status
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
            product: { include: { brand: true } }
          }
        }
      },
      orderBy: { orderedAt: 'desc' },
      take: 100,
    })
    
    // 통계
    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { orderType: 'rx' },
      _count: true,
    })
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyOrders = await prisma.order.count({
      where: { orderType: 'rx', orderedAt: { gte: thisMonth } }
    })
    
    const totalAmount = await prisma.order.aggregate({
      where: { orderType: 'rx' },
      _sum: { totalAmount: true }
    })
    
    const avgAmount = await prisma.order.aggregate({
      where: { orderType: 'rx' },
      _avg: { totalAmount: true }
    })
    
    return NextResponse.json({
      orders: orders.map(order => {
        const firstItem = order.items[0]
        return {
          id: order.id,
          orderNo: order.orderNo,
          store: order.store.name,
          brand: firstItem?.product.brand.name || '-',
          product: firstItem?.product.name || '-',
          // RX 처방 정보
          rightSph: firstItem?.sph || '-2.00',
          rightCyl: firstItem?.cyl || '-0.50',
          rightAxis: firstItem?.axis || '180',
          leftSph: '-2.25',  // 실제로는 별도 저장 필요
          leftCyl: '-0.75',
          leftAxis: '175',
          pd: '62',
          add: '+2.00',
          quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          amount: order.totalAmount,
          status: order.status,
          orderedAt: order.orderedAt.toISOString().replace('T', ' ').slice(0, 16),
        }
      }),
      stats: {
        monthlyOrders,
        pending: stats.find(s => s.status === 'pending')?._count || 0,
        totalAmount: totalAmount._sum.totalAmount || 0,
        avgAmount: Math.round(avgAmount._avg.totalAmount || 0),
      },
    })
  } catch (error) {
    console.error('Failed to fetch RX orders:', error)
    return NextResponse.json({ error: 'RX 주문 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/orders/rx - 상태 변경
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderIds, status } = body
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '주문을 선택해주세요' }, { status: 400 })
    }
    
    const updateData: any = { status }
    const now = new Date()
    
    if (status === 'confirmed') updateData.confirmedAt = now
    else if (status === 'shipped') updateData.shippedAt = now
    else if (status === 'delivered') updateData.deliveredAt = now
    
    await prisma.order.updateMany({
      where: { id: { in: orderIds }, orderType: 'rx' },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, updatedCount: orderIds.length })
  } catch (error) {
    console.error('Failed to update RX orders:', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
