const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: 'admin' }
  })
  
  if (!user) {
    console.log('User not found!')
    return
  }
  
  console.log('User found:', user.username, user.email)
  console.log('Password hash:', user.password.substring(0, 20) + '...')
  
  const testPassword = 'Seoul2026!'
  const isValid = await bcrypt.compare(testPassword, user.password)
  console.log('Password "Seoul2026!" valid:', isValid)
}

main().catch(console.error).finally(() => prisma.$disconnect())
