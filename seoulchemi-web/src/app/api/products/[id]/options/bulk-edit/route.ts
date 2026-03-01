import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 도수 옵션 일괄 수정 (생성+수정+삭제를 한 번에)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { creates, updates, deleteIds } = body as {
      creates?: { sph: string; cyl: string; priceAdjustment: number; stockType: string }[]
      updates?: { id: number; priceAdjustment: number }[]
      deleteIds?: number[]
    }

    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0

    await prisma.$transaction(async (tx) => {
      // 1. 삭제 (deleteMany - 단일 쿼리)
      if (deleteIds && deleteIds.length > 0) {
        const result = await tx.productOption.deleteMany({
          where: { id: { in: deleteIds }, productId },
        })
        deletedCount = result.count
      }

      // 2. 수정 (updateMany 가격별 그룹 - N개 가격이면 N번 쿼리)
      if (updates && updates.length > 0) {
        const grouped = new Map<number, number[]>()
        for (const u of updates) {
          const ids = grouped.get(u.priceAdjustment) || []
          ids.push(u.id)
          grouped.set(u.priceAdjustment, ids)
        }
        for (const [price, ids] of grouped) {
          const result = await tx.productOption.updateMany({
            where: { id: { in: ids }, productId },
            data: { priceAdjustment: price },
          })
          updatedCount += result.count
        }
      }

      // 3. 생성 (createMany - 단일 쿼리)
      if (creates && creates.length > 0) {
        const result = await tx.productOption.createMany({
          data: creates.map(o => ({
            productId,
            sph: o.sph,
            cyl: o.cyl,
            priceAdjustment: o.priceAdjustment || 0,
            stockType: o.stockType || 'local',
            stock: 0,
            isActive: true,
          })),
        })
        createdCount = result.count
      }
    })

    // 작업 로그
    const parts = []
    if (createdCount > 0) parts.push(`${createdCount}개 생성`)
    if (updatedCount > 0) parts.push(`${updatedCount}개 수정`)
    if (deletedCount > 0) parts.push(`${deletedCount}개 삭제`)

    await prisma.workLog.create({
      data: {
        workType: 'product_option_bulk_edit',
        targetType: 'product',
        targetId: productId,
        description: `도수 옵션 일괄 수정: ${parts.join(', ')}`,
        details: JSON.stringify({ createdCount, updatedCount, deletedCount }),
      },
    })

    return NextResponse.json({
      success: true,
      data: { created: createdCount, updated: updatedCount, deleted: deletedCount },
      message: parts.join(', '),
    })
  } catch (error) {
    console.error('Error bulk editing options:', error)
    return NextResponse.json({ error: 'Failed to bulk edit options' }, { status: 500 })
  }
}
