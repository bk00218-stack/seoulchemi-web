import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: categoryId가 null인 브랜드 조회
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { categoryId: null },
      select: { id: true, name: true, categoryId: true, isActive: true }
    })
    return NextResponse.json({ brands })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST: categoryId가 null인 브랜드에 categoryId 지정
export async function POST(request: NextRequest) {
  try {
    const { brandId, categoryId } = await request.json()
    if (!brandId || !categoryId) {
      return NextResponse.json({ error: 'brandId and categoryId required' }, { status: 400 })
    }
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: { categoryId }
    })
    return NextResponse.json({ brand })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
