const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const users = await p.user.findMany({
    select: { id: true, username: true, name: true, role: true, email: true }
  })
  console.log('Users:', JSON.stringify(users, null, 2))
}

main().finally(() => p.$disconnect())
