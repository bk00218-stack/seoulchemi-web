import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, AuthUser } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

// JWT_SECRET 필수 체크
const JWT_SECRET_RAW = process.env.JWT_SECRET
if (!JWT_SECRET_RAW && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 프로덕션 환경에서는 필수입니다!')
}

const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_RAW || 'dev-only-secret-do-not-use-in-production'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // IP 주소 가져오기 (로깅용)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    const result = await authenticateUser(username, password)

    // 계정 잠금된 경우
    if (result && typeof result === 'object' && 'locked' in result) {
      return NextResponse.json(
        { 
          error: `계정이 일시적으로 잠겼습니다. ${result.remainingMin}분 후에 다시 시도해주세요.`,
          locked: true,
          remainingMin: result.remainingMin
        },
        { status: 423 } // Locked
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 타입이 AuthUser로 좁혀짐 (locked 케이스는 위에서 처리됨)
    const user = result as AuthUser

    // JWT 토큰 생성
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      storeId: user.storeId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // 쿠키에 토큰 저장
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // lax에서 strict로 강화
      maxAge: 60 * 60 * 24, // 24시간
      path: '/'
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
