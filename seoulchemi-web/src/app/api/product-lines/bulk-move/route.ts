import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/product-lines/bulk-move - 품목 브랜드 이동
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { productLineIds, targetBrandId } = await request.json()

    if (!productLineIds || productLineIds.length === 0) {
      return NextResponse.json({ error: '이동할 품목을 선택해주세요.' }, { status: 400 })
    }
    if (!targetBrandId) {
      return NextResponse.json({ error: '대상 브랜드를 선택해주세요.' }, { status: 400 })
    }

    const target = await prisma.brand.findUnique({ where: { id: targetBrandId } })
    if (!target) {
      return NextResponse.json({ error: '대상 브랜드를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 품목 이동
      const updated = await tx.productLine.updateMany({
        where: { id: { in: productLineIds } },
        data: { brandId: targetBrandId },
      })

      // 품목에 속한 상품들의 brandId도 함께 변경
      await tx.product.updateMany({
        where: { productLineId: { in: productLineIds } },
        data: { brandId: targetBrandId },
      })

      const lines = await tx.productLine.findMany({
        where: { id: { in: productLineIds } },
        select: { name: true },
      })

      await tx.workLog.create({
        data: {
          workType: 'productline_bulk_move',
          targetType: 'productLine',
          targetId: targetBrandId,
          description: `품목 브랜드 이동: ${lines.map(l => l.name).join(', ')} → ${target.name}`,
          details: JSON.stringify({ productLineIds, targetBrandId, targetName: target.name, count: updated.count }),
          userName: currentUser,
          pcName: 'WEB',
        },
      })

      return updated.count
    })

    return NextResponse.json({
      success: true,
      message: `${result}개 품목이 ${target.name}(으)로 이동되었습니다.`,
      count: result,
    })
  } catch (error: any) {
    console.error('Product line bulk move failed:', error)
    return NextResponse.json({ error: error?.message || '품목 이동에 실패했습니다.' }, { status: 500 })
  }
}
