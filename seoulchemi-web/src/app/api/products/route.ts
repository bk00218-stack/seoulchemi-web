import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const productLineId = searchParams.get('productLineId')
    const categoryId = searchParams.get('categoryId')
    const includeOptions = searchParams.get('includeOptions') === 'true'
    const includeInactive = searchParams.get('includeInactive')

    const search = searchParams.get('search') || ''
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const where: Record<string, unknown> = {}
    if (brandId) where.brandId = parseInt(brandId)
    if (productLineId) where.productLineId = parseInt(productLineId)
    if (categoryId) where.brand = { categoryId: parseInt(categoryId) }
    if (includeInactive === 'false') where.isActive = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { name: { contains: search } } },
        { erpCode: { contains: search } },
      ]
    }

    // 병렬 실행: 상품 + 브랜드 + 통계
    const [products, brands, stats] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          productLine: { select: { id: true, name: true } },
          ...(includeOptions ? {
            options: {
              where: { isActive: true },
              orderBy: [{ sph: 'asc' as const }, { cyl: 'asc' as const }],
              select: { id: true, optionName: true, sph: true, cyl: true, priceAdjustment: true, stock: true }
            }
          } : {}),
        },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' }
        ],
        ...(limit ? { take: limit } : {})
      }),
      prisma.brand.findMany({
        select: { id: true, name: true },
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      }),
      prisma.product.groupBy({
        by: ['isActive'],
        where,
        _count: true,
      })
    ])

    const activeCount = stats.find(s => s.isActive)?._count || 0
    const inactiveCount = stats.find(s => !s.isActive)?._count || 0

    return NextResponse.json({
      brands,
      products: products.map(p => ({
        id: p.id,
        code: `PRD${String(p.id).padStart(3, '0')}`,
        brand: p.brand.name,
        brandId: p.brandId,
        productLineId: p.productLineId,
        productLine: p.productLine,
        name: p.name,
        optionType: p.optionType,
        productType: p.productType,
        bundleName: p.bundleName,
        refractiveIndex: p.refractiveIndex,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        retailPrice: p.retailPrice,
        isActive: p.isActive,
        displayOrder: p.displayOrder || 0,
        status: p.isActive ? 'active' : 'inactive',
        imageUrl: p.imageUrl,
        erpCode: p.erpCode,
        ...(includeOptions ? { options: p.options } : {}),
      })),
      stats: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const product = await prisma.product.create({
      data: {
        brandId: body.brandId,
        productLineId: body.productLineId || null,
        name: body.name,
        optionType: body.optionType,
        productType: body.productType || body.optionType,
        bundleName: body.bundleName || null,
        refractiveIndex: body.refractiveIndex || null,
        sellingPrice: body.sellingPrice || 0,
        purchasePrice: body.purchasePrice || 0,
        isActive: body.isActive ?? true,
        displayOrder: body.displayOrder || 0,
        erpCode: body.erpCode || null,
        imageUrl: body.imageUrl || null,
      }
    })
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
