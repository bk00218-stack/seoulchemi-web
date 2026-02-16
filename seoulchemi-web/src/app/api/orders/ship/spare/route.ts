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
      status: 'pending',
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
        WHERE o.status = 'pending' AND o."orderType" = 'stock' AND s."isActive" = true
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

// POST /api/orders/ship/spare - 여벌 출고 처리 (아이템 선택 → 주문 단위로 처리)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemIds } = body // 출고할 OrderItem ID 배열

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: '출고할 아이템을 선택해주세요' }, { status: 400 })
    }

    // 아이템 조회 (주문 정보 포함)
    const items = await prisma.orderItem.findMany({
      where: { 
        id: { in: itemIds },
        order: { status: 'pending', orderType: 'stock' }
      },
      include: {
        order: {
          include: { store: true }
        },
        product: {
          include: { brand: true }
        }
      }
    })

    if (items.length === 0) {
      return NextResponse.json({ error: '출고할 아이템이 없습니다 (이미 출고됨 또는 존재하지 않음)' }, { status: 404 })
    }

    // 주문 ID 추출 (선택된 아이템들의 주문)
    const orderIds = [...new Set(items.map(item => item.orderId))]

    // 해당 주문들 전체 조회 (모든 아이템 포함)
    const orders = await prisma.order.findMany({
      where: { 
        id: { in: orderIds },
        status: 'pending'
      },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      }
    })

    const results: any[] = []

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        const store = order.store

        // 1. 주문 상태 변경 -> shipped
        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: 'shipped',
            shippedAt: new Date()
          }
        })

        // 2. 재고 차감 + 재고 이력 생성
        for (const item of order.items) {
          // ProductOption 찾기 (productId + sph + cyl 매칭)
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
            // 재고 차감
            beforeStock = productOption.stock
            afterStock = Math.max(0, beforeStock - item.quantity) // 음수 방지
            productOptionId = productOption.id

            await tx.productOption.update({
              where: { id: productOption.id },
              data: { stock: afterStock }
            })
          }

          // 재고 이력 기록 (InventoryTransaction)
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              productOptionId: productOptionId,
              type: 'out',
              reason: 'sale',
              quantity: -item.quantity, // 출고는 마이너스
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

        // 3. 거래처 잔액 증가 (외상 증가)
        await tx.store.update({
          where: { id: order.storeId },
          data: {
            outstandingAmount: { increment: order.totalAmount }
          }
        })

        // 4. 거래내역 생성 (Transaction)
        await tx.transaction.create({
          data: {
            storeId: order.storeId,
            type: 'sale',
            amount: order.totalAmount,
            balanceAfter: store.outstandingAmount + order.totalAmount, // 새 잔액
            orderId: order.id,
            orderNo: order.orderNo,
            memo: `여벌 출고`,
            processedBy: 'admin',
          }
        })

        // 5. 작업 로그
        await tx.workLog.create({
          data: {
            workType: 'order_ship',
            targetType: 'order',
            targetId: order.id,
            targetNo: order.orderNo,
            description: `여벌 출고: ${store.name} - ${order.totalAmount.toLocaleString()}원`,
            details: JSON.stringify({
              storeId: store.id,
              storeName: store.name,
              itemCount: order.items.length,
              totalAmount: order.totalAmount
            }),
            userName: 'admin',
            pcName: 'WEB',
          }
        })

        results.push({
          orderId: order.id,
          orderNo: order.orderNo,
          storeName: store.name,
          shippingAmount: order.totalAmount,
          itemCount: order.items.length
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
