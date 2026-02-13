import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 품목 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    const where = brandId ? { brandId: parseInt(brandId), isActive: true } : { isActive: true }

    const productLines = await prisma.productLine.findMany({
      where,
      include: {
        brand: {
          select: { id: true, name: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json({ productLines })
  } catch (error) {
    console.error('Error fetching product lines:', error)
    return NextResponse.json({ error: 'Failed to fetch product lines' }, { status: 500 })
  }
}

// 품목 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandId, name, code, description, displayOrder } = body

    const productLine = await prisma.productLine.create({
      data: {
        brandId,
        name,
        code,
        description,
        displayOrder: displayOrder || 0,
      }
    })

    return NextResponse.json(productLine)
  } catch (error) {
    console.error('Error creating product line:', error)
    return NextResponse.json({ error: 'Failed to create product line' }, { status: 500 })
  }
}
