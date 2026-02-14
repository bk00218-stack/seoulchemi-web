const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin1234', 12)
  
  const updated = await prisma.user.update({
    where: { username: 'admin' },
    data: { password: hashedPassword }
  })
  
  console.log('Password reset for:', updated.username)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
