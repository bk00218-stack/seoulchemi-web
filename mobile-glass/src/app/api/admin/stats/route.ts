import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [totalOrders, pendingOrders, completedOrders, totalRevenueResult] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: { in: ['shipped', 'delivered'] } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } })
  ])
  
  return NextResponse.json({
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue: totalRevenueResult._sum.totalAmount || 0,
    returnCount: 0
  })
}
