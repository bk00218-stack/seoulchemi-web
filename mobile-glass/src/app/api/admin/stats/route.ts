import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 기본 통계
  const [totalOrders, pendingOrders, completedOrders, totalRevenueResult, todayOrders, todayRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: { in: ['shipped', 'delivered'] } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    // 오늘 주문
    prisma.order.count({
      where: {
        createdAt: { gte: today, lt: tomorrow }
      }
    }),
    // 오늘 매출
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today, lt: tomorrow }
      },
      _sum: { totalAmount: true }
    })
  ])
  
  // 주간 매출 (최근 7일)
  const weeklyRevenue = []
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const dayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: date, lt: nextDate }
      },
      _sum: { totalAmount: true }
    })
    
    weeklyRevenue.push({
      day: dayNames[date.getDay()],
      date: date.toISOString().split('T')[0],
      amount: dayRevenue._sum.totalAmount || 0
    })
  }
  
  // 인기 상품 TOP 5
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 5
  })
  
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { brand: true }
      })
      return {
        id: item.productId,
        name: product?.name || '알 수 없음',
        brand: product?.brand?.name || '-',
        count: item._count.productId
      }
    })
  )
  
  // 최근 활동 (최근 주문 5건)
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      store: true,
      items: {
        include: { product: true },
        take: 1
      }
    }
  })
  
  const recentActivity = recentOrders.map(order => {
    const timeDiff = Date.now() - new Date(order.createdAt).getTime()
    const minutes = Math.floor(timeDiff / 60000)
    let timeStr = '방금'
    if (minutes > 60 * 24) {
      timeStr = `${Math.floor(minutes / (60 * 24))}일 전`
    } else if (minutes > 60) {
      timeStr = `${Math.floor(minutes / 60)}시간 전`
    } else if (minutes > 0) {
      timeStr = `${minutes}분 전`
    }
    
    const itemCount = order.items.length
    const firstProduct = order.items[0]?.product?.name || '상품'
    
    return {
      time: timeStr,
      action: order.status === 'pending' ? '주문' : order.status === 'shipped' ? '출고' : '완료',
      detail: `${order.store?.name || '거래처'} - ${firstProduct}${itemCount > 1 ? ` 외 ${itemCount - 1}건` : ''}`
    }
  })
  
  return NextResponse.json({
    // 기본 통계
    totalOrders: todayOrders,
    pendingOrders,
    completedOrders: await prisma.order.count({
      where: {
        status: { in: ['shipped', 'delivered'] },
        createdAt: { gte: today, lt: tomorrow }
      }
    }),
    totalRevenue: todayRevenue._sum.totalAmount || 0,
    
    // 주간 매출
    weeklyRevenue,
    
    // 인기 상품
    topProducts: topProductsWithDetails,
    
    // 최근 활동
    recentActivity,
    
    // 알림 (대기 주문이 많으면)
    alerts: pendingOrders > 5 
      ? [{ type: 'warning', message: `대기 중인 주문 ${pendingOrders}건이 있습니다` }]
      : []
  })
}
