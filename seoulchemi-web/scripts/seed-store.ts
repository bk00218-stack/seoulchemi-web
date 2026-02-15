import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 테스트 가맹점 생성
  const store = await prisma.store.upsert({
    where: { code: 'BK-001' },
    update: {},
    create: {
      name: '밝은안경',
      code: 'BK-001',
      phone: '02-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      ownerName: '김철수',
      isActive: true,
      deliveryContact: '김철수',
      deliveryPhone: '010-1234-5678',
      deliveryAddress: '서울시 강남구 테헤란로 123',
      deliveryZipcode: '06234',
    }
  })

  console.log('✅ 테스트 가맹점 생성:', store.name, `(${store.code})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
