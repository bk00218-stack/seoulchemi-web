// 단축코드로 상품 조회 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: '단축코드를 입력해주세요' }, { status: 400 })
    }

    const shortcut = await prisma.productShortcut.findUnique({
      where: { shortcode: code.toUpperCase() }
    })

    if (!shortcut || !shortcut.isActive) {
      return NextResponse.json({ error: '존재하지 않는 단축코드입니다' }, { status: 404 })
    }

    // 사용 횟수 증가
    await prisma.productShortcut.update({
      where: { id: shortcut.id },
      data: { useCount: { increment: 1 } }
    })

    // 상품 정보 조회
    const product = await prisma.product.findUnique({
      where: { id: shortcut.productId },
      include: {
        brand: true,
        options: {
          where: { isActive: true },
          orderBy: [{ sph: 'asc' }, { cyl: 'asc' }]
        }
      }
    })

    return NextResponse.json({
      shortcut,
      product
    })
  } catch (error) {
    console.error('Failed to lookup shortcut:', error)
    return NextResponse.json({ error: 'Failed to lookup shortcut' }, { status: 500 })
  }
}
