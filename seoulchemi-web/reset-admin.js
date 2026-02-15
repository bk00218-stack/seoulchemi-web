const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // List users
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true }
  })
  console.log('Users:', users)
  
  // Reset admin password to 'admin'
  const hashedPassword = await bcrypt.hash('admin', 12)
  
  if (users.length > 0) {
    const admin = users.find(u => u.role === 'admin') || users[0]
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })
    console.log(`Reset password for user: ${admin.username}`)
  }
}

main().finally(() => prisma.$disconnect())
