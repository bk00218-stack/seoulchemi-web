import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'
import { getStoreDiscountSettings, calculatePriceFromCache } from '@/lib/priceCalculator'

function normalizeQuantity(qty: number): number {
  if (qty >= 0) return Math.ceil(qty * 2) / 2
  return -Math.ceil(Math.abs(qty) * 2) / 2
}

// POST /api/orders/create-and-ship - 주문 생성 + 즉시 출고 (단일 트랜잭션)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const body = await request.json()
    const { storeId, orderType: rawOrderType, items, memo, skipCreditCheck } = body

    const orderTypeMap: Record<string, string> = {
      '여벌': 'stock', '착색': 'stock', '기타': 'stock', 'RX': 'rx', 'stock': 'stock', 'rx': 'rx'
    }
    const orderType = orderTypeMap[rawOrderType] || 'stock'

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ error: '가맹점과 상품을 선택해주세요' }, { status: 400 })
    }

    const parsedStoreId = parseInt(storeId)
    const productIds = items.map((item: any) => item.productId)

    // 모든 초기 쿼리 병렬 실행
    const [store, discountSettings, products, productOptions] = await Promise.all([
      prisma.store.findUnique({ where: { id: parsedStoreId } }),
      getStoreDiscountSettings(parsedStoreId),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, brandId: true, sellingPrice: true }
      }),
      // 재고 옵션도 미리 조회 (출고용)
      prisma.productOption.findMany({
        where: { productId: { in: productIds }, isActive: true },
        select: { id: true, productId: true, sph: true, cyl: true, stock: true }
      })
    ])

    if (!store) return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    if (!store.isActive) return NextResponse.json({ error: '비활성 가맹점입니다.' }, { status: 400 })

    const productMap = new Map(products.map(p => [p.id, p]))

    // 할인 적용 + 수량 정규화
    const itemsWithDiscount = items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) return item
      const priceResult = calculatePriceFromCache(product, discountSettings)
      const unitPrice = item.unitPrice ?? priceResult.finalPrice
      const quantity = normalizeQuantity(item.quantity)
      return { ...item, quantity, unitPrice, originalPrice: product.sellingPrice, discountType: priceResult.discountType, discountRate: priceResult.discountRate }
    })

    const totalAmount = itemsWithDiscount.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

    // 신용한도 체크
    if (!skipCreditCheck && store.creditLimit > 0 && totalAmount > 0) {
      const futureOutstanding = store.outstandingAmount + totalAmount
      if (futureOutstanding > store.creditLimit) {
        return NextResponse.json({
          error: '신용한도를 초과합니다.',
          details: { currentOutstanding: store.outstandingAmount, orderAmount: totalAmount, creditLimit: store.creditLimit, wouldExceedBy: futureOutstanding - store.creditLimit }
        }, { status: 400 })
      }
    }

    // ProductOption 룩업 맵
    const optionMap = new Map<string, typeof productOptions[0]>()
    for (const opt of productOptions) {
      optionMap.set(`${opt.productId}|${opt.sph || ''}|${opt.cyl || ''}`, opt)
    }

    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    const secs = String(now.getSeconds()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0')
    const orderNo = `${month}${day}${hours}${mins}${secs}${rand}`

    // 단일 트랜잭션: 주문 생성 + 출고 + 재고차감 + 거래내역
    const result = await prisma.$transaction(async (tx) => {
      // 1. 주문 생성
      const newOrder = await tx.order.create({
        data: {
          orderNo, storeId: parsedStoreId, orderType: orderType || 'stock',
          status: 'shipped', shippedAt: now, totalAmount, memo,
          items: {
            create: itemsWithDiscount.map((item: any) => ({
              productId: item.productId, quantity: item.quantity,
              unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice,
              sph: item.sph || null, cyl: item.cyl || null, axis: item.axis || null,
              status: 'shipped', shippedAt: now,
            }))
          }
        },
        include: { items: { select: { id: true, productId: true, sph: true, cyl: true, quantity: true, unitPrice: true, totalPrice: true } } }
      })

      // 2. 재고 차감 - 배치 처리
      const inventoryData: any[] = []
      for (const item of newOrder.items) {
        const optKey = `${item.productId}|${item.sph || ''}|${item.cyl || ''}`
        const opt = optionMap.get(optKey)
        let beforeStock = 0, afterStock = 0, productOptionId: number | null = null

        if (opt) {
          beforeStock = opt.stock
          afterStock = item.quantity > 0 ? Math.max(0, beforeStock - item.quantity) : beforeStock - item.quantity
          productOptionId = opt.id
          opt.stock = afterStock

          await tx.productOption.update({ where: { id: opt.id }, data: { stock: afterStock } })
        }

        inventoryData.push({
          productId: item.productId, productOptionId,
          type: item.quantity < 0 ? 'return' : 'out',
          reason: item.quantity < 0 ? 'return' : 'sale',
          quantity: -item.quantity, beforeStock, afterStock,
          unitPrice: item.unitPrice, totalPrice: item.totalPrice,
          orderId: newOrder.id, orderNo,
          memo: `출고: ${store.name}${!opt ? ' (옵션없음)' : ''}`,
        })
      }

      // 3. 재고 이력 일괄 생성
      if (inventoryData.length > 0) {
        await tx.inventoryTransaction.createMany({ data: inventoryData })
      }

      // 4. 거래처 잔액 업데이트
      await tx.store.update({
        where: { id: parsedStoreId },
        data: { outstandingAmount: { increment: totalAmount } }
      })

      // 5. 거래내역 + 작업로그 병렬 (트랜잭션 내)
      await Promise.all([
        tx.transaction.create({
          data: {
            storeId: parsedStoreId, type: totalAmount < 0 ? 'return' : 'sale',
            amount: Math.abs(totalAmount), balanceAfter: store.outstandingAmount + totalAmount,
            orderId: newOrder.id, orderNo, memo: '출고', processedBy: currentUser,
          }
        }),
        tx.workLog.create({
          data: {
            workType: 'order_ship', targetType: 'order', targetId: newOrder.id, targetNo: orderNo,
            description: `접수+출고: ${store.name} - ${totalAmount.toLocaleString()}원`,
            details: JSON.stringify({ storeId: store.id, storeName: store.name, orderType, itemCount: items.length, totalAmount }),
            userName: currentUser, pcName: 'WEB',
          }
        })
      ])

      return newOrder
    }, { timeout: 10000 })

    return NextResponse.json({
      success: true,
      order: {
        id: result.id, orderNo: result.orderNo,
        itemIds: result.items.map(i => i.id),
        itemCount: result.items.length, totalAmount
      }
    })
  } catch (error: any) {
    console.error('Failed to create-and-ship:', error)
    return NextResponse.json({ error: '주문 처리에 실패했습니다.', details: error?.message || String(error) }, { status: 500 })
  }
}
