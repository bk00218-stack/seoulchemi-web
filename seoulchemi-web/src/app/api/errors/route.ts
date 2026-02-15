import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

// 에러 로그 저장 (WorkLog 테이블 활용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, message, stack, componentStack, url, userAgent, timestamp } = body

    // 로거로 기록
    logger.error(`Client Error: ${name}`, {
      path: url,
      data: { message, userAgent },
      error: new Error(message)
    })

    // DB에 저장
    await prisma.workLog.create({
      data: {
        workType: 'error',
        targetType: 'client',
        description: `${name}: ${message}`,
        details: JSON.stringify({
          stack,
          componentStack,
          url,
          userAgent,
          timestamp
        }),
        pcName: userAgent?.substring(0, 100) || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // 에러 리포팅 실패는 조용히 처리
    console.error('Failed to log error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// 최근 에러 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const errors = await prisma.workLog.findMany({
      where: { workType: 'error' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        description: true,
        details: true,
        createdAt: true
      }
    })

    return NextResponse.json({ errors })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 })
  }
}
