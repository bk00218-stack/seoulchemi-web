import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// RX 상품 optionType 값들
const RX_OPTION_TYPES = ['안경렌즈 RX', 'RX']
// 여벌 상품 optionType 값들  
const STOCK_OPTION_TYPES = ['안경렌즈 여벌', '여벌', 'stock']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const productType = searchParams.get('productType') // 'rx', 'stock', 'contact', 'all'
  
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
  
  // 상품 타입으로 필터링
  const filteredOrders = orders.filter(order => {
    // 주문 내 상품들의 optionType 확인
    const hasRxProduct = order.items.some(item => 
      RX_OPTION_TYPES.some(type => 
        item.product?.optionType?.includes(type)
      )
    )
    
    const hasStockProduct = order.items.some(item =>
      STOCK_OPTION_TYPES.some(type =>
        item.product?.optionType?.includes(type)
      ) || !item.product?.optionType // optionType 없으면 여벌로 간주
    )
    
    // orderType 필드도 체크 (주문 생성 시 설정된 값)
    const isRxOrder = order.orderType === 'rx' || hasRxProduct
    
    if (productType === 'rx') {
      return isRxOrder
    } else if (productType === 'all') {
      return true
    } else {
      // 기본: 여벌 주문만 (RX 제외)
      return !isRxOrder
    }
  })
  
  return NextResponse.json({ orders: filteredOrders })
}
