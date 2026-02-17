import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const productLineId = searchParams.get('productLineId')
    
    const search = searchParams.get('search') || ''
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const where: Record<string, unknown> = {}
    if (brandId) where.brandId = parseInt(brandId)
    if (productLineId) where.productLineId = parseInt(productLineId)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { name: { contains: search } } },
        { erpCode: { contains: search } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        productLine: {
          select: { id: true, name: true }
        },
        _count: {
          select: { options: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      ...(limit ? { take: limit } : {})
    })

    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    })

    const stats = {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      inactive: products.filter(p => !p.isActive).length
    }

    return NextResponse.json({ 
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
        isActive: p.isActive,
        displayOrder: p.displayOrder || 0,
        status: p.isActive ? 'active' : 'inactive',
        imageUrl: p.imageUrl,
        erpCode: p.erpCode,
        _count: p._count
      })),
      brands,
      stats
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
