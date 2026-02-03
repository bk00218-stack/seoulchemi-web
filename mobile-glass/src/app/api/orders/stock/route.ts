import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/stock - 여벌 주문 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const where: any = { orderType: 'stock' }
    
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
      where: { orderType: 'stock' },
      _count: true,
      _sum: { totalAmount: true },
    })
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyOrders = await prisma.order.count({
      where: { orderType: 'stock', orderedAt: { gte: thisMonth } }
    })
    
    const totalAmount = await prisma.order.aggregate({
      where: { orderType: 'stock' },
      _sum: { totalAmount: true }
    })
    
    const totalQuantity = await prisma.orderItem.aggregate({
      where: { order: { orderType: 'stock' } },
      _sum: { quantity: true }
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
          sph: firstItem?.sph || '-',
          cyl: firstItem?.cyl || '-',
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
        avgQuantity: Math.round((totalQuantity._sum.quantity || 0) / (orders.length || 1)),
      },
    })
  } catch (error) {
    console.error('Failed to fetch stock orders:', error)
    return NextResponse.json({ error: '여벌 주문 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/orders/stock - 상태 변경
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
      where: { id: { in: orderIds }, orderType: 'stock' },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, updatedCount: orderIds.length })
  } catch (error) {
    console.error('Failed to update stock orders:', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
