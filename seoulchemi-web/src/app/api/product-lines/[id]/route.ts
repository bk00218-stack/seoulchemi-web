import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 품목 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productLine = await prisma.productLine.findUnique({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        _count: { select: { products: true } }
      }
    })

    if (!productLine) {
      return NextResponse.json({ error: 'Product line not found' }, { status: 404 })
    }

    return NextResponse.json(productLine)
  } catch (error) {
    console.error('Error fetching product line:', error)
    return NextResponse.json({ error: 'Failed to fetch product line' }, { status: 500 })
  }
}

// 품목 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const productLine = await prisma.productLine.update({
      where: { id: parseInt(id) },
      data: body
    })

    return NextResponse.json(productLine)
  } catch (error) {
    console.error('Error updating product line:', error)
    return NextResponse.json({ error: 'Failed to update product line' }, { status: 500 })
  }
}

// 품목 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 해당 품목에 상품이 있는지 확인
    const productCount = await prisma.product.count({
      where: { productLineId: parseInt(id) }
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: `이 품목에 ${productCount}개의 상품이 있어 삭제할 수 없습니다.` },
        { status: 400 }
      )
    }

    await prisma.productLine.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product line:', error)
    return NextResponse.json({ error: 'Failed to delete product line' }, { status: 500 })
  }
}
