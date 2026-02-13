const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find stores with _dup suffix or similar names
  const stores = await prisma.store.findMany({
    select: { id: true, code: true, name: true, phone: true, createdAt: true },
    orderBy: { name: 'asc' }
  });
  
  console.log(`Total stores: ${stores.length}`);
  
  // Find _dup codes
  const dupCodes = stores.filter(s => s.code.includes('_dup') || s.code.includes('_'));
  console.log(`\nStores with _dup or _ in code: ${dupCodes.length}`);
  dupCodes.slice(0, 10).forEach(s => console.log(`  ${s.code} - ${s.name}`));
  
  // Find duplicate names
  const nameCount = {};
  stores.forEach(s => {
    const name = s.name.trim();
    if (!nameCount[name]) nameCount[name] = [];
    nameCount[name].push(s);
  });
  
  const duplicateNames = Object.entries(nameCount).filter(([name, list]) => list.length > 1);
  console.log(`\nDuplicate names: ${duplicateNames.length}`);
  duplicateNames.slice(0, 10).forEach(([name, list]) => {
    console.log(`  "${name}" (${list.length}개):`);
    list.forEach(s => console.log(`    - code: ${s.code}, id: ${s.id}`));
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
