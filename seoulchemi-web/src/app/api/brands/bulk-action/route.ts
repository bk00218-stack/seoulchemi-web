import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/brands/bulk-action - 브랜드/품목/상품 일괄 삭제·상태변경
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { action, brandIds, productLineIds, productIds } = await request.json()

    if (!action || !['delete', 'activate', 'deactivate'].includes(action)) {
      return NextResponse.json({ error: '작업 유형을 선택해주세요.' }, { status: 400 })
    }

    const hasIds = (brandIds?.length > 0) || (productLineIds?.length > 0) || (productIds?.length > 0)
    if (!hasIds) {
      return NextResponse.json({ error: '대상을 선택해주세요.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = []

      // 상품 처리
      if (productIds?.length > 0) {
        if (action === 'delete') {
          // FK 체크: 주문 연결된 상품은 soft delete
          const withOrders = await tx.product.findMany({
            where: { id: { in: productIds }, orderItems: { some: {} } },
            select: { id: true }
          })
          const withOrderIds = new Set(withOrders.map(p => p.id))
          const safeDeleteIds = productIds.filter((id: number) => !withOrderIds.has(id))

          if (safeDeleteIds.length > 0) {
            await tx.productOption.deleteMany({ where: { productId: { in: safeDeleteIds } } })
            await tx.product.deleteMany({ where: { id: { in: safeDeleteIds } } })
          }
          if (withOrderIds.size > 0) {
            await tx.product.updateMany({
              where: { id: { in: [...withOrderIds] } },
              data: { isActive: false }
            })
          }
          summary.push(`상품 ${safeDeleteIds.length}개 삭제, ${withOrderIds.size}개 비활성화(주문연결)`)
        } else {
          const isActive = action === 'activate'
          await tx.product.updateMany({ where: { id: { in: productIds } }, data: { isActive } })
          summary.push(`상품 ${productIds.length}개 ${isActive ? '활성화' : '비활성화'}`)
        }
      }

      // 품목 처리
      if (productLineIds?.length > 0) {
        if (action === 'delete') {
          // 하위 상품도 함께 비활성화
          await tx.product.updateMany({
            where: { productLineId: { in: productLineIds } },
            data: { isActive: false }
          })
          await tx.productLine.updateMany({
            where: { id: { in: productLineIds } },
            data: { isActive: false }
          })
          summary.push(`품목 ${productLineIds.length}개 비활성화 (하위 상품 포함)`)
        } else {
          const isActive = action === 'activate'
          await tx.productLine.updateMany({ where: { id: { in: productLineIds } }, data: { isActive } })
          if (isActive) {
            await tx.product.updateMany({
              where: { productLineId: { in: productLineIds } },
              data: { isActive: true }
            })
          }
          summary.push(`품목 ${productLineIds.length}개 ${isActive ? '활성화' : '비활성화'}`)
        }
      }

      // 브랜드 처리
      if (brandIds?.length > 0) {
        if (action === 'delete') {
          // 하위 품목/상품 비활성화
          await tx.product.updateMany({
            where: { brandId: { in: brandIds } },
            data: { isActive: false }
          })
          await tx.productLine.updateMany({
            where: { brandId: { in: brandIds } },
            data: { isActive: false }
          })
          await tx.brand.updateMany({
            where: { id: { in: brandIds } },
            data: { isActive: false }
          })
          summary.push(`브랜드 ${brandIds.length}개 비활성화 (하위 전체 포함)`)
        } else {
          const isActive = action === 'activate'
          await tx.brand.updateMany({ where: { id: { in: brandIds } }, data: { isActive } })
          summary.push(`브랜드 ${brandIds.length}개 ${isActive ? '활성화' : '비활성화'}`)
        }
      }

      await tx.workLog.create({
        data: {
          workType: 'bulk_action',
          targetType: 'product',
          targetId: 0,
          description: summary.join(', '),
          details: JSON.stringify({ action, brandIds, productLineIds, productIds }),
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      return summary
    }, { timeout: 15000 })

    return NextResponse.json({
      success: true,
      message: result.join('\n'),
      details: result,
    })
  } catch (error: any) {
    console.error('Bulk action failed:', error)
    return NextResponse.json({ error: error?.message || '일괄 작업에 실패했습니다.' }, { status: 500 })
  }
}
