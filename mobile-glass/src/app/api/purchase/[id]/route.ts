// 매입 상세 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 매입 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchaseId = parseInt(id)

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        items: {
          include: {
            // productId로 상품 정보 조회 (relation 없음)
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json({ error: '매입 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    // 상품 정보 추가
    const productIds = purchase.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })

    const productMap = new Map(products.map(p => [p.id, p]))
    const itemsWithProduct = purchase.items.map(item => ({
      ...item,
      product: productMap.get(item.productId)
    }))

    return NextResponse.json({
      ...purchase,
      items: itemsWithProduct
    })
  } catch (error) {
    console.error('Failed to fetch purchase:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase' }, { status: 500 })
  }
}

// 매입 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchaseId = parseInt(id)
    const body = await request.json()
    const { status, receivedAt, memo } = body

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { supplier: true, items: true }
    })

    if (!purchase) {
      return NextResponse.json({ error: '매입 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    // 입고 완료 처리
    if (status === 'completed' && purchase.status !== 'completed') {
      const updated = await prisma.$transaction(async (tx) => {
        // 매입 상태 업데이트
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'completed',
            receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
            memo
          }
        })

        // 재고 증가 (ProductOption이 있으면 옵션별, 없으면 기본)
        for (const item of purchase.items) {
          // 기본 옵션 찾기 또는 첫 번째 옵션
          const option = await tx.productOption.findFirst({
            where: { productId: item.productId }
          })

          if (option) {
            // 재고 이력 기록
            await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                productOptionId: option.id,
                type: 'in',
                reason: 'purchase',
                quantity: item.quantity,
                beforeStock: option.stock,
                afterStock: option.stock + item.quantity,
                purchaseId: purchaseId,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                memo: `매입입고 - ${purchase.purchaseNo}`
              }
            })

            // 재고 증가
            await tx.productOption.update({
              where: { id: option.id },
              data: { stock: { increment: item.quantity } }
            })
          }
        }

        // 작업 로그
        await tx.workLog.create({
          data: {
            workType: 'purchase_receive',
            targetType: 'purchase',
            targetId: purchaseId,
            targetNo: purchase.purchaseNo,
            description: `매입 입고 완료 - ${purchase.supplier.name}`,
            details: JSON.stringify({ itemCount: purchase.items.length })
          }
        })

        return updatedPurchase
      })

      return NextResponse.json(updated)
    }

    // 취소 처리
    if (status === 'cancelled' && purchase.status !== 'cancelled') {
      const updated = await prisma.$transaction(async (tx) => {
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: { status: 'cancelled', memo }
        })

        // 미납금 차감 (아직 입고 안 된 경우만)
        if (purchase.status === 'pending') {
          await tx.supplier.update({
            where: { id: purchase.supplierId },
            data: {
              outstandingAmount: { decrement: purchase.totalAmount }
            }
          })
        }

        // 입고된 경우 재고 차감
        if (purchase.status === 'completed') {
          for (const item of purchase.items) {
            const option = await tx.productOption.findFirst({
              where: { productId: item.productId }
            })

            if (option) {
              await tx.inventoryTransaction.create({
                data: {
                  productId: item.productId,
                  productOptionId: option.id,
                  type: 'out',
                  reason: 'adjust',
                  quantity: -item.quantity,
                  beforeStock: option.stock,
                  afterStock: option.stock - item.quantity,
                  purchaseId: purchaseId,
                  memo: `매입 취소 - ${purchase.purchaseNo}`
                }
              })

              await tx.productOption.update({
                where: { id: option.id },
                data: { stock: { decrement: item.quantity } }
              })
            }
          }

          // 취소 시 미납금도 차감
          await tx.supplier.update({
            where: { id: purchase.supplierId },
            data: {
              outstandingAmount: { decrement: purchase.totalAmount }
            }
          })
        }

        return updatedPurchase
      })

      return NextResponse.json(updated)
    }

    // 일반 수정
    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: { memo }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update purchase:', error)
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}

// 매입 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchaseId = parseInt(id)

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId }
    })

    if (!purchase) {
      return NextResponse.json({ error: '매입 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    if (purchase.status === 'completed') {
      return NextResponse.json({ error: '입고 완료된 매입은 삭제할 수 없습니다' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 아이템 삭제
      await tx.purchaseItem.deleteMany({
        where: { purchaseId }
      })

      // 매입 삭제
      await tx.purchase.delete({
        where: { id: purchaseId }
      })

      // 미납금 차감
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          outstandingAmount: { decrement: purchase.totalAmount }
        }
      })
    })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Failed to delete purchase:', error)
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}
