// 상품 단축코드 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 단축코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { shortcode: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const shortcuts = await prisma.productShortcut.findMany({
      where,
      orderBy: { useCount: 'desc' }
    })

    // 상품 정보 추가
    const productIds = shortcuts.map(s => s.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    const shortcutsWithProducts = shortcuts.map(s => ({
      ...s,
      product: productMap.get(s.productId)
    }))

    return NextResponse.json({ shortcuts: shortcutsWithProducts })
  } catch (error) {
    console.error('Failed to fetch shortcuts:', error)
    return NextResponse.json({ error: 'Failed to fetch shortcuts' }, { status: 500 })
  }
}

// 단축코드 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shortcode, productId, description } = body

    if (!shortcode || !productId) {
      return NextResponse.json({ error: '단축코드와 상품은 필수입니다' }, { status: 400 })
    }

    // 중복 체크
    const existing = await prisma.productShortcut.findUnique({
      where: { shortcode }
    })
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 단축코드입니다' }, { status: 400 })
    }

    const shortcut = await prisma.productShortcut.create({
      data: {
        shortcode: shortcode.toUpperCase(),
        productId,
        description
      }
    })

    return NextResponse.json(shortcut, { status: 201 })
  } catch (error) {
    console.error('Failed to create shortcut:', error)
    return NextResponse.json({ error: 'Failed to create shortcut' }, { status: 500 })
  }
}
