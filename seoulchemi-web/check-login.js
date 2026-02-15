const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { username: 'admin' },
    select: { id: true, username: true, password: true, isActive: true }
  })
  
  console.log('User found:', !!user)
  console.log('isActive:', user?.isActive)
  
  if (user) {
    const valid = await bcrypt.compare('admin1234', user.password)
    console.log('Password admin1234 valid:', valid)
    
    const valid2 = await bcrypt.compare('admin1234!', user.password)
    console.log('Password admin1234! valid:', valid2)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
