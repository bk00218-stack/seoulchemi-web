import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/ship/spare - 여벌 출고 대기 주문 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const storeId = searchParams.get('storeId')
    const groupId = searchParams.get('groupId')
    const salesStaffId = searchParams.get('salesStaffId')
    const deliveryStaffId = searchParams.get('deliveryStaffId')
    const orderType = searchParams.get('orderType') || 'stock' // stock, rx, all

    // 필터 조건 빌드
    const storeWhere: string[] = []
    const orderWhere: string[] = [
      `o.status IN ('pending', 'partial')`
    ]
    // orderType 필터: 'all'이면 전체, 아니면 해당 타입만
    if (orderType !== 'all') {
      orderWhere.push(`o."orderType" = '${orderType}'`)
    }
    const itemWhere: string[] = [`oi.status = 'pending'`]
    const params: any[] = []
    let paramIdx = 1

    if (storeId && storeId !== 'all') {
      orderWhere.push(`o."storeId" = $${paramIdx}`)
      params.push(parseInt(storeId))
      paramIdx++
    }
    if (groupId && groupId !== 'all') {
      storeWhere.push(`s."groupId" = $${paramIdx}`)
      params.push(parseInt(groupId))
      paramIdx++
    }
    if (salesStaffId && salesStaffId !== 'all') {
      storeWhere.push(`s."salesStaffId" = $${paramIdx}`)
      params.push(parseInt(salesStaffId))
      paramIdx++
    }
    if (deliveryStaffId && deliveryStaffId !== 'all') {
      storeWhere.push(`s."deliveryStaffId" = $${paramIdx}`)
      params.push(parseInt(deliveryStaffId))
      paramIdx++
    }
    if (supplierId && supplierId !== 'all') {
      params.push(parseInt(supplierId))
      paramIdx++
    }

    // 단일 raw SQL로 플랫 아이템 목록 조회 (성능 최적화)
    const supplierJoin = (supplierId && supplierId !== 'all')
      ? `INNER JOIN "Brand" br ON br.id = p."brandId" AND br."supplierId" = $${paramIdx - 1}`
      : `LEFT JOIN "Brand" br ON br.id = p."brandId"`

    const storeFilter = storeWhere.length > 0 ? `AND ${storeWhere.join(' AND ')}` : ''

    const flatOrders = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        o.id, oi.id as "itemId", o."orderNo",
        s.id as "storeId", s.name as "storeName", s.code as "storeCode",
        s."groupId", sg.name as "groupName",
        s."salesStaffId", ss.name as "salesStaffName",
        s."deliveryStaffId", ds.name as "deliveryStaffName",
        p.id as "productId", p.name as "productName",
        p."brandId", br.name as "brandName",
        br."supplierId", sup.name as "supplierName",
        oi.sph, oi.cyl, oi.quantity, oi."unitPrice", oi."totalPrice",
        o."orderType", o."orderedAt", o.status
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      INNER JOIN "Store" s ON s.id = o."storeId"
      INNER JOIN "Product" p ON p.id = oi."productId"
      ${supplierJoin}
      LEFT JOIN "Supplier" sup ON sup.id = br."supplierId"
      LEFT JOIN "StoreGroup" sg ON sg.id = s."groupId"
      LEFT JOIN "SalesStaff" ss ON ss.id = s."salesStaffId"
      LEFT JOIN "DeliveryStaff" ds ON ds.id = s."deliveryStaffId"
      WHERE ${orderWhere.join(' AND ')}
        AND ${itemWhere.join(' AND ')}
        ${storeFilter}
      ORDER BY o."orderedAt" ASC, oi.id ASC
    `, ...params)

    // 필터 목록은 병렬로 조회
    const [suppliers, stores, groups, salesStaffs, deliveryStaffs] = await Promise.all([
      prisma.supplier.findMany({
        where: { isActive: true, brands: { some: {} } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.$queryRawUnsafe<{id: number, name: string, code: string, phone: string | null}[]>(
        `SELECT DISTINCT s.id, s.name, s.code, s.phone
        FROM "Store" s
        INNER JOIN "Order" o ON o."storeId" = s.id
        WHERE o.status IN ('pending', 'partial') ${orderType !== 'all' ? `AND o."orderType" = '${orderType}'` : ''} AND s."isActive" = true
        ORDER BY s.name`
      ),
      prisma.storeGroup.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.salesStaff.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.deliveryStaff.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      orders: flatOrders,
      filters: { suppliers, stores, groups, salesStaffs, deliveryStaffs },
      totalCount: flatOrders.length
    })

  } catch (error: any) {
    console.error('Failed to fetch spare shipping orders:', error)
    return NextResponse.json({
      error: '여벌 출고 대기 주문을 불러오는데 실패했습니다.',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST /api/orders/ship/spare - 여벌 출고 처리 (부분출고 지원)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemIds } = body

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: '출고할 아이템을 선택해주세요' }, { status: 400 })
    }

    // 1. 트랜잭션 밖에서 데이터 미리 조회
    const selectedItems = await prisma.orderItem.findMany({
      where: {
        id: { in: itemIds },
        status: 'pending',
        order: { status: { in: ['pending', 'partial'] } }
      },
      include: {
        order: { include: { store: true } },
        product: true
      }
    })

    if (selectedItems.length === 0) {
      return NextResponse.json({ error: '출고할 아이템이 없습니다 (이미 출고됨 또는 존재하지 않음)' }, { status: 404 })
    }

    const orderIds = [...new Set(selectedItems.map(item => item.orderId))]

    // 주문별 전체 아이템 상태 + ProductOption 미리 조회 (트랜잭션 밖에서)
    const [orders, productOptions] = await Promise.all([
      prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          store: true,
          items: { select: { id: true, status: true } }
        }
      }),
      // 필요한 ProductOption 한 번에 조회
      prisma.productOption.findMany({
        where: {
          productId: { in: selectedItems.map(i => i.productId) },
          isActive: true
        },
        select: { id: true, productId: true, sph: true, cyl: true, stock: true }
      })
    ])

    // ProductOption 룩업 맵 생성
    const optionMap = new Map<string, typeof productOptions[0]>()
    for (const opt of productOptions) {
      const key = `${opt.productId}|${opt.sph || ''}|${opt.cyl || ''}`
      optionMap.set(key, opt)
    }

    const results: any[] = []
    const now = new Date()

    // 2. 트랜잭션: 최소한의 쓰기 작업만 수행
    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        const store = order.store
        const itemsToShip = selectedItems.filter(item => item.orderId === order.id)
        const shippedAmount = itemsToShip.reduce((sum, item) => sum + item.totalPrice, 0)

        // OrderItem 일괄 shipped 처리
        await tx.orderItem.updateMany({
          where: { id: { in: itemsToShip.map(i => i.id) } },
          data: { status: 'shipped', shippedAt: now }
        })

        // 재고 차감 + 이력: 배치로 처리
        for (const item of itemsToShip) {
          const optKey = `${item.productId}|${item.sph || ''}|${item.cyl || ''}`
          const productOption = optionMap.get(optKey)

          let beforeStock = 0, afterStock = 0
          let productOptionId: number | null = null

          const isReturnItem = item.quantity < 0

          if (productOption) {
            beforeStock = productOption.stock
            afterStock = beforeStock - item.quantity // 양수: 재고감소, 음수(반품): 재고증가
            if (item.quantity > 0) afterStock = Math.max(0, afterStock) // 양수만 0 하한
            productOptionId = productOption.id
            productOption.stock = afterStock // 로컬 캐시 업데이트

            await tx.productOption.update({
              where: { id: productOption.id },
              data: { stock: afterStock }
            })
          }

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              productOptionId,
              type: isReturnItem ? 'return' : 'out',
              reason: isReturnItem ? 'return' : 'sale',
              quantity: -item.quantity,
              beforeStock, afterStock,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `${isReturnItem ? '반품 입고' : '출고'}: ${store.name}${!productOption ? ' (옵션없음)' : ''}`,
            }
          })
        }

        // 주문 상태 결정
        const shippingNowIds = new Set(itemsToShip.map(i => i.id))
        const allShipped = order.items.every(i =>
          shippingNowIds.has(i.id) || i.status === 'shipped'
        )

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: allShipped ? 'shipped' : 'partial',
            ...(allShipped ? { shippedAt: now } : {})
          }
        })

        // 거래처 잔액 + 거래내역 + 로그
        await tx.store.update({
          where: { id: order.storeId },
          data: { outstandingAmount: { increment: shippedAmount } }
        })

        const isNetReturn = shippedAmount < 0
        await tx.transaction.create({
          data: {
            storeId: order.storeId,
            type: isNetReturn ? 'return' : 'sale',
            amount: shippedAmount,
            balanceAfter: store.outstandingAmount + shippedAmount,
            orderId: order.id,
            orderNo: order.orderNo,
            memo: isNetReturn
              ? (allShipped ? '반품 처리' : '반품 부분처리')
              : (allShipped ? '출고' : '부분출고'),
            processedBy: 'admin',
          }
        })

        await tx.workLog.create({
          data: {
            workType: 'order_ship',
            targetType: 'order',
            targetId: order.id,
            targetNo: order.orderNo,
            description: `${isNetReturn ? '반품' : ''} ${allShipped ? (isNetReturn ? '처리' : '출고') : (isNetReturn ? '부분처리' : '부분출고')}: ${store.name} - ${shippedAmount.toLocaleString()}원`,
            details: JSON.stringify({
              storeId: store.id,
              storeName: store.name,
              shippedItemCount: itemsToShip.length,
              totalItemCount: order.items.length,
              shippedAmount,
              isPartial: !allShipped
            }),
            userName: 'admin',
            pcName: 'WEB',
          }
        })

        results.push({
          orderId: order.id,
          orderNo: order.orderNo,
          storeName: store.name,
          shippingAmount: shippedAmount,
          itemCount: itemsToShip.length,
          shippedItemIds: itemsToShip.map(i => i.id)
        })
      }
    }, { timeout: 15000 })

    return NextResponse.json({
      success: true,
      message: `${results.length}건의 주문이 출고 처리되었습니다.`,
      shipped: results
    })

  } catch (error: any) {
    console.error('Failed to ship spare items:', error)
    return NextResponse.json({
      error: '여벌 출고 처리에 실패했습니다.',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
