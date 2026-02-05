import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/login-history - 로그인 이력 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const success = searchParams.get('success')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (userId) {
      where.userId = parseInt(userId)
    }

    if (success !== null && success !== '') {
      where.success = success === 'true'
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        where.createdAt.lt = end
      }
    }

    const [total, history] = await Promise.all([
      prisma.loginHistory.count({ where }),
      prisma.loginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ])

    // 통계
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [todayLogins, todayFails, uniqueUsers] = await Promise.all([
      prisma.loginHistory.count({
        where: { createdAt: { gte: today }, success: true }
      }),
      prisma.loginHistory.count({
        where: { createdAt: { gte: today }, success: false }
      }),
      prisma.loginHistory.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: today }, success: true }
      })
    ])

    return NextResponse.json({
      history: history.map(h => ({
        id: h.id,
        userId: h.userId,
        username: h.username,
        ipAddress: h.ipAddress || '-',
        userAgent: h.userAgent ? parseUserAgent(h.userAgent) : '-',
        success: h.success,
        failReason: h.failReason,
        createdAt: h.createdAt.toISOString(),
      })),
      stats: {
        todayLogins,
        todayFails,
        uniqueUsers: uniqueUsers.length,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Failed to fetch login history:', error)
    return NextResponse.json({ error: '로그인 이력 조회에 실패했습니다.' }, { status: 500 })
  }
}

// User Agent 파싱
function parseUserAgent(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Mobile')) return 'Mobile'
  return 'Other'
}
