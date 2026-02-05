// 묶음상품 상세 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 묶음상품 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bundleId = parseInt(id)
    const body = await request.json()
    const { name, description, discountRate, discountAmount, isActive, items } = body

    // 기존 아이템 삭제 후 재생성 (items가 있는 경우)
    if (items) {
      await prisma.bundleItem.deleteMany({
        where: { bundleId }
      })

      await prisma.bundleItem.createMany({
        data: items.map((item: { productId: number; quantity: number }) => ({
          bundleId,
          productId: item.productId,
          quantity: item.quantity || 1
        }))
      })
    }

    const bundle = await prisma.bundleProduct.update({
      where: { id: bundleId },
      data: {
        name,
        description,
        discountRate,
        discountAmount,
        isActive
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(bundle)
  } catch (error) {
    console.error('Failed to update bundle:', error)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}

// 묶음상품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bundleId = parseInt(id)

    await prisma.$transaction([
      prisma.bundleItem.deleteMany({ where: { bundleId } }),
      prisma.bundleProduct.delete({ where: { id: bundleId } })
    ])

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Failed to delete bundle:', error)
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 })
  }
}
