import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 카테고리 목록
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }]
    })

    // 타입별 그룹핑
    const grouped: Record<string, typeof categories> = {}
    for (const cat of categories) {
      if (!grouped[cat.type]) grouped[cat.type] = []
      grouped[cat.type].push(cat)
    }

    return NextResponse.json({ categories, grouped })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: '카테고리 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 카테고리 추가
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, code, name, description, displayOrder } = body

    if (!type || !code || !name) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        type,
        code,
        name,
        description: description || null,
        displayOrder: displayOrder || 0,
        isActive: true,
      }
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: '카테고리 추가 실패' }, { status: 500 })
  }
}

// PATCH: 카테고리 수정 (활성화/비활성화 포함)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID는 필수입니다' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Categories PATCH error:', error)
    return NextResponse.json({ error: '카테고리 수정 실패' }, { status: 500 })
  }
}
