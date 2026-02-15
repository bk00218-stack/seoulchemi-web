import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// GET /api/users/[id] - 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: '잘못된 사용자 ID입니다.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        storeId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 최근 로그인 이력
    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      user: {
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions) : []
      },
      loginHistory
    })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: '사용자 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/users/[id] - 사용자 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    const body = await request.json()
    const { email, name, role, password, storeId, isActive, permissions } = body

    if (isNaN(userId)) {
      return NextResponse.json({ error: '잘못된 사용자 ID입니다.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업데이트 데이터 구성
    const updateData: any = {}

    if (email && email !== user.email) {
      // 이메일 중복 체크
      const existingEmail = await prisma.user.findFirst({
        where: { email, id: { not: userId } }
      })
      if (existingEmail) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 })
      }
      updateData.email = email
    }

    if (name) updateData.name = name
    if (role) updateData.role = role
    if (storeId !== undefined) updateData.storeId = storeId ? parseInt(storeId) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (permissions) updateData.permissions = JSON.stringify(permissions)

    // 비밀번호 변경
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        storeId: true,
        isActive: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: '사용자 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: '잘못된 사용자 ID입니다.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // admin은 삭제 불가
    if (user.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: '마지막 관리자는 삭제할 수 없습니다.' }, { status: 400 })
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: '사용자 삭제에 실패했습니다.' }, { status: 500 })
  }
}
