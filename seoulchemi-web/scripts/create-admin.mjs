import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 관리자 계정 생성 스크립트\n')

  // 기존 admin 확인
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (existingAdmin) {
    console.log('⚠️  이미 관리자 계정이 존재합니다:')
    console.log(`   - 아이디: ${existingAdmin.username}`)
    console.log(`   - 이름: ${existingAdmin.name}`)
    console.log(`   - 이메일: ${existingAdmin.email}`)
    return
  }

  // 관리자 계정 생성
  const password = 'admin1234' // 초기 비밀번호
  const hashedPassword = await bcrypt.hash(password, 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@lenschoice.kr',
      username: 'admin',
      password: hashedPassword,
      name: '관리자',
      role: 'admin',
      permissions: JSON.stringify(['*']),
    }
  })

  console.log('✅ 관리자 계정이 생성되었습니다!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  아이디: ${admin.username}`)
  console.log(`  비밀번호: ${password}`)
  console.log(`  이름: ${admin.name}`)
  console.log(`  이메일: ${admin.email}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경해주세요!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
