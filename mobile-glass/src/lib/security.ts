import { headers } from 'next/headers'

/**
 * 현재 요청의 인증된 사용자 정보 가져오기
 * middleware에서 설정한 헤더에서 추출
 */
export async function getAuthUser() {
  const headersList = await headers()
  
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  const userStore = headersList.get('x-user-store')

  if (!userId) {
    return null
  }

  return {
    id: parseInt(userId),
    role: userRole || 'user',
    storeId: userStore ? parseInt(userStore) : null
  }
}

/**
 * 권한 체크
 */
export async function requireAuth() {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * 관리자 권한 체크
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}

/**
 * 특정 역할 체크
 */
export async function requireRole(roles: string[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error(`Required role: ${roles.join(' or ')}`)
  }
  return user
}

/**
 * 가맹점 소유 데이터 접근 체크
 */
export async function requireStoreAccess(storeId: number) {
  const user = await requireAuth()
  
  // admin/manager는 모든 가맹점 접근 가능
  if (['admin', 'manager'].includes(user.role)) {
    return user
  }
  
  // 가맹점 사용자는 자기 가맹점만
  if (user.storeId !== storeId) {
    throw new Error('Access denied to this store')
  }
  
  return user
}

/**
 * 입력값 새니타이징
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // XSS 기본 방지
    .trim()
}

/**
 * SQL Injection 방지용 ID 검증
 */
export function validateId(id: unknown): number {
  const parsed = parseInt(String(id))
  if (isNaN(parsed) || parsed < 1) {
    throw new Error('Invalid ID')
  }
  return parsed
}

/**
 * 페이지네이션 파라미터 검증
 */
export function validatePagination(page?: string | null, limit?: string | null) {
  const p = Math.max(1, parseInt(page || '1') || 1)
  const l = Math.min(100, Math.max(1, parseInt(limit || '20') || 20))
  return { page: p, limit: l, skip: (p - 1) * l }
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}
