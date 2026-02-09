import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const users = await prisma.user.findMany({
  select: { id: true, username: true, name: true, role: true }
})
console.log('Users:', users)

await prisma.$disconnect()
