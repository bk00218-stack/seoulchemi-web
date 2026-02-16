import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders/ship - 출고 처리
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderIds } = body // 출고할 주문 ID 배열

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: '출고할 주문을 선택해주세요' }, { status: 400 })
    }

    // 주문 조회 (items 포함)
    const orders = await prisma.order.findMany({
      where: { 
        id: { in: orderIds },
        status: 'pending' // 대기 상태만
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

    if (orders.length === 0) {
      return NextResponse.json({ error: '출고할 주문이 없습니다 (이미 출고됨 또는 존재하지 않음)' }, { status: 404 })
    }

    const results: any[] = []

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
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
              memo: `출고: ${order.store.name}${!productOption ? ' (옵션없음)' : ''}`,
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
            balanceAfter: order.store.outstandingAmount + order.totalAmount, // 새 잔액
            orderId: order.id,
            orderNo: order.orderNo,
            memo: `판매 출고`,
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
            description: `출고 완료: ${order.store.name} - ${order.totalAmount.toLocaleString()}원`,
            details: JSON.stringify({
              storeId: order.storeId,
              storeName: order.store.name,
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
          storeName: order.store.name,
          totalAmount: order.totalAmount,
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
    console.error('Failed to ship orders:', error)
    return NextResponse.json({
      error: '출고 처리에 실패했습니다.',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// GET /api/orders/ship - 출고 대기 주문 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderType = searchParams.get('orderType') // stock, rx
    const supplierId = searchParams.get('supplierId')

    const where: any = {
      status: 'pending'
    }

    if (orderType && orderType !== 'all') {
      where.orderType = orderType
    }

    // supplierId로 필터링 - 브랜드의 supplierId 기준
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

    const orders = await prisma.order.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, code: true }
        },
        items: {
          include: {
            product: {
              include: {
                brand: {
                  select: { id: true, name: true, supplierId: true },
                  include: {
                    supplier: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { orderedAt: 'asc' }
    })

    // 플랫하게 변환 (아이템 단위로)
    const flatOrders = orders.flatMap(order => 
      order.items.map(item => ({
        id: order.id,
        itemId: item.id,
        orderNo: order.orderNo,
        storeId: order.store.id,
        storeName: order.store.name,
        storeCode: order.store.code,
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

    // 매입처 목록 조회 (브랜드에 연결된 것만)
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        brands: { some: {} } // 브랜드가 연결된 매입처만
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      orders: flatOrders,
      suppliers,
      totalCount: flatOrders.length
    })

  } catch (error: any) {
    console.error('Failed to fetch shipping orders:', error)
    return NextResponse.json({
      error: '출고 대기 주문을 불러오는데 실패했습니다.',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
