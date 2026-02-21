import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 전체 단축키 목록
export async function GET() {
  try {
    const shortcuts = await prisma.productShortcut.findMany({
      include: {
        product: {
          include: { brand: true }
        }
      },
      orderBy: { shortcode: 'asc' }
    })
    return NextResponse.json({ shortcuts })
  } catch (error) {
    console.error('Shortcuts GET error:', error)
    return NextResponse.json({ error: '단축키 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 단축키 등록/수정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shortcode, productId, description } = body

    if (!shortcode) {
      return NextResponse.json({ error: '단축코드는 필수입니다' }, { status: 400 })
    }

    const shortcut = await prisma.productShortcut.upsert({
      where: { shortcode },
      update: { productId: productId || null, description: description || null },
      create: { shortcode, productId: productId || null, description: description || null },
      include: { product: { include: { brand: true } } }
    })

    return NextResponse.json({ success: true, shortcut })
  } catch (error) {
    console.error('Shortcuts POST error:', error)
    return NextResponse.json({ error: '단축키 저장 실패' }, { status: 500 })
  }
}

// DELETE: 단축키 해제 (productId를 null로)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shortcode = searchParams.get('shortcode')

    if (!shortcode) {
      return NextResponse.json({ error: '단축코드는 필수입니다' }, { status: 400 })
    }

    await prisma.productShortcut.update({
      where: { shortcode },
      data: { productId: null, description: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shortcuts DELETE error:', error)
    return NextResponse.json({ error: '단축키 해제 실패' }, { status: 500 })
  }
}
