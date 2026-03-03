import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores/verify - 가맹점 계정 목록 (승인 대기/완료)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending' // pending, approved, all
    const search = searchParams.get('search') || ''

    const where: any = { role: 'store' }

    if (status === 'pending') {
      where.isActive = false
    } else if (status === 'approved') {
      where.isActive = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        storeId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    // Store 정보 join
    const storeIds = users.map(u => u.storeId).filter((id): id is number => id !== null)
    const stores = storeIds.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, ownerName: true, phone: true, code: true },
        })
      : []
    const storeMap = new Map(stores.map(s => [s.id, s]))

    const result = users.map(u => ({
      ...u,
      store: u.storeId ? storeMap.get(u.storeId) || null : null,
    }))

    return NextResponse.json({ users: result, total: result.length })
  } catch (error) {
    console.error('Error fetching store users:', error)
    return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
  }
}

// PATCH /api/stores/verify - 승인/거절
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body as { userId: number; action: 'approve' | 'reject' }

    if (!userId || !action) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'store') {
      return NextResponse.json({ error: '가맹점 계정을 찾을 수 없습니다' }, { status: 404 })
    }

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      })

      await prisma.workLog.create({
        data: {
          workType: 'store_approve',
          targetType: 'user',
          targetId: userId,
          description: `가맹점 계정 승인: ${user.name} (${user.username})`,
          pcName: 'WEB',
        },
      })

      return NextResponse.json({ success: true, message: `${user.name} 계정이 승인되었습니다.` })
    } else {
      await prisma.user.delete({ where: { id: userId } })

      await prisma.workLog.create({
        data: {
          workType: 'store_reject',
          targetType: 'user',
          targetId: userId,
          description: `가맹점 계정 거절/삭제: ${user.name} (${user.username})`,
          pcName: 'WEB',
        },
      })

      return NextResponse.json({ success: true, message: `${user.name} 계정이 거절되었습니다.` })
    }
  } catch (error) {
    console.error('Error processing store verification:', error)
    return NextResponse.json({ error: '처리 실패' }, { status: 500 })
  }
}
