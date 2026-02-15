import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  
  if (!user) {
    console.log('Admin user not found!')
    return
  }
  
  console.log('User found:', { id: user.id, username: user.username })
  console.log('Password hash:', user.password)
  
  // Test various passwords
  const passwords = ['admin', 'admin123', 'password', '1234']
  for (const pwd of passwords) {
    const valid = await bcrypt.compare(pwd, user.password)
    console.log(`Password "${pwd}": ${valid ? '✓ VALID' : '✗ invalid'}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
