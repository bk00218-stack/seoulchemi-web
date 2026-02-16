import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 아이템 수정 (수량, 금액)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { quantity, totalPrice } = body

    const updateData: any = {}
    
    if (quantity !== undefined) {
      // 수량은 0.5 단위로 반올림
      const roundedQty = Math.round(quantity * 2) / 2
      if (roundedQty < 0.5) {
        return NextResponse.json({ error: '수량은 0.5 이상이어야 합니다' }, { status: 400 })
      }
      updateData.quantity = roundedQty
    }
    
    if (totalPrice !== undefined) {
      if (totalPrice < 0) {
        return NextResponse.json({ error: '금액은 0 이상이어야 합니다' }, { status: 400 })
      }
      updateData.totalPrice = Math.round(totalPrice)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 데이터가 없습니다' }, { status: 400 })
    }

    const updated = await prisma.orderItem.update({
      where: { id: parseInt(itemId) },
      data: updateData
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error: any) {
    console.error('Item update error:', error)
    return NextResponse.json({ error: error.message || '수정 실패' }, { status: 500 })
  }
}

// 아이템 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    // 아이템 삭제
    await prisma.orderItem.delete({
      where: { id: parseInt(itemId) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Item delete error:', error)
    return NextResponse.json({ error: error.message || '삭제 실패' }, { status: 500 })
  }
}
