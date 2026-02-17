const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.mainCategory.findMany({ include: { _count: { select: { brands: true } } } });
  console.log('=== Categories ===');
  cats.forEach(c => console.log(c.id, c.code, c.name, 'brands:', c._count.brands));

  const brands = await prisma.brand.findMany({
    include: { category: true, _count: { select: { products: true, productLines: true } } },
    orderBy: { displayOrder: 'asc' }
  });
  console.log('\n=== Brands ===');
  brands.forEach(b => console.log(b.id, b.name, 'cat:', b.category?.name||'-', 'products:', b._count.products, 'lines:', b._count.productLines));

  const productCount = await prisma.product.count();
  console.log('\nTotal products:', productCount);

  const lines = await prisma.productLine.findMany({
    include: { brand: true, _count: { select: { products: true } } },
    orderBy: { brand: { name: 'asc' } }
  });
  console.log('\n=== Product Lines ===');
  lines.forEach(l => console.log(l.id, l.brand.name, '-', l.name, 'products:', l._count.products));
}

main().catch(console.error).finally(() => prisma.$disconnect());
