/**
 * 레티나 데이터 → MobileGlass DB 임포트 스크립트
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  const dataPath = path.join(__dirname, '../data/sample-products.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log('🚀 MobileGlass 데이터 임포트 시작...\n');

  // 1. 브랜드 생성
  console.log('📦 브랜드 생성 중...');
  const brandMap = {};
  
  for (const brandName of data.brands) {
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        isActive: true,
        displayOrder: data.brands.indexOf(brandName) + 1
      }
    });
    brandMap[brandName] = brand.id;
    console.log(`  ✓ ${brandName}`);
  }

  // 2. 상품 생성
  console.log('\n📦 상품 생성 중...');
  let productCount = 0;
  
  for (const product of data.products) {
    const brandId = brandMap[product.brand];
    if (!brandId) {
      console.log(`  ⚠ 브랜드 없음: ${product.brand}`);
      continue;
    }

    await prisma.product.create({
      data: {
        brandId,
        name: product.name,
        optionType: product.optionType,
        productType: product.productType,
        bundleName: product.bundleName || null,
        refractiveIndex: product.refractiveIndex || null,
        optionName: product.option || null,
        hasSph: product.hasSph || false,
        hasCyl: product.hasCyl || false,
        hasAxis: product.hasAxis || false,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        isActive: product.status === '사용',
        displayOrder: product.order || 0
      }
    });
    productCount++;
  }
  
  console.log(`  ✓ ${productCount}개 상품 생성됨`);

  // 3. 통계
  const brandCount = await prisma.brand.count();
  const totalProducts = await prisma.product.count();
  
  console.log('\n✅ 임포트 완료!');
  console.log(`   - 브랜드: ${brandCount}개`);
  console.log(`   - 상품: ${totalProducts}개`);
}

importData()
  .catch(e => {
    console.error('❌ 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
