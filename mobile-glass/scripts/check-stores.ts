import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const stores = await prisma.store.findMany({
    include: {
      _count: {
        select: { orders: true }
      }
    }
  })
  
  console.log(`총 가맹점 수: ${stores.length}`)
  console.log('---')
  
  for (const store of stores) {
    console.log(`[${store.code}] ${store.name}`)
    console.log(`  대표: ${store.ownerName || '-'} | 연락처: ${store.phone || '-'}`)
    console.log(`  주소: ${store.address || '-'}`)
    console.log(`  주문수: ${store._count.orders} | 상태: ${store.isActive ? '활성' : '비활성'}`)
    console.log('')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
