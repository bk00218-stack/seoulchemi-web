import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/brands/merge - 브랜드 통합 (source → target)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { sourceBrandId, targetBrandId } = await request.json()

    if (!sourceBrandId || !targetBrandId) {
      return NextResponse.json({ error: '원본/대상 브랜드를 선택해주세요.' }, { status: 400 })
    }
    if (sourceBrandId === targetBrandId) {
      return NextResponse.json({ error: '같은 브랜드로 통합할 수 없습니다.' }, { status: 400 })
    }

    const [source, target] = await Promise.all([
      prisma.brand.findUnique({ where: { id: sourceBrandId }, include: { _count: { select: { products: true, productLines: true } } } }),
      prisma.brand.findUnique({ where: { id: targetBrandId }, include: { productLines: { select: { id: true, name: true } } } }),
    ])

    if (!source) return NextResponse.json({ error: '원본 브랜드를 찾을 수 없습니다.' }, { status: 404 })
    if (!target) return NextResponse.json({ error: '대상 브랜드를 찾을 수 없습니다.' }, { status: 404 })

    const result = await prisma.$transaction(async (tx) => {
      let movedProducts = 0
      let movedLines = 0
      let mergedLines = 0

      // 1. ProductLine 이동/병합
      const sourceLines = await tx.productLine.findMany({ where: { brandId: sourceBrandId } })
      const targetLineMap = new Map(target.productLines.map(l => [l.name, l.id]))

      for (const line of sourceLines) {
        const existingTargetLineId = targetLineMap.get(line.name)

        if (existingTargetLineId) {
          // 이름 충돌 → 기존 품목으로 상품 합침
          await tx.product.updateMany({
            where: { productLineId: line.id },
            data: { brandId: targetBrandId, productLineId: existingTargetLineId }
          })
          await tx.productLine.update({ where: { id: line.id }, data: { isActive: false } })
          mergedLines++
        } else {
          // 충돌 없음 → 품목 자체를 이동
          await tx.productLine.update({ where: { id: line.id }, data: { brandId: targetBrandId } })
          movedLines++
        }
      }

      // 2. 품목 없는 상품(productLineId null)도 이동
      const orphanResult = await tx.product.updateMany({
        where: { brandId: sourceBrandId, productLineId: null },
        data: { brandId: targetBrandId }
      })

      // 3. 남은 상품도 모두 이동
      const remainResult = await tx.product.updateMany({
        where: { brandId: sourceBrandId },
        data: { brandId: targetBrandId }
      })
      movedProducts = orphanResult.count + remainResult.count

      // 4. 할인 설정 이동 (StoreBrandDiscount)
      try {
        await tx.storeBrandDiscount.updateMany({
          where: { brandId: sourceBrandId },
          data: { brandId: targetBrandId }
        })
      } catch { /* 충돌 시 무시 (이미 대상 브랜드에 할인 있을 수 있음) */ }

      // 5. source 브랜드 비활성화
      await tx.brand.update({
        where: { id: sourceBrandId },
        data: { isActive: false }
      })

      // 6. WorkLog
      await tx.workLog.create({
        data: {
          workType: 'brand_merge',
          targetType: 'brand',
          targetId: targetBrandId,
          description: `브랜드 통합: ${source.name} → ${target.name}`,
          details: JSON.stringify({
            sourceBrandId, sourceName: source.name,
            targetBrandId, targetName: target.name,
            movedProducts, movedLines, mergedLines,
          }),
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      return { movedProducts, movedLines, mergedLines }
    }, { timeout: 15000 })

    return NextResponse.json({
      success: true,
      message: `${source.name} → ${target.name} 통합 완료`,
      ...result,
    })
  } catch (error: any) {
    console.error('Brand merge failed:', error)
    return NextResponse.json({ error: error?.message || '브랜드 통합에 실패했습니다.' }, { status: 500 })
  }
}
