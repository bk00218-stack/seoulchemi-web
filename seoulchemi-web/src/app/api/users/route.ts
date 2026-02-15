import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// GET /api/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (role && role !== 'all') {
      where.role = role
    }

    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        storeId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // 역할별 통계
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        admin: roleCounts.find(r => r.role === 'admin')?._count || 0,
        manager: roleCounts.find(r => r.role === 'manager')?._count || 0,
        user: roleCounts.find(r => r.role === 'user')?._count || 0,
        store: roleCounts.find(r => r.role === 'store')?._count || 0,
      }
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: '사용자 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/users - 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password, name, role, storeId } = body

    // 필수 필드 검증
    if (!email || !username || !password || !name) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    // 중복 체크
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 })
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 400 })
      }
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(password)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: role || 'user',
        storeId: storeId ? parseInt(storeId) : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        storeId: true,
        isActive: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: '사용자 생성에 실패했습니다.' }, { status: 500 })
  }
}
