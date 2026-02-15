import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { updates } = body // [{ id, priceAdjustment }, ...]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // 트랜잭션으로 일괄 업데이트
    let updatedCount = 0
    for (const update of updates) {
      await prisma.productOption.update({
        where: { 
          id: update.id,
          productId: productId // 보안: 해당 상품의 옵션만 수정 가능
        },
        data: {
          priceAdjustment: update.priceAdjustment || 0
        }
      })
      updatedCount++
    }

    return NextResponse.json({ 
      updated: updatedCount,
      message: `${updatedCount}개의 옵션이 수정되었습니다.`
    })
  } catch (error) {
    console.error('Error bulk updating options:', error)
    return NextResponse.json({ error: 'Failed to update options' }, { status: 500 })
  }
}
