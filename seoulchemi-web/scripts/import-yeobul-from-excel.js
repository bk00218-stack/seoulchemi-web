const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 여벌이 아닌 브랜드 (제외)
const EXCLUDED_BRANDS = ['아큐브', '알콘', '바슈롬', '쿠퍼비젼', '클라렌', 'I LENS', '착색', '영진칼라', '인터로조'];

function isExcluded(brandName) {
  return EXCLUDED_BRANDS.some(ex => brandName.includes(ex));
}

// SPH 문자열 파싱: "-1200d" → -12.00, "0d" → 0
function parseSph(val) {
  if (!val) return null;
  const s = String(val).replace('d', '').trim();
  if (!s || s === '0') return 0;
  const num = parseInt(s, 10);
  return num / 100;
}

async function main() {
  const filePath = 'C:\\Users\\User\\Documents\\카카오톡 받은 파일\\렌즈목록.xlsx';
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log('=== 안경렌즈 여벌 상품 임포트 ===\n');

  // 1. 기존 여벌 상품 비활성화 (soft delete)
  console.log('1. 기존 여벌 상품 비활성화...');
  const existingBrands = await prisma.brand.findMany({
    where: { categoryId: 2 },
    select: { id: true, name: true }
  });

  let deactivatedProducts = 0;
  let deactivatedBrands = 0;
  for (const brand of existingBrands) {
    const result = await prisma.product.updateMany({
      where: { brandId: brand.id, isActive: true },
      data: { isActive: false }
    });
    deactivatedProducts += result.count;

    // 브랜드도 비활성화
    await prisma.brand.update({
      where: { id: brand.id },
      data: { isActive: false }
    });
    deactivatedBrands++;
  }
  console.log(`   비활성화: ${deactivatedProducts}개 상품, ${deactivatedBrands}개 브랜드\n`);

  // 2. 엑셀에서 여벌 상품 추출
  console.log('2. 엑셀 데이터 파싱...');
  const productRows = [];
  for (let i = 7; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue;
    const brand = String(row[1]).trim();
    if (!brand || isExcluded(brand)) continue;

    productRows.push({
      brand,
      name: String(row[2] || '').trim(),
      minSph: parseSph(row[7]),
      minCyl: parseSph(row[8]),
      maxSph: parseSph(row[10]),
      maxCyl: parseSph(row[11]),
      purchasePrice: Math.round(Number(row[13]) || 0),
      sellingPrice: Math.round(Number(row[14]) || 0),  // 도매가
      retailPrice: Math.round(Number(row[16]) || 0),    // 소매가
    });
  }
  console.log(`   여벌 상품: ${productRows.length}개\n`);

  // 3. 브랜드 생성/조회
  console.log('3. 브랜드 처리...');
  const uniqueBrands = [...new Set(productRows.map(p => p.brand))];
  const brandMap = new Map();
  let brandOrder = 1;

  for (const brandName of uniqueBrands) {
    // 기존 브랜드 찾기 (같은 이름 + category 2)
    let existing = await prisma.brand.findFirst({
      where: { name: brandName, categoryId: 2 }
    });

    if (existing) {
      // 재활성화
      await prisma.brand.update({
        where: { id: existing.id },
        data: { isActive: true, displayOrder: brandOrder }
      });
      brandMap.set(brandName, existing.id);
      console.log(`   [재활성] ${brandName} (ID: ${existing.id})`);
    } else {
      // 새로 생성
      const created = await prisma.brand.create({
        data: {
          name: brandName,
          categoryId: 2,
          isActive: true,
          displayOrder: brandOrder
        }
      });
      brandMap.set(brandName, created.id);
      console.log(`   [생성] ${brandName} (ID: ${created.id})`);
    }
    brandOrder++;
  }
  console.log(`   총 ${uniqueBrands.length}개 브랜드 처리 완료\n`);

  // 4. 상품 등록
  console.log('4. 상품 등록...');
  let created = 0;
  let errors = 0;

  for (const p of productRows) {
    const brandId = brandMap.get(p.brand);
    if (!brandId) {
      console.log(`   [오류] 브랜드 없음: ${p.brand}`);
      errors++;
      continue;
    }

    try {
      await prisma.product.create({
        data: {
          brandId,
          name: p.name,
          optionType: '여벌',
          productType: '여벌',
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          retailPrice: p.retailPrice,
          hasSph: true,
          hasCyl: false,
          hasAxis: false,
          isActive: true,
        }
      });
      created++;
    } catch (e) {
      console.log(`   [오류] ${p.brand} - ${p.name}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== 임포트 완료 ===`);
  console.log(`생성: ${created}개`);
  console.log(`오류: ${errors}개`);
  console.log(`비활성화(기존): ${deactivatedProducts}개`);

  // 최종 확인
  const totalActive = await prisma.product.count({
    where: { brand: { categoryId: 2 }, isActive: true }
  });
  const totalBrandsActive = await prisma.brand.count({
    where: { categoryId: 2, isActive: true }
  });
  console.log(`\n현재 여벌 활성 브랜드: ${totalBrandsActive}개`);
  console.log(`현재 여벌 활성 상품: ${totalActive}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
