const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importAll() {
  console.log('🚀 전체 상품 임포트 시작...\n');

  // 하이텍 상품
  const hitech = [
    {brand: "하이텍", name: "[CR편광] 그레이", optionType: "안경렌즈 여벌", bundleName: "CR 편광", refractiveIndex: "1.50", sellingPrice: 10000},
    {brand: "하이텍", name: "[CR편광] 그린", optionType: "안경렌즈 여벌", bundleName: "CR 편광", refractiveIndex: "1.50", sellingPrice: 10000},
    {brand: "하이텍", name: "[CR편광] 브라운", optionType: "안경렌즈 여벌", bundleName: "CR 편광", refractiveIndex: "1.50", sellingPrice: 10000},
    {brand: "하이텍", name: "[아이렌] 1.60", optionType: "안경렌즈 여벌", bundleName: "아이렌 일반", refractiveIndex: "1.60", sellingPrice: 2900},
    {brand: "하이텍", name: "[아이렌] 중", optionType: "안경렌즈 여벌", bundleName: "아이렌 일반", refractiveIndex: "1.56", sellingPrice: 1450},
    {brand: "하이텍", name: "[아이렌퍼펙트] 고", optionType: "안경렌즈 여벌", bundleName: "아이렌 청광", refractiveIndex: "1.60", sellingPrice: 3250},
    {brand: "하이텍", name: "[아이렌퍼펙트] 고비", optionType: "안경렌즈 여벌", bundleName: "아이렌 청광", refractiveIndex: "1.60", sellingPrice: 3250},
    {brand: "하이텍", name: "[아이렌퍼펙트] 중", optionType: "안경렌즈 여벌", bundleName: "아이렌 청광", refractiveIndex: "1.56", sellingPrice: 2400},
    {brand: "하이텍", name: "[아이렌퍼펙트] 초고비", optionType: "안경렌즈 여벌", bundleName: "아이렌 청광", refractiveIndex: "1.67", sellingPrice: 5500},
    {brand: "하이텍", name: "하이텍 [근적외선] 1.56 SP", optionType: "안경렌즈 여벌", bundleName: "근적외선", refractiveIndex: "1.56", sellingPrice: 3000},
    {brand: "하이텍", name: "하이텍 [근적외선] 1.60 APS", optionType: "안경렌즈 여벌", bundleName: "근적외선", refractiveIndex: "1.60", sellingPrice: 4400},
  ];

  // 진명 상품
  const jinmyung = [
    {brand: "진명", name: "[가르마 20% 청광] 1.56 SP (B)", optionType: "안경렌즈 여벌", bundleName: "가르마 청광", refractiveIndex: "1.56", sellingPrice: 3500},
    {brand: "진명", name: "[가르마 20% 청광] 1.56 SP (G)", optionType: "안경렌즈 여벌", bundleName: "가르마 청광", refractiveIndex: "1.56", sellingPrice: 3500},
    {brand: "진명", name: "[가르마 20% 청광] 1.60 SP (B)", optionType: "안경렌즈 여벌", bundleName: "가르마 청광", refractiveIndex: "1.60", sellingPrice: 5750},
    {brand: "진명", name: "[가르마 20% 청광] 1.60 SP (G)", optionType: "안경렌즈 여벌", bundleName: "가르마 청광", refractiveIndex: "1.60", sellingPrice: 5750},
    {brand: "진명", name: "[가르마 80%] 1.56 (BC)", optionType: "안경렌즈 여벌", bundleName: "가르마 80%", refractiveIndex: "1.56", sellingPrice: 4500},
    {brand: "진명", name: "[가르마 80%] 1.56 (SC)", optionType: "안경렌즈 여벌", bundleName: "가르마 80%", refractiveIndex: "1.56", sellingPrice: 4500},
    {brand: "진명", name: "[가르마 80%] 1.60 (BC)", optionType: "안경렌즈 여벌", bundleName: "가르마 80%", refractiveIndex: "1.60", sellingPrice: 6500},
    {brand: "진명", name: "[가르마 80%] 1.60 (SC)", optionType: "안경렌즈 여벌", bundleName: "가르마 80%", refractiveIndex: "1.60", sellingPrice: 6500},
    {brand: "진명", name: "[가르마 반밀러] 1.56 (실버)", optionType: "안경렌즈 여벌", bundleName: "반밀러", refractiveIndex: "1.56", sellingPrice: 5000},
  ];

  // 아큐브 상품
  const acuvue = [
    {brand: "아큐브", name: "디파인 내츄럴샤인 (30P)", optionType: "콘택트렌즈", bundleName: "디파인", refractiveIndex: null, sellingPrice: 43560},
    {brand: "아큐브", name: "디파인 내츄럴샤인 (90P)", optionType: "콘택트렌즈", bundleName: "디파인", refractiveIndex: null, sellingPrice: 108020},
    {brand: "아큐브", name: "디파인 래디언트 브라이트 (30P)", optionType: "콘택트렌즈", bundleName: "디파인", refractiveIndex: null, sellingPrice: 43560},
    {brand: "아큐브", name: "디파인 비비드 (30P)", optionType: "콘택트렌즈", bundleName: "디파인", refractiveIndex: null, sellingPrice: 43560},
    {brand: "아큐브", name: "디파인 비비드 (90P)", optionType: "콘택트렌즈", bundleName: "디파인", refractiveIndex: null, sellingPrice: 108020},
    {brand: "아큐브", name: "모이스트 원데이 (30P)", optionType: "콘택트렌즈", bundleName: "모이스트", refractiveIndex: null, sellingPrice: 27720},
    {brand: "아큐브", name: "모이스트 원데이 (90P)", optionType: "콘택트렌즈", bundleName: "모이스트", refractiveIndex: null, sellingPrice: 72490},
    {brand: "아큐브", name: "모이스트 원데이 난시용 (30P)", optionType: "콘택트렌즈", bundleName: "모이스트", refractiveIndex: null, sellingPrice: 34980},
  ];

  // 알콘 상품
  const alcon = [
    {brand: "알콘", name: "토탈원 워터렌즈 30P", optionType: "콘택트렌즈", bundleName: "토탈원", refractiveIndex: null, sellingPrice: 43340},
    {brand: "알콘", name: "토탈원 워터렌즈 90P", optionType: "콘택트렌즈", bundleName: "토탈원", refractiveIndex: null, sellingPrice: 112310},
  ];

  const allProducts = [...hitech, ...jinmyung, ...acuvue, ...alcon];

  for (const p of allProducts) {
    const brand = await prisma.brand.findUnique({ where: { name: p.brand } });
    if (!brand) {
      console.log(`  ⚠ 브랜드 없음: ${p.brand}`);
      continue;
    }

    await prisma.product.create({
      data: {
        brandId: brand.id,
        name: p.name,
        optionType: p.optionType,
        productType: p.optionType,
        bundleName: p.bundleName,
        refractiveIndex: p.refractiveIndex,
        sellingPrice: p.sellingPrice,
        isActive: true,
        hasSph: true,
        hasCyl: true,
        hasAxis: true,
      }
    });
  }

  console.log(`  ✓ ${allProducts.length}개 상품 추가됨`);

  const total = await prisma.product.count();
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } }
  });

  console.log('\n📊 브랜드별 상품 수:');
  brands.forEach(b => console.log(`  ${b.name}: ${b._count.products}개`));
  console.log(`\n✅ 총 ${total}개 상품`);
}

importAll()
  .catch(e => console.error('❌ 에러:', e))
  .finally(() => prisma.$disconnect());
