import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 도수 옵션 일괄 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { ids } = body // [optionId, ...]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
    }

    const result = await prisma.productOption.deleteMany({
      where: {
        id: { in: ids },
        productId, // 보안: 해당 상품의 옵션만 삭제
      },
    })

    return NextResponse.json({
      deleted: result.count,
      message: `${result.count}개의 옵션이 삭제되었습니다.`,
    })
  } catch (error) {
    console.error('Error bulk deleting options:', error)
    return NextResponse.json({ error: 'Failed to delete options' }, { status: 500 })
  }
}

// 도수 옵션 일괄 수정
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
