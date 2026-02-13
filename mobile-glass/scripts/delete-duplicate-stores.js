const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find and delete stores with _dup in code
  const dupStores = await prisma.store.findMany({
    where: {
      code: { contains: '_dup' }
    },
    select: { id: true, code: true, name: true }
  });
  
  console.log(`Found ${dupStores.length} duplicate stores to delete`);
  
  if (dupStores.length > 0) {
    const deleted = await prisma.store.deleteMany({
      where: {
        code: { contains: '_dup' }
      }
    });
    
    console.log(`Deleted: ${deleted.count} stores`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
