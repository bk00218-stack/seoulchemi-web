const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Check existing users
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true }
  })
  
  console.log('Existing users:', users)
  
  if (users.length === 0) {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin1234', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@seoulchemi.com',
        username: 'admin',
        password: hashedPassword,
        name: '관리자',
        role: 'admin'
      }
    })
    console.log('Created admin:', admin.username)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
