import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/product-lines/merge - 품목 통합 (다중 source → target)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { sourceLineIds, targetLineId } = await request.json()

    if (!sourceLineIds || sourceLineIds.length === 0 || !targetLineId) {
      return NextResponse.json({ error: '원본/대상 품목을 선택해주세요.' }, { status: 400 })
    }
    if (sourceLineIds.includes(targetLineId)) {
      return NextResponse.json({ error: '원본과 대상이 같은 품목일 수 없습니다.' }, { status: 400 })
    }

    const target = await prisma.productLine.findUnique({
      where: { id: targetLineId },
      include: { brand: { select: { name: true } } },
    })
    if (!target) {
      return NextResponse.json({ error: '대상 품목을 찾을 수 없습니다.' }, { status: 404 })
    }

    const sources = await prisma.productLine.findMany({
      where: { id: { in: sourceLineIds } },
      include: { _count: { select: { products: true } } },
    })
    if (sources.length === 0) {
      return NextResponse.json({ error: '원본 품목을 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalMovedProducts = 0

      for (const source of sources) {
        // 상품 이동
        const moved = await tx.product.updateMany({
          where: { productLineId: source.id },
          data: { productLineId: targetLineId },
        })
        totalMovedProducts += moved.count

        // 원본 품목 비활성화
        await tx.productLine.update({
          where: { id: source.id },
          data: { isActive: false },
        })
      }

      // WorkLog
      const sourceNames = sources.map(s => s.name).join(', ')
      await tx.workLog.create({
        data: {
          workType: 'productline_merge',
          targetType: 'productLine',
          targetId: targetLineId,
          description: `품목 통합: [${sourceNames}] → ${target.name}`,
          details: JSON.stringify({
            sourceLineIds: sources.map(s => s.id),
            sourceNames: sources.map(s => s.name),
            targetLineId,
            targetName: target.name,
            totalMovedProducts,
          }),
          userName: currentUser,
          pcName: 'WEB',
        },
      })

      return { totalMovedProducts }
    }, { timeout: 15000 })

    return NextResponse.json({
      success: true,
      message: `${sources.length}개 품목 → ${target.name} 통합 완료 (상품 ${result.totalMovedProducts}개 이동)`,
      movedProducts: result.totalMovedProducts,
    })
  } catch (error: any) {
    console.error('ProductLine merge failed:', error)
    return NextResponse.json({ error: error?.message || '품목 통합에 실패했습니다.' }, { status: 500 })
  }
}
