const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const store = await p.store.findFirst({
    where: { name: { contains: '밝은' } }
  })
  
  if (store) {
    console.log('찾음:', store.name, '(id:', store.id + ')')
  } else {
    console.log('밝은안경 없음!')
    // Check what stores exist
    const stores = await p.store.findMany({ take: 5, select: { id: true, name: true } })
    console.log('DB에 있는 거래처:', stores.map(s => s.name).join(', '))
  }
  
  await p.$disconnect()
}

main()
