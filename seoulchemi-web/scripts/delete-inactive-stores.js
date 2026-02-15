const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 먼저 개수 확인
  const count = await prisma.store.count({
    where: {
      OR: [
        { name: { contains: '(중지)' } },
        { name: { contains: '(폐업)' } }
      ]
    }
  });
  
  console.log(`삭제 대상: ${count}개`);
  
  if (count > 0) {
    // 삭제 실행
    const deleted = await prisma.store.deleteMany({
      where: {
        OR: [
          { name: { contains: '(중지)' } },
          { name: { contains: '(폐업)' } }
        ]
      }
    });
    
    console.log(`삭제 완료: ${deleted.count}개`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
