import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lens-choice-secret-key-change-in-production'
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        storeId: payload.storeId
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: '세션이 만료되었습니다.' },
      { status: 401 }
    )
  }
}
