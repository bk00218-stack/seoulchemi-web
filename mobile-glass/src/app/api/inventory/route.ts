import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 재고 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search')
    
    const options = await prisma.productOption.findMany({
      where: {
        product: {
          isActive: true,
          ...(brandId && { brandId: parseInt(brandId) })
        },
        ...(search && {
          OR: [
            { product: { name: { contains: search } } },
            { barcode: { contains: search } }
          ]
        })
      },
      include: {
        product: {
          include: { brand: true }
        }
      },
      orderBy: [
        { product: { brandId: 'asc' } },
        { product: { name: 'asc' } }
      ]
    })
    
    const result = options.map(opt => ({
      id: opt.id,
      productId: opt.productId,
      productName: opt.product.name,
      brandName: opt.product.brand.name,
      optionName: opt.optionName || `${opt.sph || ''} ${opt.cyl || ''}`.trim() || '-',
      barcode: opt.barcode,
      stock: opt.stock,
      location: opt.location,
      isActive: opt.isActive
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// 재고 일괄 수정
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body // [{ id, stock, location }, ...]
    
    const results = await Promise.all(
      updates.map((u: { id: number; stock?: number; location?: string }) =>
        prisma.productOption.update({
          where: { id: u.id },
          data: {
            ...(u.stock !== undefined && { stock: u.stock }),
            ...(u.location && { location: u.location })
          }
        })
      )
    )
    
    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
