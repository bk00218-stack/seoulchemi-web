import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/brands/merge - 브랜드 통합 (다중 source → target)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const body = await request.json()
    const { targetBrandId } = body

    // sourceBrandIds 배열 or 기존 sourceBrandId 단일 하위호환
    const sourceBrandIds: number[] = body.sourceBrandIds
      ? body.sourceBrandIds
      : body.sourceBrandId
        ? [body.sourceBrandId]
        : []

    if (sourceBrandIds.length === 0 || !targetBrandId) {
      return NextResponse.json({ error: '원본/대상 브랜드를 선택해주세요.' }, { status: 400 })
    }
    if (sourceBrandIds.includes(targetBrandId)) {
      return NextResponse.json({ error: '원본과 대상이 같은 브랜드일 수 없습니다.' }, { status: 400 })
    }

    // 대상 브랜드 조회
    const target = await prisma.brand.findUnique({
      where: { id: targetBrandId },
      include: { productLines: { select: { id: true, name: true } } },
    })
    if (!target) {
      return NextResponse.json({ error: '대상 브랜드를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 원본 브랜드들 조회
    const sources = await prisma.brand.findMany({
      where: { id: { in: sourceBrandIds } },
      include: { _count: { select: { products: true, productLines: true } } },
    })
    if (sources.length === 0) {
      return NextResponse.json({ error: '원본 브랜드를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalMovedProducts = 0
      let totalMovedLines = 0
      let totalMergedLines = 0

      // target의 productLine 맵 (매 source 처리 후 갱신)
      let targetLineMap = new Map(target.productLines.map(l => [l.name, l.id]))

      for (const source of sources) {
        let movedProducts = 0

        // 1. ProductLine 이동/병합
        const sourceLines = await tx.productLine.findMany({ where: { brandId: source.id } })

        for (const line of sourceLines) {
          const existingTargetLineId = targetLineMap.get(line.name)

          if (existingTargetLineId) {
            // 이름 충돌 → 기존 품목으로 상품 합침
            await tx.product.updateMany({
              where: { productLineId: line.id },
              data: { brandId: targetBrandId, productLineId: existingTargetLineId },
            })
            await tx.productLine.update({ where: { id: line.id }, data: { isActive: false } })
            totalMergedLines++
          } else {
            // 충돌 없음 → 품목 자체를 이동
            await tx.productLine.update({ where: { id: line.id }, data: { brandId: targetBrandId } })
            // 이동된 품목을 맵에 추가 (다음 source 처리 시 충돌 감지용)
            targetLineMap.set(line.name, line.id)
            totalMovedLines++
          }
        }

        // 2. 품목 없는 상품(productLineId null)도 이동
        const orphanResult = await tx.product.updateMany({
          where: { brandId: source.id, productLineId: null },
          data: { brandId: targetBrandId },
        })

        // 3. 남은 상품도 모두 이동
        const remainResult = await tx.product.updateMany({
          where: { brandId: source.id },
          data: { brandId: targetBrandId },
        })
        movedProducts = orphanResult.count + remainResult.count
        totalMovedProducts += movedProducts

        // 4. 할인 설정 이동
        try {
          await tx.storeBrandDiscount.updateMany({
            where: { brandId: source.id },
            data: { brandId: targetBrandId },
          })
        } catch { /* 충돌 시 무시 */ }

        // 5. source 브랜드 비활성화
        await tx.brand.update({
          where: { id: source.id },
          data: { isActive: false },
        })
      }

      // 6. WorkLog
      const sourceNames = sources.map(s => s.name).join(', ')
      await tx.workLog.create({
        data: {
          workType: 'brand_merge',
          targetType: 'brand',
          targetId: targetBrandId,
          description: `브랜드 통합: [${sourceNames}] → ${target.name}`,
          details: JSON.stringify({
            sourceBrandIds: sources.map(s => s.id),
            sourceNames: sources.map(s => s.name),
            targetBrandId,
            targetName: target.name,
            totalMovedProducts,
            totalMovedLines,
            totalMergedLines,
          }),
          userName: currentUser,
          pcName: 'WEB',
        },
      })

      return { totalMovedProducts, totalMovedLines, totalMergedLines }
    }, { timeout: 30000 })

    const sourceNames = sources.map(s => s.name).join(', ')
    return NextResponse.json({
      success: true,
      message: `${sources.length}개 브랜드 → ${target.name} 통합 완료 (상품 ${result.totalMovedProducts}개 이동)`,
      movedProducts: result.totalMovedProducts,
      movedLines: result.totalMovedLines,
      mergedLines: result.totalMergedLines,
    })
  } catch (error: any) {
    console.error('Brand merge failed:', error)
    return NextResponse.json({ error: error?.message || '브랜드 통합에 실패했습니다.' }, { status: 500 })
  }
}
