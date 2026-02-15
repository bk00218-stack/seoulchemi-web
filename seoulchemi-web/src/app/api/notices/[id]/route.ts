import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notices/[id] - 공지사항 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notice = await prisma.notice.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!notice) {
      return NextResponse.json({ error: '공지사항을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 조회수 증가
    await prisma.notice.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } }
    })
    
    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Failed to fetch notice:', error)
    return NextResponse.json({ error: '공지사항을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/notices/[id] - 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        content: body.content || null,
        type: body.type,
        displayType: body.displayType,
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl || null,
        isImportant: body.isImportant,
        isPinned: body.isPinned,
        showOnce: body.showOnce,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive,
        authorName: body.authorName,
      }
    })
    
    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Failed to update notice:', error)
    return NextResponse.json({ error: '공지사항 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/notices/[id] - 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.notice.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notice:', error)
    return NextResponse.json({ error: '공지사항 삭제에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/notices/[id] - 부분 수정 (토글 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: body
    })
    
    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Failed to patch notice:', error)
    return NextResponse.json({ error: '공지사항 수정에 실패했습니다.' }, { status: 500 })
  }
}
