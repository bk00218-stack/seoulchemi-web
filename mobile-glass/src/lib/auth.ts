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

// 비밀번호 해시
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 사용자 인증
export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
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
      // 로그인 실패 기록
      await prisma.loginHistory.create({
        data: {
          userId: 0,
          username,
          success: false,
          failReason: 'User not found'
        }
      })
      return null
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      // 로그인 실패 기록
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          username: user.username,
          success: false,
          failReason: 'Invalid password'
        }
      })
      return null
    }

    // 로그인 성공 기록
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        username: user.username,
        success: true
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
}): Promise<AuthUser | null> {
  try {
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
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: [],
      storeId: user.storeId
    }
  } catch (error) {
    console.error('Create user error:', error)
    return null
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
