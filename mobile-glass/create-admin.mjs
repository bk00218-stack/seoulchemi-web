import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:C:/Users/User/clawd/mobile-glass/prisma/dev.db'
    }
  }
})

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@lenschoice.com',
      username: 'admin',
      password: hashedPassword,
      name: '관리자',
      role: 'admin',
      isActive: true
    }
  })
  
  console.log('Admin user created/updated:', user.username)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
