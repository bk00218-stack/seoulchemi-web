import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 공지사항 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.type && { type: body.type }),
        ...(body.isImportant !== undefined && { isImportant: body.isImportant }),
        ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) })
      }
    })
    
    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error updating notice:', error)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

// 공지사항 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.notice.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notice:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}

// 조회수 증가
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } }
    })
    
    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 })
  }
}
