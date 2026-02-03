import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    
    const where = brandId ? { brandId: parseInt(brandId) } : {}
    
    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
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
        name: p.name,
        optionType: p.optionType,
        productType: p.productType,
        bundleName: p.bundleName,
        refractiveIndex: p.refractiveIndex,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        isActive: p.isActive,
        displayOrder: p.displayOrder || 0,
        status: p.isActive ? 'active' : 'inactive'
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
        name: body.name,
        optionType: body.optionType,
        productType: body.productType || body.optionType,
        bundleName: body.bundleName || null,
        refractiveIndex: body.refractiveIndex || null,
        sellingPrice: body.sellingPrice || 0,
        purchasePrice: body.purchasePrice || 0,
        isActive: body.isActive ?? true,
        displayOrder: body.displayOrder || 0,
      }
    })
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
