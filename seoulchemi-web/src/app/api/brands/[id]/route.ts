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

    // 허용된 필드만 추출 (Prisma strict mode 대응)
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null
    if (body.supplierId !== undefined) data.supplierId = body.supplierId || null
    if (body.stockManage !== undefined) data.stockManage = body.stockManage || null
    if (body.canExchange !== undefined) data.canExchange = Boolean(body.canExchange)
    if (body.canReturn !== undefined) data.canReturn = Boolean(body.canReturn)
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
    if (body.displayOrder !== undefined) data.displayOrder = parseInt(body.displayOrder) || 0

    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data
    })
    
    return NextResponse.json(brand)
  } catch (error: any) {
    console.error('Error updating brand:', error)
    // Unique constraint violation
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: '같은 대분류에 동일한 브랜드명이 이미 존재합니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to update brand' }, { status: 500 })
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
