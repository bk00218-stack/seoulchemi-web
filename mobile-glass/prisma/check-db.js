const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  const products = await prisma.product.findMany({ include: { brand: true } });
  const stores = await prisma.store.findMany();
  
  console.log('=== DB Status ===');
  console.log('Brands:', brands.length);
  console.log('Products:', products.length);
  console.log('Stores:', stores.length);
  console.log('\n=== Brands ===');
  brands.forEach(b => {
    const count = products.filter(p => p.brandId === b.id).length;
    console.log(`- ${b.name}: ${count} products`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
