import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStoreDiscountSettings, calculatePriceFromCache } from '@/lib/priceCalculator'

// 수량 정규화: 0.5 단위로 올림 (0.1→0.5, 1.1→1.5, 1.6→2)
function normalizeQuantity(qty: number): number {
  return Math.ceil(qty * 2) / 2
}

// POST /api/orders/create - 새 주문 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { storeId, orderType: rawOrderType, items, memo, skipCreditCheck } = body
    
    // orderType 매핑: 여벌/착색/기타 -> stock, RX -> rx
    const orderTypeMap: Record<string, string> = {
      '여벌': 'stock',
      '착색': 'stock', 
      '기타': 'stock',
      'RX': 'rx',
      'stock': 'stock',
      'rx': 'rx'
    }
    const orderType = orderTypeMap[rawOrderType] || 'stock'
    
    if (!storeId) {
      return NextResponse.json({ error: '가맹점을 선택해주세요' }, { status: 400 })
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: '상품을 추가해주세요' }, { status: 400 })
    }

    // 가맹점 정보 조회
    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!store.isActive) {
      return NextResponse.json({ error: '비활성 가맹점입니다.' }, { status: 400 })
    }

    // 할인 설정 조회
    const discountSettings = await getStoreDiscountSettings(parseInt(storeId))
    
    // 상품 정보 조회 (할인 계산용)
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, brandId: true, sellingPrice: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    // 할인 적용된 아이템 계산 + 수량 정규화
    const itemsWithDiscount = items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) return item
      
      // 할인가 계산
      const priceResult = calculatePriceFromCache(product, discountSettings)
      const unitPrice = item.unitPrice ?? priceResult.finalPrice // 직접 지정한 가격이 있으면 사용
      
      // 수량 정규화 (1 미만은 0.5)
      const quantity = normalizeQuantity(item.quantity)
      
      return {
        ...item,
        quantity,
        unitPrice,
        originalPrice: product.sellingPrice,
        discountType: priceResult.discountType,
        discountRate: priceResult.discountRate
      }
    })

    // 총액 계산 (할인 적용된 가격)
    const totalAmount = itemsWithDiscount.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    )

    // 신용한도 체크 (옵션)
    if (!skipCreditCheck && store.creditLimit > 0) {
      const futureOutstanding = store.outstandingAmount + totalAmount
      if (futureOutstanding > store.creditLimit) {
        return NextResponse.json({ 
          error: '신용한도를 초과합니다.',
          details: {
            currentOutstanding: store.outstandingAmount,
            orderAmount: totalAmount,
            creditLimit: store.creditLimit,
            wouldExceedBy: futureOutstanding - store.creditLimit
          }
        }, { status: 400 })
      }
    }
    
    // 주문번호 생성
    const today = new Date()
    const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
    const lastOrder = await prisma.order.findFirst({
      where: { orderNo: { startsWith: prefix } },
      orderBy: { orderNo: 'desc' }
    })
    
    let seq = 1
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.split('-').pop() || '0')
      seq = lastSeq + 1
    }
    const orderNo = `${prefix}-${String(seq).padStart(4, '0')}`
    
    // 트랜잭션으로 주문 생성
    const order = await prisma.$transaction(async (tx) => {
      // 주문 생성
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          storeId: parseInt(storeId),
          orderType: orderType || 'stock',
          status: 'pending',
          totalAmount,
          memo,
          items: {
            create: itemsWithDiscount.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              sph: item.sph || null,
              cyl: item.cyl || null,
              axis: item.axis || null,
              bc: item.bc || null,
              dia: item.dia || null,
              memo: item.memo || null,
            }))
          }
        },
        include: {
          store: true,
          items: { include: { product: { include: { brand: true } } } }
        }
      })

      // 작업 로그 기록
      await tx.workLog.create({
        data: {
          workType: 'order_create',
          targetType: 'order',
          targetId: newOrder.id,
          targetNo: orderNo,
          description: `주문 등록: ${store.name} - ${totalAmount.toLocaleString()}원`,
          details: JSON.stringify({
            storeId: store.id,
            storeName: store.name,
            orderType,
            itemCount: items.length,
            totalAmount
          }),
          userName: 'admin',
          pcName: 'WEB',
        }
      })

      return newOrder
    })
    
    return NextResponse.json({ 
      success: true, 
      order: {
        id: order.id,
        orderNo: order.orderNo,
        storeName: order.store.name,
        totalAmount: order.totalAmount,
        status: order.status,
        itemCount: order.items.length
      }
    })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: '주문 등록에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/orders/create - 주문 등록에 필요한 데이터 조회
export async function GET() {
  try {
    const [stores, products, brands] = await Promise.all([
      prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { brand: true },
        orderBy: [{ brandId: 'asc' }, { name: 'asc' }]
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      })
    ])
    
    return NextResponse.json({ stores, products, brands })
  } catch (error) {
    console.error('Failed to fetch order form data:', error)
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
