import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 대분류 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.mainCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        brands: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        },
        _count: { select: { brands: true } }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}

// 대분류 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const category = await prisma.mainCategory.update({
      where: { id: parseInt(id) },
      data: body
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// 대분류 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 해당 대분류에 브랜드가 있는지 확인
    const brandCount = await prisma.brand.count({
      where: { categoryId: parseInt(id) }
    })

    if (brandCount > 0) {
      return NextResponse.json(
        { error: `이 대분류에 ${brandCount}개의 브랜드가 있어 삭제할 수 없습니다.` },
        { status: 400 }
      )
    }

    await prisma.mainCategory.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
