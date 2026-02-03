import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders - 주문 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const brandId = searchParams.get('brandId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { store: { name: { contains: search } } },
      ]
    }
    
    // 브랜드 필터
    if (brandId) {
      where.items = {
        some: {
          product: { brandId: parseInt(brandId) }
        }
      }
    }
    
    const total = await prisma.order.count({ where })
    
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
      skip: (page - 1) * limit,
      take: limit,
    })
    
    // 통계
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayOrders = await prisma.order.count({
      where: { orderedAt: { gte: today } }
    })
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    })
    
    const todayTotal = await prisma.order.aggregate({
      where: { orderedAt: { gte: today } },
      _sum: { totalAmount: true }
    })
    
    // 브랜드 목록 (필터용)
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' }
    })
    
    return NextResponse.json({
      brands,
      orders: orders.map(order => {
        const firstItem = order.items[0]
        return {
          id: order.id,
          orderNo: order.orderNo,
          store: order.store.name,
          storeId: order.store.id,
          brand: firstItem?.product.brand.name || '-',
          product: order.items.length > 1 
            ? `${firstItem?.product.name} 외 ${order.items.length - 1}종`
            : firstItem?.product.name || '-',
          items: order.items.map(item => ({
            id: item.id,
            productName: item.product.name,
            brandName: item.product.brand.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            sph: item.sph,
            cyl: item.cyl,
          })),
          quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: order.totalAmount,
          status: order.status,
          memo: order.memo,
          orderedAt: order.orderedAt.toISOString().replace('T', ' ').slice(0, 16),
          confirmedAt: order.confirmedAt?.toISOString().split('T')[0] || null,
          shippedAt: order.shippedAt?.toISOString().split('T')[0] || null,
          deliveredAt: order.deliveredAt?.toISOString().split('T')[0] || null,
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        todayOrders,
        pending: statusCounts.find(s => s.status === 'pending')?._count || 0,
        confirmed: statusCounts.find(s => s.status === 'confirmed')?._count || 0,
        shipped: statusCounts.find(s => s.status === 'shipped')?._count || 0,
        delivered: statusCounts.find(s => s.status === 'delivered')?._count || 0,
        todayTotal: todayTotal._sum.totalAmount || 0,
      },
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/orders - 상태 일괄 변경
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderIds, status } = body
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '주문을 선택해주세요' }, { status: 400 })
    }
    
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '잘못된 상태값입니다' }, { status: 400 })
    }
    
    const updateData: any = { status }
    const now = new Date()
    
    if (status === 'confirmed') {
      updateData.confirmedAt = now
    } else if (status === 'shipped') {
      updateData.shippedAt = now
    } else if (status === 'delivered') {
      updateData.deliveredAt = now
    }
    
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, updatedCount: orderIds.length })
  } catch (error) {
    console.error('Failed to update orders:', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
