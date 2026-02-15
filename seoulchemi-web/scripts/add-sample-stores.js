/**
 * 샘플 가맹점 추가
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSampleStores() {
  console.log('🏪 샘플 가맹점 추가 중...\n');

  const stores = [
    { name: '강남안경', code: 'GN001', phone: '02-1234-5678', address: '서울 강남구', ownerName: '김안경' },
    { name: '홍대안경원', code: 'HD001', phone: '02-2345-6789', address: '서울 마포구', ownerName: '박렌즈' },
    { name: '부산안경', code: 'BS001', phone: '051-123-4567', address: '부산 해운대구', ownerName: '이도수' },
    { name: '대구광학', code: 'DG001', phone: '053-234-5678', address: '대구 중구', ownerName: '최광학' },
    { name: '인천눈사랑', code: 'IC001', phone: '032-345-6789', address: '인천 남동구', ownerName: '정눈빛' },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: store
    });
    console.log(`  ✓ ${store.name}`);
  }

  const count = await prisma.store.count();
  console.log(`\n✅ 완료! 총 ${count}개 가맹점`);
}

addSampleStores()
  .catch(e => console.error('❌ 에러:', e))
  .finally(() => prisma.$disconnect());
