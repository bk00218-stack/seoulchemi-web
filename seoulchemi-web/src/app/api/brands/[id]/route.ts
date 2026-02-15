import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 브랜드 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const brand = await prisma.brand.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { products: true } }
      }
    })
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }
    
    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}

// 브랜드 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: body
    })
    
    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

// 브랜드 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 해당 브랜드 상품이 있는지 확인
    const productCount = await prisma.product.count({
      where: { brandId: parseInt(id) }
    })
    
    if (productCount > 0) {
      return NextResponse.json(
        { error: `이 브랜드에 ${productCount}개의 상품이 있어 삭제할 수 없습니다.` },
        { status: 400 }
      )
    }
    
    await prisma.brand.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}
