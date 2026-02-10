import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// RX 브랜드 키워드 (누진, 매직폼 등)
const RX_BRAND_KEYWORDS = ['누진', '매직폼', 'K누진']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const orderType = searchParams.get('orderType')
  const includeRx = searchParams.get('includeRx') === 'true'
  
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
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
  
  // RX 브랜드 포함 여부로 필터링
  const filteredOrders = orders.filter(order => {
    const hasRxBrand = order.items.some(item => 
      RX_BRAND_KEYWORDS.some(keyword => 
        item.product?.brand?.name?.includes(keyword)
      )
    )
    
    // orderType이 'rx'이거나 RX 브랜드 포함이면 RX 주문
    const isRxOrder = order.orderType === 'rx' || hasRxBrand
    
    if (orderType === 'rx' || includeRx) {
      return isRxOrder
    } else {
      // 기본: 여벌 주문만 (RX 제외)
      return !isRxOrder
    }
  })
  
  return NextResponse.json({ orders: filteredOrders })
}
