import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 랜덤 가맹점 5개 선택해서 미수금 설정
  const stores = await prisma.store.findMany({ take: 10 });
  
  const testData = [
    { idx: 0, outstanding: 1500000, creditLimit: 2000000, paymentTermDays: 30 },
    { idx: 1, outstanding: 850000, creditLimit: 1000000, paymentTermDays: 30 },
    { idx: 2, outstanding: 2300000, creditLimit: 2000000, paymentTermDays: 15 }, // 한도 초과
    { idx: 3, outstanding: 450000, creditLimit: 500000, paymentTermDays: 30 },
    { idx: 4, outstanding: 3200000, creditLimit: 5000000, paymentTermDays: 45 },
  ];

  console.log('=== 테스트 미수금 설정 ===\n');

  for (const data of testData) {
    const store = stores[data.idx];
    if (!store) continue;

    // 미수금 업데이트 + 마지막 입금일을 40일 전으로 설정 (일부 연체 테스트)
    const lastPayment = new Date();
    lastPayment.setDate(lastPayment.getDate() - 40);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        outstandingAmount: data.outstanding,
        creditLimit: data.creditLimit,
        paymentTermDays: data.paymentTermDays,
        lastPaymentAt: lastPayment,
      }
    });

    // 매출 거래 내역 추가
    await prisma.transaction.create({
      data: {
        storeId: store.id,
        type: 'sale',
        amount: data.outstanding,
        balanceAfter: data.outstanding,
        memo: '테스트 매출',
        processedBy: 'system',
        processedAt: lastPayment,
      }
    });

    console.log(`✓ ${store.name} (${store.code})`);
    console.log(`  미수금: ${data.outstanding.toLocaleString()}원`);
    console.log(`  신용한도: ${data.creditLimit.toLocaleString()}원`);
    console.log(`  결제기한: ${data.paymentTermDays}일`);
    console.log('');
  }

  console.log('완료!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
