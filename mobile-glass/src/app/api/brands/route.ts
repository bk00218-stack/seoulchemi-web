import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 브랜드 목록 조회
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })
    
    // 브랜드별 통계 추가
    const brandsWithStats = await Promise.all(brands.map(async (brand) => {
      const activeProducts = await prisma.product.count({
        where: { brandId: brand.id, isActive: true }
      })
      const inactiveProducts = await prisma.product.count({
        where: { brandId: brand.id, isActive: false }
      })
      
      return {
        ...brand,
        productCount: brand._count.products,
        activeCount: activeProducts,
        inactiveCount: inactiveProducts
      }
    }))
    
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
    const { name, stockManage, canExchange, canReturn, isActive, displayOrder } = body
    
    const brand = await prisma.brand.create({
      data: {
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
