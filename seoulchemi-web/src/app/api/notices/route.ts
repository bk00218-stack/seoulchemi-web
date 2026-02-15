import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notices - 공지사항 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const displayType = searchParams.get('displayType') // popup, banner
    
    const where: any = {}
    
    if (activeOnly) {
      where.isActive = true
      where.OR = [
        { startDate: null },
        { startDate: { lte: new Date() } }
      ]
      where.AND = [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        }
      ]
    }
    
    if (displayType) {
      where.displayType = { in: [displayType, 'both'] }
    }
    
    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json({ notices })
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return NextResponse.json({ error: '공지사항을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/notices - 공지사항 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      type,
      displayType,
      imageUrl,
      linkUrl,
      isImportant,
      isPinned,
      showOnce,
      startDate,
      endDate,
      isActive,
      authorName
    } = body
    
    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 })
    }
    
    const notice = await prisma.notice.create({
      data: {
        title,
        content: content || null,
        type: type || 'notice',
        displayType: displayType || 'popup',
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isImportant: isImportant || false,
        isPinned: isPinned || false,
        showOnce: showOnce || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        authorName: authorName || null,
      }
    })
    
    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Failed to create notice:', error)
    return NextResponse.json({ error: '공지사항 등록에 실패했습니다.' }, { status: 500 })
  }
}
