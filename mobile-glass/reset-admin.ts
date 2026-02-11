import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const newPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  
  await prisma.user.update({
    where: { id: 1 },
    data: { password: hashedPassword }
  })
  
  console.log('Admin password reset to: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
