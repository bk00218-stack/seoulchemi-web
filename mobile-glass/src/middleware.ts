import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// JWT_SECRET 필수 체크
const JWT_SECRET_RAW = process.env.JWT_SECRET
if (!JWT_SECRET_RAW && process.env.NODE_ENV === 'production') {
  console.error('⚠️ JWT_SECRET 환경변수가 설정되지 않았습니다!')
}

const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_RAW || 'dev-only-secret-do-not-use-in-production'
)

// 인증 불필요한 경로
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/store/login',
  '/api/store/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
]

// API Rate Limiting (메모리 기반 - 프로덕션에서는 Redis 권장)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // 분당 요청 수
const RATE_WINDOW = 60 * 1000 // 1분

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

// 로그인 시도 Rate Limiting (더 엄격)
const loginRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const LOGIN_RATE_LIMIT = 5 // 분당 로그인 시도
const LOGIN_RATE_WINDOW = 60 * 1000

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginRateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    loginRateLimitMap.set(ip, { count: 1, resetTime: now + LOGIN_RATE_WINDOW })
    return true
  }

  if (record.count >= LOGIN_RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'

  // Rate limiting 체크
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  // 로그인 엔드포인트 특별 제한
  if (pathname === '/api/auth/login') {
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  // Public 경로는 인증 불필요
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 정적 파일 제외
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  // 토큰 확인
  const token = request.cookies.get('auth-token')?.value

  // API 요청인 경우
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      // 요청 헤더에 사용자 정보 추가
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', String(payload.id))
      requestHeaders.set('x-user-role', String(payload.role))
      requestHeaders.set('x-user-store', String(payload.storeId || ''))

      return NextResponse.next({
        request: { headers: requestHeaders }
      })
    } catch (error) {
      return NextResponse.json(
        { error: '세션이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      )
    }
  }

  // 페이지 요청인 경우
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('expired', '1')
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
