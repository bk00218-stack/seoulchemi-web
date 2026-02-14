import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/auth'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'
)

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    let userId: number
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      userId = payload.id as number
    } catch {
      return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // 입력 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: '새 비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 변경
    const result = await changePassword(userId, currentPassword, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
