import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const counts = {
    Brand: await prisma.brand.count(),
    Product: await prisma.product.count(),
    Store: await prisma.store.count(),
    Order: await prisma.order.count(),
    Transaction: await prisma.transaction.count(),
  };
  console.log('=== DB Contents ===');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table}: ${count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
