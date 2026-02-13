const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 12)
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@seoulchemi.com',
      username: 'admin',
      password: hashedPassword,
      name: '관리자',
      role: 'admin',
      isActive: true
    }
  })
  
  console.log('Created admin user:', user.username)
}

main().finally(() => prisma.$disconnect())
