import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 공지사항 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    
    const notices = await prisma.notice.findMany({
      where: {
        ...(search && {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } }
          ]
        }),
        ...(type && { type })
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    // 통계
    const stats = {
      total: notices.length,
      notice: notices.filter(n => n.type === 'notice').length,
      event: notices.filter(n => n.type === 'event').length,
      urgent: notices.filter(n => n.type === 'urgent').length,
      pinned: notices.filter(n => n.isPinned).length
    }
    
    return NextResponse.json({ notices, stats })
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

// 공지사항 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'notice',
        isImportant: body.isImportant || false,
        isPinned: body.isPinned || false,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive ?? true
      }
    })
    
    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
