import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/products/bulk-move - 상품 일괄 이동
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { productIds, targetBrandId, targetProductLineId } = await request.json()

    if (!productIds || productIds.length === 0) {
      return NextResponse.json({ error: '이동할 상품을 선택해주세요.' }, { status: 400 })
    }
    if (!targetBrandId && !targetProductLineId) {
      return NextResponse.json({ error: '이동 대상을 선택해주세요.' }, { status: 400 })
    }

    // 대상 유효성 확인
    if (targetBrandId) {
      const brand = await prisma.brand.findUnique({ where: { id: targetBrandId } })
      if (!brand) return NextResponse.json({ error: '대상 브랜드를 찾을 수 없습니다.' }, { status: 404 })
    }
    if (targetProductLineId) {
      const line = await prisma.productLine.findUnique({ where: { id: targetProductLineId } })
      if (!line) return NextResponse.json({ error: '대상 품목을 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const data: Record<string, number | null> = {}
      if (targetBrandId) {
        data.brandId = targetBrandId
        // 브랜드 변경 시 품목도 설정 (미지정이면 null로 초기화)
        data.productLineId = targetProductLineId || null
      } else if (targetProductLineId) {
        // 품목만 변경
        data.productLineId = targetProductLineId
        // 품목의 브랜드로 자동 맞춤
        const line = await tx.productLine.findUnique({ where: { id: targetProductLineId }, select: { brandId: true } })
        if (line) data.brandId = line.brandId
      }

      const updated = await tx.product.updateMany({
        where: { id: { in: productIds } },
        data,
      })

      await tx.workLog.create({
        data: {
          workType: 'product_bulk_move',
          targetType: 'product',
          targetId: 0,
          description: `상품 일괄 이동: ${updated.count}개`,
          details: JSON.stringify({ productIds, targetBrandId, targetProductLineId, count: updated.count }),
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      return updated.count
    })

    return NextResponse.json({
      success: true,
      message: `${result}개 상품이 이동되었습니다.`,
      count: result,
    })
  } catch (error: any) {
    console.error('Bulk move failed:', error)
    return NextResponse.json({ error: error?.message || '상품 이동에 실패했습니다.' }, { status: 500 })
  }
}
