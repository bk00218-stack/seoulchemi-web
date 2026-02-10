import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const orderType = searchParams.get('orderType')
  
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }
  // 기본적으로 여벌(stock) 주문만 표시, RX 주문 제외
  if (orderType) {
    where.orderType = orderType
  } else {
    where.orderType = 'stock'
  }
  
  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderedAt: 'desc' },
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
    take: 100
  })
  
  return NextResponse.json({ orders })
}
