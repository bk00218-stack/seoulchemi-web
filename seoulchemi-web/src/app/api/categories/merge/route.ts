import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/categories/merge - 대분류 통합 (다중 source → target)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { sourceCategoryIds, targetCategoryId } = await request.json()

    if (!sourceCategoryIds || sourceCategoryIds.length === 0 || !targetCategoryId) {
      return NextResponse.json({ error: '원본/대상 대분류를 선택해주세요.' }, { status: 400 })
    }
    if (sourceCategoryIds.includes(targetCategoryId)) {
      return NextResponse.json({ error: '원본과 대상이 같은 대분류일 수 없습니다.' }, { status: 400 })
    }

    const target = await prisma.mainCategory.findUnique({ where: { id: targetCategoryId } })
    if (!target) {
      return NextResponse.json({ error: '대상 대분류를 찾을 수 없습니다.' }, { status: 404 })
    }

    const sources = await prisma.mainCategory.findMany({
      where: { id: { in: sourceCategoryIds } },
      include: { _count: { select: { brands: true } } },
    })
    if (sources.length === 0) {
      return NextResponse.json({ error: '원본 대분류를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalMovedBrands = 0

      for (const source of sources) {
        // 브랜드 이동
        const moved = await tx.brand.updateMany({
          where: { categoryId: source.id },
          data: { categoryId: targetCategoryId },
        })
        totalMovedBrands += moved.count

        // 원본 대분류 비활성화
        await tx.mainCategory.update({
          where: { id: source.id },
          data: { isActive: false },
        })
      }

      // WorkLog
      const sourceNames = sources.map(s => s.name).join(', ')
      await tx.workLog.create({
        data: {
          workType: 'category_merge',
          targetType: 'category',
          targetId: targetCategoryId,
          description: `대분류 통합: [${sourceNames}] → ${target.name}`,
          details: JSON.stringify({
            sourceCategoryIds: sources.map(s => s.id),
            sourceNames: sources.map(s => s.name),
            targetCategoryId,
            targetName: target.name,
            totalMovedBrands,
          }),
          userName: currentUser,
          pcName: 'WEB',
        },
      })

      return { totalMovedBrands }
    }, { timeout: 15000 })

    return NextResponse.json({
      success: true,
      message: `${sources.length}개 대분류 → ${target.name} 통합 완료 (브랜드 ${result.totalMovedBrands}개 이동)`,
      movedBrands: result.totalMovedBrands,
    })
  } catch (error: any) {
    console.error('Category merge failed:', error)
    return NextResponse.json({ error: error?.message || '대분류 통합에 실패했습니다.' }, { status: 500 })
  }
}
