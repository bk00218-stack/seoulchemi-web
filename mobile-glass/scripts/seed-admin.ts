import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 관리자 계정 생성 시작...\n')

  // 기존 admin 확인
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (existingAdmin) {
    console.log('✅ 관리자 계정이 이미 존재합니다:', existingAdmin.username)
    return
  }

  // 비밀번호 해시
  const hashedPassword = await bcrypt.hash('admin1234!', 12)

  // 관리자 생성
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lenschoice.co.kr',
      username: 'admin',
      password: hashedPassword,
      name: '시스템관리자',
      role: 'admin',
      permissions: JSON.stringify(['*']),
      isActive: true
    }
  })

  console.log('✅ 관리자 계정 생성 완료!')
  console.log('   아이디: admin')
  console.log('   비밀번호: admin1234!')
  console.log('   이메일:', admin.email)
  console.log('\n⚠️  첫 로그인 후 반드시 비밀번호를 변경하세요!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
