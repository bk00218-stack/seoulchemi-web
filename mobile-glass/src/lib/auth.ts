import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface AuthUser {
  id: number
  email: string
  username: string
  name: string
  role: string
  permissions: string[]
  storeId: number | null
}

// 비밀번호 정책
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// 계정 잠금 설정
export const LOCKOUT_POLICY = {
  maxAttempts: 5,           // 최대 시도 횟수
  lockoutDurationMin: 15,   // 잠금 시간 (분)
}

// 비밀번호 유효성 검사
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`비밀번호는 최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`)
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.')
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.')
  }

  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.')
  }

  if (PASSWORD_POLICY.requireSpecial) {
    const specialRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`)
    if (!specialRegex.test(password)) {
      errors.push('특수문자(!@#$%^&* 등)를 포함해야 합니다.')
    }
  }

  return { valid: errors.length === 0, errors }
}

// 계정 잠금 체크
async function checkAccountLockout(userId: number): Promise<{ locked: boolean; remainingMin?: number }> {
  const recentFailures = await prisma.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - LOCKOUT_POLICY.lockoutDurationMin * 60 * 1000)
      }
    }
  })

  if (recentFailures >= LOCKOUT_POLICY.maxAttempts) {
    // 마지막 실패 시간 확인
    const lastFailure = await prisma.loginHistory.findFirst({
      where: { userId, success: false },
      orderBy: { createdAt: 'desc' }
    })

    if (lastFailure) {
      const lockoutEnds = new Date(lastFailure.createdAt.getTime() + LOCKOUT_POLICY.lockoutDurationMin * 60 * 1000)
      const remainingMs = lockoutEnds.getTime() - Date.now()
      
      if (remainingMs > 0) {
        return { locked: true, remainingMin: Math.ceil(remainingMs / 60000) }
      }
    }
  }

  return { locked: false }
}

// 비밀번호 해시
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 사용자 인증
export async function authenticateUser(username: string, password: string): Promise<AuthUser | null | { locked: true; remainingMin: number }> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true
      }
    })

    if (!user) {
      // 로그인 실패 기록 (유저 없음)
      await prisma.loginHistory.create({
        data: {
          userId: 0,
          username,
          success: false,
          failReason: 'User not found',
          ipAddress: 'unknown'
        }
      })
      return null
    }

    // 계정 잠금 체크
    const lockoutStatus = await checkAccountLockout(user.id)
    if (lockoutStatus.locked) {
      return { locked: true, remainingMin: lockoutStatus.remainingMin! }
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      // 로그인 실패 기록
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          username: user.username,
          success: false,
          failReason: 'Invalid password',
          ipAddress: 'unknown'
        }
      })

      // 남은 시도 횟수 계산
      const recentFailures = await prisma.loginHistory.count({
        where: {
          userId: user.id,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - LOCKOUT_POLICY.lockoutDurationMin * 60 * 1000)
          }
        }
      })

      const remainingAttempts = LOCKOUT_POLICY.maxAttempts - recentFailures
      if (remainingAttempts <= 2 && remainingAttempts > 0) {
        console.warn(`User ${user.username}: ${remainingAttempts} login attempts remaining`)
      }

      return null
    }

    // 로그인 성공 기록
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        username: user.username,
        success: true,
        ipAddress: 'unknown'
      }
    })

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      storeId: user.storeId
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// 사용자 생성
export async function createUser(data: {
  email: string
  username: string
  password: string
  name: string
  role?: string
  storeId?: number
}): Promise<{ user?: AuthUser; error?: string }> {
  try {
    // 비밀번호 정책 검사
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.valid) {
      return { error: passwordValidation.errors.join(' ') }
    }

    // 중복 체크
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    })

    if (existing) {
      return { error: '이미 사용 중인 아이디 또는 이메일입니다.' }
    }

    const hashedPassword = await hashPassword(data.password)
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'user',
        storeId: data.storeId || null
      }
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: [],
        storeId: user.storeId
      }
    }
  } catch (error) {
    console.error('Create user error:', error)
    return { error: '사용자 생성에 실패했습니다.' }
  }
}

// 비밀번호 변경
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' }
    }

    // 새 비밀번호 정책 검사
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors.join(' ') }
    }

    // 이전 비밀번호와 동일한지 체크
    const isSameAsOld = await verifyPassword(newPassword, user.password)
    if (isSameAsOld) {
      return { success: false, error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }
    }

    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: '비밀번호 변경에 실패했습니다.' }
  }
}

// 권한 체크
export function hasPermission(user: AuthUser, permission: string): boolean {
  // admin은 모든 권한
  if (user.role === 'admin') return true
  
  // 특정 권한 체크
  return user.permissions.includes(permission)
}

// 역할 체크
export function hasRole(user: AuthUser, roles: string | string[]): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

// 역할별 기본 권한
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // 모든 권한
  manager: [
    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
    'stores.view', 'stores.edit',
    'products.view', 'products.edit',
    'receivables.view', 'receivables.deposit',
    'reports.view',
    'shipping.view', 'shipping.process'
  ],
  user: [
    'orders.view', 'orders.create',
    'stores.view',
    'products.view',
    'shipping.view'
  ],
  store: [ // 가맹점 사용자
    'orders.view.own', 'orders.create',
    'products.view'
  ]
}
