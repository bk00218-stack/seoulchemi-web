// 상품 단축코드 상세 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 단축코드 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shortcutId = parseInt(id)
    const body = await request.json()

    const shortcut = await prisma.productShortcut.update({
      where: { id: shortcutId },
      data: body
    })

    return NextResponse.json(shortcut)
  } catch (error) {
    console.error('Failed to update shortcut:', error)
    return NextResponse.json({ error: 'Failed to update shortcut' }, { status: 500 })
  }
}

// 단축코드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shortcutId = parseInt(id)

    await prisma.productShortcut.delete({
      where: { id: shortcutId }
    })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Failed to delete shortcut:', error)
    return NextResponse.json({ error: 'Failed to delete shortcut' }, { status: 500 })
  }
}
