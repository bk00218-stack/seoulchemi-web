import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 브랜드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const includeInactive = searchParams.get('includeInactive') === 'true'
    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (!includeInactive) where.isActive = true

    const brands = await prisma.brand.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        productLines: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { products: { where: { isActive: true } } } }
          }
        },
        _count: {
          select: {
            products: true,
            productLines: { where: { isActive: true } }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    // _count에서 직접 계산 (N+1 쿼리 제거)
    const brandsWithStats = brands.map(brand => {
      const totalProducts = brand._count.products
      const activeProducts = brand.productLines.reduce((sum, pl) => sum + pl._count.products, 0)
      return {
        ...brand,
        productCount: totalProducts,
        productLineCount: brand._count.productLines,
        activeCount: activeProducts,
        inactiveCount: totalProducts - activeProducts
      }
    })

    return NextResponse.json({ brands: brandsWithStats })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

// 브랜드 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, name, stockManage, canExchange, canReturn, isActive, displayOrder } = body
    
    const brand = await prisma.brand.create({
      data: {
        categoryId: categoryId || null,
        name,
        stockManage,
        canExchange: canExchange ?? false,
        canReturn: canReturn ?? false,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0
      }
    })
    
    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
