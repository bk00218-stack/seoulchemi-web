import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 대분류 목록 조회
export async function GET() {
  try {
    const categories = await prisma.mainCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { brands: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// 대분류 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, description, displayOrder } = body

    const category = await prisma.mainCategory.create({
      data: {
        code,
        name,
        description,
        displayOrder: displayOrder || 0,
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
