const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const newPassword = 'Seoul2026!'
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: hashedPassword }
  })
  
  console.log('Password changed to:', newPassword)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
