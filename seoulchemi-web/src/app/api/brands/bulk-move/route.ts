import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/brands/bulk-move - 브랜드 대분류 이동
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { brandIds, targetCategoryId } = await request.json()

    if (!brandIds || brandIds.length === 0) {
      return NextResponse.json({ error: '이동할 브랜드를 선택해주세요.' }, { status: 400 })
    }
    if (!targetCategoryId) {
      return NextResponse.json({ error: '대상 대분류를 선택해주세요.' }, { status: 400 })
    }

    const target = await prisma.mainCategory.findUnique({ where: { id: targetCategoryId } })
    if (!target) {
      return NextResponse.json({ error: '대상 대분류를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.brand.updateMany({
        where: { id: { in: brandIds } },
        data: { categoryId: targetCategoryId },
      })

      const brands = await tx.brand.findMany({
        where: { id: { in: brandIds } },
        select: { name: true },
      })

      await tx.workLog.create({
        data: {
          workType: 'brand_bulk_move',
          targetType: 'brand',
          targetId: targetCategoryId,
          description: `브랜드 대분류 이동: ${brands.map(b => b.name).join(', ')} → ${target.name}`,
          details: JSON.stringify({ brandIds, targetCategoryId, targetName: target.name, count: updated.count }),
          userName: currentUser,
          pcName: 'WEB',
        },
      })

      return updated.count
    })

    return NextResponse.json({
      success: true,
      message: `${result}개 브랜드가 ${target.name}(으)로 이동되었습니다.`,
      count: result,
    })
  } catch (error: any) {
    console.error('Brand bulk move failed:', error)
    return NextResponse.json({ error: error?.message || '브랜드 이동에 실패했습니다.' }, { status: 500 })
  }
}
