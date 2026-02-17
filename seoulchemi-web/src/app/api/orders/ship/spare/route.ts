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

    const where: any = {
      status: { in: ['pending', 'partial'] }, // 부분출고 주문도 포함
      orderType: 'stock' // 여벌만
    }

    // 가맹점 직접 필터
    if (storeId && storeId !== 'all') {
      where.storeId = parseInt(storeId)
    }

    // 그룹 필터 - store.groupId
    if (groupId && groupId !== 'all') {
      where.store = {
        ...where.store,
        groupId: parseInt(groupId)
      }
    }

    // 영업담당 필터 - store.salesStaffId
    if (salesStaffId && salesStaffId !== 'all') {
      where.store = {
        ...where.store,
        salesStaffId: parseInt(salesStaffId)
      }
    }

    // 배송담당 필터 - store.deliveryStaffId
    if (deliveryStaffId && deliveryStaffId !== 'all') {
      where.store = {
        ...where.store,
        deliveryStaffId: parseInt(deliveryStaffId)
      }
    }

    // 매입처 필터 - 브랜드의 supplierId 기준
    if (supplierId && supplierId !== 'all') {
      where.items = {
        some: {
          product: {
            brand: {
              supplierId: parseInt(supplierId)
            }
          }
        }
      }
    }

    // 병렬로 주문과 필터 목록 조회 (성능 최적화)
    const [orders, suppliers, stores, groups, salesStaffs, deliveryStaffs] = await Promise.all([
      // 주문 조회
      prisma.order.findMany({
        where,
        include: {
          store: {
            select: { 
              id: true, 
              name: true, 
              code: true,
              groupId: true,
              salesStaffId: true,
              deliveryStaffId: true,
              group: { select: { id: true, name: true } },
              salesStaff: { select: { id: true, name: true } },
              deliveryStaff: { select: { id: true, name: true } }
            }
          },
          items: {
            where: { status: 'pending' }, // 출고된 아이템 제외
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brandId: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      supplierId: true,
                      supplier: { select: { id: true, name: true } }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { orderedAt: 'asc' }
      }),
      // 매입처 (브랜드가 연결된 것만)
      prisma.supplier.findMany({
        where: { isActive: true, brands: { some: {} } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      // 가맹점 - 출고 대기 주문에서 직접 추출 (더 빠름)
      prisma.$queryRaw<{id: number, name: string, code: string, phone: string | null}[]>`
        SELECT DISTINCT s.id, s.name, s.code, s.phone
        FROM "Store" s
        INNER JOIN "Order" o ON o."storeId" = s.id
        WHERE o.status IN ('pending', 'partial') AND o."orderType" = 'stock' AND s."isActive" = true
        ORDER BY s.name
      `,
      // 그룹
      prisma.storeGroup.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      // 영업담당
      prisma.salesStaff.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      // 배송담당
      prisma.deliveryStaff.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ])

    // 플랫하게 변환 (아이템 단위로) - 개별 선택 가능하도록
    const flatOrders = orders.flatMap(order => 
      order.items.map(item => ({
        id: order.id,
        itemId: item.id,
        orderNo: order.orderNo,
        storeId: order.store.id,
        storeName: order.store.name,
        storeCode: order.store.code,
        groupId: order.store.groupId,
        groupName: order.store.group?.name || null,
        salesStaffId: order.store.salesStaffId,
        salesStaffName: order.store.salesStaff?.name || null,
        deliveryStaffId: order.store.deliveryStaffId,
        deliveryStaffName: order.store.deliveryStaff?.name || null,
        productId: item.productId,
        productName: item.product.name,
        brandId: item.product.brandId,
        brandName: item.product.brand.name,
        supplierId: item.product.brand.supplierId,
        supplierName: item.product.brand.supplier?.name || null,
        sph: item.sph,
        cyl: item.cyl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        orderType: order.orderType,
        orderedAt: order.orderedAt,
        status: order.status
      }))
    )

    return NextResponse.json({
      orders: flatOrders,
      filters: {
        suppliers,
        stores,
        groups,
        salesStaffs,
        deliveryStaffs
      },
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

// POST /api/orders/ship/spare - 여벌 출고 처리 (아이템 선택 → 선택된 아이템만 처리, 부분출고 지원)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemIds } = body // 출고할 OrderItem ID 배열

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: '출고할 아이템을 선택해주세요' }, { status: 400 })
    }

    // 선택된 아이템 중 pending 상태인 것만 조회
    const selectedItems = await prisma.orderItem.findMany({
      where: {
        id: { in: itemIds },
        status: 'pending',
        order: { status: { in: ['pending', 'partial'] }, orderType: 'stock' }
      },
      include: {
        order: { include: { store: true } },
        product: { include: { brand: true } }
      }
    })

    if (selectedItems.length === 0) {
      return NextResponse.json({ error: '출고할 아이템이 없습니다 (이미 출고됨 또는 존재하지 않음)' }, { status: 404 })
    }

    // 주문 ID 추출
    const orderIds = [...new Set(selectedItems.map(item => item.orderId))]

    // 주문 조회 (전체 아이템의 status 확인용 - lightweight)
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        store: true,
        items: { select: { id: true, status: true } }
      }
    })

    const results: any[] = []

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        const store = order.store
        const now = new Date()

        // 이 주문에서 지금 출고할 아이템만 필터
        const itemsToShip = selectedItems.filter(item => item.orderId === order.id)
        const shippedAmount = itemsToShip.reduce((sum, item) => sum + item.totalPrice, 0)

        // 1. 선택된 OrderItem 상태를 shipped로 변경
        await tx.orderItem.updateMany({
          where: { id: { in: itemsToShip.map(i => i.id) } },
          data: { status: 'shipped', shippedAt: now }
        })

        // 2. 선택된 아이템만 재고 차감 + 재고 이력 생성
        for (const item of itemsToShip) {
          const productOption = await tx.productOption.findFirst({
            where: {
              productId: item.productId,
              sph: item.sph || null,
              cyl: item.cyl || null,
              isActive: true
            }
          })

          let beforeStock = 0
          let afterStock = 0
          let productOptionId: number | null = null

          if (productOption) {
            beforeStock = productOption.stock
            afterStock = Math.max(0, beforeStock - item.quantity)
            productOptionId = productOption.id

            await tx.productOption.update({
              where: { id: productOption.id },
              data: { stock: afterStock }
            })
          }

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              productOptionId: productOptionId,
              type: 'out',
              reason: 'sale',
              quantity: -item.quantity,
              beforeStock: beforeStock,
              afterStock: afterStock,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: `여벌 출고: ${store.name}${!productOption ? ' (옵션없음)' : ''}`,
            }
          })
        }

        // 3. 주문 내 모든 아이템이 출고됐는지 확인
        const shippingNowIds = new Set(itemsToShip.map(i => i.id))
        const allShipped = order.items.every(i =>
          shippingNowIds.has(i.id) || i.status === 'shipped'
        )
        const newOrderStatus = allShipped ? 'shipped' : 'partial'

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: newOrderStatus,
            ...(allShipped ? { shippedAt: now } : {})
          }
        })

        // 4. 거래처 잔액 증가 (출고된 아이템 금액만)
        await tx.store.update({
          where: { id: order.storeId },
          data: { outstandingAmount: { increment: shippedAmount } }
        })

        // 5. 거래내역 생성
        await tx.transaction.create({
          data: {
            storeId: order.storeId,
            type: 'sale',
            amount: shippedAmount,
            balanceAfter: store.outstandingAmount + shippedAmount,
            orderId: order.id,
            orderNo: order.orderNo,
            memo: allShipped ? '여벌 출고' : '여벌 부분출고',
            processedBy: 'admin',
          }
        })

        // 6. 작업 로그
        await tx.workLog.create({
          data: {
            workType: 'order_ship',
            targetType: 'order',
            targetId: order.id,
            targetNo: order.orderNo,
            description: `여벌 ${allShipped ? '출고' : '부분출고'}: ${store.name} - ${shippedAmount.toLocaleString()}원`,
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
    })

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
